const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getDashboard, getOngoingProjects, getProjectRequests, updateProjectStatusController, 
    getHiring, getSettings, getBids, getCompanyRevenue, 
    createHireRequest, updateCompanyProfile, handleWorkerRequest, submitBidController, submitProjectProposal} = require('../controllers/companyController');
const isAuthenticated = require('../middlewares/auth'); // Assuming 'auth' is the middleware name
const upload = multer();
// Company dashboard and main pages
router.get('/companydashboard', isAuthenticated, getDashboard); // Company dashboard view
router.get('/companyongoing_projects', isAuthenticated, getOngoingProjects); // Ongoing projects for company
router.get('/project_requests', isAuthenticated, getProjectRequests); // Project requests page
// This is the new route you need to add
router.patch('/api/projects/:projectId/:status', isAuthenticated, updateProjectStatusController);
router.get('/companyhiring', isAuthenticated, getHiring); // Hiring page for company

// START: ADD THIS NEW ROUTE
router.post('/companytoworker', isAuthenticated, createHireRequest);
// END: ADD THIS NEW ROUTE

router.get('/companysettings', isAuthenticated, getSettings); // Company settings page
router.get('/companybids', isAuthenticated, getBids); // Company bids page
router.get('/companyrevenue', isAuthenticated, getCompanyRevenue); // Company revenue page
// Accept a bid → Create ongoing project



// Placeholder for additional routes (e.g., revenue form if different from revenue view)
router.get('/revenue_form', isAuthenticated, (req, res) => {
  res.render('company/revenue_form'); // Placeholder, update controller if needed
});

router.patch('/worker-request/:requestId', isAuthenticated, handleWorkerRequest);

router.post(
    '/update-company-profile', 
    isAuthenticated, 
    upload.any(), // Use multer to handle the form data
    updateCompanyProfile
);

// Customer accepts a company's bid
// Customer accepts company bid - creates ongoing project
router.post('/submit-bid', isAuthenticated, submitBidController);
router.post('/company/submit-proposal', isAuthenticated, submitProjectProposal);
// Add more routes as per companyController functions or requirements

module.exports = router;
