const mongoose = require('mongoose');

/**
 * Message — a single chat message.
 * Works for both 1:1 (conversationId set) and group (projectChatId set).
 */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Conversation',
      default: null,
    },
    projectChatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'ProjectChat',
      default: null,
    },
    text: {
      type:      String,
      required:  [true, 'Message text is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      trim:      true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
  },
  { timestamps: true }
);

// Index for fast conversation message fetching
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ projectChatId:  1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
