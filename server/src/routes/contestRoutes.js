const express = require('express');
const { protect }   = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const {
  getContests, getContest,
  createContest, updateContest, endContest, setWinners, deleteContest,
  submitPrizeClaim, getPrizeClaims, markClaimProcessed,
} = require('../controllers/contestController');
const {
  getSubmissions, getLeaderboard, checkEligibility,
  submitFilm, deleteSubmission,
  toggleLike, toggleVote,
  getComments, addComment, deleteComment,
} = require('../controllers/contestSubmissionController');

const router = express.Router();

// Contest CRUD
router.get('/',              getContests);
router.get('/:id',           getContest);
router.post('/',             protect, adminOnly, createContest);
router.put('/:id',           protect, adminOnly, updateContest);
router.patch('/:id/end',     protect, adminOnly, endContest);
router.patch('/:id/winners',     protect, adminOnly, setWinners);
router.delete('/:id',            protect, adminOnly, deleteContest);
router.post('/:id/prize-claim',              protect,              submitPrizeClaim);
router.get('/:id/prize-claims',              protect, adminOnly,   getPrizeClaims);
router.patch('/:id/prize-claims/:claimId',   protect, adminOnly,   markClaimProcessed);

// Submissions
router.get( '/:id/submissions',                  getSubmissions);
router.get( '/:id/leaderboard',                  getLeaderboard);
router.get( '/:id/eligibility',  protect,        checkEligibility);
router.post('/:id/submissions',  protect,        submitFilm);
router.delete('/:id/submissions/:subId', protect, deleteSubmission);

// Submission interactions
router.post(  '/:id/submissions/:subId/like',                protect, toggleLike);
router.post(  '/:id/submissions/:subId/vote',                protect, toggleVote);
router.get(   '/:id/submissions/:subId/comments',                     getComments);
router.post(  '/:id/submissions/:subId/comments',            protect, addComment);
router.delete('/:id/submissions/:subId/comments/:commentId', protect, deleteComment);

module.exports = router;
