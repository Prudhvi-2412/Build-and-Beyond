const { Customer, Worker, ArchitectHiring, DesignRequest, ConstructionProjectSchema, Bid, Company, FavoriteDesign } = require('../models/index');
const { getTargetDate } = require('../utils/helpers');
const mongoose = require('mongoose'); // Needed for checking ObjectId validity

const getDashboard = (req, res) => res.render('customer/customer_dashboard');

const getJobRequestStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) return res.status(401).send('Unauthorized');
    const architectApplications = await ArchitectHiring.find({ customer: req.user.user_id }).lean();
    const interiorApplications = await DesignRequest.find({ customerId: req.user.user_id }).lean();
    const companyApplications = await ConstructionProjectSchema.find({ customerId: req.user.user_id }).lean();
    res.render('customer/Job_Status', { architectApplications, interiorApplications, companyApplications });
  } catch (error) {
    console.error('Error fetching job request status:', error);
    res.status(500).send('Internal Server Error');
  }
};

const getConstructionCompaniesList = async (req, res) => {
  try {
    const companies = await Company.find({}).lean();
    res.render('customer/construction_companies_list', { companies, user: req.user });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).send('Server error');
  }
};

const getArchitects = async (req, res) => {
  try {
    const architects = await Worker.find({ isArchitect: true }).lean();
    res.render('customer/architect', { architects });
  } catch (error) {
    console.error('Error fetching architects:', error);
    res.status(500).json({ message: 'Failed to fetch architects' });
  }
};

const getArchitectForm = (req, res) => {
  const { workerId } = req.query;
  res.render('customer/architect_form', { workerId });
};

const getOngoingProjects = async (req, res) => {
  try {
    const customerId = req.user.user_id;
    if (!customerId) return res.redirect('/login');
    const projects = await ConstructionProjectSchema.find({ customerId, status: 'accepted' }).lean();
    const totalActiveProjects = projects.length;
    const metrics = { totalActiveProjects, monthlyRevenue: '4.8', customerSatisfaction: '4.7', projectsOnSchedule: '85' };
    const enhancedProjects = projects.map(project => {
      const projectObj = project;
      projectObj.completion = 0;
      projectObj.targetDate = getTargetDate(project.createdAt, project.projectTimeline);
      projectObj.currentPhase = 'Update current';
      projectObj.siteFilepaths = projectObj.siteFilepaths || [];
      projectObj.floors = projectObj.floors || [];
      return projectObj;
    });
    res.render('customer/ongoing_projects', { projects: enhancedProjects, metrics });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).send('Server error');
  }
};

const getDesignIdeas = (req, res) => res.render('customer/design_ideas');

const getInteriorDesignForm = (req, res) => {
  const { workerId } = req.query;
  res.render('customer/interiordesign_form', { workerId });
};

const getInteriorDesigners = async (req, res) => {
  try {
    const designers = await Worker.find({ isArchitect: false }).lean();
    res.render('customer/interior_design', { designers });
  } catch (error) {
    console.error('Error fetching designers:', error);
    res.status(500).json({ message: 'Failed to fetch designers' });
  }
};

const getConstructionForm = (req, res) => res.render('customer/construction_form');

const getBidForm = (req, res) => res.render('customer/bid_form');

const getSettings = async (req, res) => {
  try {
    const user = await Customer.findById(req.user.user_id).lean();
    res.render('customer/customer_settings', { user });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).send('Server error');
  }
};

const getBidSpace = async (req, res) => {
  try {
    const customerId = req.user.user_id;
    const customerBids = await Bid.find({ customerId }).lean();
    res.render('customer/bid_space', { customerBids, user: req.user });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).send('Server error');
  }
};

