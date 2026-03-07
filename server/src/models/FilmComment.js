const mongoose = require('mongoose');

const filmCommentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContestSubmission',
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FilmComment', filmCommentSchema);
