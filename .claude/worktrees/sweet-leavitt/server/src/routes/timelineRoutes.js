const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');

// Update timeline stage — only project owner or team members
router.patch('/:id/timeline', protect, async (req, res, next) => {
  try {
    const { stage } = req.body;
    const validStages = ['planning', 'pre-production', 'production', 'post-production', 'released'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isOwner = project.createdBy.toString() === req.user._id.toString();
    const isMember = project.teamMembers.some((m) => m.user?.toString() === req.user._id.toString());

    if (!isOwner && !isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    project.timelineStage = stage;
    await project.save();

    res.status(200).json({ success: true, message: 'Timeline updated', data: project });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
