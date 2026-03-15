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
