const { Worker, ArchitectHiring, DesignRequest, Company, CompanytoWorker, WorkerToCompany, ConstructionProjectSchema } = require('../models');
const mongoose = require("mongoose");
const { findOrCreateChatRoom } = require('./chatController'); // NEW: Import the chat utility
const bcrypt = require('bcrypt');
// controllers/workerController.js

const getJobs = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    // Fetch the full worker document instead of just 'isArchitect'
    const worker = await Worker.findById(req.user.user_id).lean(); // Using .lean() for better performance

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (worker.isArchitect) {
      const Jobs = await ArchitectHiring.find({ worker: req.user.user_id, status: 'Pending' }).sort({ updatedAt: -1 });
      // Pass the full worker object as 'user'
      return res.render('worker/worker_jobs', { user: worker, jobOffers: Jobs ,activePage: 'jobs'});
    } else {
      const Jobs = await DesignRequest.find({ workerId: req.user.user_id, status: 'pending' }).sort({ updatedAt: -1 });
      // Pass the full worker object as 'user'
      return res.render('worker/InteriorDesigner_Jobs', { user: worker, jobs: Jobs ,activePage: 'jobs' });
    }
  } catch (error) {
    console.error('Error fetching accepted projects:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getJoinCompany = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const { search, location, specialization } = req.query; // Get filter queries from URL

    // Build a dynamic filter object for the database query
    const companyFilter = {};
    if (search) {
      companyFilter.$or = [
        { companyName: { $regex: search, $options: 'i' } }, // Case-insensitive search
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) {
      companyFilter['location.city'] = location;
    }
    if (specialization) {
      companyFilter.specialization = specialization;
    }
    
    const user = await Worker.findById(workerId).lean();
    // Use the filter object in the .find() method, add limit and sort to prevent loading all records
    const companies = await Company.find(companyFilter).sort({ createdAt: -1 }).limit(100).lean(); 
    
    // Add field selection to populate to reduce data size
    const offers = await CompanytoWorker.find({ worker: workerId, status: 'Pending' })
                                        .populate('company', 'companyName description aboutCompany location specialization size yearsInBusiness currentOpenings whyJoinUs')
                                        .sort({ createdAt: -1 })
                                        .lean();
    const jobApplications = await WorkerToCompany.find({ workerId: workerId }).lean();
    
    const isEmployed = await CompanytoWorker.findOne({ worker: workerId, status: 'Accepted' }) || await WorkerToCompany.findOne({ workerId: workerId, status: 'Accepted' });


    res.render('worker/workers_join_company', { 
      user, 
      companies, 
      offers, 
      jobApplications, 
      activePage: 'join',
      query: req.query, // Pass the query back to the template to pre-fill filters
      isEmployed: !!isEmployed
    });
  } catch (error) {
    console.error('Error fetching data for Join Company page:', error);
    res.status(500).send('Server error');
  }
};


const getSettings = async (req, res) => {
  const user = await Worker.findById(req.user.user_id);
  res.render('worker/worker_settings', { user });
};

const getEditProfile = (req, res) => res.render('worker/worker_profile_edit');

const getDashboard = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) return res.status(401).send('Unauthorized: User not authenticated');
    
    const workerId = req.user.user_id;
    const worker = await Worker.findById(workerId).lean();
    if (!worker) return res.status(404).send('Worker not found');

    const [offers, companies, jobs, offerCount, applicationCount] = await Promise.all([
      CompanytoWorker.find({ worker: workerId, status: 'Pending' }).populate('company', 'companyName').sort({ createdAt: -1 }).limit(3).lean(),
      // MODIFIED THIS LINE to sort companies by most recently created
      Company.find({}).sort({ createdAt: -1 }).limit(3).lean(),
      DesignRequest.find({ workerId: workerId, status: 'pending' }).sort({ createdAt: -1 }).limit(3).lean(),
      CompanytoWorker.countDocuments({ worker: workerId, status: 'Pending' }),
      WorkerToCompany.countDocuments({ workerId: workerId, status: 'Pending' })
    ]);

    const enhancedJobs = jobs.map(job => ({ ...job, timeline: job.roomType === 'Residential' ? '2 weeks' : '1 month', budget: job.roomSize?.length && job.roomSize?.width ? job.roomSize.length * job.roomSize.width * 1000 : 0 }));
    
    res.render('worker/worker_dashboard', { 
        workerName: worker.name || 'Builder', 
        offers, 
        companies, 
        jobs: enhancedJobs, 
        user: worker,
        activePage: 'dashboard',
        stats: {
            pendingOffers: offerCount,
            activeApplications: applicationCount
        }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { message: 'Dashboard Loading Failed', error: process.env.NODE_ENV === 'development' ? error : {} });
  }
};
const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).select('name email title rating about specialties projects contact location linkedin previousWork profileImage').lean();
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    worker.profileImage = worker.profileImage || `https://api.dicebear.com/9.x/male/svg?seed=${encodeURIComponent(worker.name.replace(/\s+/g, ''))}&mouth=smile`;
    res.json(worker);
  } catch (err) {
    console.error('Error fetching worker:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteWorkerRequest = async (req, res) => {
  try {
    const request = await WorkerToCompany.findOneAndDelete({ _id: req.params.id, companyId: req.user.user_id, status: 'pending' });
    if (!request) return res.status(404).json({ error: 'Request not found or cannot be cancelled' });
    res.json({ message: 'Request cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling request:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// Added now
const createWorkerRequest = async (req, res) => {
  try {
    const workerId = req.user.user_id;

    const isEmployed = await CompanytoWorker.findOne({ worker: workerId, status: 'Accepted' }) || await WorkerToCompany.findOne({ workerId: workerId, status: 'Accepted' });
    if (isEmployed) {
        return res.status(403).send('You are already employed and cannot apply for another company.');
    }
    const {
      fullName,
      email,
      location,
      linkedin,
      experience,
      expectedSalary,
      positionApplying,
      primarySkills,
      workExperience,
      termsAgree,
      companyId,
    } = req.body;


    // Validate required fields
    if (
      !fullName ||
      !email ||
      !location ||
      !experience ||
      !expectedSalary ||
      !positionApplying ||
      !primarySkills ||
      !workExperience ||
      !termsAgree ||
      !workerId ||
      !companyId ||
      !req.file
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        missing: {
          fullName: !fullName,
          email: !email,
          location: !location,
          experience: !experience,
          expectedSalary: !expectedSalary,
          positionApplying: !positionApplying,
          primarySkills: !primarySkills,
          workExperience: !workExperience,
          termsAgree: !termsAgree,
          workerId: !workerId,
          companyId: !companyId,
          resume: !req.file,
        },
      });
    }

    // Validate companyId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ error: "Invalid companyId format" });
    }

    // Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Get company name
    const compName = company.name || company.companyName;

    // Parse primarySkills
    const skillsArray = primarySkills.split(",").map((s) => s.trim());

    // Create new application
    const jobApplication = new WorkerToCompany({
      fullName,
      email,
      location,
      linkedin: linkedin || null,
      experience: parseInt(experience),
      expectedSalary: parseInt(expectedSalary),
      positionApplying,
      primarySkills: skillsArray,
      workExperience,
      resume: req.file.filename,
      termsAgree: termsAgree === "true" || termsAgree === true,
      workerId,
      companyId,
      compName,
    });

    await jobApplication.save();

    // Redirect after saving
    res.redirect("/workerjoin_company");
  } catch (error) {
    console.error("Error in createWorkerRequest:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      file: req.file,
    });
    if (error.name === "MulterError") {
      return res.status(400).json({ error: `Multer error: ${error.message}` });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: `Validation error: ${error.message}` });
    }
    res.status(500).json({
      error: "Server error while processing application",
      details: error.message,
    });
  }
};

