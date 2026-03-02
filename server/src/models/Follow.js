const mongoose = require('mongoose');

// Simple one-way follow — no approval needed.
// follower  → the user who clicked Follow
// following → the user being followed
const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 }); // fast "who follows me" lookups

module.exports = mongoose.model('Follow', followSchema);
