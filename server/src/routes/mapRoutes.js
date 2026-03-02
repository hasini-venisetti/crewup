const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

// Get all creators with location for the map
router.get('/', async (req, res, next) => {
  try {
    const profiles = await Profile.find({
      'location.city': { $exists: true, $ne: '' },
    })
      .populate('user', 'name username role profileImage')
      .select('user location skills availability experienceLevel')
      .limit(200)
      .lean();

    // Filter out any without valid users
    const valid = profiles.filter((p) => p.user);

    res.status(200).json({ success: true, data: valid });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
