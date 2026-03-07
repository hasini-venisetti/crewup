const express = require('express');
const { follow, unfollow, getStatus, getCounts, getFollowers, getFollowing, getFeed } = require('../controllers/followController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/feed',              protect, getFeed);          // following feed
router.get('/status/:userId',    protect, getStatus);        // am I following them?
router.get('/counts/:userId',    protect, getCounts);        // follower/following counts
router.get('/followers/:userId', protect, getFollowers);     // get followers list
router.get('/following/:userId', protect, getFollowing);     // get following list
router.post('/:userId',          protect, follow);           // follow
router.delete('/:userId',        protect, unfollow);         // unfollow

module.exports = router;