const postConstructionForm = async (req, res) => {
  try {
    const {
      projectName,
      customerName,
      customerEmail,
      customerPhone,
      projectAddress,
      projectLocationPincode,
      totalArea,
      buildingType,
      estimatedBudget,
      projectTimeline,
      totalFloors,
      specialRequirements,
      accessibilityNeeds,
      energyEfficiency,
      floors
    } = req.body;

    // Handle file uploads if any (e.g., siteFilepaths)
    const siteFilepaths = req.files ? req.files.map(file => file.path) : [];

    // Parse floors if sent as JSON string
    let parsedFloors = [];
    if (typeof floors === 'string') {
      try {
        parsedFloors = JSON.parse(floors);
      } catch (e) {
        console.error('Error parsing floors:', e);
        return res.status(400).send('Invalid floors data');
      }
    } else if (Array.isArray(floors)) {
      parsedFloors = floors;
    }

    const newProject = new ConstructionProjectSchema({
      projectName,
      customerName,
      customerEmail,
      customerPhone,
      projectAddress,
      projectLocationPincode,
      totalArea: Number(totalArea),
      buildingType,
      estimatedBudget: Number(estimatedBudget) || 0,
      projectTimeline: Number(projectTimeline) || 0,
      totalFloors: Number(totalFloors),
      floors: parsedFloors,
      specialRequirements,
      accessibilityNeeds,
      energyEfficiency,
      siteFilepaths,
      customerId: req.user ? req.user.user_id : null,
      status: 'pending'
    });

    await newProject.save();
    res.redirect('/ongoing_projects');
  } catch (error) {
    console.error('Error in postConstructionForm:', error);
    res.status(500).send('Server Error');
  }
};


// ====================================================================
// NEW FAVORITES API CONTROLLERS
// ====================================================================

/**
 * GET /api/customer/favorites
 * Fetches all favorited designs for the logged-in customer.
 */
const getFavorites = async (req, res) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const customerId = req.user.user_id;

        const favorites = await FavoriteDesign.find({ customerId }).lean();

        res.status(200).json({ favorites });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: 'Failed to retrieve favorites.' });
    }
};

/**
 * POST /api/customer/favorites
 * Adds a new design to the customer's favorites.
 */
const saveFavoriteDesign = async (req, res) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const customerId = req.user.user_id;
        const { designId, category, title, imageUrl } = req.body;

        if (!designId || !category || !title || !imageUrl) {
            return res.status(400).json({ message: 'Missing required design fields.' });
        }

        const newFavorite = new FavoriteDesign({
            customerId,
            designId,
            category,
            title,
            imageUrl
        });

        const savedFavorite = await newFavorite.save();

        res.status(201).json({ 
            message: 'Design added to favorites!', 
            favorite: savedFavorite 
        });

    } catch (error) {
        // Mongoose duplicate key error (11000)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'This design is already in your favorites.' });
        }
        console.error('Error saving favorite design:', error);
        res.status(500).json({ message: 'Failed to save favorite due to a server error.' });
    }
};

/**
 * DELETE /api/customer/favorites/:id
 * Removes a favorite design by its MongoDB _id.
 */
const removeFavoriteDesign = async (req, res) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const customerId = req.user.user_id;
        const favoriteMongoId = req.params.id; 

        if (!mongoose.Types.ObjectId.isValid(favoriteMongoId)) {
            return res.status(400).json({ message: 'Invalid favorite ID format.' });
        }

        // Delete the document, ensuring the customerId matches for security
        const result = await FavoriteDesign.deleteOne({ _id: favoriteMongoId, customerId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Favorite not found or unauthorized to delete.' });
        }

        res.status(200).json({ message: 'Favorite design removed successfully.' });
    } catch (error) {
        console.error('Error removing favorite design:', error);
        res.status(500).json({ message: 'Failed to remove favorite.' });
    }
};

// ====================================================================

module.exports = {
  getDashboard,
  getJobRequestStatus,
  getConstructionCompaniesList,
  getArchitects,
  getArchitectForm,
  getOngoingProjects,
  getDesignIdeas,
  getInteriorDesignForm,
  getInteriorDesigners,
  getConstructionForm,
  getBidForm,
  getSettings,
  getBidSpace,
  postConstructionForm,
  // EXPORT NEW FAVORITES FUNCTIONS
  getFavorites,
  saveFavoriteDesign,
  removeFavoriteDesign
};