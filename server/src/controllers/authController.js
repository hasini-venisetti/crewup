const https                = require('https');
const crypto               = require('crypto');
const { validationResult } = require('express-validator');
const User                 = require('../models/User');
const Profile              = require('../models/Profile');
const generateToken        = require('../utils/generateToken');
const { sendEmailOTP }       = require('../utils/emailService');
const { sendPhoneOTPSMS }    = require('../utils/smsService');

/* ── helpers ──────────────────────────────────────────────────────────── */
function userPayload(user) {
  return {
    id:              user._id,
    uid:             user.uid,
    name:            user.name,
    username:        user.username,
    email:           user.email,
    role:            user.role,
    profileImage:    user.profileImage,
    isAdmin:         user.isAdmin         || false,
    isSuspended:     user.isSuspended     || false,
    authProvider:    user.authProvider    || 'local',
    isEmailVerified: user.isEmailVerified || false,
    isMinor:         user.isMinor         || false,
    phone:           user.phone           || { number: '', isVerified: false },
    hasDateOfBirth:  !!user.dateOfBirth,
  };
}

// Generate a 6-digit numeric OTP
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Compute isMinor from dateOfBirth
function computeIsMinor(dob) {
  if (!dob) return false;
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear()
    - (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);
  return age < 18;
}

// Verify Google id_token via Google's tokeninfo endpoint (no extra packages needed)
function verifyGoogleToken(idToken) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.error) return reject(new Error(data.error));
            resolve(data);
          } catch (e) { reject(e); }
        });
      }
    ).on('error', reject);
  });
}

/* ── POST /api/auth/register ──────────────────────────────────────────── */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { name, username, email, password, role, dateOfBirth } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(409).json({ success: false, message: `${field} already in use` });
    }

    const isMinor = computeIsMinor(dateOfBirth);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name, username, email, password, role,
      dateOfBirth: dateOfBirth || null,
      isMinor,
      isEmailVerified: false,
      emailOTP: { code: otp, expiresAt: otpExpiry },
    });
    await Profile.create({ user: user._id });

    // Send OTP email (fire-and-forget — don't block signup)
    sendEmailOTP(email, name, otp).catch(() => {});

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Email OTP for ${user.email}: ${otp}`);
    }
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      token,
      user: userPayload(user),
      requiresEmailVerification: true,
    });
  } catch (error) { next(error); }
};

/* ── POST /api/auth/send-email-otp ────────────────────────────────────── */
// Resend OTP to the authenticated user's email
const sendEmailVerificationOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+emailOTP.code +emailOTP.expiresAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

    // Rate-limit: don't resend if last OTP was sent < 60 seconds ago
    if (user.emailOTP?.expiresAt) {
      const remainingMs = user.emailOTP.expiresAt.getTime() - Date.now();
      if (remainingMs > 9 * 60 * 1000) { // less than 1 min old
        return res.status(429).json({ success: false, message: 'Please wait 60 seconds before requesting a new code.' });
      }
    }

    const otp = generateOTP();
    user.emailOTP = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save({ validateBeforeSave: false });

    await sendEmailOTP(user.email, user.name, otp);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Email OTP for ${user.email}: ${otp}`);
    }
    res.status(200).json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) { next(error); }
};

/* ── POST /api/auth/verify-email ───────────────────────────────────────── */
const verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Verification code is required' });

    const user = await User.findById(req.user._id).select('+emailOTP.code +emailOTP.expiresAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

    if (!user.emailOTP?.code || user.emailOTP.code !== String(code).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
    if (user.emailOTP.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    user.isEmailVerified = true;
    user.emailOTP = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: 'Email verified successfully', token, user: userPayload(user) });
  } catch (error) { next(error); }
};

/* ── POST /api/auth/login ─────────────────────────────────────────────── */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.authProvider === 'google')
      return res.status(400).json({ success: false, message: 'This account uses Google Sign-In. Please continue with Google.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: 'Login successful', token, user: userPayload(user) });
  } catch (error) { next(error); }
};

