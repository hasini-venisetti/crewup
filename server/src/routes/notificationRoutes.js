const express = require('express');
const {
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All notification routes are protected
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
