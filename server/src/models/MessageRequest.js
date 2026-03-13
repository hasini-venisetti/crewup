const mongoose = require('mongoose');

/**
 * MessageRequest — tracks a pending request to start a 1:1 chat.
 * Sender requests; recipient accepts or declines.
 * Once accepted, a Conversation is created (or unlocked).
 */
const messageRequestSchema = new mongoose.Schema(
  {
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message:   { type: String, default: '', maxlength: 300 }, // optional intro message
    status: {
      type:    String,
      enum:    ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// One pending/accepted request per pair — prevent duplicate requests
messageRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });
messageRequestSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model('MessageRequest', messageRequestSchema);
