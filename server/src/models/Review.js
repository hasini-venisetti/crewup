const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project:  { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, default: '', maxlength: 1000, trim: true },
  categories: {
    professionalism: { type: Number, min: 1, max: 5, default: null },
    skill:           { type: Number, min: 1, max: 5, default: null },
    communication:   { type: Number, min: 1, max: 5, default: null },
  },
}, { timestamps: true });

reviewSchema.index({ reviewer: 1, reviewee: 1, project: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1 });

module.exports = mongoose.model('Review', reviewSchema);
