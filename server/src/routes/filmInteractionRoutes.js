const express = require('express');
const {
  toggleLike, getLikeStatus,
  getComments, addComment, deleteComment,
  reportFilm,
  toggleBookmark, getBookmarkStatus, getBookmarks,
  getFilmAnalytics,
} = require('../controllers/filmInteractionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Bookmarks (must come before /:id routes to avoid param clash) ──
router.get('/bookmarks',              protect, getBookmarks);

// ── Likes ──
router.post('/:id/like',             protect, toggleLike);
router.get('/:id/like',                       getLikeStatus);   // public

// ── Comments ──
router.get('/:id/comments',                   getComments);
router.post('/:id/comments',         protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

// ── Bookmarks per film ──
router.post('/:id/bookmark',         protect, toggleBookmark);
router.get('/:id/bookmark',                   getBookmarkStatus);  // public

// ── Analytics (owner only) ──
router.get('/:id/analytics',         protect, getFilmAnalytics);

// ── Reports ──
router.post('/:id/report',           protect, reportFilm);

module.exports = router;
