const express        = require('express');
const router         = express.Router();
const { protect }    = require('../middleware/auth');
const Profile        = require('../models/Profile');
const Notification   = require('../models/Notification');
const MessageRequest = require('../models/MessageRequest');
const Conversation   = require('../models/Conversation');
const User           = require('../models/User');
const MentorReview   = require('../models/MentorReview');
const MentorBooking  = require('../models/MentorBooking');
const emailService   = require('../utils/emailService');

// GET /api/mentors — list all mentors
router.get('/', async (req, res) => {
  try {
    const { field, availability, sessionType, locationType, search } = req.query;
    const query = {
      isMentor: true,
      $or: [{ mentorStatus: 'open' }, { mentorStatus: { $exists: false } }],
    };
    if (field)        query.mentorFields       = { $in: [field] };
    if (availability) query.availability       = availability;
    if (sessionType)  query.mentorSessionTypes = { $in: [sessionType] };
    if (locationType) query.mentorLocationType = locationType;

    let profiles = await Profile.find(query)
      .populate('user', 'name username profileImage role')
      .limit(100)
      .sort({ mentorRatingAvg: -1, createdAt: -1 });

    // Search by name (post-filter since name is on User doc)
    if (search) {
      const q = search.toLowerCase();
      profiles = profiles.filter((p) =>
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.username?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: profiles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/mentors/settings — update mentor profile fields
router.patch('/settings', protect, async (req, res) => {
  try {
    // Only verified users can become mentors
    if (req.body.isMentor === true && !req.user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before becoming a mentor.' });
    }
    const {
      isMentor, mentorStatus, mentorFields, mentorBio, mentorRate, mentorCurrency,
      mentorExperience, mentorSessionTypes, mentorLocationType, mentorLanguages,
      mentorTimezone, mentorSessionDuration, mentorWeeklySchedule,
      mentorBookingDateFrom, mentorBookingDateTo, mentorBlockedDates,
    } = req.body;
    const updateFields = {
      isMentor:              typeof isMentor === 'boolean' ? isMentor : undefined,
      mentorStatus:          mentorStatus          !== undefined ? mentorStatus          : undefined,
      mentorFields:          mentorFields          !== undefined ? mentorFields          : undefined,
      mentorBio:             mentorBio             !== undefined ? mentorBio             : undefined,
      mentorRate:            mentorRate            !== undefined ? (mentorRate !== null && mentorRate !== '' ? Number(mentorRate) : null) : undefined,
      mentorCurrency:        mentorCurrency        !== undefined ? (mentorCurrency || 'INR') : undefined,
      mentorExperience:      mentorExperience      !== undefined ? (mentorExperience !== '' ? Number(mentorExperience) : null) : undefined,
      mentorSessionTypes:    mentorSessionTypes    !== undefined ? mentorSessionTypes    : undefined,
      mentorLocationType:    mentorLocationType    !== undefined ? mentorLocationType    : undefined,
      mentorLanguages:       mentorLanguages       !== undefined ? mentorLanguages       : undefined,
      mentorTimezone:        mentorTimezone        !== undefined ? mentorTimezone        : undefined,
      mentorSessionDuration: mentorSessionDuration !== undefined ? Number(mentorSessionDuration) : undefined,
      mentorWeeklySchedule:  mentorWeeklySchedule  !== undefined ? mentorWeeklySchedule  : undefined,
      mentorBookingDateFrom: mentorBookingDateFrom !== undefined ? mentorBookingDateFrom : undefined,
      mentorBookingDateTo:   mentorBookingDateTo   !== undefined ? mentorBookingDateTo   : undefined,
      mentorBlockedDates:    mentorBlockedDates    !== undefined ? mentorBlockedDates    : undefined,
    };
    Object.keys(updateFields).forEach((k) => updateFields[k] === undefined && delete updateFields[k]);

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id || req.user.id },
      { $set: updateFields },
      { new: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mentors/:mentorUserId/apply — send a mentorship application
router.post('/:mentorUserId/apply', protect, async (req, res) => {
  try {
    const { message = '' } = req.body;
    const mentorUserId = req.params.mentorUserId;
    const senderId     = req.user._id || req.user.id;

    if (String(senderId) === String(mentorUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot apply to yourself.' });
    }

    const mentorProfile = await Profile.findOne({ user: mentorUserId, isMentor: true })
      .populate('user', 'name')
      .lean();
    if (!mentorProfile) {
      return res.status(404).json({ success: false, message: 'Mentor not found.' });
    }

    // Check for duplicate pending application
    const existing = await MessageRequest.findOne({ sender: senderId, recipient: mentorUserId });
    if (existing && existing.status === 'pending') {
      return res.status(409).json({ success: false, message: 'You already have a pending application with this mentor.' });
    }
    if (existing && existing.status === 'accepted') {
      return res.status(409).json({ success: false, message: 'This mentor has already accepted your application. You can chat directly.' });
    }

    // Create (or reset declined) MessageRequest so mentor can accept → open chat
    let mentorRequest;
    if (existing) {
      existing.status  = 'pending';
      existing.message = message.trim();
      await existing.save();
      mentorRequest = existing;
    } else {
      mentorRequest = await MessageRequest.create({ sender: senderId, recipient: mentorUserId, message: message.trim() });
    }

    // Notify the mentor
    await Notification.create({
      recipient: mentorUserId,
      sender:    senderId,
      type:      'mentorship_request',
      title:     `${req.user.name} wants you as their mentor`,
      message:   message.trim() || `${req.user.name} has applied for mentorship with you.`,
      link:      `/messages?tab=requests`,
      data:      { requestId: String(mentorRequest._id) },
    });

    // Send email to mentor (fire-and-forget)
    const mentorUser = await User.findById(mentorUserId).select('email name').lean();
    if (mentorUser?.email) {
      emailService.sendMentorApplicationReceived(
        mentorUser.email,
        mentorUser.name,
        req.user.name,
        req.user.role,
        message.trim()
      ).catch((e) => console.error('[EMAIL ERROR]', e.message));
    }

    return res.status(201).json({ success: true, message: 'Application sent! The mentor will be notified.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/mentors/requests/:requestId/accept — mentor accepts a mentorship application
// This is identical to the generic messageRequest accept, but scoped here for clarity
router.patch('/requests/:requestId/accept', protect, async (req, res) => {
  try {
    const request = await MessageRequest.findById(req.params.requestId)
      .populate('sender', 'name username role profileImage');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (String(request.recipient) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    request.status = 'accepted';
    await request.save();

    // Create or activate conversation
    let conversation = await Conversation.findOne({
      members: { $all: [request.sender._id, request.recipient] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        members: [request.sender._id, request.recipient],
        status:  'active',
      });
    } else {
      conversation.status = 'active';
      await conversation.save();
    }

    // Notify the applicant
    try {
      await Notification.create({
        recipient: request.sender._id,
        sender:    req.user._id || req.user.id,
        type:      'message_request_accepted',
        title:     `${req.user.name} accepted your mentorship application`,
        message:   `You can now chat with ${req.user.name}.`,
        link:      `/messages?conv=${conversation._id}`,
      });
    } catch (_) { /* non-critical */ }

    const populated = await Conversation.findById(conversation._id)
      .populate('members', 'name username role profileImage');

    // Send email to the applicant (fire-and-forget)
    const applicantUser = await User.findById(request.sender._id).select('email name').lean();
    if (applicantUser?.email) {
      emailService.sendMentorApplicationAccepted(
        applicantUser.email,
        applicantUser.name,
        req.user.name,
        conversation._id
      ).catch((e) => console.error('[EMAIL ERROR]', e.message));
    }

    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   BOOKING SYSTEM
═══════════════════════════════════════════════════════════════ */

// PATCH /api/mentors/settings — also saves weekly schedule + timezone + duration
// (already handled above — just keeping the comment for clarity)

// GET /api/mentors/:mentorUserId/slots?month=YYYY-MM
// Returns booked slots for a month so the calendar can grey them out
router.get('/:mentorUserId/slots', async (req, res) => {
  try {
    const { month } = req.query; // "2025-06"
    if (!month) return res.status(400).json({ success: false, message: 'month query required (YYYY-MM)' });

    const [year, mon] = month.split('-').map(Number);
    const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
    const endDate   = `${year}-${String(mon).padStart(2, '0')}-31`;

    const bookings = await MentorBooking.find({
      mentor: req.params.mentorUserId,
      date:   { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed'] },
    }).select('date startTime endTime status');

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mentors/:mentorUserId/bookings — request a session
router.post('/:mentorUserId/bookings', protect, async (req, res) => {
  try {
    const { sessionType, date, startTime, endTime, notes, meetingAddress } = req.body;
    const mentorUserId = req.params.mentorUserId;
    const menteeId     = req.user._id || req.user.id;

    if (!req.user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before booking a session.' });
    }
    if (String(menteeId) === String(mentorUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot book yourself.' });
    }
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'date, startTime and endTime are required.' });
    }

    // Check mentor exists
    const mentorProfile = await Profile.findOne({ user: mentorUserId, isMentor: true }).lean();
    if (!mentorProfile) {
      return res.status(404).json({ success: false, message: 'Mentor not found.' });
    }

    // Check slot not already taken
    const conflict = await MentorBooking.findOne({
      mentor: mentorUserId, date, startTime, status: { $in: ['pending', 'confirmed'] },
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'That time slot is already booked. Please choose another.' });
    }

    const { duration: clientDuration } = req.body;
    const duration = clientDuration || mentorProfile.mentorSessionDuration || 60;
    const tz       = mentorProfile.mentorTimezone || 'Asia/Kolkata';

    const booking = await MentorBooking.create({
      mentor: mentorUserId, mentee: menteeId,
      sessionType: sessionType || '', date, startTime, endTime,
      duration, timezone: tz,
      notes: notes?.trim() || '',
      meetingAddress: meetingAddress?.trim() || '',
    });

    // Notify mentor (link goes straight to Sessions tab)
    const mentorUser = await User.findById(mentorUserId).select('email name').lean();
    await Notification.create({
      recipient: mentorUserId, sender: menteeId,
      type: 'booking_requested',
      title: `${req.user.name} booked a ${sessionType || 'session'} with you`,
      message: `Date: ${date} at ${startTime}${meetingAddress ? ` — 📍 ${meetingAddress.slice(0, 80)}` : ''}${notes ? ` — "${notes.slice(0, 60)}"` : ''}`,
      link: `/mentors/dashboard?tab=sessions`,
    });

    // Email mentor about new request (fire-and-forget)
    if (mentorUser?.email) {
      emailService.sendBookingRequested({
        mentorEmail: mentorUser.email, mentorName: mentorUser.name,
        menteeName: req.user.name,
        sessionType: sessionType || '1:1 Session', date, startTime, duration, timezone: tz,
        notes: notes?.trim() || '',
        meetingAddress: meetingAddress?.trim() || '',
      }).catch((e) => console.error('[EMAIL ERROR]', e.message));
    }

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'That slot is already taken.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/mentors/my-bookings — mentee's bookings
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await MentorBooking.find({ mentee: req.user._id || req.user.id })
      .populate('mentor', 'name username profileImage role')
      .sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/mentors/incoming-bookings — mentor's incoming bookings
router.get('/incoming-bookings', protect, async (req, res) => {
  try {
    const bookings = await MentorBooking.find({ mentor: req.user._id || req.user.id })
      .populate('mentee', 'name username profileImage role')
      .sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/mentors/bookings/:id/confirm — mentor confirms + optionally sets meeting link
router.patch('/bookings/:id/confirm', protect, async (req, res) => {
  try {
    const booking = await MentorBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (String(booking.mentor) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only the mentor can confirm.' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Booking is already ${booking.status}.` });
    }

    booking.status      = 'confirmed';
    booking.meetingLink = req.body.meetingLink?.trim() || '';
    await booking.save();

    // Notify mentee — link goes to their Sessions tab
    await Notification.create({
      recipient: booking.mentee, sender: req.user._id || req.user.id,
      type: 'booking_confirmed',
      title: `${req.user.name} confirmed your booking!`,
      message: `${booking.sessionType || 'Session'} on ${booking.date} at ${booking.startTime}${booking.meetingLink ? ` — Join: ${booking.meetingLink}` : ''}`,
      link: `/mentors/dashboard?tab=sessions`,
    });

    // Send confirmation emails to both mentor and mentee (fire-and-forget)
    const menteeUser = await User.findById(booking.mentee).select('email name').lean();
    if (menteeUser?.email || req.user?.email) {
      emailService.sendBookingConfirmed({
        menteeEmail:  menteeUser?.email,
        menteeName:   menteeUser?.name || 'Mentee',
        mentorEmail:  req.user.email,
        mentorName:   req.user.name,
        sessionType:  booking.sessionType || '1:1 Session',
        date:         booking.date,
        startTime:    booking.startTime,
        endTime:      booking.endTime,
        duration:     booking.duration || 60,
        timezone:     booking.timezone || 'Asia/Kolkata',
        meetingLink:    booking.meetingLink || '',
        meetingAddress: booking.meetingAddress || '',
      }).catch((e) => console.error('[EMAIL ERROR]', e.message));
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/mentors/bookings/:id/cancel — mentor or mentee cancels
router.patch('/bookings/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await MentorBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const myId   = String(req.user._id || req.user.id);
    const isMentor = String(booking.mentor) === myId;
    const isMentee = String(booking.mentee) === myId;
    if (!isMentor && !isMentee) return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Booking is already ${booking.status}.` });
    }

    booking.status       = 'cancelled';
    booking.cancelReason = req.body.reason?.trim() || '';
    booking.cancelledBy  = isMentor ? 'mentor' : 'mentee';
    await booking.save();

    // Notify the other party
    const recipient = isMentor ? booking.mentee : booking.mentor;
    await Notification.create({
      recipient, sender: req.user._id || req.user.id,
      type: 'booking_cancelled',
      title: `Booking cancelled by ${isMentor ? 'mentor' : 'mentee'}`,
      message: `${booking.sessionType || 'Session'} on ${booking.date} at ${booking.startTime} was cancelled.`,
      link: `/mentors/dashboard?tab=sessions`,
    }).catch((e) => console.error('[EMAIL ERROR]', e.message));

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/mentors/bookings/:id/complete — mentor marks session as done
router.patch('/bookings/:id/complete', protect, async (req, res) => {
  try {
    const booking = await MentorBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (String(booking.mentor) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only the mentor can mark complete.' });
    }
    booking.status = 'completed';
    await booking.save();

    // Prompt mentee to leave a review
    await Notification.create({
      recipient: booking.mentee, sender: req.user._id || req.user.id,
      type: 'booking_completed',
      title: `How was your session with ${req.user.name}?`,
      message: 'Your session is complete — leave a review on the Mentors page!',
      link: `/mentors`,
    }).catch((e) => console.error('[EMAIL ERROR]', e.message));

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mentors/bookings/:id/chat — send a message in the booking chat
router.post('/bookings/:id/chat', protect, async (req, res) => {
  try {
    const booking = await MentorBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const myId = String(req.user._id || req.user.id);
    const isMentor = String(booking.mentor) === myId;
    const isMentee = String(booking.mentee) === myId;
    if (!isMentor && !isMentee) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ success: false, message: 'Message cannot be empty.' });

    booking.chat.push({ sender: myId, text });
    await booking.save();

    // Notify the other party
    const recipient = isMentor ? booking.mentee : booking.mentor;
    await Notification.create({
      recipient, sender: myId,
      type: 'booking_message',
      title: `${req.user.name} sent a message about your booking`,
      message: text.slice(0, 100),
      link: `/mentors/dashboard?tab=sessions`,
    }).catch((e) => console.error('[EMAIL ERROR]', e.message));

    // Real-time push via socket
    const io = global._io;
    if (io) io.to(`user:${recipient}`).emit('bookingChatMessage', { bookingId: booking._id, sender: myId, text });

    res.json({ success: true, data: booking.chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/mentors/:mentorUserId/reviews — get reviews for a mentor
router.get('/:mentorUserId/reviews', async (req, res) => {
  try {
    const reviews = await MentorReview.find({ mentor: req.params.mentorUserId })
      .populate('reviewer', 'name username profileImage role')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mentors/:mentorUserId/reviews — submit a review
router.post('/:mentorUserId/reviews', protect, async (req, res) => {
  try {
    const { rating, comment, sessionType } = req.body;
    const mentorUserId = req.params.mentorUserId;
    const reviewerId   = req.user._id || req.user.id;

    if (String(reviewerId) === String(mentorUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself.' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const review = await MentorReview.findOneAndUpdate(
      { mentor: mentorUserId, reviewer: reviewerId },
      { rating, comment: comment?.trim() || '', sessionType: sessionType || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await review.populate('reviewer', 'name username profileImage role');

    // Recalculate and persist the mentor's rating average BEFORE responding
    // so the next GET /mentors fetch sees the updated values immediately
    const agg = await MentorReview.aggregate([
      { $match: { mentor: review.mentor } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const newAvg   = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    const newCount = agg[0] ? agg[0].count : 0;
    await Profile.findOneAndUpdate(
      { user: mentorUserId },
      { mentorRatingAvg: newAvg, mentorRatingCount: newCount }
    );

    res.status(201).json({ success: true, data: review, mentorRatingAvg: newAvg, mentorRatingCount: newCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/mentors/:mentorUserId/reviews — delete own review
router.delete('/:mentorUserId/reviews', protect, async (req, res) => {
  try {
    const deleted = await MentorReview.findOneAndDelete({
      mentor:   req.params.mentorUserId,
      reviewer: req.user._id || req.user.id,
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
