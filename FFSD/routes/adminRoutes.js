const express = require('express');
const router = express.Router();
const { 
  getAdminDashboard,
  deleteCustomer,
  deleteCompany,
  deleteWorker,
  deleteArchitectHiring,
  deleteConstructionProject,
  deleteDesignRequest,
  deleteBid,
  deleteJobApplication,
  getCustomerDetail,
  getCompanyDetail,
  getWorkerDetail,
  getArchitectHiringDetail,
  getConstructionProjectDetail,
  getDesignRequestDetail,
  getBidDetail,
  getJobApplicationDetail
} = require('../controllers/adminController');
const auth = require('../middlewares/auth');

// Admin dashboard route (protected)
router.get('/admindashboard', auth, getAdminDashboard);

// Delete routes
router.delete('/admin/delete-customer/:id', auth, deleteCustomer);
router.delete('/admin/delete-company/:id', auth, deleteCompany);
router.delete('/admin/delete-worker/:id', auth, deleteWorker);
router.delete('/admin/delete-architectHiring/:id', auth, deleteArchitectHiring);
router.delete('/admin/delete-constructionProject/:id', auth, deleteConstructionProject);
router.delete('/admin/delete-designRequest/:id', auth, deleteDesignRequest);
router.delete('/admin/delete-bid/:id', auth, deleteBid);
router.delete('/admin/delete-jobApplication/:id', auth, deleteJobApplication);

// Detail view routes
router.get('/admin/customer/:id', auth, getCustomerDetail);
router.get('/admin/company/:id', auth, getCompanyDetail);
router.get('/admin/worker/:id', auth, getWorkerDetail);
router.get('/admin/architect-hiring/:id', auth, getArchitectHiringDetail);
router.get('/admin/construction-project/:id', auth, getConstructionProjectDetail);
router.get('/admin/design-request/:id', auth, getDesignRequestDetail);
router.get('/admin/bid/:id', auth, getBidDetail);
router.get('/admin/job-application/:id', auth, getJobApplicationDetail);

module.exports = router;