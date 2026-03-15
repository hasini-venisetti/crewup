const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roleApplyingFor: {
      type: String,
      required: [true, 'Role is required'],
    },
    message: {
      type: String,
      required: [true, 'Application message is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNote: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One application per user per project
applicationSchema.index({ project: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
