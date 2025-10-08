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
router.get('/home', getDashboard); // Entry point or public dashboard
router.get('/customerdashboard', getDashboard); // Specific dashboard view
router.get('/architect', getArchitects); // Public list of architects
router.get('/architect_form', getArchitectForm); // Public architect form
router.get('/design_ideas', getDesignIdeas); // Public design ideas
router.get('/constructionform', getConstructionForm); // Public construction form
router.get('/bidform', getBidForm); // Public bid form

// Protected routes (require authentication)
router.post('/constructionform', auth, postConstructionForm); // Protected form submission
router.get('/job_status', auth, getJobRequestStatus); // Protected job status
router.get('/construction_companies_list', auth, getConstructionCompaniesList); // Protected companies list
router.get('/ongoing_projects', auth, getOngoingProjects); // Protected ongoing projects
router.get('/interiordesign_form', auth, getInteriorDesignForm); // Protected interior design form
router.get('/interior_designer', auth, getInteriorDesigners); // Protected interior designers
router.get('/customersettings', auth, getSettings); // Protected settings
router.get('/bidspace', auth, getBidSpace); // Protected bid space

// ====================================================================
// NEW PROTECTED FAVORITES API ROUTES (Used by EJS AJAX calls)
// 
// NOTE: These routes MUST be mounted under a /api/customer prefix 
// in your main app.js or server.js file for the /api/customer/favorites 
// URL to resolve correctly.
// ====================================================================
router.get('/api/customer/favorites', auth, getFavorites);
router.post('/api/customer/favorites', auth, saveFavoriteDesign);
router.delete('/api/customer/favorites/:id', auth, removeFavoriteDesign);

module.exports = router;