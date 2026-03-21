const express = require('express');
const {
  applyToProject,
  getProjectApplications,
  updateApplicationStatus,
  getMyApplications,
  withdrawApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/apply', protect, applyToProject);
router.get('/applications/my', protect, getMyApplications);
router.get('/applications/:projectId', protect, getProjectApplications);
router.put('/application/status', protect, updateApplicationStatus);
router.delete('/application/:id', protect, withdrawApplication);

module.exports = router;
