const mongoose = require('mongoose');

const mentorBookingSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    sessionType:   { type: String, default: '' },      // "1:1 Video Call", etc.
    date:          { type: String, required: true },   // "YYYY-MM-DD" in mentor's timezone
    startTime:     { type: String, required: true },   // "HH:MM"
    endTime:       { type: String, required: true },   // "HH:MM"
    duration:      { type: Number, default: 60 },      // minutes
    timezone:      { type: String, default: 'Asia/Kolkata' }, // mentor's tz

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },

    notes:          { type: String, default: '', maxlength: 500 }, // from mentee
    meetingAddress: { type: String, default: '' },               // mentee's location for in-person sessions
    meetingLink:    { type: String, default: '' },               // filled by mentor on confirm (online sessions)
    cancelReason: { type: String, default: '' },
    cancelledBy:  { type: String, enum: ['mentor', 'mentee', ''], default: '' },

    // Per-booking negotiation chat (separate from regular DMs)
    chat: [{
      sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      text:      { type: String, required: true, maxlength: 1000 },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

// Prevent double-booking same slot (mentor + date + startTime must be unique for confirmed/pending)
mentorBookingSchema.index({ mentor: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('MentorBooking', mentorBookingSchema);
