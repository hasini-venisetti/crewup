const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const ScheduleEvent = require('../models/ScheduleEvent');
const Project = require('../models/Project');

async function checkAccess(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404).json({ success: false, message: 'Project not found' }); return null; }
  const isOwner = project.createdBy.toString() === req.user.id;
  const isMember = project.teamMembers?.some(m => m.user?.toString() === req.user.id);
  if (!isOwner && !isMember) { res.status(403).json({ success: false, message: 'Not a team member' }); return null; }
  return { project, isOwner };
}

// GET /api/projects/:id/schedule
router.get('/', protect, async (req, res) => {
  try {
    const access = await checkAccess(req, res);
    if (!access) return;
    const events = await ScheduleEvent.find({ project: req.params.id })
      .populate('createdBy', 'name username')
      .sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/projects/:id/schedule
router.post('/', protect, async (req, res) => {
  try {
    const access = await checkAccess(req, res);
    if (!access) return;
    const { title, date, startTime, endTime, location, notes } = req.body;
    if (!title || !date) return res.status(400).json({ success: false, message: 'title and date are required' });
    const event = await ScheduleEvent.create({
      project: req.params.id, title, date, startTime, endTime, location, notes, createdBy: req.user.id,
    });
    await event.populate('createdBy', 'name username');
    res.status(201).json({ success: true, data: event });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/projects/:id/schedule/:eid
router.patch('/:eid', protect, async (req, res) => {
  try {
    const access = await checkAccess(req, res);
    if (!access) return;
    const event = await ScheduleEvent.findOneAndUpdate(
      { _id: req.params.eid, project: req.params.id },
      { $set: req.body },
      { new: true }
    ).populate('createdBy', 'name username');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/projects/:id/schedule/:eid
router.delete('/:eid', protect, async (req, res) => {
  try {
    const access = await checkAccess(req, res);
    if (!access) return;
    if (!access.isOwner) return res.status(403).json({ success: false, message: 'Only the owner can delete events' });
    await ScheduleEvent.findOneAndDelete({ _id: req.params.eid, project: req.params.id });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
