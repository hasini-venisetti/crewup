const User        = require('../models/User');
const Project     = require('../models/Project');
const FilmComment = require('../models/FilmComment');
const Review      = require('../models/Review');
const Contest     = require('../models/Contest');
const Notification = require('../models/Notification');
const Report      = require('../models/Report');

/* ── helpers ──────────────────────────────────────────────────────────── */
function weekStart() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

function computeRepScore(avgRating, reviewCount) {
  if (!reviewCount) return 0;
  const quality = (avgRating / 5) * 70;
  const volume  = Math.min(reviewCount / 10, 1) * 30;
  return Math.round(quality + volume);
}

/* ── Platform Statistics ─────────────────────────────────────────────── */
// GET /api/admin/stats
const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProjects, totalFilms, totalContests, pendingReports] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Project.countDocuments({ youtubeLink: { $ne: '' } }),
      Contest.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
    ]);

    res.json({ success: true, data: { totalUsers, totalProjects, totalFilms, totalContests, pendingReports } });
  } catch (e) { next(e); }
};

/* ── Weekly Analytics ───────────────────────────────────────────────── */
// GET /api/admin/analytics
const getWeeklyAnalytics = async (req, res, next) => {
  try {
    const since = weekStart();
    const [newUsers, newProjects, newFilms] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: since } }),
      Project.countDocuments({ createdAt: { $gte: since } }),
      Project.countDocuments({ youtubeLink: { $ne: '' }, updatedAt: { $gte: since } }),
    ]);
    res.json({ success: true, data: { newUsers, newProjects, newFilms, since } });
  } catch (e) { next(e); }
};

