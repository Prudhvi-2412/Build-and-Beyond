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
    const projects = await ConstructionProjectSchema.find({ 
      status: { $in: ['pending', 'proposal_sent'] }, 
      companyId: req.user.user_id 
    }).lean();
    res.render('company/project_requests', { projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// Add this new function to your controllers file
const updateProjectStatusController = async (req, res) => {
  try {
    // CORRECT: Destructure projectId directly from the req.params object
    const { projectId } = req.params; 
    
    // CORRECT: Destructure status directly from the req.body object
    const { status } = req.body; 

    // Assuming req.user contains the logged-in user's ID as user_id
    const { user_id } = req.user; 

    const updatedProject = await ConstructionProjectSchema.findOneAndUpdate(
      // The query now uses the correctly extracted variables
      { _id: projectId, companyId: user_id }, 
      { status: status }, 
      { new: true } 
    );

    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found or you do not have permission to update it.' });
    }

    res.status(200).json({ message: 'Project status updated successfully', project: updatedProject });

  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
};
// In controllers/companyController.js



// ===== ADD THIS NEW FUNCTION =====

const submitBidController = async (req, res) => {
    // 1. Get the data from the form submission
    const { bidId, bidPrice, companyName, companyId } = req.body;

    // 2. Basic validation to ensure we have the necessary data
    if (!bidId || !bidPrice || !companyId || !companyName) {
        // If data is missing, redirect back with an error
        return res.redirect('/companybids?error=invalid_data');
    }

    try {
        // 3. Find the main project document using its ID
        const projectBid = await Bid.findById(bidId);

        if (!projectBid) {
            // If no project is found with that ID, it's an error
            return res.redirect('/companybids?error=project_not_found');
        }

        // 4. Create the new company bid sub-document object
        const newCompanyBid = {
            companyId: companyId,
            companyName: companyName,
            bidPrice: parseFloat(bidPrice) // Ensure bidPrice is a number
        };

        // 5. Push the new bid object into the 'companyBids' array
        projectBid.companyBids.push(newCompanyBid);

        // 6. Save the parent document. This is the crucial step!
        await projectBid.save();

        // 7. Redirect back to the bids page with a success message
        res.redirect('/companybids?success=bid_submitted');

    } catch (error) {
        console.error('Error submitting bid:', error);
        // If a database error occurs, redirect with a server error message
        res.redirect('/companybids?error=server_error');
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
    const workerRequests = await WorkerToCompany.find({
      companyId: companyId,
      status: 'Pending'
    })
    .populate('workerId')
    .lean();

    const requestedWorkersRaw = await CompanytoWorker.find({ company: companyId }).populate('worker', 'name email location profileImage').lean();
    const requestedWorkers = requestedWorkersRaw.map(request => ({ _id: request._id, positionApplying: request.position, expectedSalary: request.salary, status: request.status, location: request.location, worker: { name: request.worker?.name || 'Unknown', email: request.worker?.email || 'N/A' } }));
    res.render('company/hiring', { workers: processedWorkers, workerRequests, requestedWorkers });
  } catch (err) {
    console.error('Error loading hiring page:', err);
    res.status(500).send('Error loading hiring page');
  }
};

const handleWorkerRequest = async (req, res) => {
  try {
    const { requestId } = req.params; // The ID of the WorkerToCompany request
    const { status } = req.body; // 'accepted' or 'rejected'
    const companyId = req.user.user_id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status provided.' });
    }

    // Find the request and ensure it belongs to the logged-in company
    const updatedRequest = await WorkerToCompany.findOneAndUpdate(
      { _id: requestId, companyId: companyId },
      { status: status }, // Update the status field
      { new: true }      // Return the updated document
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Request not found or you do not have permission.' });
    }

    res.status(200).json({ message: `Worker request has been ${status}.`, request: updatedRequest });

  } catch (error) {
    console.error('Error handling worker request:', error);
    res.status(500).json({ error: 'Server error while handling worker request.' });
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

// In controllers/companyController.js

const getSettings = async (req, res) => {
  try {
    const companyFromDB = await Company.findById(req.user.user_id);

    if (!companyFromDB) {
      return res.status(404).send("Company not found.");
    }

    // Format the location object into a readable string
    let formattedLocation = 'Not specified';
    if (companyFromDB.location && companyFromDB.location.city) {
      formattedLocation = `${companyFromDB.location.city}, ${companyFromDB.location.state || ''}`.trim();
      if (formattedLocation.endsWith(',')) {
        formattedLocation = formattedLocation.slice(0, -1);
      }
    }

    const company = {
      workerProfile: {
        // Using exact names from your schema
        name: companyFromDB.companyName || 'N/A',
        location: formattedLocation,
        size: companyFromDB.size || 'N/A',
        specializations: companyFromDB.specialization || [], // Corrected: specialization (singular)
        currentOpenings: companyFromDB.currentOpenings || [],
        about: companyFromDB.aboutCompany || '', // Corrected: aboutCompany
        whyJoin: companyFromDB.whyJoinUs || '' // Corrected: whyJoinUs
      },
      customerProfile: {
        name: companyFromDB.companyName || 'N/A',
        location: formattedLocation,
        projectsCompleted: companyFromDB.projectsCompleted || '0',
        yearsInBusiness: companyFromDB.yearsInBusiness || '0',
        about: companyFromDB.aboutForCustomers || '', // Using a single 'about' field for both for now
        didYouKnow: companyFromDB.didYouKnow || '',
        teamMembers: companyFromDB.teamMembers || [],
        completedProjects: companyFromDB.completedProjects || []
      }
    };

    res.render('company/company_settings', { company });
  
  } catch (error) {
    console.error("Error in getSettings:", error);
    res.status(500).send("An error occurred while loading settings.");
  }
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

// In companyController.js

const updateCompanyProfile = async (req, res) => {
    // This single function will handle BOTH profile updates.
    // It uses req.body.profileType to know which form was submitted.
    
    const { profileType } = req.body;
    const companyId = req.user.user_id;

    if (!profileType) {
        return res.status(400).json({ message: 'Profile type is required.' });
    }

    try {
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        if (profileType === 'worker') {
            // This logic is for the WORKER PROFILE (sent as JSON)
            const { companyLocation, companySize, specializations, aboutCompany, whyJoinUs, currentOpenings } = req.body;
            
            if (companyLocation) company.location.city = companyLocation;
            company.size = companySize;
            company.specialization = specializations.split(',').map(s => s.trim());
            company.aboutCompany = aboutCompany;
            company.whyJoinUs = whyJoinUs;
            company.currentOpenings = currentOpenings;

        } else if (profileType === 'customer') {
            // This logic is for the CUSTOMER PROFILE (sent as FormData)
            const { companyLocation, projectsCompleted, yearsInBusiness, customerAboutCompany, didYouKnow, teamMembers, completedProjects } = req.body;

            if (companyLocation) company.location.city = companyLocation;
            company.projectsCompleted = projectsCompleted;
            company.yearsInBusiness = yearsInBusiness;
            company.aboutForCustomers = customerAboutCompany; // Assuming you want to update the main 'about'
            company.didYouKnow = didYouKnow;

            // For file uploads, req.files will be available because of multer.
            // You would add logic here to upload images to a service like Cloudinary,
            // get back the URLs, and then update the teamMembers/completedProjects arrays.
            // For now, we update with the text data sent from the form.
            if (teamMembers) company.teamMembers = JSON.parse(teamMembers);
            if (completedProjects) company.completedProjects = JSON.parse(completedProjects);
        }

        await company.save();
        res.json({ message: 'Profile updated successfully!' });

    } catch (error) {
        console.error('Error updating company profile:', error);
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
};
const submitProjectProposal = async (req, res) => {
  try {
    const { projectId, price, description } = req.body;
    const companyId = req.user.user_id;

    const project = await ConstructionProjectSchema.findOne({ _id: projectId, companyId: companyId });
    if (!project) {
      return res.status(404).send('Project not found or you are not authorized.');
    }

    project.status = 'proposal_sent';
    project.proposal = {
      price: parseFloat(price),
      description: description,
      sentAt: new Date()
    };

    await project.save();
    res.redirect('/project_requests'); // Redirect back to the project requests page

  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).send('Server Error');
  }
};
// Add other company controllers like revenue, etc., if needed

module.exports = { getDashboard, getOngoingProjects, getProjectRequests, updateProjectStatusController, 
   getHiring, getSettings, getBids , getCompanyRevenue, createHireRequest,  
  updateCompanyProfile, handleWorkerRequest, submitBidController, submitProjectProposal};
