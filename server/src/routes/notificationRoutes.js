const express = require('express');
const {
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
  deleteNotification,
  sendDirectNotification,
  sendGlobalNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All notification routes are protected
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/read-all', protect, markAllRead);
router.post('/send', protect, sendDirectNotification);
router.post('/admin/global', protect, sendGlobalNotification);
router.patch('/:id/read', protect, markRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
