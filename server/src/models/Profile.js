const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 20,
        message: 'Cannot have more than 20 skills',
      },
    },
    location: {
      city:     { type: String, default: '' },
      district: { type: String, default: '' },
      state:    { type: String, default: '' },
      country:  { type: String, default: '' },
    },
    locationVisible: { type: Boolean, default: true }, // controls visibility on the Creator Map
    portfolioLinks: [
      {
        label: { type: String, default: '' },
        url: { type: String, default: '' },
      },
    ],
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'professional'],
      default: 'beginner',
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'open-to-offers'],
      default: 'available',
    },
    isMentor:           { type: Boolean, default: false },
    mentorStatus:       { type: String, enum: ['open', 'paused', 'closed'], default: 'open' },
    mentorFields:       { type: [String], default: [] },
    mentorBio:          { type: String, default: '', maxlength: 500 },
    mentorRate:         { type: Number, default: null },
    mentorCurrency:     { type: String, default: 'INR' },
    mentorExperience:   { type: Number, default: null },   // years of experience
    mentorSessionTypes: { type: [String], default: [] },   // e.g. ['1:1 Video Call', 'Portfolio Review']
    mentorLocationType: { type: String, enum: ['online', 'offline', 'both'], default: 'online' },
    mentorLanguages:    { type: [String], default: [] },   // e.g. ['Telugu', 'Hindi', 'English']
    // Ratings (auto-updated when reviews are submitted)
    mentorRatingAvg:    { type: Number, default: 0 },
    mentorRatingCount:  { type: Number, default: 0 },
    // Booking system
    mentorTimezone:        { type: String, default: 'Asia/Kolkata' },
    mentorSessionDuration: { type: Number, default: 60 },  // minutes: 30, 60, 90
    mentorWeeklySchedule:  [{
      day:       { type: Number, min: 0, max: 6 }, // 0=Sun … 6=Sat
      startTime: { type: String, default: '09:00' },
      endTime:   { type: String, default: '17:00' },
    }],
    // Date range within which mentees can book (YYYY-MM-DD strings)
    mentorBookingDateFrom: { type: String, default: '' },
    mentorBookingDateTo:   { type: String, default: '' },
    // Specific dates the mentor wants to skip/block (YYYY-MM-DD strings)
    mentorBlockedDates:    { type: [String], default: [] },
    socialLinks: {
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      vimeo: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    availabilitySlots: [
      {
        startDate: { type: Date, required: true },
        endDate:   { type: Date, required: true },
        note:      { type: String, default: '', maxlength: 100 },
      },
    ],
    portfolio: [
      {
        title:        { type: String, required: true, trim: true },
        description:  { type: String, default: '' },
        type:         { type: String, enum: ['video', 'image', 'audio', 'link', 'certificate', 'other'], default: 'other' },
        link:         { type: String, default: '' },
        tags:         { type: [String], default: [] },
        // Certificate-specific fields
        issuer:             { type: String, default: '' },   // e.g. "Coursera", "Adobe", "FTII"
        issueDate:          { type: String, default: '' },   // YYYY-MM-DD
        expiryDate:         { type: String, default: '' },   // YYYY-MM-DD (optional)
        credentialId:       { type: String, default: '' },   // optional unique ID
        certificateFileUrl: { type: String, default: '' },   // base64 data-URL of uploaded cert file
        createdAt:          { type: Date, default: Date.now },
      },
    ],

    // ── Phase 4: Verified Creator Badge ──────────────────────────────────
    isVerified: { type: Boolean, default: false },
    verificationLinks: {
      imdb:      { type: String, default: '' },
      instagram: { type: String, default: '' },
    },

    // ── Phase 4: Completed project count (updated when project is released) ──
    completedProjectsCount: { type: Number, default: 0 },

    // ── Phase 5: Emergency Contact ────────────────────────────────────────
    emergencyContact: {
      name:         { type: String, default: '' },
      phone:        { type: String, default: '' },
      relationship: { type: String, default: '' },
    },

    // ── Phase 5: Safe Check-In ────────────────────────────────────────────
    // Stores current/last check-in for meeting safety
    safeCheckIn: {
      active:       { type: Boolean, default: false },
      meetingWith:  { type: String, default: '' },
      location:     { type: String, default: '' },
      scheduledAt:  { type: Date,   default: null },
      checkInAt:    { type: Date,   default: null },
      checkOutAt:   { type: Date,   default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
