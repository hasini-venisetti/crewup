const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Profile = require('../models/Profile');

// GET /api/mentors — list all mentors
router.get('/', async (req, res) => {
  try {
    const { field, availability } = req.query;
    const query = { isMentor: true };
    if (field) query.mentorFields = { $in: [field] };
    if (availability) query.availability = availability;
    const profiles = await Profile.find(query)
      .populate('user', 'name username profileImage role')
      .limit(50)
      .sort({ createdAt: -1 });
    res.json({ success: true, data: profiles });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/mentors/settings — toggle mentor status
router.patch('/settings', protect, async (req, res) => {
  try {
    const { isMentor, mentorFields, mentorBio } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: { isMentor: !!isMentor, mentorFields: mentorFields || [], mentorBio: mentorBio || '' } },
      { new: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
