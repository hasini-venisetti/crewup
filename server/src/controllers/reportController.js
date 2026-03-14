const Report       = require('../models/Report');
const Notification = require('../models/Notification');
const Project      = require('../models/Project');
const User         = require('../models/User');

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

    // Upsert — if the same user already reported the same target, update their reason/details
    const report = await Report.findOneAndUpdate(
      { reporter: req.user._id, targetId },
      {
        $set: {
          targetType,
          reason,
          details: (details || '').trim().slice(0, 500),
          status: 'pending',
        },
        $setOnInsert: { reporter: req.user._id, targetId },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Post-approval project monitoring ────────────────────────────────────
    // If a live (approved) project gets reported → auto-suspend it immediately
    // and alert all admins so they can act fast.
    if (targetType === 'project') {
      const project = await Project.findById(targetId).populate('createdBy', 'name username').lean();
      if (project && project.moderationStatus === 'approved') {
        // Suspend the project
        await Project.findByIdAndUpdate(targetId, {
          moderationStatus: 'pending',
          autoSuspended:    true,
          moderationNote:   'Auto-suspended: reported after approval',
        });

        // Alert all admins immediately
        const admins = await User.find({ isAdmin: true }).select('_id').lean();
        await Promise.all(admins.map((admin) =>
          Notification.create({
            recipient: admin._id,
            type:      'platform_update',
            title:     `🚨 Project auto-suspended: "${project.title}"`,
            message:   `Reported by a user (reason: ${reason}). Project has been hidden from public and needs your review.`,
            link:      '/admin?tab=moderation',
          })
        ));
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
   Returns the current user's submitted reports (for reference)
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
   GET  /api/admin/reports          — list all pending reports (admin)
   PATCH /api/admin/reports/:id/resolve — resolve a report (admin)
   ───────────────────────────────────────────────────────────────────────── */
const getAllReports = async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find({ status })
        .populate('reporter', 'name username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Report.countDocuments({ status }),
    ]);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const { action, note } = req.body; // action: 'reviewed' | 'dismissed'
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

    res.status(200).json({ success: true, message: `Report marked as ${action}`, data: report });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitReport, getMyReports, getAllReports, resolveReport };