/* ── POST /api/auth/google ────────────────────────────────────────────── */
// Body: { idToken, username? }  — username only required for new accounts
const googleAuth = async (req, res, next) => {
  try {
    const { idToken, username, role, location, skills } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'idToken is required' });

    // Verify with Google
    let googleData;
    try { googleData = await verifyGoogleToken(idToken); }
    catch { return res.status(401).json({ success: false, message: 'Invalid Google token' }); }

    const { sub: googleId, email, name, picture } = googleData;
    if (!email) return res.status(400).json({ success: false, message: 'Could not retrieve email from Google' });

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link googleId if signing in via email-matching account
      if (!user.googleId) {
        user.googleId     = googleId;
        user.authProvider = 'google';
        if (picture && !user.profileImage) user.profileImage = picture;
        await user.save();
      }
    } else {
      // New user — username is required
      if (!username) {
        return res.status(200).json({
          success:       false,
          needsUsername: true,
          message:       'Please choose a username to complete sign-up',
          googleId, email, name, picture,
        });
      }

      // Check username availability
      const taken = await User.findOne({ username: username.toLowerCase() });
      if (taken) return res.status(409).json({ success: false, message: 'Username already taken' });

      user = await User.create({
        name:            name || email.split('@')[0],
        username:        username.toLowerCase(),
        email,
        googleId,
        authProvider:    'google',
        profileImage:    picture || '',
        role:            role || 'other',
        location:        location || {},
        skills:          skills || [],
        isEmailVerified: true, // Google already verified the email
      });
      await Profile.create({ user: user._id });
    }

    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: 'Google sign-in successful', token, user: userPayload(user) });
  } catch (error) { next(error); }
};

/* ── POST /api/auth/send-phone-otp ─────────────────────────────────────
   Body: { phone: "+919876543210" }
   Saves the number on the user, generates a 6-digit OTP, and in production
   you'd send it via SMS (Twilio / AWS SNS).  For now we log it and also
   return it in dev mode so the front-end can display it without an SMS service.
   ─────────────────────────────────────────────────────────────────────── */
const sendPhoneOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.trim().length < 7) {
      return res.status(400).json({ success: false, message: 'A valid phone number is required' });
    }

    const user = await User.findById(req.user._id).select('+phoneOTP.code +phoneOTP.expiresAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.phone?.isVerified) {
      return res.status(400).json({ success: false, message: 'Phone number already verified' });
    }

    // Rate-limit — don't resend if last OTP was sent < 60 seconds ago
    if (user.phoneOTP?.expiresAt) {
      const remainingMs = user.phoneOTP.expiresAt.getTime() - Date.now();
      if (remainingMs > 9 * 60 * 1000) {
        return res.status(429).json({ success: false, message: 'Please wait 60 seconds before requesting a new code.' });
      }
    }

    const otp = generateOTP();
    user.phone = { number: phone.trim(), isVerified: false };
    user.phoneOTP = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save({ validateBeforeSave: false });

    // ── SMS delivery ─────────────────────────────────────────────────────
    // Tries Fast2SMS → Twilio → MSG91 based on configured env vars.
    // Falls back to console.log if no provider is set (dev mode).
    try {
      await sendPhoneOTPSMS(phone.trim(), otp);
    } catch (smsErr) {
      console.error('[SMS ERROR]', smsErr.message);
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Phone OTP for ${phone}: ${otp}`);
    }

    res.status(200).json({ success: true, message: `Verification code sent to ${phone}` });
  } catch (error) { next(error); }
};

/* ── POST /api/auth/verify-phone ───────────────────────────────────────
   Body: { code: "123456" }
   ─────────────────────────────────────────────────────────────────────── */
const verifyPhone = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Verification code is required' });

    const user = await User.findById(req.user._id).select('+phoneOTP.code +phoneOTP.expiresAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.phone?.isVerified) {
      return res.status(400).json({ success: false, message: 'Phone already verified' });
    }

    if (!user.phoneOTP?.code || user.phoneOTP.code !== String(code).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
    if (user.phoneOTP.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    }

    user.phone.isVerified = true;
    user.phoneOTP = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: 'Phone number verified successfully', token, user: userPayload(user) });
  } catch (error) { next(error); }
};

/* ── GET /api/auth/me ─────────────────────────────────────────────────── */
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: userPayload(req.user) });
};

/* ── PUT /api/auth/update-me ──────────────────────────────────────────── */
// Update basic user fields: name, dateOfBirth
const updateMe = async (req, res, next) => {
  try {
    const { name, dateOfBirth } = req.body;
    const updates = {};

    if (name && name.trim()) updates.name = name.trim();
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date of birth' });
      }
      updates.dateOfBirth = dob;
      // Recalculate isMinor
      const ageDiff = Date.now() - dob.getTime();
      const ageDate = new Date(ageDiff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      updates.isMinor = age < 18;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: false }
    );

    res.status(200).json({ success: true, message: 'Profile updated', user: userPayload(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, googleAuth, getMe, updateMe, sendEmailVerificationOTP, verifyEmail, sendPhoneOTP, verifyPhone };
