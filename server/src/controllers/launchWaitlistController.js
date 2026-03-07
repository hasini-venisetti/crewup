const LaunchWaitlist = require('../models/LaunchWaitlist');
const { sendLaunchNotification } = require('../utils/emailService');

// @desc   Join the launch waitlist
// @route  POST /api/launch-waitlist
// @access Public
const joinWaitlist = async (req, res, next) => {
  try {
    const { email, name, source } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email is required.' });
    }

    const entry = await LaunchWaitlist.create({
      email:  email.toLowerCase().trim(),
      name:   name?.trim() || '',
      source: source || 'waitlist-page',
    });

    // Return position in waitlist
    const position = await LaunchWaitlist.countDocuments({ createdAt: { $lte: entry.createdAt } });

    res.status(201).json({ success: true, message: 'You\'re on the waitlist!', position });
  } catch (err) {
    if (err.code === 11000) {
      // Already on list — silently succeed so we don't expose user data
      return res.status(409).json({ success: false, message: 'This email is already on the waitlist.' });
    }
    next(err);
  }
};

// @desc   Get all waitlist entries (admin only)
// @route  GET /api/launch-waitlist
// @access Private (admin)
const getWaitlist = async (req, res, next) => {
  try {
    const entries = await LaunchWaitlist.find().sort({ createdAt: -1 }).lean();
    const total   = await LaunchWaitlist.countDocuments();
    res.status(200).json({ success: true, total, data: entries });
  } catch (err) {
    next(err);
  }
};

// @desc   Send launch notification emails to all unnotified waitlist entries
// @route  POST /api/launch-waitlist/notify
// @access Private (admin)
const notifyWaitlist = async (req, res, next) => {
  try {
    const entries = await LaunchWaitlist.find({ notified: { $ne: true } }).lean();

    if (entries.length === 0) {
      return res.status(200).json({ success: true, message: 'Everyone has already been notified.', sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        await sendLaunchNotification(entry.email, entry.name);
        await LaunchWaitlist.findByIdAndUpdate(entry._id, { notified: true });
        sent++;
      } catch {
        failed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Launch emails sent to ${sent} people${failed > 0 ? ` (${failed} failed)` : ''}.`,
      sent,
      failed,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { joinWaitlist, getWaitlist, notifyWaitlist };
