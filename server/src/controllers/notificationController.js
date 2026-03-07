const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get count of unread notifications for current user
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a notification to a specific user (e.g. project invite)
// @route   POST /api/notifications/send
// @access  Private
const sendDirectNotification = async (req, res, next) => {
  try {
    const { recipientId, title, message, type = 'project_invite', link = '' } = req.body;
    if (!recipientId || !title || !message) {
      return res.status(400).json({ success: false, message: 'recipientId, title and message are required' });
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender:    req.user._id,
      type,
      title,
      message,
      link,
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a global notification to all users (admin only)
// @route   POST /api/notifications/admin/global
// @access  Private (admin)
const sendGlobalNotification = async (req, res, next) => {
  try {
    // Optional: restrict to admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { title, message, type = 'platform_update', link = '' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'title and message are required' });
    }

    // Fetch all user IDs
    const users = await User.find({}, '_id');
    if (users.length === 0) {
      return res.status(200).json({ success: true, message: 'No users found', count: 0 });
    }

    const notifications = users.map((u) => ({
      recipient: u._id,
      sender:    req.user._id,
      type,
      title,
      message,
      link,
      read: false,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Global notification sent to ${notifications.length} users`,
      count: notifications.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
  deleteNotification,
  sendDirectNotification,
  sendGlobalNotification,
};