/* ── User Management ────────────────────────────────────────────────── */
// GET /api/admin/users?page=1&limit=20&search=
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const filter = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { username: new RegExp(search, 'i') }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter).select('name username email role profileImage isActive isSuspended isAdmin createdAt').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);

    // Attach reputation from reviews
    const Review = require('../models/Review');
    const userIds = users.map((u) => u._id);
    const reviewAggs = await Review.aggregate([
      { $match: { reviewee: { $in: userIds } } },
      { $group: { _id: '$reviewee', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const repMap = {};
    reviewAggs.forEach((r) => { repMap[r._id.toString()] = { avg: r.avg, count: r.count }; });

    const enriched = users.map((u) => {
      const rep = repMap[u._id.toString()] || { avg: 0, count: 0 };
      return { ...u, reputationScore: computeRepScore(rep.avg, rep.count), avgRating: rep.avg?.toFixed(1) || null, reviewCount: rep.count };
    });

    res.json({ success: true, data: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
};

// PATCH /api/admin/users/:id/suspend
const suspendUser = async (req, res, next) => {
  try {
    const { suspend = true } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isAdmin) return res.status(403).json({ success: false, message: 'Cannot suspend an admin' });
    user.isSuspended = !!suspend;
    await user.save();
    res.json({ success: true, message: suspend ? 'User suspended' : 'User unsuspended', data: { isSuspended: user.isSuspended } });
  } catch (e) { next(e); }
};

/* ── Trending Films ─────────────────────────────────────────────────── */
// GET /api/admin/trending-films  (public — also used on homepage)
const getTrendingFilms = async (req, res, next) => {
  try {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const films = await Project.find({ youtubeLink: { $ne: '' } })
      .select('title youtubeLink projectType likes createdBy createdAt updatedAt')
      .populate('createdBy', 'name username profileImage')
      .lean();

    // Get comment counts in bulk
    const projectIds = films.map((f) => f._id);
    const commentCounts = await FilmComment.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', count: { $sum: 1 } } },
    ]);
    const commentMap = {};
    commentCounts.forEach((c) => { commentMap[c._id.toString()] = c.count; });

    const scored = films.map((film) => {
      const likes    = film.likes?.length || 0;
      const comments = commentMap[film._id.toString()] || 0;
      const isRecent = new Date(film.updatedAt) >= since7d ? 10 : 0;
      const score    = likes * 3 + comments * 2 + isRecent;

      const videoId   = extractYtId(film.youtubeLink);
      const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
      return { _id: film._id, title: film.title, youtubeLink: film.youtubeLink, projectType: film.projectType, thumbnail, director: film.createdBy, likeCount: likes, commentCount: comments, score };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json({ success: true, data: scored.slice(0, 5) });
  } catch (e) { next(e); }
};

function extractYtId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/* ── Platform Announcements ─────────────────────────────────────────── */
// POST /api/admin/announce
const sendAnnouncement = async (req, res, next) => {
  try {
    const { title, message, link = '' } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'title and message are required' });

    const users = await User.find({ isSuspended: { $ne: true } }).select('_id').lean();
    const notifications = users.map((u) => ({
      recipient: u._id,
      sender:    req.user._id,
      type:      'platform_update',
      title,
      message,
      link,
    }));

    await Notification.insertMany(notifications, { ordered: false });
    res.json({ success: true, message: `Announcement sent to ${notifications.length} users` });
  } catch (e) { next(e); }
};

/* ── Reports ─────────────────────────────────────────────────────────── */
// GET /api/admin/reports?status=pending&page=1&limit=20
const getReports = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const filter = status !== 'all' ? { status } : {};

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name username profileImage')
        .populate({ path: 'targetId', model: 'Project', select: 'title youtubeLink createdBy', populate: { path: 'createdBy', select: 'name username' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Report.countDocuments(filter),
    ]);

    res.json({ success: true, data: reports, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
};

// PATCH /api/admin/reports/:id   — update status (reviewed | dismissed)
const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['reviewed', 'dismissed', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (e) { next(e); }
};

// DELETE /api/admin/clear-test-data  — wipe all projects, films & related data for launch
// Keeps: Users, Profiles, Waitlist, Reviews, Contests
const Application   = require('../models/Application');
const ProjectChat   = require('../models/ProjectChat');
const Task          = require('../models/Task');
const Conversation  = require('../models/Conversation');
const Message       = require('../models/Message');

const clearTestData = async (req, res, next) => {
  try {
    const [projects, applications, chats, tasks, notifications] = await Promise.all([
      Project.deleteMany({}),
      Application.deleteMany({}),
      ProjectChat.deleteMany({}),
      Task.deleteMany({}),
      Notification.deleteMany({ type: { $in: ['application', 'application_accepted', 'application_declined', 'role_filled', 'general'] } }),
    ]);

    res.json({
      success: true,
      message: 'All test data cleared. Platform is ready for launch! 🚀',
      deleted: {
        projects:      projects.deletedCount,
        applications:  applications.deletedCount,
        projectChats:  chats.deletedCount,
        tasks:         tasks.deletedCount,
        notifications: notifications.deletedCount,
      },
    });
  } catch (e) { next(e); }
};

// ── Phase 2: Project Moderation ────────────────────────────────────────────────
const emailService = require('../utils/emailService');

// GET /api/admin/projects/pending — list projects awaiting moderation
const getPendingProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find({ moderationStatus: 'pending' })
        .populate('createdBy', 'name username email role profileImage isEmailVerified')
        .sort({ createdAt: 1 }) // oldest first so nothing waits too long
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments({ moderationStatus: 'pending' }),
    ]);
    res.json({ success: true, data: projects, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (e) { next(e); }
};

// PATCH /api/admin/projects/:id/moderate — approve or reject
const moderateProject = async (req, res, next) => {
  try {
    const { action, note } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'approve' or 'reject'" });
    }

    const project = await Project.findById(req.params.id).populate('createdBy', 'name email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.moderationStatus = action === 'approve' ? 'approved' : 'rejected';
    project.moderationNote   = note || '';
    await project.save();

    // Notify the project owner
    await Notification.create({
      recipient: project.createdBy._id,
      type:      'platform_update',
      title:     action === 'approve' ? '✅ Project approved' : '❌ Project not approved',
      message:   action === 'approve'
        ? `Your project "${project.title}" is now live and accepting applications.`
        : `Your project "${project.title}" was not approved.${note ? ` Reason: ${note}` : ''}`,
      link: `/projects/${project._id}`,
    });

    // Email (fire-and-forget)
    if (project.createdBy?.email) {
      if (action === 'approve') {
        emailService.sendProjectApproved(project.createdBy.email, project.createdBy.name, project.title, project._id).catch(() => {});
      } else {
        emailService.sendProjectRejected(project.createdBy.email, project.createdBy.name, project.title, note).catch(() => {});
      }
    }

    res.json({ success: true, message: `Project ${action}d`, data: project });
  } catch (e) { next(e); }
};

// ── Risk Monitor — projects that need admin attention ─────────────────────────
// GET /api/admin/risk-monitor
// Returns: auto-suspended projects + high/medium risk projects, sorted by risk score
const getRiskProjects = async (req, res, next) => {
  try {
    const { filter = 'all', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};
    if (filter === 'suspended')    query = { autoSuspended: true };
    else if (filter === 'high')    query = { riskLevel: 'high' };
    else if (filter === 'medium')  query = { riskLevel: 'medium' };
    else {
      // 'all' — show suspended + high + medium
      query = { $or: [{ autoSuspended: true }, { riskLevel: { $in: ['high', 'medium'] } }] };
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('createdBy', 'name username email isEmailVerified')
        .sort({ autoSuspended: -1, riskScore: -1, createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Project.countDocuments(query),
    ]);

    res.json({ success: true, data: projects, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (e) { next(e); }
};

// DELETE /api/admin/risk-monitor/:id — admin force-deletes a project
const adminDeleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', 'name email _id');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await Project.findByIdAndDelete(req.params.id);

    // Notify the creator
    await Notification.create({
      recipient: project.createdBy._id,
      type:      'platform_update',
      title:     '❌ Your project was removed',
      message:   `Your project "${project.title}" was removed by our moderation team for violating platform guidelines.`,
      link:      '/dashboard',
    });

    res.json({ success: true, message: 'Project deleted' });
  } catch (e) { next(e); }
};

// PATCH /api/admin/risk-monitor/:id/restore — lift suspension (set autoSuspended false, keep live)
const restoreProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { autoSuspended: false, moderationStatus: 'approved', moderationNote: '' },
      { new: true }
    ).populate('createdBy', 'name _id');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await Notification.create({
      recipient: project.createdBy._id,
      type:      'platform_update',
      title:     '✅ Your project has been restored',
      message:   `Your project "${project.title}" has been reviewed and is now live again.`,
      link:      `/projects/${project._id}`,
    });

    res.json({ success: true, message: 'Project restored', data: project });
  } catch (e) { next(e); }
};

// ── Phase 4: Grant / revoke Verified Creator badge ────────────────────────────
const Profile = require('../models/Profile');

// PATCH /api/admin/users/:id/verify
const setVerifiedBadge = async (req, res, next) => {
  try {
    const { verified } = req.body; // true | false
    const profile = await Profile.findOne({ user: req.params.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    profile.isVerified = Boolean(verified);
    await profile.save();

    // Notify the user
    if (verified) {
      await Notification.create({
        recipient: req.params.id,
        type:      'platform_update',
        title:     '✅ Verified Creator',
        message:   "Congratulations! You've been granted the Verified Creator badge on CREWUPFILMS.",
        link:      `/profile/${req.params.id}`,
      });
    }

    res.json({ success: true, message: `Verified badge ${verified ? 'granted' : 'removed'}`, isVerified: profile.isVerified });
  } catch (e) { next(e); }
};

module.exports = {
  getPlatformStats, getWeeklyAnalytics, getUsers, suspendUser, getTrendingFilms,
  sendAnnouncement, getReports, updateReportStatus, clearTestData,
  getPendingProjects, moderateProject, setVerifiedBadge,
  getRiskProjects, adminDeleteProject, restoreProject,
};
