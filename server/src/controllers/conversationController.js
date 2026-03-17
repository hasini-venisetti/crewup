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

    // ── Block check: if anyone in this conversation has blocked it, no messages allowed ──
    if (Array.isArray(conversation.blockedBy) && conversation.blockedBy.length > 0) {
      const myId = req.user._id.toString();
      const iBlockedThem = conversation.blockedBy.some((id) => id.toString() === myId);
      const theyBlockedMe = conversation.blockedBy.some((id) => id.toString() !== myId);

      if (iBlockedThem) {
        return res.status(403).json({ success: false, message: 'You have blocked this conversation. Unblock to send messages.', code: 'BLOCKED_BY_YOU' });
      }
      if (theyBlockedMe) {
        return res.status(403).json({ success: false, message: 'You cannot send messages to this person.', code: 'BLOCKED_BY_OTHER' });
      }
    }

    // ── Minor Protection: if any other member is a minor, sender must be verified ──
    const otherMemberIds = conversation.members
      .map(String)
      .filter((id) => id !== String(req.user._id));

    const otherMembers = otherMemberIds.length > 0
      ? await User.find({ _id: { $in: otherMemberIds } }).select('role isMinor')
      : [];

    if (!req.user.isEmailVerified && otherMembers.some((m) => m.isMinor)) {
      return res.status(403).json({
        success: false,
        message: 'You must verify your email before sending messages to users under 18.',
        code: 'MINOR_PROTECTION',
      });
    }

    // ── Role-aware contact info policy ──────────────────────────────────────
    // If an actor is involved (sender OR recipient), contact info is filtered
    // for their safety. For other roles, contact info passes through with a
    // caution notice so they can share files / work details freely.
    const isScam       = detectScamKeywords(text);
    const hasContact   = hasContactInfo(text);
    const senderIsActor    = req.user.role === 'actor';
    const recipientIsActor = otherMembers.some((m) => m.role === 'actor');
    const actorInvolved    = senderIsActor || recipientIsActor;

    // Strip contact info only when an actor is in the conversation
    const storedText = (hasContact && actorInvolved) ? filterContactInfo(text) : text;

    const message = await Message.create({
      sender:              req.user._id,
      conversationId,
      text:                storedText,
      isFlagged:           isScam,
      containsContactInfo: hasContact,
    });

    await message.populate('sender', 'name username profileImage');

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage:   storedText.slice(0, 100),
      lastMessageAt: new Date(),
    });

    // Build contextual warning
    let warning = null;
    if (isScam) {
      warning = 'This message was flagged as potentially suspicious. Legitimate productions never ask you to send money.';
    } else if (hasContact && actorInvolved) {
      warning = senderIsActor
        ? '🔒 For your safety, personal contact details were removed. Share your phone or email only after meeting in person.'
        : '🔒 Contact info was removed — the other person is an actor. Their safety policy keeps personal details off-platform until after a first meeting.';
    } else if (hasContact) {
      // Non-actor to non-actor — allowed, but show a caution nudge
      warning = '💡 Heads up: you shared contact info. Only exchange personal details with people you fully trust.';
    }

    res.status(201).json({
      success:             true,
      data:                message,
      warning,
      contactInfoBlocked:  hasContact && actorInvolved,
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
    } else {
      // Sync: add any project members who joined after the chat was created
      const projectMemberIds = [
        project.createdBy.toString(),
        ...project.teamMembers.map((m) => m.user.toString()),
      ];
      const chatMemberIds = chat.members.map((m) => (m._id || m).toString());
      const newMemberIds  = projectMemberIds.filter((id) => !chatMemberIds.includes(id));
      if (newMemberIds.length > 0) {
        chat = await ProjectChat.findByIdAndUpdate(
          chat._id,
          { $addToSet: { members: { $each: newMemberIds } } },
          { new: true }
        )
          .populate('members',   'name username role profileImage')
          .populate('createdBy', 'name username');
      }
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

/* ─────────────────────────────────────────────────────────────────────────
   BLOCK / UNBLOCK
   ───────────────────────────────────────────────────────────────────────── */

// @desc    Block a conversation (adds current user to blockedBy)
// @route   POST /api/conversations/:convId/block
// @access  Private
const blockConversation = async (req, res, next) => {
  try {
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const userId = req.user._id.toString();
    if (!conv.members.some((m) => m.toString() === userId)) {
      return res.status(403).json({ success: false, message: 'Not a member of this conversation' });
    }

    if (!conv.blockedBy.some((id) => id.toString() === userId)) {
      conv.blockedBy.push(req.user._id);
      await conv.save();
    }

    res.status(200).json({ success: true, message: 'Conversation blocked' });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock a conversation (removes current user from blockedBy)
// @route   DELETE /api/conversations/:convId/block
// @access  Private
const unblockConversation = async (req, res, next) => {
  try {
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const userId = req.user._id.toString();
    conv.blockedBy = conv.blockedBy.filter((id) => id.toString() !== userId);
    await conv.save();

    res.status(200).json({ success: true, message: 'Conversation unblocked' });
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
  blockConversation,
  unblockConversation,
};
