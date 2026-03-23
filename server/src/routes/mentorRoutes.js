const express        = require('express');
const router         = express.Router();
const { protect }    = require('../middleware/auth');
const Profile        = require('../models/Profile');
const Notification   = require('../models/Notification');
const MessageRequest = require('../models/MessageRequest');
const Conversation   = require('../models/Conversation');
const User           = require('../models/User');
const MentorReview   = require('../models/MentorReview');
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
    const {
      isMentor, mentorStatus, mentorFields, mentorBio, mentorRate, mentorCurrency,
      mentorExperience, mentorSessionTypes, mentorLocationType, mentorLanguages,
    } = req.body;
    const updateFields = {
      isMentor:            typeof isMentor === 'boolean' ? isMentor : undefined,
      mentorStatus:        mentorStatus        !== undefined ? mentorStatus        : undefined,
      mentorFields:        mentorFields        !== undefined ? mentorFields        : undefined,
      mentorBio:           mentorBio           !== undefined ? mentorBio           : undefined,
      mentorRate:          mentorRate          !== undefined ? (mentorRate !== null && mentorRate !== '' ? Number(mentorRate) : null) : undefined,
      mentorCurrency:      mentorCurrency      !== undefined ? (mentorCurrency || 'INR') : undefined,
      mentorExperience:    mentorExperience    !== undefined ? (mentorExperience !== '' ? Number(mentorExperience) : null) : undefined,
      mentorSessionTypes:  mentorSessionTypes  !== undefined ? mentorSessionTypes  : undefined,
      mentorLocationType:  mentorLocationType  !== undefined ? mentorLocationType  : undefined,
      mentorLanguages:     mentorLanguages     !== undefined ? mentorLanguages     : undefined,
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
      ).catch(() => {});
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
      ).catch(() => {});
    }

    return res.status(200).json({ success: true, data: populated });
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

    res.status(201).json({ success: true, data: review });
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
