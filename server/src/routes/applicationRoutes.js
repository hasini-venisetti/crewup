const express = require('express');
const {
  applyToProject,
  getProjectApplications,
  updateApplicationStatus,
  getMyApplications,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/apply', protect, applyToProject);
router.get('/applications/my', protect, getMyApplications);
router.get('/applications/:projectId', protect, getProjectApplications);
router.put('/application/status', protect, updateApplicationStatus);

module.exports = router;
