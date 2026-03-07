const Follow   = require('../models/Follow');
const Project  = require('../models/Project');
const User     = require('../models/User');

// ── Follow a user ─────────────────────────────────────────────────────────
// POST /api/follow/:userId
const follow = async (req, res, next) => {
  try {
    console.log('Follow request received:', {
      followerId: req.user?._id,
      followingId: req.params.userId,
      user: req.user
    });

    const followerId  = req.user._id;
    const followingId = req.params.userId;

    if (!followerId) {
      console.log('No followerId found');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (followerId.toString() === followingId) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }

    const user = await User.findById(followingId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    console.log('Checking for existing follow...');
    // Check if already following (try both field names for compatibility)
    let existingFollow = await Follow.findOne({ follower: followerId, following: followingId });
    
    // If not found, try old field names
    if (!existingFollow) {
      existingFollow = await Follow.findOne({ requester: followerId, recipient: followingId });
    }
    
    console.log('Existing follow found:', existingFollow);
    
    if (existingFollow) {
      console.log('User already following, returning 409');
      return res.status(409).json({ success: false, message: 'Already following this user' });
    }

    console.log('Creating new follow relationship...');
    // Create new follow relationship
    const newFollow = await Follow.create({
      follower: followerId,
      following: followingId
    });
    console.log('New follow created:', newFollow);

    res.status(200).json({ success: true, data: { following: true } });
  } catch (error) {
    console.error('Follow error:', error);
    
    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      console.log('Duplicate key error, user already following');
      return res.status(409).json({ success: false, message: 'Already following this user' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.log('Validation error:', error.message);
      return res.status(400).json({ success: false, message: 'Invalid follow data' });
    }
    
    next(error);
  }
};

// ── Unfollow ──────────────────────────────────────────────────────────────
// DELETE /api/follow/:userId
const unfollow = async (req, res, next) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;
    
    // Try both field names for compatibility
    const result = await Follow.deleteOne({ follower: followerId, following: followingId });
    
    // If no document was deleted, try old field names
    if (result.deletedCount === 0) {
      await Follow.deleteOne({ requester: followerId, recipient: followingId });
    }
    
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

    // Try both field names for compatibility
    const [iFollow, theyFollow] = await Promise.all([
      Follow.findOne({ follower: myId, following: otherId }),
      Follow.findOne({ follower: otherId, following: myId })
    ]);

    // If not found with new field names, try old field names
    const [iFollowOld, theyFollowOld] = await Promise.all([
      !iFollow ? Follow.findOne({ requester: myId, recipient: otherId }) : null,
      !theyFollow ? Follow.findOne({ requester: otherId, recipient: myId }) : null
    ]);

    res.status(200).json({
      success: true,
      data: { following: !!(iFollow || iFollowOld), followedBy: !!(theyFollow || theyFollowOld) },
    });
  } catch (error) {
    next(error);
  }
};

// ── Follower / following counts for any profile ───────────────────────────
// GET /api/follow/counts/:userId
const getCounts = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Count both old and new field names for compatibility
    const [newFollowers, newFollowing, oldFollowers, oldFollowing] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
      Follow.countDocuments({ recipient: userId }),
      Follow.countDocuments({ requester: userId })
    ]);

    const followers = newFollowers + oldFollowers;
    const following = newFollowing + oldFollowing;

    res.status(200).json({ success: true, data: { followers, following } });
  } catch (error) {
    next(error);
  }
};

// ── Get list of followers for a user ────────────────────────────────────────
// GET /api/follow/followers/:userId
const getFollowers = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    // Get both old and new field names for compatibility
    const [newFollows, oldFollows] = await Promise.all([
      Follow.find({ following: userId })
        .populate('follower', 'name username profileImage role')
        .sort({ createdAt: -1 }),
      Follow.find({ recipient: userId })
        .populate('requester', 'name username profileImage role')
        .sort({ createdAt: -1 })
    ]);
    
    // Map old field names to new format
    const oldFollowersMapped = oldFollows.map(f => ({
      ...f.toObject(),
      follower: f.requester,
      requester: undefined
    }));
    
    // Combine and deduplicate
    const allFollowers = [...newFollows, ...oldFollowersMapped];
    const followers = allFollowers.map(f => f.follower);
    
    res.status(200).json({ success: true, data: followers });
  } catch (error) {
    next(error);
  }
};

// ── Get list of users a user is following ────────────────────────────────────
// GET /api/follow/following/:userId
const getFollowing = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    // Get both old and new field names for compatibility
    const [newFollows, oldFollows] = await Promise.all([
      Follow.find({ follower: userId })
        .populate('following', 'name username profileImage role')
        .sort({ createdAt: -1 }),
      Follow.find({ requester: userId })
        .populate('recipient', 'name username profileImage role')
        .sort({ createdAt: -1 })
    ]);
    
    // Map old field names to new format
    const oldFollowingMapped = oldFollows.map(f => ({
      ...f.toObject(),
      following: f.recipient,
      recipient: undefined
    }));
    
    // Combine and deduplicate
    const allFollowing = [...newFollows, ...oldFollowingMapped];
    const following = allFollowing.map(f => f.following);
    
    res.status(200).json({ success: true, data: following });
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

    // Get both old and new field names for compatibility
    const [newFollowRecords, oldFollowRecords] = await Promise.all([
      Follow.find({ follower: myId }).select('following'),
      Follow.find({ requester: myId }).select('recipient')
    ]);
    
    // Combine following IDs from both schemas
    const newFollowingIds = newFollowRecords.map((f) => f.following);
    const oldFollowingIds = oldFollowRecords.map((f) => f.recipient);
    const followingIds = [...new Set([...newFollowingIds, ...oldFollowingIds])];

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
