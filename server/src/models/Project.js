const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    projectType: {
      type: String,
      required: true,
      enum: [
        'short-film',
        'feature-film',
        'youtube',
        'music-video',
        'podcast',
        'web-series',
        'documentary',
        'commercial',
        'photography',
        'music',
        'other',
      ],
    },
    requiredRoles: {
      type: [String],
      required: [true, 'At least one required role is needed'],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one role must be specified',
      },
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    budget: {
      type: String,
      default: '',
    },
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
      isRemote: { type: Boolean, default: false },
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    filledRoles: [
      {
        role:     { type: String, required: true },
        filledAt: { type: Date, default: Date.now },
        note:     { type: String, default: '' },
      },
    ],
    experienceLevel: {
      type: String,
      enum: ['any', 'beginner', 'intermediate', 'advanced'],
      default: 'any',
    },
    projectTags: {
      type: [String],
      enum: ['learning-project', 'practice-collaboration', 'portfolio-building', 'mentorship-available', 'paid-opportunity'],
      default: [],
    },
    timelineStage: {
      type: String,
      enum: ['planning', 'pre-production', 'production', 'post-production', 'released'],
      default: 'planning',
    },
    teamFiles: [
      {
        name:        { type: String, required: true },
        url:         { type: String, required: true },
        type:        { type: String, enum: ['link', 'google-drive', 'dropbox', 'notion', 'figma', 'image', 'video', 'doc', 'other'], default: 'link' },
        description: { type: String, default: '' },
        uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt:   { type: Date, default: Date.now },
      },
    ],
    waitlist: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, default: '' },
      joinedAt: { type: Date, default: Date.now },
    }],
    // Set by the owner when the project is released — surfaces the film on all team members' profiles
    youtubeLink: { type: String, default: '' },
    // For web-series projects: multiple episode links
    episodeLinks: [
      {
        title: { type: String, default: '' },
        url:   { type: String, required: true },
      },
    ],
    // Film engagement
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Phase 2: Casting Call Safety ─────────────────────────────────────
    productionType: {
      type:    String,
      enum:    ['student', 'indie', 'commercial', 'broadcast', 'other'],
      default: 'indie',
    },
    auditionFormat: {
      type:    String,
      enum:    ['online', 'studio', 'production-office', 'flexible', 'not-applicable'],
      default: 'not-applicable',
    },
    // Shooting location type — hard validation: 'private-residence' is blocked on the client
    shootingLocationType: {
      type:    String,
      enum:    ['studio', 'public-location', 'remote', 'flexible', 'not-specified'],
      default: 'not-specified',
    },
    // Per-role requirements written by the creator
    // e.g. { Actor: "Female, age 20–30, Tamil speaking", Cinematographer: "Night shoot exp." }
    roleDescriptions: {
      type: Map,
      of: String,
      default: {},
    },
    // How many people needed per role, e.g. { Actor: 3, Cinematographer: 1 }
    rolePositions: {
      type: Map,
      of: Number,
      default: {},
    },
    // Clear compensation statement (required when isPaid = true)
    compensationDetails: {
      type:      String,
      default:   '',
      maxlength: [300, 'Compensation details cannot exceed 300 characters'],
    },
    // Moderation queue — new projects start as 'pending' and must be approved
    moderationStatus: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderationNote:  { type: String, default: '' },
    autoSuspended:   { type: Boolean, default: false },

    // Fraud detection — populated automatically on creation
    riskScore: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    riskFlags: [{ type: String }],

    // ── Phase 4: Audit trail for project edits ────────────────────────────
    editHistory: [
      {
        editedAt:  { type: Date, default: Date.now },
        editedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        summary:   { type: String, default: '' }, // e.g. "Updated compensation, location"
      },
    ],
  },
  { timestamps: true }
);

// Index for search/filter
projectSchema.index({ status: 1, projectType: 1, createdAt: -1 });
projectSchema.index({ 'location.country': 1 });

module.exports = mongoose.model('Project', projectSchema);
