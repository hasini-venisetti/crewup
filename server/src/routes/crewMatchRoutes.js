const express = require('express');
const { getCrewSuggestions } = require('../controllers/crewMatchController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// GET /api/projects/:id/crew-suggestions
router.get('/crew-suggestions', protect, getCrewSuggestions);

module.exports = router;
