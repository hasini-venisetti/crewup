const mongoose = require('mongoose');

const mentorReviewSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      maxlength: 500,
    },
    sessionType: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One review per reviewer per mentor
mentorReviewSchema.index({ mentor: 1, reviewer: 1 }, { unique: true });

// After save/delete: recalculate mentor's average rating on Profile
async function recalcRating(mentorId) {
  try {
    const Profile = require('./Profile');
    const agg = await MentorReview.aggregate([
      { $match: { mentor: mentorId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const avg   = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    const count = agg[0] ? agg[0].count : 0;
    await Profile.findOneAndUpdate(
      { user: mentorId },
      { mentorRatingAvg: avg, mentorRatingCount: count }
    );
  } catch (_) {}
}

mentorReviewSchema.post('save', function () { recalcRating(this.mentor); });
mentorReviewSchema.post('findOneAndDelete', function (doc) { if (doc) recalcRating(doc.mentor); });

const MentorReview = mongoose.model('MentorReview', mentorReviewSchema);
module.exports = MentorReview;
