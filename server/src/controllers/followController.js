const mongoose = require('mongoose');
const Follow   = require('../models/Follow');
const Project  = require('../models/Project');
const User     = require('../models/User');
const { logActivity } = require('./activityController');

// Helper: safely cast a string to ObjectId, returns null if invalid
const toOid = (id) => {
  try { return new mongoose.Types.ObjectId(id); } catch { return null; }
};

// ── Follow a user ─────────────────────────────────────────────────────────
// POST /api/follow/:userId
const follow = async (req, res, next) => {
  try {
    const followerOid  = toOid(req.user._id);
    const followingOid = toOid(req.params.userId);

    if (!followerOid || !followingOid) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    if (followerOid.equals(followingOid)) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }

    const user = await User.findById(followingOid);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Atomic upsert — creates the doc if it doesn't exist, no-ops if it does.
    // This avoids findOne+create race conditions and 11000 duplicate-key errors.
    const result = await Follow.findOneAndUpdate(
      { follower: followerOid, following: followingOid },
      { $setOnInsert: { follower: followerOid, following: followingOid } },
      { upsert: true, new: false, rawResult: true }
    );

    // If the doc was just inserted (not already there) log the activity
    if (result.lastErrorObject?.upserted) {
      logActivity({
        actor:   followerOid,
        type:    'user_followed',
        title:   `started following ${user.name}`,
        link:    `/profile/${followingOid}`,
        userRef: followingOid,
      });
    }

    res.status(200).json({ success: true, data: { following: true } });
  } catch (err) {
    next(err);
  }
};

// ── Unfollow ──────────────────────────────────────────────────────────────
// DELETE /api/follow/:userId
const unfollow = async (req, res, next) => {
  try {
    const followerOid  = toOid(req.user._id);
    const followingOid = toOid(req.params.userId);

    if (!followerOid || !followingOid) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    await Follow.deleteOne({ follower: followerOid, following: followingOid });

    res.status(200).json({ success: true, data: { following: false } });
  } catch (err) {
    next(err);
  }
};

// ── Check follow status between current user and a target ─────────────────
// GET /api/follow/status/:userId
const getStatus = async (req, res, next) => {
  try {
    const myId    = req.user._id;
    const otherId = toOid(req.params.userId);
    if (!otherId) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const [iFollow, theyFollow] = await Promise.all([
      Follow.findOne({ follower: myId,    following: otherId }),
      Follow.findOne({ follower: otherId, following: myId }),
    ]);

    res.status(200).json({
      success: true,
      data: { following: !!iFollow, followedBy: !!theyFollow },
    });
  } catch (error) {
    next(error);
  }
};

// ── Follower / following counts for any profile ───────────────────────────
// GET /api/follow/counts/:userId  (public — no auth required)
const getCounts = async (req, res, next) => {
  try {
    const userId = toOid(req.params.userId);
    if (!userId) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const [followers, following] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower:  userId }),
    ]);

    res.status(200).json({ success: true, data: { followers, following } });
  } catch (error) {
    next(error);
  }
};

// ── Get list of followers for a user ────────────────────────────────────────
// GET /api/follow/followers/:userId
const getFollowers = async (req, res, next) => {
  try {
    const userId = toOid(req.params.userId);
    if (!userId) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const follows = await Follow.find({ following: userId })
      .populate('follower', 'name username profileImage role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: follows.map((f) => f.follower) });
  } catch (error) {
    next(error);
  }
};

// ── Get list of users a user is following ────────────────────────────────────
// GET /api/follow/following/:userId
const getFollowing = async (req, res, next) => {
  try {
    const userId = toOid(req.params.userId);
    if (!userId) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const follows = await Follow.find({ follower: userId })
      .populate('following', 'name username profileImage role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: follows.map((f) => f.following) });
  } catch (error) {
    next(error);
  }
};

// ── Following feed — projects from people I follow ────────────────────────
// GET /api/follow/feed?page=1
const getFeed = async (req, res, next) => {
  try {
    const myId  = req.user._id;
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = 12;
    const skip  = (page - 1) * limit;

    const followRecords  = await Follow.find({ follower: myId }).select('following');
    const followingIds   = followRecords.map((f) => f.following);

    if (!followingIds.length) {
      return res.status(200).json({
        success: true, data: [],
        pagination: { total: 0, page, pages: 0 },
      });
    }

    const total    = await Project.countDocuments({ createdBy: { $in: followingIds } });
    const projects = await Project.find({ createdBy: { $in: followingIds } })
      .populate('createdBy', 'name username role profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: projects,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { follow, unfollow, getStatus, getCounts, getFollowers, getFollowing, getFeed };
