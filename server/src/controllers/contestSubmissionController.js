const Contest            = require('../models/Contest');
const ContestSubmission  = require('../models/ContestSubmission');
const FilmComment        = require('../models/FilmComment');
const Project            = require('../models/Project');
const Notification       = require('../models/Notification');
const User               = require('../models/User');
const { runAutoCheck }   = require('../utils/youtubeChecker');

function extractYtId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// GET /api/contests/:id/submissions?page=1&limit=12
// Public: only approved submissions. Admin sees all (pass ?all=1 with admin token).
const getSubmissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Admins can pass ?all=1 to see every submission regardless of status
    const isAdmin = req.user?.role === 'admin';
    const showAll = isAdmin && req.query.all === '1';
    const filter  = showAll
      ? { contest: req.params.id }
      : { contest: req.params.id, reviewStatus: 'approved' };

    const [submissions, total] = await Promise.all([
      ContestSubmission.find(filter)
        .populate('submittedBy', 'name username profileImage')
        .populate('project', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ContestSubmission.countDocuments(filter),
    ]);

    const ids = submissions.map((s) => s._id);
    const commentAggs = await FilmComment.aggregate([
      { $match: { submission: { $in: ids } } },
      { $group: { _id: '$submission', count: { $sum: 1 } } },
    ]);
    const commentMap = {};
    commentAggs.forEach((c) => { commentMap[c._id.toString()] = c.count; });

    const enriched = submissions.map((s) => ({
      ...s,
      likeCount:    s.likes?.length  || 0,
      voteCount:    s.votes?.length  || 0,
      commentCount: commentMap[s._id.toString()] || 0,
    }));

    res.json({ success: true, data: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
};

// GET /api/contests/:id/leaderboard  — top 10 approved submissions by votes then likes
const getLeaderboard = async (req, res, next) => {
  try {
    const submissions = await ContestSubmission.find({ contest: req.params.id, reviewStatus: 'approved' })
      .populate('submittedBy', 'name username profileImage')
      .lean();

    const ids = submissions.map((s) => s._id);
    const commentAggs = await FilmComment.aggregate([
      { $match: { submission: { $in: ids } } },
      { $group: { _id: '$submission', count: { $sum: 1 } } },
    ]);
    const commentMap = {};
    commentAggs.forEach((c) => { commentMap[c._id.toString()] = c.count; });

    const scored = submissions.map((s) => {
      const votes    = s.votes?.length  || 0;
      const likes    = s.likes?.length  || 0;
      const comments = commentMap[s._id.toString()] || 0;
      return { ...s, voteCount: votes, likeCount: likes, commentCount: comments, score: votes * 5 + likes * 3 + comments * 2 };
    });
    scored.sort((a, b) => b.score - a.score);

    res.json({ success: true, data: scored.slice(0, 10) });
  } catch (e) { next(e); }
};

// GET /api/contests/:id/eligibility  — check if current user can submit
const checkEligibility = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const contest = await Contest.findById(req.params.id).lean();
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });

    // Build project query — must have ≥ 1 team member AND respect teamFormedAfter
    const query = {
      createdBy:       userId,
      'teamMembers.0': { $exists: true },
    };
    if (contest.teamFormedAfter) {
      query.createdAt = { $gte: new Date(contest.teamFormedAfter) };
    }

    const eligibleProjects = await Project.find(query).select('title teamMembers createdAt').lean();

    // Check which of those projects have already submitted to this contest
    const eligibleIds = eligibleProjects.map((p) => p._id);
    const alreadySubmitted = await ContestSubmission.find({
      contest: req.params.id,
      project: { $in: eligibleIds },
    }).select('project submittedBy reviewStatus').lean();

    // Projects with approved/pending submissions are locked — rejected ones can resubmit
    const lockedStatuses       = ['approved', 'pending_review', 'pending_check'];
    const lockedProjectIds     = new Set(
      alreadySubmitted
        .filter((s) => lockedStatuses.includes(s.reviewStatus))
        .map((s) => s.project?.toString())
    );
    const submittedByMe        = alreadySubmitted.find((s) => s.submittedBy?.toString() === userId.toString());
    const availableProjects    = eligibleProjects.filter((p) => !lockedProjectIds.has(p._id.toString()));
    const eligible             = availableProjects.length > 0;

    let reason = null;
    if (eligibleProjects.length === 0) {
      if (contest.teamFormedAfter) {
        const d = new Date(contest.teamFormedAfter).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        reason = `Your team must have been formed on or after ${d} and have at least 2 members (including yourself).`;
      } else {
        reason = 'You must post a project on CREWUP with at least 2 team members (including yourself) to participate.';
      }
    } else if (!eligible) {
      reason = 'Your team has already submitted a film to this contest. Only one submission per team is allowed.';
    }

    res.json({
      success:             true,
      eligible,
      reason,
      teamAlreadySubmitted: !eligible && eligibleProjects.length > 0,
      submittedByMe:        !!submittedByMe,
      teamFormedAfter:      contest.teamFormedAfter || null,
      projects: availableProjects.map((p) => ({
        id:          p._id,
        title:       p.title,
        memberCount: (p.teamMembers?.length || 0) + 1,
        createdAt:   p.createdAt,
      })),
    });
  } catch (e) { next(e); }
};

// ── Shared helper: run auto-check and update submission + notify ──────────
async function runCheckAndUpdate(submission, username, contestTitle) {
  const check = await runAutoCheck(submission.videoId, username);

  let newStatus;
  if (check.skipped) {
    // No YouTube API key — go straight to admin review
    newStatus = 'pending_review';
  } else if (check.passed) {
    newStatus = 'pending_review';
  } else {
    newStatus = 'auto_rejected';
  }

  submission.autoCheck    = check;
  submission.reviewStatus = newStatus;
  await submission.save();

  // Notify the submitter of the auto-check result
  let notifTitle, notifMsg;
  if (newStatus === 'pending_review') {
    notifTitle = `✅ Submission received: ${contestTitle}`;
    notifMsg   = check.skipped
      ? `Your film "${submission.title}" has been submitted and is pending admin review.`
      : `Your film "${submission.title}" passed the auto-check and is now pending admin review.`;
  } else {
    const missing = [];
    if (!check.hasCrewupMention)   missing.push('"crewupfilms"');
    if (!check.hasUsernameMention) missing.push(`"@${username}"`);
    notifTitle = `❌ Submission auto-rejected: ${contestTitle}`;
    notifMsg   = `Your film "${submission.title}" was auto-rejected because the YouTube description is missing: ${missing.join(' and ')}. Please add the required mentions and resubmit.`;
  }

  await Notification.create({
    recipient: submission.submittedBy,
    type:      'contest_submission',
    title:     notifTitle,
    message:   notifMsg,
    link:      `/contests/${submission.contest}`,
  });

  // Notify all admins when a film reaches pending_review
  if (newStatus === 'pending_review') {
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (admins.length > 0) {
      await Notification.insertMany(admins.map((a) => ({
        recipient: a._id,
        type:      'contest_submission',
        title:     `📽️ New contest submission: ${contestTitle}`,
        message:   `"${submission.title}" by @${username} passed auto-check and is ready for review.`,
        link:      `/admin?tab=contest-submissions`,
      })));
    }
  }

  return submission;
}

// POST /api/contests/:id/submissions  (auth required)
const submitFilm = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest)                  return res.status(404).json({ success: false, message: 'Contest not found' });
    if (contest.status !== 'open') return res.status(400).json({ success: false, message: 'Contest is closed' });
    if (new Date() > new Date(contest.submissionDeadline))
      return res.status(400).json({ success: false, message: 'Submission deadline has passed' });

    // ── Eligibility: must have a project with ≥ 2 members (+ teamFormedAfter) ──
    const projectQuery = {
      createdBy:       req.user._id,
      'teamMembers.0': { $exists: true },
    };
    if (contest.teamFormedAfter) {
      projectQuery.createdAt = { $gte: new Date(contest.teamFormedAfter) };
    }
    const eligibleProjects = await Project.find(projectQuery).lean();

    if (eligibleProjects.length === 0) {
      let msg = 'Eligibility failed: You must have a project on CREWUP with at least 2 team members to submit.';
      if (contest.teamFormedAfter) {
        const d = new Date(contest.teamFormedAfter).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        msg = `Eligibility failed: Your team project must have been created on or after ${d} and have at least 2 members.`;
      }
      return res.status(403).json({ success: false, message: msg, needsTeam: true });
    }

    const { title, youtubeLink, projectId, caption } = req.body;
    if (!title || !youtubeLink)
      return res.status(400).json({ success: false, message: 'title and youtubeLink are required' });

    const videoId = extractYtId(youtubeLink);
    if (!videoId) return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Use provided projectId or first eligible project
    const chosenProject = projectId
      ? eligibleProjects.find((p) => p._id.toString() === projectId) || eligibleProjects[0]
      : eligibleProjects[0];

    // ── Block only if existing submission is in a locked state ──
    const existingSubmission = await ContestSubmission.findOne({
      contest: req.params.id,
      project: chosenProject._id,
    });
    const lockedStatuses = ['approved', 'pending_review', 'pending_check'];
    if (existingSubmission && lockedStatuses.includes(existingSubmission.reviewStatus)) {
      return res.status(409).json({
        success: false,
        message: 'Your team already has an active submission for this contest.',
        teamAlreadySubmitted: true,
      });
    }

    // If a rejected submission exists, update it (resubmit) rather than creating a new one
    let submission;
    if (existingSubmission) {
      existingSubmission.title        = title;
      existingSubmission.youtubeLink  = youtubeLink;
      existingSubmission.videoId      = videoId;
      existingSubmission.thumbnail    = thumbnail;
      existingSubmission.caption      = (caption || '').trim().slice(0, 300);
      existingSubmission.reviewStatus = 'pending_check';
      existingSubmission.adminNote    = '';
      existingSubmission.resubmitCount += 1;
      await existingSubmission.save();
      submission = existingSubmission;
    } else {
      submission = await ContestSubmission.create({
        contest:     req.params.id,
        submittedBy: req.user._id,
        project:     chosenProject._id,
        title, youtubeLink, videoId, thumbnail,
        caption:      (caption || '').trim().slice(0, 300),
        reviewStatus: 'pending_check',
      });
    }

    await submission.populate('submittedBy', 'name username profileImage');

    // Return immediately so the user isn't kept waiting — check runs async
    res.status(201).json({ success: true, data: submission });

    // Run the YouTube description check in the background
    const username = req.user.username || '';
    runCheckAndUpdate(submission, username, contest.title).catch(console.error);

  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: 'Your team already has a submission for this contest.', teamAlreadySubmitted: true });
    next(e);
  }
};

// DELETE /api/contests/:id/submissions/:subId
const deleteSubmission = async (req, res, next) => {
  try {
    const sub = await ContestSubmission.findById(req.params.subId);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.submittedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await sub.deleteOne();
    res.json({ success: true, message: 'Submission removed' });
  } catch (e) { next(e); }
};

// POST /api/contests/:id/submissions/:subId/like  (engagement like)
const toggleLike = async (req, res, next) => {
  try {
    const sub = await ContestSubmission.findById(req.params.subId);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    const uid   = req.user._id.toString();
    const liked = sub.likes.map((l) => l.toString()).includes(uid);
    if (liked) sub.likes = sub.likes.filter((l) => l.toString() !== uid);
    else       sub.likes.push(req.user._id);
    await sub.save();
    res.json({ success: true, liked: !liked, likeCount: sub.likes.length });
  } catch (e) { next(e); }
};

// POST /api/contests/:id/submissions/:subId/vote  (contest vote)
const toggleVote = async (req, res, next) => {
  try {
    const sub = await ContestSubmission.findById(req.params.subId);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    // Cannot vote on your own submission
    if (sub.submittedBy.toString() === req.user._id.toString())
      return res.status(403).json({ success: false, message: 'You cannot vote on your own submission' });

    const uid   = req.user._id.toString();
    const voted = sub.votes.map((v) => v.toString()).includes(uid);
    if (voted) sub.votes = sub.votes.filter((v) => v.toString() !== uid);
    else       sub.votes.push(req.user._id);
    await sub.save();
    res.json({ success: true, voted: !voted, voteCount: sub.votes.length });
  } catch (e) { next(e); }
};

// GET /api/contests/:id/submissions/:subId/comments
const getComments = async (req, res, next) => {
  try {
    const comments = await FilmComment.find({ submission: req.params.subId })
      .populate('author', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: comments });
  } catch (e) { next(e); }
};

// POST /api/contests/:id/submissions/:subId/comments
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'text is required' });
    const comment = await FilmComment.create({ submission: req.params.subId, author: req.user._id, text: text.trim() });
    await comment.populate('author', 'name username profileImage');
    res.status(201).json({ success: true, data: comment });
  } catch (e) { next(e); }
};

// DELETE /api/contests/:id/submissions/:subId/comments/:commentId
const deleteComment = async (req, res, next) => {
  try {
    const comment = await FilmComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await comment.deleteOne();
    res.json({ success: true });
  } catch (e) { next(e); }
};

// ── Admin: list all submissions pending review (or any status) ────────────
// GET /api/admin/contest-submissions?status=pending_review&contestId=xxx
const adminGetSubmissions = async (req, res, next) => {
  try {
    const { status, contestId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status)    filter.reviewStatus = status;
    if (contestId) filter.contest      = contestId;

    const [submissions, total] = await Promise.all([
      ContestSubmission.find(filter)
        .populate('submittedBy', 'name username profileImage')
        .populate('contest',     'title')
        .populate('project',     'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ContestSubmission.countDocuments(filter),
    ]);

    res.json({ success: true, data: submissions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
};

// ── Admin: approve a submission ───────────────────────────────────────────
// PATCH /api/admin/contest-submissions/:subId/approve
const adminApprove = async (req, res, next) => {
  try {
    const sub = await ContestSubmission.findById(req.params.subId)
      .populate('submittedBy', 'name username')
      .populate('contest', 'title');
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    sub.reviewStatus = 'approved';
    sub.adminNote    = (req.body.note || '').trim();
    sub.reviewedBy   = req.user._id;
    sub.reviewedAt   = new Date();
    await sub.save();

    // Notify the submitter
    await Notification.create({
      recipient: sub.submittedBy._id,
      type:      'contest_submission',
      title:     `🎉 Submission approved: ${sub.contest.title}`,
      message:   `Your film "${sub.title}" has been approved and is now live in the contest!${sub.adminNote ? ` Note: ${sub.adminNote}` : ''}`,
      link:      `/contests/${sub.contest._id}`,
    });

    res.json({ success: true, data: sub });
  } catch (e) { next(e); }
};

// ── Admin: reject a submission ────────────────────────────────────────────
// PATCH /api/admin/contest-submissions/:subId/reject
const adminReject = async (req, res, next) => {
  try {
    const sub = await ContestSubmission.findById(req.params.subId)
      .populate('submittedBy', 'name username')
      .populate('contest', 'title');
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    const reason = (req.body.reason || '').trim();
    if (!reason) return res.status(400).json({ success: false, message: 'A rejection reason is required' });

    sub.reviewStatus = 'rejected';
    sub.adminNote    = reason;
    sub.reviewedBy   = req.user._id;
    sub.reviewedAt   = new Date();
    await sub.save();

    // Notify the submitter with the reason and resubmit link
    await Notification.create({
      recipient: sub.submittedBy._id,
      type:      'contest_submission',
      title:     `❌ Submission rejected: ${sub.contest.title}`,
      message:   `Your film "${sub.title}" was rejected. Reason: ${reason}. You can update your submission and resubmit.`,
      link:      `/contests/${sub.contest._id}`,
    });

    res.json({ success: true, data: sub });
  } catch (e) { next(e); }
};

// GET /api/contests/:id/my-submission  — get the current user's own submission
const getMySubmission = async (req, res, next) => {
  try {
    const sub = await ContestSubmission.findOne({
      contest:     req.params.id,
      submittedBy: req.user._id,
    }).populate('project', 'title').lean();

    res.json({ success: true, data: sub || null });
  } catch (e) { next(e); }
};

module.exports = {
  getSubmissions, getLeaderboard, checkEligibility,
  submitFilm, deleteSubmission,
  toggleLike, toggleVote,
  getComments, addComment, deleteComment,
  adminGetSubmissions, adminApprove, adminReject,
  getMySubmission,
};
