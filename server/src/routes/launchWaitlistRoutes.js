const express  = require('express');
const { joinWaitlist, getWaitlist, notifyWaitlist } = require('../controllers/launchWaitlistController');
const { protect, adminOnly }        = require('../middleware/auth');

const router = express.Router();

router.post('/',        joinWaitlist);                           // public — anyone can join
router.get('/',         protect, adminOnly, getWaitlist);        // admin only
router.post('/notify',  protect, adminOnly, notifyWaitlist);     // admin only — send launch emails

module.exports = router;