const updateWorkerProfile = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const { name, title, experience, about, specialties } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found." });
    }

    // Update basic fields
    worker.name = name || worker.name;
    worker.professionalTitle = title || worker.professionalTitle;
    worker.experience = experience || worker.experience;
    worker.about = about || worker.about;
    worker.specialties = Array.isArray(specialties) ? specialties : (specialties ? [specialties] : []);

    // Handle profile image upload
    const profileImageFile = req.files.find(file => file.fieldname === 'profileImage');
    if (profileImageFile) {
      worker.profileImage = profileImageFile.path;
    }

    // Handle dynamic project updates
    const projects = [];
    let i = 1;
    while (req.body[`projectName-${i}`]) {
        const projectImageFile = req.files.find(file => file.fieldname === `projectImage-${i}`);
        projects.push({
            name: req.body[`projectName-${i}`],
            year: req.body[`projectYear-${i}`],
            location: req.body[`projectLocation-${i}`],
            description: req.body[`projectDescription-${i}`],
            image: projectImageFile ? projectImageFile.path : worker.projects[i-1]?.image , // Retain existing image if no new upload
        });
        i++;
    }
    // Only update projects if new project data was submitted
    if(projects.length > 0){
        worker.projects = projects;
    }


    await worker.save();

    res.status(200).json({
      message: 'Profile updated successfully!',
      redirect: '/workersettings' // Redirect back to the settings page
    });

  } catch (error) {
    console.error('Error updating worker profile:', error);
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
};
const updateAvailability = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const { availability } = req.body;

    // Validate the input
    if (!['available', 'busy', 'unavailable'].includes(availability)) {
      return res.status(400).json({ message: 'Invalid availability status.' });
    }

    // Find the worker by their ID and update their status
    await Worker.findByIdAndUpdate(workerId, { availability });

    res.status(200).json({ success: true, message: 'Availability updated successfully.' });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error while updating availability.' });
  }
};
const acceptOffer = async (req, res) => {
  try {
    const offer = await CompanytoWorker.findById(req.params.id);
    if (!offer || offer.worker.toString() !== req.user.user_id) {
      return res.status(404).send('Offer not found or you are not authorized.');
    }
    offer.status = 'Accepted';
    await offer.save();
    // Create a chat room after accepting the offer
    await findOrCreateChatRoom(offer._id, 'hiring');

    res.redirect('/worker/my-company');
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).send('Server Error');
  }
};


