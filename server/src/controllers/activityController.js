const Activity = require('../models/Activity');
const Follow   = require('../models/Follow');
const mongoose = require('mongoose');

// ── Internal helper: log an activity (fire-and-forget) ───────────────────────
const logActivity = async ({ actor, type, title, body = '', link = '', projectRef = null, userRef = null }) => {
  try {
    await Activity.create({ actor, type, title, body, link, projectRef, userRef });
  } catch (err) {
    // Non-critical — never crash the calling request
    console.error('[ACTIVITY LOG ERROR]', err.message);
  }
};

// ── GET /api/activity/feed ───────────────────────────────────────────────────
// Returns a paginated feed of activities from:
//   1. People the current user follows
//   2. The current user themselves
const getFeed = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;

    // Get list of users we follow
    const follows = await Follow.find({ follower: userId }).select('following').lean();
    const followingIds = follows.map((f) => f.following);

    // Include self
    const actorIds = [userId, ...followingIds];

    const [activities, total] = await Promise.all([
      Activity.find({ actor: { $in: actorIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor',      'name username profileImage')
        .populate('projectRef', 'title')
        .populate('userRef',    'name username')
        .lean(),
      Activity.countDocuments({ actor: { $in: actorIds } }),
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/activity/user/:userId ───────────────────────────────────────────
// Public: get activity for a specific user (for their profile page)
const getUserActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(30, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const activities = await Activity.find({ actor: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor',      'name username profileImage')
      .populate('projectRef', 'title')
      .populate('userRef',    'name username')
      .lean();

    res.json({ success: true, data: activities });
  } catch (err) {
    next(err);
  }
};

module.exports = { logActivity, getFeed, getUserActivity };
