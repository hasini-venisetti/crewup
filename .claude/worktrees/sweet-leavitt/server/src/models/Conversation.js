const mongoose = require('mongoose');

/**
 * Conversation — 1:1 private chat thread between two users.
 * A unique compound index on members ensures one conversation per pair.
 */
const conversationSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
        required: true,
      },
    ],
    lastMessage: {
      type:    String,
      default: '',
    },
    lastMessageAt: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique pair — prevents duplicate conversations between the same two users
conversationSchema.index({ members: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
