const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    follower:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// sparse:true means documents missing follower/following (old schema) are ignored
// by the unique index, so stale old-format docs don't block new inserts
followSchema.index({ follower: 1, following: 1 }, { unique: true, sparse: true });
// Fast "who follows userId?" lookups
followSchema.index({ following: 1 });

module.exports = mongoose.model('Follow', followSchema);
