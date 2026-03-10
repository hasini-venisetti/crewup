const express  = require('express');
const router   = express.Router();
const { getFeed, getUserActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/activity/feed   — auth required, returns personalized feed
router.get('/feed', protect, getFeed);

// GET /api/activity/user/:userId  — public, returns a user's own activity
router.get('/user/:userId', getUserActivity);

module.exports = router;
