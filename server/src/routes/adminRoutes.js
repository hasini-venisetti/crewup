const express = require('express');
const { protect }   = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const {
  getPlatformStats,
  getWeeklyAnalytics,
  getUsers,
  suspendUser,
  getTrendingFilms,
  sendAnnouncement,
  getReports,
  updateReportStatus,
  clearTestData,
} = require('../controllers/adminController');

const router = express.Router();

// public — used on homepage for trending section
router.get('/trending-films', getTrendingFilms);

// admin-only
router.use(protect, adminOnly);

router.get('/stats',            getPlatformStats);
router.get('/analytics',        getWeeklyAnalytics);
router.get('/users',            getUsers);
router.patch('/users/:id/suspend', suspendUser);
router.post('/announce',        sendAnnouncement);
router.get('/reports',          getReports);
router.patch('/reports/:id',    updateReportStatus);
router.delete('/clear-test-data', clearTestData);  // ⚠️ destructive — clears all projects/films/apps

module.exports = router;
