const express = require('express');
const router = express.Router();
const { getJobs, getJoinCompany, getSettings, getEditProfile, getDashboard, getWorkerById, deleteWorkerRequest,createWorkerRequest  } = require('../controllers/workerController');
const isAuthenticated = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

router.get('/workerjobs', isAuthenticated, getJobs);
router.get('/workerjoin_company', isAuthenticated, getJoinCompany);
router.get('/workersettings', isAuthenticated, getSettings);
router.get('/worker_edit', getEditProfile);
router.get('/workerdashboard', isAuthenticated, getDashboard);
router.get('/api/workers/:id', isAuthenticated, getWorkerById);
router.delete('/api/worker-requests/:id', isAuthenticated, deleteWorkerRequest);
router.post('/worker_request/:companyId',isAuthenticated,upload.single("resume"),createWorkerRequest);

module.exports = router;