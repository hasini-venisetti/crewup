const mongoose = require('mongoose');
const Follow   = require('../models/Follow');
const User     = require('../models/User');
const Project  = require('../models/Project');

const toOid = (id) => {
  try { return new mongoose.Types.ObjectId(String(id)); }
  catch { return null; }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/follow/:userId  — follow a user
───────────────────────────────────────────────────────────── */
const follow = async (req, res) => {
  try {
    const me   = toOid(req.user._id || req.user.id);
    const them = toOid(req.params.userId);

    if (!me || !them)      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    if (me.equals(them))   return res.status(400).json({ success: false, message: 'You cannot follow yourself' });

    const target = await User.findById(them).select('_id').lean();
    if (!target)           return res.status(404).json({ success: false, message: 'User not found' });

    // findOneAndUpdate with upsert is the most reliable atomic follow
    await Follow.findOneAndUpdate(
      { follower: me, following: them },
      { $setOnInsert: { follower: me, following: them } },
      { upsert: true, new: true }
    );

    const followers = await Follow.countDocuments({ following: them });
    return res.json({ success: true, data: { isFollowing: true, followers } });
  } catch (err) {
    // E11000 = already following — still return success
    if (err.code === 11000) {
      const followers = await Follow.countDocuments({ following: toOid(req.params.userId) });
      return res.json({ success: true, data: { isFollowing: true, followers } });
    }
    console.error('[follow]', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/follow/:userId  — unfollow a user
───────────────────────────────────────────────────────────── */
const unfollow = async (req, res) => {
  try {
    const me   = toOid(req.user._id || req.user.id);
    const them = toOid(req.params.userId);

    if (!me || !them) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    await Follow.deleteOne({ follower: me, following: them });

    const followers = await Follow.countDocuments({ following: them });
    return res.json({ success: true, data: { isFollowing: false, followers } });
  } catch (err) {
    console.error('[unfollow]', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/follow/status/:userId  — current user's follow state
   Returns: { isFollowing, followers, following }
───────────────────────────────────────────────────────────── */
const getFollowStatus = async (req, res) => {
  try {
    const me   = toOid(req.user._id || req.user.id);
    const them = toOid(req.params.userId);

    if (!me || !them) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const [doc, followers, following] = await Promise.all([
      Follow.findOne({ follower: me, following: them }).select('_id').lean(),
      Follow.countDocuments({ following: them }),
      Follow.countDocuments({ follower: them }),
    ]);

    return res.json({ success: true, data: { isFollowing: !!doc, followers, following } });
  } catch (err) {
    console.error('[getFollowStatus]', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Legacy alias — same handler
const getFollowInfo = getFollowStatus;

/* ─────────────────────────────────────────────────────────────
   GET /api/follow/counts/:userId  — public counts (no auth)
───────────────────────────────────────────────────────────── */
const getCounts = async (req, res) => {
  try {
    const them = toOid(req.params.userId);
    if (!them) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const [followers, following] = await Promise.all([
      Follow.countDocuments({ following: them }),
      Follow.countDocuments({ follower: them }),
    ]);

    return res.json({ success: true, data: { followers, following } });
  } catch (err) {
    console.error('[getCounts]', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/follow/followers/:userId  — who follows this user
───────────────────────────────────────────────────────────── */
const getFollowers = async (req, res) => {
  try {
    const them = toOid(req.params.userId);
    if (!them) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const docs = await Follow.find({ following: them })
      .populate('follower', 'name username profileImage role')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: docs.map((d) => d.follower) });
  } catch (err) {
    console.error('[getFollowers]', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/follow/following/:userId  — who this user follows
───────────────────────────────────────────────────────────── */
const getFollowing = async (req, res) => {
  try {
    const them = toOid(req.params.userId);
    if (!them) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const docs = await Follow.find({ follower: them })
      .populate('following', 'name username profileImage role')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: docs.map((d) => d.following) });
  } catch (err) {
    console.error('[getFollowing]', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/follow/feed  — projects from people I follow
───────────────────────────────────────────────────────────── */
const getFeed = async (req, res) => {
  try {
    const me    = toOid(req.user._id || req.user.id);
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = 12;
    const skip  = (page - 1) * limit;

    const followDocs   = await Follow.find({ follower: me }).select('following').lean();
    const followingIds = followDocs.map((d) => d.following);

    if (!followingIds.length) {
      return res.json({ success: true, data: [], pagination: { total: 0, page, pages: 0 } });
    }

    const [total, projects] = await Promise.all([
      Project.countDocuments({ createdBy: { $in: followingIds } }),
      Project.find({ createdBy: { $in: followingIds } })
        .populate('createdBy', 'name username role profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.json({ success: true, data: projects, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('[getFeed]', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { follow, unfollow, getFollowStatus, getFollowInfo, getCounts, getFollowers, getFollowing, getFeed };
