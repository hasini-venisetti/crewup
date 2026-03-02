const Follow   = require('../models/Follow');
const Project  = require('../models/Project');
const User     = require('../models/User');

// ── Follow a user ─────────────────────────────────────────────────────────
// POST /api/follow/:userId
const follow = async (req, res, next) => {
  try {
    const followerId  = req.user._id;
    const followingId = req.params.userId;

    if (followerId.toString() === followingId) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }

    const user = await User.findById(followingId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Follow.findOneAndUpdate(
      { follower: followerId, following: followingId },
      { follower: followerId, following: followingId },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: { following: true } });
  } catch (error) {
    next(error);
  }
};

// ── Unfollow ──────────────────────────────────────────────────────────────
// DELETE /api/follow/:userId
const unfollow = async (req, res, next) => {
  try {
    await Follow.deleteOne({ follower: req.user._id, following: req.params.userId });
    res.status(200).json({ success: true, data: { following: false } });
  } catch (error) {
    next(error);
  }
};

// ── Check follow status between current user and a target ─────────────────
// GET /api/follow/status/:userId
const getStatus = async (req, res, next) => {
  try {
    const myId    = req.user._id;
    const otherId = req.params.userId;

    const [iFollow, theyFollow] = await Promise.all([
      Follow.exists({ follower: myId,    following: otherId }),
      Follow.exists({ follower: otherId, following: myId }),
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
// GET /api/follow/counts/:userId
const getCounts = async (req, res, next) => {
  try {
    const [followers, following] = await Promise.all([
      Follow.countDocuments({ following: req.params.userId }),
      Follow.countDocuments({ follower:  req.params.userId }),
    ]);
    res.status(200).json({ success: true, data: { followers, following } });
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

    const followRecords = await Follow.find({ follower: myId }).select('following');
    const followingIds  = followRecords.map((f) => f.following);

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

module.exports = { follow, unfollow, getStatus, getCounts, getFeed };
