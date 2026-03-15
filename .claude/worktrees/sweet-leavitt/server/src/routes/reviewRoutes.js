const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
const Project = require('../models/Project');

// POST /api/reviews — create a review
router.post('/', protect, async (req, res) => {
  try {
    const { revieweeId, projectId, rating, comment, categories } = req.body;
    if (!revieweeId || !projectId || !rating) {
      return res.status(400).json({ success: false, message: 'revieweeId, projectId and rating are required' });
    }
    // Check they were both on the project
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const isOwner = project.createdBy.toString() === req.user.id;
    const isMember = project.teamMembers?.some(m => m.user?.toString() === req.user.id);
    if (!isOwner && !isMember) {
      return res.status(403).json({ success: false, message: 'You must be part of this project to leave a review' });
    }
    const existing = await Review.findOne({ reviewer: req.user.id, reviewee: revieweeId, project: projectId });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this person for this project' });

    const review = await Review.create({
      reviewer: req.user.id,
      reviewee: revieweeId,
      project: projectId,
      rating,
      comment: comment || '',
      categories: categories || {},
    });
    await review.populate('reviewer', 'name username profileImage');
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'You already reviewed this person for this project' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/project/:projectId/mine — IDs of users I've reviewed for this project
router.get('/project/:projectId/mine', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id, project: req.params.projectId }).select('reviewee');
    res.json({ success: true, data: reviews.map((r) => r.reviewee.toString()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/:userId — get all reviews for a user
router.get('/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name username profileImage')
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ success: true, data: reviews, averageRating: avg, total: reviews.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
