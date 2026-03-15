const express = require('express');
const { follow, unfollow, getStatus, getCounts, getFollowers, getFollowing, getFeed } = require('../controllers/followController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/feed',              protect, getFeed);          // following feed
router.get('/status/:userId',    protect, getStatus);        // am I following them?
router.get('/counts/:userId',    getCounts);                 // follower/following counts (public)
router.get('/followers/:userId', getFollowers);              // get followers list (public)
router.get('/following/:userId', getFollowing);              // get following list (public)
router.post('/:userId',          protect, follow);           // follow
router.delete('/:userId',        protect, unfollow);         // unfollow

module.exports = router;
