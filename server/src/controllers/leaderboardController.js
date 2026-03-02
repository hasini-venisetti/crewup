const Application = require('../models/Application');
const Project = require('../models/Project');
const User = require('../models/User');
const Profile = require('../models/Profile');

// @desc    Get leaderboard ranked by accepted applications and completed projects
// @route   GET /api/leaderboard?period=alltime|month&role=
// @access  Public
const getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'alltime', role = '' } = req.query;

    let matchStage = {};
    if (period === 'month') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      matchStage = { createdAt: { $gte: startOfMonth } };
    }

    // Aggregate accepted applications per user (as applicant)
    const acceptedApps = await Application.aggregate([
      { $match: { status: 'accepted', ...matchStage } },
      { $group: { _id: '$applicant', acceptedCount: { $sum: 1 } } },
    ]);

    // Aggregate completed projects per user (as createdBy)
    const completedProjects = await Project.aggregate([
      { $match: { status: 'completed', ...matchStage } },
      { $group: { _id: '$createdBy', completedProjects: { $sum: 1 } } },
    ]);

    // Build a map for quick lookup
    const appMap = {};
    acceptedApps.forEach((item) => {
      appMap[item._id.toString()] = item.acceptedCount;
    });

    const projectMap = {};
    completedProjects.forEach((item) => {
      projectMap[item._id.toString()] = item.completedProjects;
    });

    // Collect all unique user IDs
    const allUserIds = new Set([
      ...acceptedApps.map((a) => a._id.toString()),
      ...completedProjects.map((p) => p._id.toString()),
    ]);

    // Fetch user and profile data for all users
    const users = await User.find({ _id: { $in: Array.from(allUserIds) } }).select('-password');
    const profiles = await Profile.find({ user: { $in: Array.from(allUserIds) } });

    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.user.toString()] = p;
    });

    // Build leaderboard entries with scores
    const leaderboard = users.map((user) => {
      const userId = user._id.toString();
      const acceptedCount = appMap[userId] || 0;
      const completed = projectMap[userId] || 0;
      const rank = acceptedCount * 2 + completed * 3;
      const profile = profileMap[userId];

      const entry = {
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          profileImage: user.profileImage,
        },
        profile: profile || null,
        stats: {
          acceptedCount,
          completedProjects: completed,
          rank,
        },
      };

      // Filter by role if provided
      if (role && user.role !== role) {
        return null;
      }

      return entry;
    });

    // Remove null entries (filtered out by role)
    const filtered = leaderboard.filter((e) => e !== null);

    // Sort by rank descending and limit to top 20
    const sorted = filtered.sort((a, b) => b.stats.rank - a.stats.rank).slice(0, 20);

    res.status(200).json({ success: true, data: sorted });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeaderboard };
