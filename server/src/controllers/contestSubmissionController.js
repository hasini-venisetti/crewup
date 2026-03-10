const Contest            = require('../models/Contest');
const ContestSubmission  = require('../models/ContestSubmission');
const FilmComment        = require('../models/FilmComment');
const Project            = require('../models/Project');

function extractYtId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// GET /api/contests/:id/submissions?page=1&limit=12
const getSubmissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [submissions, total] = await Promise.all([
      ContestSubmission.find({ contest: req.params.id })
        .populate('submittedBy', 'name username profileImage')
        .populate('project', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ContestSubmission.countDocuments({ contest: req.params.id }),
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

// GET /api/contests/:id/leaderboard  — top 10 by votes then likes
const getLeaderboard = async (req, res, next) => {
  try {
    const submissions = await ContestSubmission.find({ contest: req.params.id })
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

    const eligible = eligibleProjects.length > 0;

    let reason = null;
    if (!eligible) {
      if (contest.teamFormedAfter) {
        const d = new Date(contest.teamFormedAfter).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        reason = `Your team must have been formed on or after ${d} and have at least 2 members (including yourself).`;
      } else {
        reason = 'You must post a project on CREWUP with at least 2 team members (including yourself) to participate.';
      }
    }

    res.json({
      success: true,
      eligible,
      reason,
      teamFormedAfter: contest.teamFormedAfter || null,
      projects: eligibleProjects.map((p) => ({
        id:          p._id,
        title:       p.title,
        memberCount: (p.teamMembers?.length || 0) + 1,
        createdAt:   p.createdAt,
      })),
    });
  } catch (e) { next(e); }
};

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

    const submission = await ContestSubmission.create({
      contest:     req.params.id,
      submittedBy: req.user._id,
      project:     chosenProject._id,
      title, youtubeLink, videoId, thumbnail,
      caption: (caption || '').trim().slice(0, 300),
    });
    await submission.populate('submittedBy', 'name username profileImage');

    res.status(201).json({ success: true, data: submission });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: 'You have already submitted to this contest' });
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

module.exports = {
  getSubmissions, getLeaderboard, checkEligibility,
  submitFilm, deleteSubmission,
  toggleLike, toggleVote,
  getComments, addComment, deleteComment,
};
