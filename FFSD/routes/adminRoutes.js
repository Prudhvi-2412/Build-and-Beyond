const express = require('express');
const router = express.Router();
const { 
  getAdminDashboard 
} = require('../controllers/adminController'); // Adjust the path as needed
const auth = require('../middlewares/auth'); // Import authentication middleware

// Admin dashboard route (protected)
router.get('/admindashboard', auth, getAdminDashboard);

module.exports = router;