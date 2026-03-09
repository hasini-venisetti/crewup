const express  = require('express');
const { joinWaitlist, getWaitlist, notifyWaitlist, forceNotifyAll, resetNotified, notifyOne } = require('../controllers/launchWaitlistController');
const { protect, adminOnly }        = require('../middleware/auth');

const router = express.Router();

router.post('/',        joinWaitlist);                           // public — anyone can join
router.get('/',         protect, adminOnly, getWaitlist);        // admin only
router.post('/notify',        protect, adminOnly, notifyWaitlist);      // admin only — send to unnotified only
router.post('/force-notify',  protect, adminOnly, forceNotifyAll);      // admin only — send to ALL (even re-send)
router.post('/reset-notified', protect, adminOnly, resetNotified);      // admin only — reset all flags to false
router.post('/notify/:id',    protect, adminOnly, notifyOne);           // admin only — notify a single entry

module.exports = router;
