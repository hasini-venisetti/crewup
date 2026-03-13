const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get profile by user ID
// @route   GET /api/profile/:id
// @access  Public
const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.params.id }).populate(
      'user',
      'name username role profileImage createdAt'
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Update own profile
// @route   PUT /api/profile/update
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const {
      bio, skills, location, portfolioLinks, experienceLevel, availability, socialLinks,
      isMentor, mentorFields, mentorBio, mentorRate, mentorCurrency, availabilitySlots,
    } = req.body;

    const updateData = {
      bio, skills, location, portfolioLinks, experienceLevel, availability, socialLinks,
    };

    // Only include mentor fields if they are explicitly sent
    if (typeof isMentor === 'boolean')     updateData.isMentor        = isMentor;
    if (mentorFields   !== undefined)      updateData.mentorFields    = mentorFields;
    if (mentorBio      !== undefined)      updateData.mentorBio       = mentorBio;
    if (mentorRate     !== undefined)      updateData.mentorRate      = mentorRate !== null && mentorRate !== '' ? Number(mentorRate) : null;
    if (mentorCurrency !== undefined)      updateData.mentorCurrency  = mentorCurrency || 'INR';
    if (availabilitySlots !== undefined)   updateData.availabilitySlots = availabilitySlots;

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name username role profileImage');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Also update role/name on User if provided
    if (req.body.role || req.body.name) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.role && { role: req.body.role }),
      });
    }

    res.status(200).json({ success: true, message: 'Profile updated', data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Get own profile
// @route   GET /api/profile/me
// @access  Private
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      'name username role profileImage email createdAt'
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Add portfolio item
// @route   POST /api/profile/portfolio
// @access  Private
const addPortfolioItem = async (req, res, next) => {
  try {
    const { title, description, type, link, tags } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $push: { portfolio: { title, description, type, link, tags } } },
      { new: true, runValidators: true }
    ).populate('user', 'name username role profileImage');

    res.status(201).json({ success: true, message: 'Portfolio item added', data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete portfolio item
// @route   DELETE /api/profile/portfolio/:itemId
// @access  Private
const deletePortfolioItem = async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { portfolio: { _id: req.params.itemId } } },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Portfolio item removed', data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload / update profile picture (base64)
// @route   PATCH /api/profile/picture
// @access  Private
const updateProfilePicture = async (req, res, next) => {
  try {
    const { imageData } = req.body; // base64 data-URL string from the client

    if (!imageData) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    // Basic validation — must be a data URL
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Invalid image format' });
    }

    // Limit size to ~2 MB (base64 overhead ≈ 33 %, so raw bytes ~ 1.5 MB)
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB as base64 string length
    if (imageData.length > MAX_SIZE) {
      return res.status(400).json({ success: false, message: 'Image too large. Max 1.5 MB.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageData },
      { new: true }
    ).select('-password');

    res.status(200).json({ success: true, message: 'Profile picture updated', data: { profileImage: user.profileImage } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getMyProfile, addPortfolioItem, deletePortfolioItem, updateProfilePicture };
