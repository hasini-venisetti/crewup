const https                = require('https');
const { validationResult } = require('express-validator');
const User                 = require('../models/User');
const Profile              = require('../models/Profile');
const generateToken        = require('../utils/generateToken');

/* ── helpers ──────────────────────────────────────────────────────────── */
function userPayload(user) {
  return {
    id:           user._id,
    uid:          user.uid,
    name:         user.name,
    username:     user.username,
    email:        user.email,
    role:         user.role,
    profileImage: user.profileImage,
    isAdmin:      user.isAdmin      || false,
    isSuspended:  user.isSuspended  || false,
    authProvider: user.authProvider || 'local',
  };
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

    const { name, username, email, password, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(409).json({ success: false, message: `${field} already in use` });
    }

    const user = await User.create({ name, username, email, password, role });
    await Profile.create({ user: user._id });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'Account created successfully', token, user: userPayload(user) });
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
        name:         name || email.split('@')[0],
        username:     username.toLowerCase(),
        email,
        googleId,
        authProvider: 'google',
        profileImage: picture || '',
        role:         role || 'other',
        location:     location || {},
        skills:       skills || [],
      });
      await Profile.create({ user: user._id });
    }

    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: 'Google sign-in successful', token, user: userPayload(user) });
  } catch (error) { next(error); }
};

/* ── GET /api/auth/me ─────────────────────────────────────────────────── */
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: userPayload(req.user) });
};

module.exports = { register, login, googleAuth, getMe };
