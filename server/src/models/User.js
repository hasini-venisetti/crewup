const mongoose = require('mongoose');
const bcrypt    = require('bcryptjs');
const crypto    = require('crypto');

const userSchema = new mongoose.Schema(
  {
    // Friendly public ID e.g. CUF-2026-A3F7B2
    uid: {
      type:   String,
      unique: true,
      index:  true,
    },
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
      trim:      true,
      lowercase: true,
      minlength: [3,  'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match:     [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    // Optional — Google-OAuth users have no password
    password: {
      type:      String,
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false,
    },
    // Google OAuth
    googleId: {
      type:   String,
      unique: true,
      sparse: true,   // allows multiple nulls
    },
    authProvider: {
      type:    String,
      enum:    ['local', 'google'],
      default: 'local',
    },
    role: {
      type:    String,
      default: 'other',
    },
    profileImage: { type: String, default: '' },
    isActive:     { type: Boolean, default: true },
    isSuspended:  { type: Boolean, default: false },
    isAdmin:      { type: Boolean, default: false },
    // Saved / bookmarked films (project refs with youtubeLink)
    bookmarks:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],

    // ── Phase 1: Account Safety ──────────────────────────────────────────
    gender: {
      type:    String,
      enum:    ['male', 'female', 'non-binary', 'prefer-not-to-say', ''],
      default: '',
    },
    dateOfBirth:     { type: Date, default: null },
    isMinor:         { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailOTP: {
      code:      { type: String, select: false },
      expiresAt: { type: Date,   select: false },
    },
    // Phone number + OTP (optional — for future SMS verification)
    phone: {
      number:     { type: String, default: '' },
      isVerified: { type: Boolean, default: false },
    },
    phoneOTP: {
      code:      { type: String, select: false },
      expiresAt: { type: Date,   select: false },
    },
    // Password reset
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpires: { type: Date,   select: false },
  },
  { timestamps: true }
);

// Auto-generate uid before first save
userSchema.pre('save', async function (next) {
  if (!this.uid) {
    const year = new Date().getFullYear();
    const hex  = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.uid   = `CUF-${year}-${hex}`;
  }
  if (this.isModified('password') && this.password) {
    const salt   = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
