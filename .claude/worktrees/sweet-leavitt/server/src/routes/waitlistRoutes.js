const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');

// POST /api/projects/:id/waitlist — join waitlist for a role
router.post('/', protect, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'role is required' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!project.waitlist) project.waitlist = [];
    const already = project.waitlist.some(w => w.user?.toString() === req.user.id && w.role === role);
    if (already) return res.status(400).json({ success: false, message: 'Already on waitlist for this role' });
    project.waitlist.push({ user: req.user.id, role });
    await project.save();
    res.json({ success: true, message: 'Added to waitlist' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/projects/:id/waitlist — leave waitlist
router.delete('/', protect, async (req, res) => {
  try {
    const { role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.waitlist = (project.waitlist || []).filter(
      w => !(w.user?.toString() === req.user.id && w.role === role)
    );
    await project.save();
    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/projects/:id/waitlist — view waitlist (owner only)
router.get('/', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('waitlist.user', 'name username profileImage');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Owner only' });
    }
    res.json({ success: true, data: project.waitlist || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
