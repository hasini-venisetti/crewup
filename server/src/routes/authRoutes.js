const express = require('express');
const { body } = require('express-validator');
const { register, login, googleAuth, getMe, updateMe, sendEmailVerificationOTP, verifyEmail, sendPhoneOTP, verifyPhone } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('username')
      .trim().notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// Google OAuth — body: { idToken, username? }
router.post('/google', googleAuth);

router.get('/me', protect, getMe);
router.put('/update-me', protect, updateMe);

// ── Phase 1: Email OTP Verification ──────────────────────────────────────────
// Send / resend OTP to authenticated user's email
router.post('/send-email-otp', protect, sendEmailVerificationOTP);
// Verify the 6-digit code
router.post('/verify-email', protect, [
  body('code').notEmpty().withMessage('Verification code is required'),
], verifyEmail);

// ── Phone OTP Verification ────────────────────────────────────────────────────
router.post('/send-phone-otp', protect, [
  body('phone').notEmpty().withMessage('Phone number is required'),
], sendPhoneOTP);
router.post('/verify-phone', protect, [
  body('code').notEmpty().withMessage('Verification code is required'),
], verifyPhone);

module.exports = router;
