const Conversation     = require('../models/Conversation');
const Message          = require('../models/Message');
const ProjectChat      = require('../models/ProjectChat');
const Project          = require('../models/Project');
const MessageRequest   = require('../models/MessageRequest');
const User             = require('../models/User');

// ── Phase 3: Messaging Safety ──────────────────────────────────────────────────
// Patterns to detect: phone numbers, email addresses, external contact info
const CONTACT_INFO_PATTERN = /(\+?\d[\d\s\-().]{7,}\d|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

// Patterns to detect payment/scam requests
const SCAM_KEYWORDS = [
  /pay\s*(?:me|us|upfront|first|now|deposit)/i,
  /send\s*(?:me|us)?\s*(?:money|cash|payment|transfer)/i,
  /(?:western\s*union|moneygram|wire\s*transfer|bitcoin|crypto)/i,
  /registration\s*fee/i,
  /audition\s*fee/i,
  /casting\s*fee/i,
  /advance\s*payment/i,
  /upfront\s*(?:fee|payment|cost)/i,
  /pay\s*(?:to|for)\s*(?:join|apply|audition)/i,
];

function filterContactInfo(text) {
  // Replace phone/email with a notice — store original text is still saved for dispute resolution
  return text.replace(CONTACT_INFO_PATTERN, '[contact info removed]');
}

function detectScamKeywords(text) {
  return SCAM_KEYWORDS.some((pattern) => pattern.test(text));
}

function hasContactInfo(text) {
  return CONTACT_INFO_PATTERN.test(text);
}

/* ─────────────────────────────────────────────────────────────────────────
   PRIVATE (1:1) CONVERSATIONS
   ───────────────────────────────────────────────────────────────────────── */

// @desc    Get all conversations for the logged-in user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user._id] },
    })
      .populate('members', 'name username role profileImage')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

// @desc    Start or return existing conversation with another user
// @route   POST /api/conversations
// @access  Private
const startConversation = async (req, res, next) => {
  try {
    // Accept either field name — client code sends 'userId' in some places
    const recipientId = req.body.recipientId || req.body.userId;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'recipientId (or userId) is required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself' });
    }

    // Check for an existing active conversation first
    let conversation = await Conversation.findOne({
      members: { $all: [req.user._id, recipientId] },
      status: 'active',
    }).populate('members', 'name username role profileImage');

    if (conversation) {
      return res.status(200).json({ success: true, data: conversation });
    }

    // Require an accepted message request before creating a new conversation
    const accepted = await MessageRequest.findOne({
      $or: [
        { sender: req.user._id, recipient: recipientId, status: 'accepted' },
        { sender: recipientId, recipient: req.user._id, status: 'accepted' },
      ],
    }).lean();

    if (!accepted) {
      return res.status(403).json({
        success: false,
        message: 'Send a message request first. You can chat once they accept.',
      });
    }

    // Create the conversation
    conversation = await Conversation.create({
      members: [req.user._id, recipientId],
      status: 'active',
    });
    conversation = await Conversation.findById(conversation._id)
      .populate('members', 'name username role profileImage');

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   MESSAGES
   ───────────────────────────────────────────────────────────────────────── */

// @desc    Get messages for a private conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Ensure the requesting user is a member
    if (!conversation.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'name username profileImage')
      .sort({ createdAt: 1 })
      .limit(200);                     // max 200 messages fetched at once

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a private conversation (REST fallback)
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, text } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // ── Minor Protection: if any other member is a minor, sender must be verified ──
    const otherMemberIds = conversation.members
      .map(String)
      .filter((id) => id !== String(req.user._id));

    if (otherMemberIds.length > 0 && !req.user.isEmailVerified) {
      const minorInConv = await User.exists({
        _id: { $in: otherMemberIds },
        isMinor: true,
      });
      if (minorInConv) {
        return res.status(403).json({
          success: false,
          message: 'You must verify your email before sending messages to users under 18.',
          code: 'MINOR_PROTECTION',
        });
      }
    }

    // Phase 3: Safety checks
    const isScam = detectScamKeywords(text);
    const hasContact = hasContactInfo(text);
    // Filter contact info from the stored text
    const safeText = filterContactInfo(text);

    const message = await Message.create({
      sender:         req.user._id,
      conversationId,
      text:           safeText,
      // Store flags for dispute resolution (not shown to users)
      isFlagged:      isScam,
      containsContactInfo: hasContact,
    });

    await message.populate('sender', 'name username profileImage');

    // Update conversation preview
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage:   safeText.slice(0, 100),
      lastMessageAt: new Date(),
    });

    // Return the message + a warning flag if scam keywords detected
    res.status(201).json({
      success: true,
      data: message,
      warning: isScam
        ? 'This message was flagged as potentially suspicious. Legitimate productions never ask you to send money.'
        : hasContact
        ? 'Contact information has been removed from this message. Keep all communication within CREWUPFILMS.'
        : null,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   PROJECT GROUP CHAT
   ───────────────────────────────────────────────────────────────────────── */

// @desc    Get or create project group chat (called after first member accepted)
// @route   GET /api/project-chat/:projectId
// @access  Private (project members only)
const getProjectChat = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Must be project owner or accepted team member
    const isMember  = project.teamMembers.some((m) => m.user.toString() === req.user._id.toString());
    const isOwner   = project.createdBy.toString() === req.user._id.toString();

    if (!isMember && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not a project member' });
    }

    let chat = await ProjectChat.findOne({ project: req.params.projectId })
      .populate('members',   'name username role profileImage')
      .populate('createdBy', 'name username');

    if (!chat) {
      // Auto-create the room with the owner + all team members
      const memberIds = [
        project.createdBy,
        ...project.teamMembers.map((m) => m.user),
      ];
      chat = await ProjectChat.create({
        project:   project._id,
        members:   [...new Set(memberIds.map(String))],
        createdBy: project.createdBy,
      });
      chat = await ProjectChat.findById(chat._id)
        .populate('members',   'name username role profileImage')
        .populate('createdBy', 'name username');
    }

    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a project group chat
// @route   GET /api/project-chat/:projectId/messages
// @access  Private (project members only)
const getProjectChatMessages = async (req, res, next) => {
  try {
    const chat = await ProjectChat.findOne({ project: req.params.projectId });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (!chat.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ projectChatId: chat._id })
      .populate('sender', 'name username profileImage')
      .sort({ createdAt: 1 })
      .limit(200);

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  getProjectChat,
  getProjectChatMessages,
};
