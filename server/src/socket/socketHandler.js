const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ProjectChat  = require('../models/ProjectChat');

/**
 * socketHandler — attaches all Socket.io event handlers to the server.
 *
 * Architecture:
 *   - Every connected socket joins a personal room named after the user's ID.
 *   - When a message is sent, the server persists it to MongoDB then
 *     emits it to all sockets in the recipient's personal room.
 *   - Project chats use a room named `project:<projectChatId>`.
 *
 * Events emitted by CLIENT:
 *   authenticate       { token }
 *   sendMessage        { conversationId, text }
 *   sendProjectMessage { projectChatId, text }
 *   joinProjectRoom    { projectChatId }
 *   typing             { conversationId }
 *   stopTyping         { conversationId }
 *
 * Events emitted by SERVER:
 *   authenticated      { userId }
 *   authError          { message }
 *   newMessage         { message }
 *   newProjectMessage  { message }
 *   userTyping         { conversationId, userId, name }
 *   userStoppedTyping  { conversationId, userId }
 *   error              { message }
 */
const socketHandler = (io) => {
  // ── Auth middleware for socket connections ──────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Every user gets their own personal room for private messages
    socket.join(`user:${userId}`);
    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // ── Send private message ──────────────────────────────────────────────
    socket.on('sendMessage', async ({ conversationId, text }) => {
      try {
        if (!text?.trim()) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.members.includes(socket.user._id)) {
          return socket.emit('error', { message: 'Not authorized for this conversation' });
        }

        // Persist message
        const message = await Message.create({
          sender:         socket.user._id,
          conversationId,
          text:           text.trim(),
        });
        await message.populate('sender', 'name username profileImage');

        // Update conversation preview
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage:   text.trim(),
          lastMessageAt: new Date(),
        });

        // Emit to all members of the conversation
        conversation.members.forEach((memberId) => {
          io.to(`user:${memberId.toString()}`).emit('newMessage', {
            ...message.toObject(),
            conversationId,
          });
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Join project chat room ─────────────────────────────────────────────
    socket.on('joinProjectRoom', async ({ projectChatId }) => {
      try {
        const chat = await ProjectChat.findById(projectChatId);
        if (!chat) return socket.emit('error', { message: 'Chat not found' });

        const isMember = chat.members.some((m) => m.toString() === userId);
        if (!isMember) return socket.emit('error', { message: 'Not a member of this chat' });

        socket.join(`project:${projectChatId}`);
        console.log(`   └─ ${socket.user.username} joined project room ${projectChatId}`);
      } catch {
        socket.emit('error', { message: 'Failed to join project room' });
      }
    });

    // ── Send project group message ─────────────────────────────────────────
    socket.on('sendProjectMessage', async ({ projectChatId, text }) => {
      try {
        if (!text?.trim()) return;

        const chat = await ProjectChat.findById(projectChatId);
        if (!chat) return socket.emit('error', { message: 'Chat not found' });

        const isMember = chat.members.some((m) => m.toString() === userId);
        if (!isMember) return socket.emit('error', { message: 'Not authorized' });

        const message = await Message.create({
          sender:        socket.user._id,
          projectChatId,
          text:          text.trim(),
        });
        await message.populate('sender', 'name username profileImage');

        // Broadcast to everyone in the project room
        io.to(`project:${projectChatId}`).emit('newProjectMessage', message.toObject());
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Typing indicators ──────────────────────────────────────────────────
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('userTyping', {
        conversationId,
        userId,
        name: socket.user.name,
      });
    });

    socket.on('stopTyping', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('userStoppedTyping', {
        conversationId,
        userId,
      });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.username} (${socket.id})`);
    });
  });
};

module.exports = socketHandler;
