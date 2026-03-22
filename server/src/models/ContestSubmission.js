const mongoose = require('mongoose');

const contestSubmissionSchema = new mongoose.Schema(
  {
    contest: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Contest',
      required: true,
      index:    true,
    },
    submittedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    // The project on CREWUP that was used to form this team
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Project',
    },
    title: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 150,
    },
    youtubeLink: {
      type:     String,
      required: true,
      trim:     true,
    },
    videoId:   { type: String, default: '' },
    thumbnail: { type: String, default: '' },

    // Custom message from the filmmaker (shown on the submission card)
    caption: { type: String, default: '', maxlength: 300, trim: true },

    // ── Moderation ────────────────────────────────────────────────────────────
    // pending_check  → just submitted, auto-check running
    // auto_rejected  → failed auto-check (missing crewupfilms / @username in description)
    // pending_review → passed auto-check, waiting for admin decision
    // approved       → admin approved — visible publicly
    // rejected       → admin rejected — user can resubmit
    reviewStatus: {
      type:    String,
      enum:    ['pending_check', 'auto_rejected', 'pending_review', 'approved', 'rejected'],
      default: 'pending_check',
      index:   true,
    },

    // Auto-check results (populated after YouTube description fetch)
    autoCheck: {
      ran:                { type: Boolean, default: false },
      passed:             { type: Boolean, default: false },
      hasCrewupMention:   { type: Boolean, default: false },
      hasUsernameMention: { type: Boolean, default: false },
      fetchedDescription: { type: String,  default: '' },
      checkedAt:          { type: Date },
    },

    // Admin review
    adminNote:   { type: String, default: '' },   // rejection reason or approval note
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt:  { type: Date },

    // How many times the user has resubmitted after rejection
    resubmitCount: { type: Number, default: 0 },

    // Legacy likes (kept for backward compat)
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Votes — separate from likes, used for contest ranking
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// One submission per user per contest (query index only)
contestSubmissionSchema.index({ contest: 1, submittedBy: 1 });

// One submission per project (team) per contest — blocks all team members from re-submitting
contestSubmissionSchema.index({ contest: 1, project: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('ContestSubmission', contestSubmissionSchema);