// ADD THIS NEW FUNCTION TO DECLINE AN OFFER
const declineOffer = async (req, res) => {
  try {
    const offer = await CompanytoWorker.findById(req.params.id);
    // Security check
    if (!offer || offer.worker.toString() !== req.user.user_id) {
      return res.status(404).send('Offer not found or you are not authorized.');
    }
    offer.status = 'Denied';
    await offer.save();
    res.redirect('/workerjoin_company'); // Redirect back to the offers page
  } catch (error) {
    console.error('Error declining offer:', error);
    res.status(500).send('Server Error');
  }
};
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status, type } = req.body; // 'type' will be 'architect' or 'interior'
    const workerId = req.user.user_id;

    if (!['Accepted', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    let job;

    if (type === 'architect') {
        // Architect schema uses Capitalized status
        job = await ArchitectHiring.findById(id);
        if (!job || (job.worker && job.worker.toString() !== workerId)) {
            return res.status(404).json({ success: false, error: 'Job not found or unauthorized' });
        }
    } else if (type === 'interior') {
        // Interior Designer schema uses lowercase status, so we convert it
        status = status.toLowerCase(); 
        job = await DesignRequest.findById(id);
        if (!job || (job.workerId && job.workerId.toString() !== workerId)) {
            return res.status(404).json({ success: false, error: 'Job not found or unauthorized' });
        }
    } else {
        return res.status(400).json({ success: false, error: 'Invalid job type' });
    }

    job.status = status; // This now saves the correctly cased status
    await job.save();
    
    // NEW: Find or create chat room immediately upon 'Accepted' status update
    if (status === 'Accepted' || status === 'accepted') {
      await findOrCreateChatRoom(job._id, type);
    }
    
    res.json({ success: true, message: `Job has been ${status.toLowerCase()}.` });

  } catch (error) {
    console.error(`Error updating ${req.body.type} job status:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
const getOngoingProjects = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const worker = await Worker.findById(workerId).lean();
    if (!worker) {
        return res.status(404).send('Worker not found');
    }

    let allProjects = [];
    let rawProjects = []; 

    if (worker.isArchitect) {
        // Fetch all Architect jobs that are Accepted, Completed, OR Rejected
        rawProjects = await ArchitectHiring.find({ 
            worker: workerId, 
            status: { $in: ['Accepted', 'Completed', 'Rejected'] } 
        }).lean();
        
        // NEW: Add chat ID to projects
        allProjects = await Promise.all(rawProjects.map(async (project) => {
            if (project.status === 'Accepted') {
                const chatRoom = await findOrCreateChatRoom(project._id, 'architect');
                return { ...project, projectType: 'architect', chatId: chatRoom ? chatRoom.roomId : null };
            }
            return { ...project, projectType: 'architect', chatId: null };
        }));

    } else {
        // Fetch all Interior Design jobs that are accepted, completed, OR rejected
        rawProjects = await DesignRequest.find({ 
            workerId: workerId, 
            status: { $in: ['accepted', 'completed', 'rejected'] } 
        }).lean();

        // NEW: Add chat ID to projects
        allProjects = await Promise.all(rawProjects.map(async (project) => {
            if (project.status === 'accepted') {
                const chatRoom = await findOrCreateChatRoom(project._id, 'interior');
                return { ...project, projectType: 'interior', chatId: chatRoom ? chatRoom.roomId : null };
            }
            return { ...project, projectType: 'interior', chatId: null };
        }));
    }

    res.render('worker/worker_ongoing_projects', { 
      user: worker, 
      projects: allProjects, 
      activePage: 'ongoing' 
    });

  } catch (error) {
    console.error('Error fetching ongoing projects:', error);
    res.status(500).send('Server Error');
  }
};
const postProjectUpdate = async (req, res) => {
  try {
    const { projectId, projectType, updateText } = req.body;
    const workerId = req.user.user_id;

    let project;
    const newUpdate = { updateText, createdAt: new Date() };
    if (req.file) {
      newUpdate.updateImage = req.file.path; // Save Cloudinary URL
    }

    if (projectType === 'architect') {
      project = await ArchitectHiring.findById(projectId);
      if (!project || (project.worker && project.worker.toString() !== workerId)) {
        return res.status(404).send('Project not found or unauthorized.');
      }
    } else if (projectType === 'interior') {
      project = await DesignRequest.findById(projectId);
      if (!project || (project.workerId && project.workerId.toString() !== workerId)) {
        return res.status(404).send('Project not found or unauthorized.');
      }
    } else {
      return res.status(400).send('Invalid project type.');
    }

    project.projectUpdates.unshift(newUpdate);
    await project.save();
    res.redirect('/worker/ongoing-projects');
  } catch (error) {
    console.error('Error posting project update:', error);
    res.status(500).send('Server Error');
  }
};
const markProjectAsCompleted = async (req, res) => {
  try {
    const { projectId, projectType } = req.body;
    const workerId = req.user.user_id;

    let project;
    if (projectType === 'architect') {
      project = await ArchitectHiring.findById(projectId);
      if (!project || project.worker.toString() !== workerId) {
        return res.status(404).send('Project not found or unauthorized.');
      }
      project.status = 'Completed';
    } else if (projectType === 'interior') {
      project = await DesignRequest.findById(projectId);
      if (!project || project.workerId.toString() !== workerId) {
        return res.status(404).send('Project not found or unauthorized.');
      }
      project.status = 'completed';
    } else {
      return res.status(400).send('Invalid project type.');
    }

    await project.save();
    res.redirect('/worker/ongoing-projects');

  } catch (error) {
    console.error('Error marking project as completed:', error);
    res.status(500).send('Server Error');
  }
};
const submitProposal = async (req, res) => {
  try {
    const { projectId, projectType, price, description } = req.body;
    const workerId = req.user.user_id;

    if (!projectId || !projectType || !price || !description) {
      return res.status(400).send('Missing required proposal fields.');
    }

    let project;
    
    if (projectType === 'architect') {
      project = await ArchitectHiring.findById(projectId);
      // Security check to ensure the project is assigned to this worker
      if (!project || (project.worker && project.worker.toString() !== workerId)) {
        return res.status(404).send('Project not found or you are not authorized.');
      }
      project.status = 'Proposal Sent';
    } else if (projectType === 'interior') {
      project = await DesignRequest.findById(projectId);
      if (!project || (project.workerId && project.workerId.toString() !== workerId)) {
        return res.status(404).send('Project not found or you are not authorized.');
      }
      project.status = 'proposal_sent';
    } else {
      return res.status(400).send('Invalid project type.');
    }

    // Add the proposal details to the project
    project.proposal = {
      price: parseFloat(price),
      description: description,
      sentAt: new Date()
    };

    await project.save();

    // Redirect the worker back to their jobs page after submitting
    res.redirect('/workerjobs');

  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).send('Server Error');
  }
};
const updatePassword = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new passwords are required.' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    // Compare the provided current password with the one in the database
    const isMatch = await bcrypt.compare(currentPassword, worker.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Set the new password. The pre-save hook in your schema will automatically hash it.
    worker.password = newPassword;
    await worker.save();

    res.status(200).json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error while updating password.' });
  }
};

const getMyCompany = async (req, res) => {
    try {
        const workerId = req.user.user_id;
        const user = await Worker.findById(workerId).lean(); // Moved up for consistency and to avoid using partial req.user
        if (!user) {
            return res.status(404).send('Worker not found');
        }

        let company, acceptedRequest;

        // Check for accepted offers from companies, add field selection to populate
        acceptedRequest = await CompanytoWorker.findOne({ worker: workerId, status: 'Accepted' }).populate('company', 'companyName location').lean();

        // If no offer, check for accepted applications to companies, add field selection
        if (!acceptedRequest) {
            acceptedRequest = await WorkerToCompany.findOne({ workerId: workerId, status: 'Accepted' }).populate('companyId', 'companyName location').lean();
            if (acceptedRequest) {
                acceptedRequest.company = acceptedRequest.companyId; // Normalize the company field
            }
        }

        if (!acceptedRequest) {
            return res.render('worker/my_company', { user, company: null, projects: [], chatId: null });
        }

        company = acceptedRequest.company;
        // Add select to limit fields fetched for projects
        const projects = await ConstructionProjectSchema.find({ companyId: company._id, status: 'accepted' }).select('projectName status').lean();

        // Custom chat room creation for company hiring to avoid issues with utility function for 'hiring' type
        let chatId = null;
        try {
            const participants = [workerId, company._id].sort((a, b) => a.toString().localeCompare(b.toString()));
            let chatRoom = await ChatRoom.findOne({ 
                participants: { 
                    $all: participants, 
                    $size: 2 
                } 
            }).lean();

            if (!chatRoom) {
                const roomId = `company_hiring_${participants.join('_')}`;
                chatRoom = new ChatRoom({
                    roomId,
                    participants,
                    type: 'company_hiring'
                });
                await chatRoom.save();
                chatId = roomId;
            } else {
                chatId = chatRoom.roomId;
            }
        } catch (chatError) {
            console.error('Error setting up company chat room:', chatError);
            // Fallback to null, no hang
        }

        res.render('worker/my_company', { user, company, projects, chatId });
    } catch (error) {
        console.error('Error fetching my company:', error);
        res.status(500).send('Server Error');
    }
};

const leaveCompany = async (req, res) => {
    try {
        const workerId = req.user.user_id;
        const statusRegex = new RegExp('^Accepted$', 'i');

        await CompanytoWorker.findOneAndDelete({ worker: workerId, status: statusRegex });
        await WorkerToCompany.findOneAndDelete({ workerId: workerId, status: statusRegex });

        return res.redirect('/worker/my-company');
    } catch (error) {
        console.error('Error leaving company:', error);
        res.status(500).send('Server Error');
    }
};

module.exports = { getJobs, getJoinCompany, getSettings, getEditProfile, getDashboard, getWorkerById, deleteWorkerRequest,
  createWorkerRequest , updateWorkerProfile,updateAvailability,acceptOffer,declineOffer, updateJobStatus ,
  getOngoingProjects,postProjectUpdate,markProjectAsCompleted,submitProposal, updatePassword, getMyCompany, leaveCompany };