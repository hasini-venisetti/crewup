const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Contest title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    rules: {
      type: [String],
      default: [],
    },
    prizeAmount: {
      type: Number,
      default: 0,
    },
    prizeDescription: {
      type: String,
      default: '',
      maxlength: 300,
    },
    submissionDeadline: {
      type: Date,
      required: true,
    },
    theme: {
      type: String,
      default: 'Open Theme',
      maxlength: 200,
    },
    maxDuration: {
      type: String,
      default: 'Up to 20 minutes',
    },
    allowedLanguages: {
      type: String,
      default: 'Any',
    },
    // Only projects (teams) created ON OR AFTER this date are eligible to submit.
    // Leave null to allow all projects regardless of age.
    teamFormedAfter: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'ended'],
      default: 'open',
    },
    winners: [
      {
        user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        placement: { type: Number },   // 1st, 2nd, 3rd …
        note:      { type: String, default: '' },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contest', contestSchema);
