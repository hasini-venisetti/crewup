const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const ProjectChat  = require('../models/ProjectChat');
const Project      = require('../models/Project');

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

    // Return existing conversation if one already exists between the two users
    let conversation = await Conversation.findOne({
      members: { $all: [req.user._id, recipientId] },
    }).populate('members', 'name username role profileImage');

    if (!conversation) {
      conversation = await Conversation.create({
        members: [req.user._id, recipientId],
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('members', 'name username role profileImage');
    }

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

    const message = await Message.create({
      sender:         req.user._id,
      conversationId,
      text,
    });

    await message.populate('sender', 'name username profileImage');

    // Update conversation preview
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage:   text,
      lastMessageAt: new Date(),
    });

    res.status(201).json({ success: true, data: message });
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
