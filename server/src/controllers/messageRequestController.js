const mongoose         = require('mongoose');
const MessageRequest   = require('../models/MessageRequest');
const Conversation     = require('../models/Conversation');
const Notification     = require('../models/Notification');
const User             = require('../models/User');

/* ─────────────────────────────────────────────────────────────
   POST /api/message-requests
   Send a message request to another user
───────────────────────────────────────────────────────────── */
const sendRequest = async (req, res, next) => {
  try {
    const senderId    = req.user._id;
    const { recipientId, message = '' } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'recipientId is required' });
    }

    if (String(senderId) === String(recipientId)) {
      return res.status(400).json({ success: false, message: 'Cannot send a request to yourself' });
    }

    const recipient = await User.findById(recipientId).select('_id name isMinor isEmailVerified').lean();
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ── Minor Protection: unverified adults cannot initiate contact with minors ──
    if (recipient.isMinor && !req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'You must verify your email before messaging users under 18. Please verify your email in Settings.',
        code: 'MINOR_PROTECTION',
      });
    }

    // Check if an accepted conversation already exists
    const existingConv = await Conversation.findOne({
      members: { $all: [senderId, recipientId] },
      status:  'active',
    }).lean();
    if (existingConv) {
      return res.status(200).json({
        success: true,
        alreadyConnected: true,
        data: existingConv,
        message: 'Already connected — you can chat directly.',
      });
    }

    // Upsert the request (reset if previously declined so they can re-apply)
    let msgRequest = await MessageRequest.findOne({ sender: senderId, recipient: recipientId });
    if (msgRequest) {
      if (msgRequest.status === 'pending') {
        return res.status(409).json({ success: false, message: 'Request already sent and pending.' });
      }
      if (msgRequest.status === 'accepted') {
        return res.status(409).json({ success: false, message: 'Request already accepted. You can chat directly.' });
      }
      // declined — allow re-send by resetting
      msgRequest.status  = 'pending';
      msgRequest.message = message;
      await msgRequest.save();
    } else {
      msgRequest = await MessageRequest.create({ sender: senderId, recipient: recipientId, message });
    }

    // Notify the recipient (include requestId so the notifications page can show Accept/Decline)
    await Notification.create({
      recipient: recipientId,
      sender:    senderId,
      type:      'message_request',
      title:     `${req.user.name} wants to message you`,
      message:   message || `${req.user.name} sent you a message request.`,
      link:      `/messages?tab=requests`,
      data:      { requestId: String(msgRequest._id) },
    });

    return res.status(201).json({ success: true, message: 'Request sent.' });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/message-requests
   Get all pending incoming requests for current user
───────────────────────────────────────────────────────────── */
const getRequests = async (req, res, next) => {
  try {
    const requests = await MessageRequest.find({
      recipient: req.user._id,
      status:    'pending',
    })
      .populate('sender', 'name username role profileImage')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/message-requests/sent
   Get sent requests for current user (so UI can show "Pending" state)
───────────────────────────────────────────────────────────── */
const getSentRequests = async (req, res, next) => {
  try {
    const requests = await MessageRequest.find({ sender: req.user._id })
      .select('recipient status createdAt')
      .lean();

    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/message-requests/:requestId/accept
   Accept a message request — creates/activates a Conversation
───────────────────────────────────────────────────────────── */
const acceptRequest = async (req, res, next) => {
  try {
    const request = await MessageRequest.findById(req.params.requestId)
      .populate('sender', 'name username role profileImage');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (String(request.recipient) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    // Mark accepted
    request.status = 'accepted';
    await request.save();

    // Create or activate the conversation
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

    // Notify the original sender
    await Notification.create({
      recipient: request.sender._id,
      sender:    req.user._id,
      type:      'message_request_accepted',
      title:     `${req.user.name} accepted your message request`,
      message:   `You can now chat with ${req.user.name}.`,
      link:      `/messages?conv=${conversation._id}`,
    });

    const populated = await Conversation.findById(conversation._id)
      .populate('members', 'name username role profileImage');

    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/message-requests/:requestId/decline
   Decline a message request
───────────────────────────────────────────────────────────── */
const declineRequest = async (req, res, next) => {
  try {
    const request = await MessageRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (String(request.recipient) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = 'declined';
    await request.save();

    return res.status(200).json({ success: true, message: 'Request declined.' });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/message-requests/status/:userId
   Check the request status between current user and another user
───────────────────────────────────────────────────────────── */
const getStatus = async (req, res, next) => {
  try {
    const myId    = req.user._id;
    const otherId = req.params.userId;

    // Check if they already have an active conversation
    const conv = await Conversation.findOne({
      members: { $all: [myId, otherId] },
      status:  'active',
    }).lean();
    if (conv) return res.status(200).json({ success: true, data: { status: 'connected', conversationId: conv._id } });

    // Check outgoing request
    const sent = await MessageRequest.findOne({ sender: myId, recipient: otherId }).lean();
    if (sent) return res.status(200).json({ success: true, data: { status: sent.status, direction: 'sent' } });

    // Check incoming request
    const received = await MessageRequest.findOne({ sender: otherId, recipient: myId }).lean();
    if (received) return res.status(200).json({ success: true, data: { status: received.status, direction: 'received', requestId: received._id } });

    return res.status(200).json({ success: true, data: { status: 'none' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendRequest, getRequests, getSentRequests, acceptRequest, declineRequest, getStatus };
