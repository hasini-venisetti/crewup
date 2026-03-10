const Activity          = require('../models/Activity');
const Follow            = require('../models/Follow');
const Project           = require('../models/Project');
const ContestSubmission = require('../models/ContestSubmission');
const mongoose          = require('mongoose');

// ── Internal helper: log an activity (fire-and-forget) ───────────────────────
const logActivity = async ({ actor, type, title, body = '', link = '', projectRef = null, userRef = null }) => {
  try {
    await Activity.create({ actor, type, title, body, link, projectRef, userRef });
  } catch (err) {
    console.error('[ACTIVITY LOG ERROR]', err.message);
  }
};

// ── Synthesise virtual activity items from existing DB data ──────────────────
// These fill the feed even before the activity-logging system has had time to
// accumulate real Activity documents.
const buildSyntheticActivities = async (actorIds) => {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // last 90 days

  const [projects, submissions] = await Promise.all([
    Project.find({ createdBy: { $in: actorIds }, createdAt: { $gte: since } })
      .select('title createdBy createdAt')
      .populate('createdBy', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),

    ContestSubmission.find({ submittedBy: { $in: actorIds }, createdAt: { $gte: since } })
      .select('title submittedBy contest createdAt')
      .populate('submittedBy', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const items = [];

  projects.forEach((p) => {
    items.push({
      _id:       `syn_proj_${p._id}`,
      type:      'project_created',
      actor:     p.createdBy,
      title:     `created a new project: ${p.title}`,
      body:      '',
      link:      `/projects/${p._id}`,
      projectRef: { _id: p._id, title: p.title },
      userRef:   null,
      createdAt: p.createdAt,
      _synthetic: true,
    });
  });

  submissions.forEach((s) => {
    items.push({
      _id:       `syn_sub_${s._id}`,
      type:      'contest_entered',
      actor:     s.submittedBy,
      title:     `submitted a film to a contest: ${s.title}`,
      body:      '',
      link:      `/contests/${s.contest}`,
      projectRef: null,
      userRef:   null,
      createdAt: s.createdAt,
      _synthetic: true,
    });
  });

  return items;
};

// ── GET /api/activity/feed ───────────────────────────────────────────────────
const getFeed = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);

    // Only show activity from people I follow — not my own
    const follows      = await Follow.find({ follower: userId }).select('following').lean();
    const followingIds = follows.map((f) => f.following);
    const actorIds     = followingIds;

    // Not following anyone yet — return empty feed immediately
    if (actorIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    }

    // Real activity docs + synthetic items in parallel
    const [realActivities, syntheticItems] = await Promise.all([
      Activity.find({ actor: { $in: actorIds } })
        .sort({ createdAt: -1 })
        .limit(200)
        .populate('actor',      'name username profileImage')
        .populate('projectRef', 'title')
        .populate('userRef',    'name username')
        .lean(),
      buildSyntheticActivities(actorIds),
    ]);

    // Deduplicate: if a real Activity doc exists for a project/submission,
    // the synthetic version is redundant — drop it.
    const realProjectIds = new Set(
      realActivities
        .filter((a) => a.type === 'project_created' && a.projectRef)
        .map((a) => a.projectRef._id?.toString())
    );
    const realSubIds = new Set(
      realActivities
        .filter((a) => a.type === 'contest_entered' && a.link)
        .map((a) => a.link)
    );

    const filteredSynthetic = syntheticItems.filter((s) => {
      if (s.type === 'project_created' && realProjectIds.has(s.projectRef?._id?.toString())) return false;
      if (s.type === 'contest_entered' && realSubIds.has(s.link)) return false;
      return true;
    });

    // Merge and sort by date descending
    const merged = [...realActivities, ...filteredSynthetic].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const total    = merged.length;
    const paginated = merged.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: paginated,
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
