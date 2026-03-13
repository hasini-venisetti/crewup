const express = require('express');
const { submitReport, getMyReports } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/reports          — submit a one-tap report
router.post('/',       protect, submitReport);

// GET  /api/reports/mine     — view your own submitted reports
router.get('/mine',    protect, getMyReports);

module.exports = router;
