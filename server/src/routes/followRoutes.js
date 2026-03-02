const express = require('express');
const { follow, unfollow, getStatus, getCounts, getFeed } = require('../controllers/followController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/feed',              protect, getFeed);          // following feed
router.get('/status/:userId',    protect, getStatus);        // am I following them?
router.get('/counts/:userId',    protect, getCounts);        // follower/following counts
router.post('/:userId',          protect, follow);           // follow
router.delete('/:userId',        protect, unfollow);         // unfollow

module.exports = router;
