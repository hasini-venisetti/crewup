const Project     = require('../models/Project');
const FilmComment = require('../models/FilmComment');
const Report      = require('../models/Report');
const User        = require('../models/User');

// @desc   Toggle like on a film
// @route  POST /api/films/:id/like
// @access Private
const toggleLike = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || !project.youtubeLink) {
      return res.status(404).json({ success: false, message: 'Film not found' });
    }

    const userId   = req.user._id.toString();
    const liked    = project.likes.map((l) => l.toString()).includes(userId);

    if (liked) {
      project.likes = project.likes.filter((l) => l.toString() !== userId);
    } else {
      project.likes.push(req.user._id);
    }

    await project.save();

    res.status(200).json({
      success:   true,
      liked:     !liked,
      likeCount: project.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get like status + count for a film
// @route  GET /api/films/:id/like
// @access Public
const getLikeStatus = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).select('likes');
    if (!project) return res.status(404).json({ success: false, message: 'Film not found' });

    let userId = null;
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id?.toString();
      }
    } catch { /* unauthenticated */ }

    const liked = userId
      ? project.likes.map((l) => l.toString()).includes(userId)
      : false;

    res.status(200).json({ success: true, liked, likeCount: project.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc   Get comments for a film
// @route  GET /api/films/:id/comments
// @access Public
const getComments = async (req, res, next) => {
  try {
    const comments = await FilmComment.find({ project: req.params.id })
      .populate('author', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

// Regex patterns to strip contact info from comments
const CONTACT_INFO_PATTERN = /(\+?[\d\s\-().]{7,}|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|(?:wa\.me|whatsapp\.com|t\.me|telegram\.me)\/\S+)/gi;

// @desc   Add a comment to a film
// @route  POST /api/films/:id/comments
// @access Private
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }
    if (text.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 1000 characters' });
    }

    // Spam cooldown: 30 seconds between comments per user per film
    const COOLDOWN_MS = 30 * 1000;
    const recent = await FilmComment.findOne({
      project: req.params.id,
      author:  req.user._id,
    }).sort({ createdAt: -1 }).select('createdAt');
    if (recent && Date.now() - new Date(recent.createdAt).getTime() < COOLDOWN_MS) {
      return res.status(429).json({ success: false, message: 'Please wait a moment before commenting again.' });
    }

    const project = await Project.findById(req.params.id).select('youtubeLink');
    if (!project || !project.youtubeLink) {
      return res.status(404).json({ success: false, message: 'Film not found' });
    }

    // Strip phone numbers, emails, and messaging links from comment text
    const sanitizedText = text.trim().replace(CONTACT_INFO_PATTERN, '[contact info removed]');

    const comment = await FilmComment.create({
      project: req.params.id,
      author:  req.user._id,
      text:    sanitizedText,
    });

    await comment.populate('author', 'name username profileImage');

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete own comment
// @route  DELETE /api/films/:id/comments/:commentId
// @access Private
const deleteComment = async (req, res, next) => {
  try {
    const comment = await FilmComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await comment.deleteOne();
    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc   Report a film
// @route  POST /api/films/:id/report
// @access Private
const reportFilm = async (req, res, next) => {
  try {
    const { reason, details } = req.body;
    const VALID_REASONS = ['spam', 'inappropriate', 'copyright', 'misinformation', 'other'];
    if (!reason || !VALID_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: 'A valid reason is required' });
    }

    const project = await Project.findById(req.params.id).select('_id youtubeLink');
    if (!project || !project.youtubeLink) {
      return res.status(404).json({ success: false, message: 'Film not found' });
    }

    await Report.create({
      reporter:   req.user._id,
      targetType: 'film',
      targetId:   req.params.id,
      reason,
      details:    details?.trim().slice(0, 500) || '',
    });

    res.status(201).json({ success: true, message: 'Report submitted. Thank you.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reported this film.' });
    }
    next(err);
  }
};

// @desc   Toggle bookmark on a project (any type, not just films)
// @route  POST /api/films/:id/bookmark
// @access Private
const toggleBookmark = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).select('_id');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const user = await User.findById(req.user._id).select('bookmarks');
    const projectId = req.params.id;
    const alreadyBookmarked = user.bookmarks.map((b) => b.toString()).includes(projectId);

    if (alreadyBookmarked) {
      user.bookmarks = user.bookmarks.filter((b) => b.toString() !== projectId);
    } else {
      user.bookmarks.push(projectId);
    }
    await user.save();

    res.status(200).json({ success: true, bookmarked: !alreadyBookmarked });
  } catch (error) {
    next(error);
  }
};

// @desc   Get bookmark status for a project
// @route  GET /api/films/:id/bookmark
// @access Public (returns false if not logged in)
const getBookmarkStatus = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).select('_id');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    let bookmarked = false;
    try {
      const jwt   = require('jsonwebtoken');
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const u = await User.findById(decoded.id).select('bookmarks');
        if (u) bookmarked = u.bookmarks.map((b) => b.toString()).includes(req.params.id);
      }
    } catch { /* unauthenticated — stay false */ }

    res.status(200).json({ success: true, bookmarked });
  } catch (error) {
    next(error);
  }
};

// @desc   Get all bookmarked films for the logged-in user
// @route  GET /api/films/bookmarks
// @access Private
const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('bookmarks')
      .populate({
        path:  'bookmarks',
        match: { youtubeLink: { $exists: true, $ne: '' } },
        select: 'title youtubeLink videoId thumbnail projectType likes createdBy',
        populate: { path: 'createdBy', select: 'name username profileImage _id' },
      });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const films = (user.bookmarks || []).filter(Boolean).map((p) => ({
      _id:         p._id,
      title:       p.title,
      youtubeLink: p.youtubeLink,
      videoId:     p.videoId,
      thumbnail:   p.thumbnail,
      projectType: p.projectType,
      likeCount:   (p.likes || []).length,
      director:    p.createdBy,
    }));

    res.status(200).json({ success: true, data: films });
  } catch (error) {
    next(error);
  }
};

// @desc   Get film analytics — who liked & who commented (project owner only)
// @route  GET /api/films/:id/analytics
// @access Private (owner only)
const getFilmAnalytics = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('likes', 'name username profileImage _id')
      .select('likes createdBy youtubeLink title');

    if (!project || !project.youtubeLink) {
      return res.status(404).json({ success: false, message: 'Film not found' });
    }
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const comments = await FilmComment.find({ project: req.params.id })
      .populate('author', 'name username profileImage _id')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        likes:    project.likes,
        comments: comments.map((c) => ({
          _id:       c._id,
          text:      c.text,
          author:    c.author,
          createdAt: c.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleLike, getLikeStatus,
  getComments, addComment, deleteComment,
  reportFilm,
  toggleBookmark, getBookmarkStatus, getBookmarks,
  getFilmAnalytics,
};
