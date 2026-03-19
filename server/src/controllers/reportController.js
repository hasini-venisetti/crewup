const Report       = require('../models/Report');
const Notification = require('../models/Notification');
const Project      = require('../models/Project');
const User         = require('../models/User');
const Message      = require('../models/Message');

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/reports
   One-tap report submission — authenticated users only
   ───────────────────────────────────────────────────────────────────────── */
const submitReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'targetType, targetId, and reason are required',
      });
    }

    // Prevent self-reporting a user profile
    if (targetType === 'user' && String(targetId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot report yourself' });
    }

    // ── Resolve who is being reported + snapshot the target name ────────────
    let reportedUser   = null;
    let targetSnapshot = '';

    if (targetType === 'film') {
      // Films are stored as Project documents (they have a youtubeLink field)
      const film = await Project.findById(targetId).populate('createdBy', '_id name username').lean();
      if (film) {
        reportedUser   = film.createdBy?._id || null;
        targetSnapshot = film.title || '';
      }
    } else if (targetType === 'project') {
      const project = await Project.findById(targetId).populate('postedBy', '_id name username').lean();
      if (project) {
        reportedUser   = project.postedBy?._id || project.createdBy?._id || null;
        targetSnapshot = project.title || '';
      }
    } else if (targetType === 'message') {
      const msg = await Message.findById(targetId).populate('sender', '_id name username').lean();
      if (msg) {
        reportedUser   = msg.sender?._id || null;
        // Store a truncated preview of the message text so it survives deletion
        targetSnapshot = (msg.text || '').slice(0, 300);
      }
    } else if (targetType === 'user') {
      const u = await User.findById(targetId).select('name username').lean();
      if (u) {
        reportedUser   = targetId;
        targetSnapshot = u.name || u.username || '';
      }
    }

    // Upsert — if the same user already reported the same target, update their reason/details
    const report = await Report.findOneAndUpdate(
      { reporter: req.user._id, targetId },
      {
        $set: {
          targetType,
          reason,
          details:        (details || '').trim().slice(0, 500),
          status:         'pending',
          reportedUser,
          targetSnapshot,
        },
        $setOnInsert: { reporter: req.user._id, targetId },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Post-approval project monitoring ────────────────────────────────────
    if (targetType === 'project') {
      const project = await Project.findById(targetId).populate('postedBy', 'name username').lean();
      if (project && project.moderationStatus === 'approved') {
        const reportCount = await Report.countDocuments({ targetId, targetType: 'project' });

        if (reportCount >= 3) {
          await Project.findByIdAndUpdate(targetId, {
            moderationStatus: 'pending',
            autoSuspended:    true,
            moderationNote:   `Auto-suspended: ${reportCount} reports received`,
          });

          const admins = await User.find({ isAdmin: true }).select('_id').lean();
          await Promise.all(admins.map((admin) =>
            Notification.create({
              recipient: admin._id,
              type:      'platform_update',
              title:     `🚨 Project auto-suspended: "${project.title}"`,
              message:   `${reportCount} users reported this project (latest reason: ${reason}). It has been hidden and needs your review.`,
              link:      '/admin?tab=moderation',
            })
          ));
        } else {
          const admins = await User.find({ isAdmin: true }).select('_id').lean();
          await Promise.all(admins.map((admin) =>
            Notification.create({
              recipient: admin._id,
              type:      'platform_update',
              title:     `⚠️ Project report #${reportCount}: "${project.title}"`,
              message:   `Report reason: ${reason}. Project remains live (auto-suspend triggers at 3 reports).`,
              link:      '/admin?tab=moderation',
            })
          ));
        }
      }
    }

    // Echo back to reporter
    await Notification.create({
      recipient: req.user._id,
      sender:    req.user._id,
      type:      'report_submitted',
      title:     'Report submitted',
      message:   'Your report has been received. If the content violates our guidelines, it has been temporarily hidden while we review it.',
      link:      '/safety',
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our moderation team will review it shortly.',
      data: { id: report._id },
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/reports/mine
   ───────────────────────────────────────────────────────────────────────── */
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .select('targetType targetId reason status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   GET  /api/admin/report-queue   — list reports (admin)
   PATCH /api/admin/report-queue/:id/resolve — resolve a report (admin)
   ───────────────────────────────────────────────────────────────────────── */
const getAllReports = async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const filter = status === 'all' ? {} : { status };
    const skip   = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter',     'name username profileImage')
        .populate('reportedUser', 'name username profileImage')
        .populate('resolvedBy',   'name username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Report.countDocuments(filter),
    ]);

    // ── Backfill legacy reports that are missing snapshot / reportedUser ──────
    // Reports created before these fields were added will have empty values.
    // We attempt a live lookup and also persist the result so it only runs once.
    await Promise.all(reports.map(async (r) => {
      if (r.targetSnapshot || r.reportedUser) return; // already filled

      let reportedUser   = null;
      let targetSnapshot = '';

      try {
        if (r.targetType === 'film') {
          // Films are Project documents with a youtubeLink
          const film = await Project.findById(r.targetId).populate('createdBy', '_id name username profileImage').lean();
          if (film) { reportedUser = film.createdBy; targetSnapshot = film.title || ''; }
        } else if (r.targetType === 'project') {
          const project = await Project.findById(r.targetId).populate('postedBy', '_id name username profileImage').lean();
          if (project) { reportedUser = project.postedBy; targetSnapshot = project.title || ''; }
        } else if (r.targetType === 'message') {
          const msg = await Message.findById(r.targetId).populate('sender', '_id name username profileImage').lean();
          if (msg) { reportedUser = msg.sender; targetSnapshot = (msg.text || '').slice(0, 300); }
        } else if (r.targetType === 'user') {
          const u = await User.findById(r.targetId).select('_id name username profileImage').lean();
          if (u) { reportedUser = u; targetSnapshot = u.name || u.username || ''; }
        }
      } catch (_) {}

      // Mutate in-place for the response
      r.reportedUser   = reportedUser;
      r.targetSnapshot = targetSnapshot;

      // Persist so we never need to look it up again
      if (targetSnapshot || reportedUser) {
        Report.findByIdAndUpdate(r._id, {
          reportedUser:   reportedUser?._id || null,
          targetSnapshot,
        }).catch(() => {});
      }
    }));

    res.status(200).json({
      success: true,
      data: reports,
      total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const { action, note, warnUser } = req.body; // action: 'reviewed' | 'dismissed'
    if (!['reviewed', 'dismissed'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "reviewed" or "dismissed"' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status         = action;
    report.resolvedBy     = req.user._id;
    report.resolvedAt     = new Date();
    report.resolutionNote = (note || '').trim();
    await report.save();

    // Optionally send a warning notification to the reported user
    if (warnUser && report.reportedUser) {
      await Notification.create({
        recipient: report.reportedUser,
        type:      'platform_update',
        title:     '⚠️ Account Warning',
        message:   note?.trim()
          ? `A report on your content was reviewed by our team. Note: ${note.trim()}`
          : 'A report on your content was reviewed. Please ensure your activity follows our community guidelines.',
        link: '/safety',
      }).catch(() => {});
    }

    res.status(200).json({ success: true, message: `Report marked as ${action}`, data: report });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitReport, getMyReports, getAllReports, resolveReport };
