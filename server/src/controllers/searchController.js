const Project = require('../models/Project');
const User = require('../models/User');
const Profile = require('../models/Profile');

// @desc    Search for projects and creators
// @route   GET /api/search?q=&type=&role=&location=&page=
// @access  Public
const search = async (req, res, next) => {
  try {
    const { q = '', type = 'both', role = '', location = '', page = 1 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limit = 12;
    const skip = (pageNum - 1) * limit;

    const results = { projects: [], creators: [], total: 0 };

    // Search projects
    if (type === 'projects' || type === 'both') {
      const projectFilter = {
        status: 'open',
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { requiredRoles: { $in: [new RegExp(q, 'i')] } },
        ],
      };

      if (role) {
        projectFilter.requiredRoles = { $in: [role] };
      }

      const projectsCount = await Project.countDocuments(projectFilter);
      const projects = await Project.find(projectFilter)
        .populate('createdBy', 'name username role profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      results.projects = projects;
      results.total = projectsCount;
    }

    // Search creators
    if (type === 'creators' || type === 'both') {
      const creatorFilter = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } },
          { role: { $regex: q, $options: 'i' } },
        ],
      };

      if (role) {
        creatorFilter.role = role;
      }

      const creatorsQuery = User.find(creatorFilter).select('-password');

      if (location) {
        const profileFilter = {
          $or: [
            { 'location.country': { $regex: location, $options: 'i' } },
            { 'location.city': { $regex: location, $options: 'i' } },
          ],
        };

        const matchingProfiles = await Profile.find(profileFilter).select('user');
        const userIds = matchingProfiles.map((p) => p.user);
        creatorsQuery.where('_id').in(userIds);
      }

      const creatorsCount = await User.countDocuments(creatorFilter);
      const creators = await creatorsQuery
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Batch-fetch all profiles in ONE query instead of N individual queries (N+1 fix)
      const creatorIds = creators.map((u) => u._id);
      const profileDocs = await Profile.find({ user: { $in: creatorIds } })
        .select('user bio experienceLevel location skills availability')
        .lean();
      const profileMap = {};
      profileDocs.forEach((p) => { profileMap[p.user.toString()] = p; });

      const creatorsWithProfiles = creators.map((user) => ({
        ...user.toObject(),
        profile: profileMap[user._id.toString()] || null,
      }));

      results.creators = creatorsWithProfiles;
      results.total = creatorsCount;
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

module.exports = { search };
