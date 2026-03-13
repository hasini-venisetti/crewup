const express = require('express');
const { getProfile, updateProfile, getMyProfile, addPortfolioItem, deletePortfolioItem, updateProfilePicture } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.get('/:id', getProfile);
router.put('/update', protect, updateProfile);
router.patch('/picture', protect, updateProfilePicture);
router.post('/portfolio', protect, addPortfolioItem);
router.delete('/portfolio/:itemId', protect, deletePortfolioItem);

module.exports = router;
