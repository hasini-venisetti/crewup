const express = require('express');
const { follow, unfollow, getFollowStatus, getFollowInfo, getCounts, getFollowers, getFollowing, getFeed } = require('../controllers/followController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/feed',               protect, getFeed);          // paginated feed of followed users' projects
router.get('/status/:userId',     protect, getFollowStatus);  // NEW — follow status + counts
router.get('/info/:userId',       protect, getFollowInfo);    // legacy alias → same as /status
router.get('/counts/:userId',     getCounts);                 // follower/following counts (public)
router.get('/followers/:userId',  getFollowers);              // followers list (public)
router.get('/following/:userId',  getFollowing);              // following list (public)
router.post('/:userId',           protect, follow);           // follow
router.delete('/:userId',         protect, unfollow);         // unfollow

module.exports = router;
