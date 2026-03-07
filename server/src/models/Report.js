const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['film', 'user'], default: 'film' },
    targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    reason:     {
      type: String,
      enum: ['spam', 'inappropriate', 'copyright', 'misinformation', 'other'],
      required: true,
    },
    details:    { type: String, maxlength: 500 },
    status:     { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' },
  },
  { timestamps: true }
);

// One report per user per target
reportSchema.index({ reporter: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
