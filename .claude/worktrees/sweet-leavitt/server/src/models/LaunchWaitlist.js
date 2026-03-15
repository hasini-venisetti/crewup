const mongoose = require('mongoose');

const launchWaitlistSchema = new mongoose.Schema(
  {
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:      { type: String, default: '', trim: true },
    notified:  { type: Boolean, default: false }, // set to true when launch email is sent
    source:    { type: String, default: 'waitlist-page' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LaunchWaitlist', launchWaitlistSchema);
