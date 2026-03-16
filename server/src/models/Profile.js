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
      city: { type: String, default: '' },
      country: { type: String, default: '' },
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
    isMentor:        { type: Boolean, default: false },
    mentorStatus:    { type: String, enum: ['open', 'paused', 'closed'], default: 'open' }, // mentor availability
    mentorFields:    { type: [String], default: [] },
    mentorBio:       { type: String, default: '', maxlength: 500 },
    mentorRate:      { type: Number, default: null },      // hourly rate
    mentorCurrency:  { type: String, default: 'INR' },     // currency code
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
        title:       { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        type:        { type: String, enum: ['video', 'image', 'audio', 'link', 'other'], default: 'other' },
        link:        { type: String, default: '' },
        tags:        { type: [String], default: [] },
        createdAt:   { type: Date, default: Date.now },
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
