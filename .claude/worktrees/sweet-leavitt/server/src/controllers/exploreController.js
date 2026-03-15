const User = require('../models/User');
const Profile = require('../models/Profile');

// @desc    Get creators for explore page
// @route   GET /api/explore?role=&skill=&location=&availability=&page=
// @access  Public
const getCreators = async (req, res, next) => {
  try {
    const { role = '', skill = '', location = '', availability = '', q = '', page = 1 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limit = 12;
    const skip = (pageNum - 1) * limit;

    const userFilter = {};
    if (role) userFilter.role = role;
    // Name / username text search
    if (q) {
      userFilter.$or = [
        { name:     { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
      ];
    }

    let users = await User.find(userFilter).select('-password');

    // Join with Profile data and apply additional filters
    const profiles = await Profile.find();
    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.user.toString()] = p;
    });

    let filtered = users.map((user) => {
      const profile = profileMap[user._id.toString()];
      return { ...user.toObject(), profile };
    });

    // Filter by skill (case-insensitive, partial match)
    if (skill) {
      filtered = filtered.filter((user) => {
        if (!user.profile || !user.profile.skills) return false;
        return user.profile.skills.some((s) =>
          s.toLowerCase().includes(skill.toLowerCase())
        );
      });
    }

    // Filter by location (city or country match)
    if (location) {
      filtered = filtered.filter((user) => {
        if (!user.profile || !user.profile.location) return false;
        const { city, country } = user.profile.location;
        return (
          city.toLowerCase().includes(location.toLowerCase()) ||
          country.toLowerCase().includes(location.toLowerCase())
        );
      });
    }

    // Filter by availability
    if (availability) {
      filtered = filtered.filter((user) => {
        if (!user.profile) return false;
        return user.profile.availability === availability;
      });
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCreators };
