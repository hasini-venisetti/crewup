const User    = require('../models/User');
const Profile = require('../models/Profile');
const Review  = require('../models/Review');

/**
 * Reputation score formula (0–100):
 *   averageRating (1–5) contributes up to 70 pts  → (avg / 5) * 70
 *   reviewCount   contributes up to 30 pts         → min(count / 10, 1) * 30
 *
 * Rewards both quality (high average) and volume (many reviews).
 */
function computeReputationScore(averageRating, reviewCount) {
  if (!reviewCount) return 0;
  const qualityPts = (averageRating / 5) * 70;
  const volumePts  = Math.min(reviewCount / 10, 1) * 30;
  return Math.round(qualityPts + volumePts);
}

// @desc    Get leaderboard ranked by reputation score
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

    // Aggregate review stats per user
    const reviewStats = await Review.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:             '$reviewee',
          averageRating:   { $avg: '$rating' },
          totalRating:     { $sum: '$rating' },
          reviewCount:     { $sum: 1 },
          professionalism: { $avg: '$categories.professionalism' },
          skill:           { $avg: '$categories.skill' },
          communication:   { $avg: '$categories.communication' },
        },
      },
      { $match: { reviewCount: { $gte: 1 } } },
    ]);

    const userIds = reviewStats.map((s) => s._id);

    // Apply role filter using actual User.role enum values
    const userFilter = { _id: { $in: userIds } };
    if (role) userFilter.role = role;

    const [users, profiles] = await Promise.all([
      User.find(userFilter).select('-password').lean(),
      Profile.find({ user: { $in: userIds } }).select('user experienceLevel location').lean(),
    ]);

    const reviewMap = {};
    reviewStats.forEach((s) => { reviewMap[s._id.toString()] = s; });

    const profileMap = {};
    profiles.forEach((p) => { profileMap[p.user.toString()] = p; });

    const leaderboard = users
      .map((user) => {
        const uid  = user._id.toString();
        const stat = reviewMap[uid];
        if (!stat) return null;

        return {
          _id:             user._id,
          name:            user.name,
          username:        user.username,
          role:            user.role,
          profileImage:    user.profileImage,
          averageRating:   Math.round(stat.averageRating * 10) / 10,
          reviewCount:     stat.reviewCount,
          reputationScore: computeReputationScore(stat.averageRating, stat.reviewCount),
          categories: {
            professionalism: stat.professionalism,
            skill:           stat.skill,
            communication:   stat.communication,
          },
          location: profileMap[uid]?.location || null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.reputationScore - a.reputationScore || b.reviewCount - a.reviewCount)
      .slice(0, 20);

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeaderboard };
