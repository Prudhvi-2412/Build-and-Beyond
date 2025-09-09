const { Worker, ArchitectHiring, DesignRequest, Company, CompanytoWorker, WorkerToCompany } = require('../models');
const mongoose = require("mongoose");

const getJobs = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) return res.status(401).json({ error: 'Unauthorized: User not found' });
    const worker = await Worker.findById(req.user.user_id).select('isArchitect');
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (worker.isArchitect) {
      const Jobs = await ArchitectHiring.find({ worker: req.user.user_id, status: 'Pending' }).sort({ updatedAt: -1 });
      return res.render('worker/worker_jobs', { user: req.user, jobOffers: Jobs });
    } else {
      const Jobs = await DesignRequest.find({ workerId: req.user.user_id, status: 'pending' }).sort({ updatedAt: -1 });
      return res.render('worker/InteriorDesigner_Jobs', { user: req.user, jobs: Jobs });
    }
  } catch (error) {
    console.error('Error fetching accepted projects:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getJoinCompany = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const user = await Worker.findById(workerId).lean();
    const companies = await Company.find().lean();
    const offers = await CompanytoWorker.find({ worker: req.user.user_id }).lean();
    const jobApplications = await WorkerToCompany.find({ workerId: req.user.user_id }).lean();
    res.render('worker/workers_join_company', { user, companies, offers, jobApplications });
  } catch (error) {
    console.error('Error fetching data:', error);
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
    const worker = await Worker.findById(req.user.user_id).lean();
    if (!worker) return res.status(404).send('Worker not found');
    const [offers, companies, jobs] = await Promise.all([
      CompanytoWorker.find({ worker: req.user.user_id, status: 'Pending' }).populate('company', 'companyName').sort({ createdAt: -1 }).limit(3).lean(),
      Company.find({}).sort({ createdAt: -1 }).limit(3).lean(),
      DesignRequest.find({ workerId: req.user.user_id, status: 'pending' }).sort({ createdAt: -1 }).limit(3).lean()
    ]);
    const enhancedJobs = jobs.map(job => ({ ...job, timeline: job.roomType === 'Residential' ? '2 weeks' : '1 month', budget: job.roomSize?.length && job.roomSize?.width ? job.roomSize.length * job.roomSize.width * 1000 : 0 }));
    res.render('worker/worker_dashboard', { workerName: worker.name || 'Builder', offers, companies, jobs: enhancedJobs, user: req.user });
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

    const workerId = req.user.user_id;

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

module.exports = { getJobs, getJoinCompany, getSettings, getEditProfile, getDashboard, getWorkerById, deleteWorkerRequest,createWorkerRequest };