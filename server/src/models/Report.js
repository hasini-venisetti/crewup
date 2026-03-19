const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['film', 'user', 'project', 'message'],
      default: 'user',
    },
    targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    reason:     {
      type: String,
      enum: [
        'scam',
        'harassment',
        'fake_project',
        'inappropriate_content',
        'minor_protection',
        'spam',
        'copyright',
        'misinformation',
        'other',
      ],
      required: true,
    },
    details:        { type: String, maxlength: 500 },
    // Snapshot of who the report is AGAINST — stored at submit time so it survives content deletion
    reportedUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    targetSnapshot: { type: String, default: '' }, // title/name of reported content at time of report
    status:         { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' },
    // Admin resolution
    resolvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt:     { type: Date, default: null },
    resolutionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

// Allow at most one report per user per target
reportSchema.index({ reporter: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
