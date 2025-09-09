const { Company, Bid, ConstructionProjectSchema, Worker, WorkerToCompany, CompanytoWorker } = require('../models');
const { getTargetDate } = require('../utils/helpers');

const getDashboard = async (req, res) => {
  try {
    const bids = await Bid.find({ status: 'open' }).sort({ createdAt: -1 }).limit(2).lean();
    const projects = await ConstructionProjectSchema.find({ companyId: req.user ? req.user.user_id : null }).sort({ createdAt: -1 }).lean();
    const activeProjects = projects.filter(p => p.status === 'accepted').length;
    const completedProjects = projects.filter(p => p.status === 'rejected').length;
    const revenue = projects.filter(p => p.status === 'rejected' && new Date(p.updatedAt).getMonth() === new Date().getMonth() && new Date(p.updatedAt).getFullYear() === new Date().getFullYear()).reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);

    res.render('company/company_dashboard', { bids, projects, activeProjects, completedProjects, revenue });
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).send('Server Error');
  }
};

const getOngoingProjects = async (req, res) => {
  try {
    const companyId = req.user.user_id;
    if (!companyId) return res.redirect('/login');
    const projects = await ConstructionProjectSchema.find({ companyId, status: 'accepted' });
    const totalActiveProjects = projects.length;
    const metrics = { totalActiveProjects, monthlyRevenue: '4.8', customerSatisfaction: '4.7', projectsOnSchedule: '85' };
    const enhancedProjects = projects.map(project => {
      const projectObj = project.toObject();
      projectObj.completion = 0;
      projectObj.targetDate = getTargetDate(project.createdAt, project.projectTimeline);
      projectObj.currentPhase = 'Update current ';
      projectObj.siteFilepaths = projectObj.siteFilepaths || [];
      projectObj.floors = projectObj.floors || [];
      // Set defaults for other fields...
      return projectObj;
    });
    res.render('company/company_ongoing_projects', { projects: enhancedProjects, metrics });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).send('Server error');
  }
};

const getProjectRequests = async (req, res) => {
  try {
    const projects = await ConstructionProjectSchema.find({ status: 'pending', companyId: req.user.user_id }).lean();
    res.render('company/project_requests', { projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

const getCompanyRevenue = async (req, res) => {
  try {
    const companyId = req.user.user_id;
    if (!companyId) return res.status(401).send('Unauthorized');

    // Use ConstructionProjectSchema instead of Project
    const completedProjects = await ConstructionProjectSchema.find({ 
      companyId, 
      status: 'completed' 
    }).lean();
    
    const acceptedBids = await Bid.find({ 
      companyId, 
      status: 'accepted' 
    }).lean();

    let totalRevenue = 0;
    completedProjects.forEach(project => {
      totalRevenue += project.estimatedBudget || 0;
    });
    acceptedBids.forEach(bid => {
      totalRevenue += bid.amount || 0;
    });

    res.render('company/revenue', { 
      totalRevenue, 
      completedProjects, 
      acceptedBids 
    });
  } catch (error) {
    console.error('Error fetching company revenue:', error);
    res.status(500).send('Server error');
  }
};

const getHiring = async (req, res) => {
  try {
    const companyId = req.user.user_id;
    const workers = await Worker.find().lean();
    const processedWorkers = workers.map(worker => ({ ...worker, profileImage: worker.profileImage || `https://api.dicebear.com/9.x/male/svg?seed=${encodeURIComponent((worker.name || 'worker').replace(/\s+/g, ''))}&mouth=smile`, rating: worker.rating || 0 }));
    const workerRequests = await WorkerToCompany.find({ companyId }).populate('workerId').lean();
    const requestedWorkersRaw = await CompanytoWorker.find({ company: companyId }).populate('worker', 'name email location profileImage').lean();
    const requestedWorkers = requestedWorkersRaw.map(request => ({ _id: request._id, positionApplying: request.position, expectedSalary: request.salary, status: request.status, location: request.location, worker: { name: request.worker?.name || 'Unknown', email: request.worker?.email || 'N/A' } }));
    res.render('company/hiring', { workers: processedWorkers, workerRequests, requestedWorkers });
  } catch (err) {
    console.error('Error loading hiring page:', err);
    res.status(500).send('Error loading hiring page');
  }
};

const getSettings = async (req, res) => {
  const user = await Company.findById(req.user.user_id);
  res.render('company/company_settings', { user });
};

const getBids = async (req, res) => {
  try {
    const companyId = req.user.user_id;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).render('company/company_bids', { error: 'Company not found', bids: [], companyBids: [], selectedBid: null, req, companyName: '', companyId: '' });
    const activeSection = req.query.section || 'place-bid';
    const bids = await Bid.find({ 'companyBids.companyId': { $ne: companyId }, status: 'open' }).lean();
    const projectsWithCompanyBids = await Bid.find({ 'companyBids.companyId': companyId }).lean();
    const companyBids = projectsWithCompanyBids.map(project => {
      const companyBid = project.companyBids.find(bid => bid.companyId.toString() === companyId.toString());
      if (companyBid) {
        let status = 'Pending';
        if (project.winningBidId) status = project.winningBidId.toString() === companyBid._id.toString() ? 'Accepted' : 'Rejected';
        return { project, bidPrice: companyBid.bidPrice, bidDate: companyBid.bidDate, status };
      }
    }).filter(Boolean);
    const selectedBidId = req.query.bidId;
    let selectedBid = null;
    if (selectedBidId && mongoose.Types.ObjectId.isValid(selectedBidId)) selectedBid = await Bid.findById(selectedBidId).lean();
    res.render('company/company_bids', { activeSection, bids, companyBids, selectedBid, req, companyName: company.companyName, companyId: company._id });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).render('company/company_bids', { error: 'Error loading bids', bids: [], companyBids: [], selectedBid: null, req, companyName: '', companyId: '' });
  }
};

// Add other company controllers like revenue, etc., if needed

module.exports = { getDashboard, getOngoingProjects, getProjectRequests, getHiring, getSettings, getBids , getCompanyRevenue };