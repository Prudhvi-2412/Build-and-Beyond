const mongoose = require('mongoose');
const { Company, Bid, ConstructionProjectSchema, Worker, WorkerToCompany, CompanytoWorker } = require('../models');
const { getTargetDate } = require('../utils/helpers');

function calculateProgress(startDate, timelineString) {
 try {
 const totalMonths = parseInt(timelineString, 10);
 if (isNaN(totalMonths) || totalMonths <= 0) {
  return 0;
 }

    const start = new Date(startDate);
    const now = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + totalMonths);

    if (now >= end) return 100;
    if (now <= start) return 0;

    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    const progressPercentage = (elapsedDuration / totalDuration) * 100;
    
    return Math.floor(progressPercentage);

  } catch (error) {
    console.error("Error in calculateProgress:", error);
    return 0;
  }
}

// Add this function right below your calculateProgress function
function calculateDaysRemaining(startDate, timelineString) {
  try {
    const totalMonths = parseInt(timelineString, 10);
    if (isNaN(totalMonths) || totalMonths <= 0) {
      return 0;
    }

    const start = new Date(startDate);
    const now = new Date();
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + totalMonths);

    // If the project is already finished, return 0 days remaining
    if (now >= end) {
      return 0;
    }

    // Calculate the difference in milliseconds and convert to days
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays;

  } catch (error) {
   console.error("Error in calculateDaysRemaining:", error);
    return 0;
  }
}

const getDashboard = async (req, res) => {
  try {
    const bids = await Bid.find({ status: 'open' }).sort({ createdAt: -1 }).limit(2).lean();
    const projects = await ConstructionProjectSchema.find({ companyId: req.user ? req.user.user_id : null }).sort({ createdAt: -1 }).lean();
    const activeProjects = projects.filter(p => p.status === 'accepted').length;
    const completedProjects = projects.filter(p => p.status === 'rejected').length;
    const revenue = projects.filter(p => p.status === 'rejected' && new Date(p.updatedAt).getMonth() === new Date().getMonth() && new Date(p.updatedAt).getFullYear() === new Date().getFullYear()).reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);

    res.render('company/company_dashboard', { bids, projects, activeProjects, completedProjects, revenue, calculateProgress, calculateDaysRemaining});
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

// Add this new function to your controllers file
const updateProjectStatusController = async (req, res) => {
  try {
    const { projectId } = req.params; // Get projectId from the URL (e.g., "123")
    const { status } = req.body; // Get status from the request body (e.g., "accepted")
    const { user_id } = req.user; // Get the companyId from the logged-in user

    // Find the project by its ID and the companyId to ensure a user can only update their own projects
    const updatedProject = await ConstructionProjectSchema.findOneAndUpdate(
      { _id: projectId, companyId: user_id },
      { status: status }, // The fields to update
      { new: true } // This option returns the updated document
    );

    if (!updatedProject) {
      // If no project was found with that ID for that user, return a 404
      return res.status(404).json({ error: 'Project not found or you do not have permission to update it.' });
    }

    // If the update was successful, send a success response
    res.status(200).json({ message: 'Project status updated successfully', project: updatedProject });

  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
};

// In controllers/companyController.js

const handleBidActionController = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { status } = req.body;
    const { user_id } = req.user;

    const bid = await Bid.findById(bidId);

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found.' });
    }

    if (status === 'accepted') {
    
      // Create a new ConstructionProject, copying all relevant details
      const newProject = new ConstructionProjectSchema({
        // --- THIS IS THE CORRECTED PART ---
        projectName: bid.projectName,
        customerName: bid.customerName,
        customerId: bid.customerId,
        customerEmail: bid.customerEmail,     // <-- ADDED THIS
        customerPhone: bid.customerPhone,     // <-- ADDED THIS
        projectAddress: bid.projectAddress,
        projectLocation: bid.projectLocation,
        estimatedBudget: bid.estimatedBudget,
        projectTimeline: bid.projectTimeline,
        totalArea: bid.totalArea,
        buildingType: bid.buildingType,
        totalFloors: bid.totalFloors,
        floors: bid.floors,
        specialRequirements: bid.specialRequirements,
        accessibilityNeeds: bid.accessibilityNeeds,
        energyEfficiency: bid.energyEfficiency,
        siteFiles: bid.siteFiles,
        // --- End of corrected part ---

        companyId: user_id,
        status: 'accepted'
      });

      // Now, when you save, the validation will pass
      await newProject.save();

      bid.status = 'awarded';
      await bid.save();
      
      return res.status(201).json({ message: 'Bid accepted and project created!', project: newProject });
    }
    
    if (status === 'rejected') {
      bid.status = 'closed';
      await bid.save();
      return res.status(200).json({ message: 'Bid has been rejected.' });
    }

    res.status(400).json({ message: 'Invalid status provided.' });

  } catch (error) {
    // This is where the validation error was being caught
    console.error('Error handling bid action:', error);
    res.status(500).json({ error: 'Server error while handling bid action.' });
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

// START: ADD THIS NEW FUNCTION
const createHireRequest = async (req, res) => {
    try {
        const { position, location, salary, workerId } = req.body;
        const companyId = req.user.user_id; // Assumes user is authenticated and user_id is the company's ID

        if (!companyId) {
            return res.status(401).json({ error: 'Unauthorized. You must be logged in.' });
        }

        if (!position || !location || !salary || !workerId) {
            return res.status(400).json({ error: 'Missing required fields for hire request.' });
        }

        // Check if a request already exists to prevent duplicates
        const existingRequest = await CompanytoWorker.findOne({
            company: companyId,
            worker: workerId,
            status: 'Pending'
        });

        if (existingRequest) {
            return res.status(409).json({ error: 'A pending hire request for this worker already exists.' });
        }

        const newHireRequest = new CompanytoWorker({
            company: companyId,
            worker: workerId,
            position: position,
            location: location,
            salary: salary,
            status: 'Pending'
        });

        await newHireRequest.save();

        res.status(200).json({ success: true, message: 'Hire request sent successfully.' });

    } catch (error) {
        console.error('Error creating hire request:', error);
        res.status(500).json({ error: 'An internal server error occurred while sending the request.' });
    }
};
// END: ADD THIS NEW FUNCTION

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

module.exports = { getDashboard, getOngoingProjects, getProjectRequests, updateProjectStatusController, handleBidActionController, getHiring, getSettings, getBids , getCompanyRevenue, createHireRequest };
