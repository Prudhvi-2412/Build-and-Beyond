const express = require('express');
const router = express.Router();
const { 
  getDashboard, 
  postConstructionForm, 
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
  // IMPORT NEW FAVORITES FUNCTIONS
  getFavorites,
  saveFavoriteDesign,
  removeFavoriteDesign
} = require('../controllers/customerController');
const auth = require('../middlewares/auth'); // Import authentication middleware

// Public routes (no authentication required)
router.get('/home', getDashboard);
router.get('/customerdashboard', getDashboard);
router.get('/architect', getArchitects);
router.get('/architect_form', getArchitectForm);
router.get('/design_ideas', getDesignIdeas);
router.get('/constructionform', getConstructionForm);
router.get('/bidform', getBidForm);

// Protected routes (require authentication)
router.post('/constructionform', auth, postConstructionForm);
router.get('/job_status', auth, getJobRequestStatus);
router.get('/construction_companies_list', auth, getConstructionCompaniesList);
router.get('/ongoing_projects', auth, getOngoingProjects);
router.get('/interiordesign_form', auth, getInteriorDesignForm);
router.get('/interior_designer', auth, getInteriorDesigners);
router.get('/customersettings', auth, getSettings);
router.get('/bidspace', auth, getBidSpace);

// ====================================================================
// FAVORITES API ROUTES (Same paths, but linked to new array logic)
// NOTE: The ID in DELETE is now the designId (e.g., LivingRoom-1)
// ====================================================================
router.get('/api/customer/favorites', auth, getFavorites);
router.post('/api/customer/favorites', auth, saveFavoriteDesign);
router.delete('/api/customer/favorites/:id', auth, removeFavoriteDesign);

module.exports = router;