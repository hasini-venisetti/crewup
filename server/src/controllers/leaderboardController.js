const User    = require('../models/User');
const Profile = require('../models/Profile');
const Review  = require('../models/Review');
const Project = require('../models/Project');

/**
 * Reputation score formula (0–100):
 *
 *  Reviews — quality  (avg rating)   → up to 50 pts   (avgRating / 5) * 50
 *  Reviews — volume   (# reviews)    → up to 20 pts   min(count / 10, 1) * 20
 *  Projects completed (released)     → up to 20 pts   min(count / 5,  1) * 20
 *  Collaborations     (unique people) → up to 10 pts  min(count / 10, 1) * 10
 *
 *  Total: 100 pts max
 */
function computeScore({ averageRating, reviewCount, projectsCompleted, collaborations }) {
  if (!reviewCount && !projectsCompleted) return 0;

  const reviewQualityPts  = reviewCount ? (averageRating / 5) * 50  : 0;
  const reviewVolumePts   = Math.min(reviewCount / 10, 1) * 20;
  const projectsPts       = Math.min(projectsCompleted / 5, 1) * 20;
  const collabPts         = Math.min(collaborations / 10, 1) * 10;

  return {
    total:          Math.round(reviewQualityPts + reviewVolumePts + projectsPts + collabPts),
    reviewQuality:  Math.round(reviewQualityPts),
    reviewVolume:   Math.round(reviewVolumePts),
    projectsPts:    Math.round(projectsPts),
    collabPts:      Math.round(collabPts),
  };
}

// @desc    Get leaderboard ranked by reputation score
// @route   GET /api/leaderboard?period=alltime|month&role=
// @access  Public
const getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'alltime', role = '' } = req.query;

    // ── Step 1: Review stats per user ────────────────────────────────────────
    let matchStage = {};
    if (period === 'month') {
      const now = new Date();
      matchStage = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
    }

    const reviewStats = await Review.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:             '$reviewee',
          averageRating:   { $avg: '$rating' },
          reviewCount:     { $sum: 1 },
          professionalism: { $avg: '$categories.professionalism' },
          skill:           { $avg: '$categories.skill' },
          communication:   { $avg: '$categories.communication' },
        },
      },
      { $match: { reviewCount: { $gte: 1 } } },
    ]);

    // ── Step 2: Projects completed + collaborations ──────────────────────────
    // Fetch all released projects (only fields needed)
    const releasedProjects = await Project.find(
      { timelineStage: 'released' },
      'createdBy teamMembers'
    ).lean();

    // Build per-user maps
    const projectCountMap = {};   // userId → # completed projects
    const collabSetMap    = {};   // userId → Set of unique collaborator IDs

    for (const proj of releasedProjects) {
      // Everyone on this project: owner + team members
      const everyone = [
        proj.createdBy?.toString(),
        ...(proj.teamMembers || []).map((m) => m.user?.toString()),
      ].filter(Boolean);

      for (const uid of everyone) {
        projectCountMap[uid] = (projectCountMap[uid] || 0) + 1;
        if (!collabSetMap[uid]) collabSetMap[uid] = new Set();
        for (const other of everyone) {
          if (other !== uid) collabSetMap[uid].add(other);
        }
      }
    }

    // ── Step 3: Fetch users (apply role filter) ──────────────────────────────
    // Include users who have reviews OR completed projects
    const reviewUserIds  = reviewStats.map((s) => s._id);
    const projectUserIds = Object.keys(projectCountMap);
    const allUserIds     = [...new Set([...reviewUserIds, ...projectUserIds.map((id) => {
      try { return require('mongoose').Types.ObjectId(id); } catch { return null; }
    }).filter(Boolean)])];

    const userFilter = { _id: { $in: allUserIds } };
    if (role) userFilter.role = role;

    const [users, profiles] = await Promise.all([
      User.find(userFilter).select('-password').lean(),
      Profile.find({ user: { $in: allUserIds } }).select('user experienceLevel location').lean(),
    ]);

    // ── Step 4: Build maps ───────────────────────────────────────────────────
    const reviewMap = {};
    reviewStats.forEach((s) => { reviewMap[s._id.toString()] = s; });

    const profileMap = {};
    profiles.forEach((p) => { profileMap[p.user.toString()] = p; });

    // ── Step 5: Score every user ─────────────────────────────────────────────
    const leaderboard = users
      .map((user) => {
        const uid    = user._id.toString();
        const stat   = reviewMap[uid] || {};
        const projCount  = projectCountMap[uid] || 0;
        const collabCount = collabSetMap[uid]?.size || 0;

        const scored = computeScore({
          averageRating:     stat.averageRating || 0,
          reviewCount:       stat.reviewCount   || 0,
          projectsCompleted: projCount,
          collaborations:    collabCount,
        });

        if (scored.total === 0) return null;

        return {
          _id:             user._id,
          name:            user.name,
          username:        user.username,
          role:            user.role,
          profileImage:    user.profileImage,
          averageRating:   stat.averageRating ? Math.round(stat.averageRating * 10) / 10 : 0,
          reviewCount:     stat.reviewCount || 0,
          projectsCompleted: projCount,
          collaborations:  collabCount,
          reputationScore: scored.total,
          breakdown: {
            reviewQuality: scored.reviewQuality,
            reviewVolume:  scored.reviewVolume,
            projects:      scored.projectsPts,
            collabs:       scored.collabPts,
          },
          categories: {
            professionalism: stat.professionalism || 0,
            skill:           stat.skill           || 0,
            communication:   stat.communication   || 0,
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
