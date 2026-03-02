const express  = require('express');
const router   = express.Router({ mergeParams: true }); // inherit :id from parent
const Task     = require('../models/Task');
const Project  = require('../models/Project');
const { protect } = require('../middleware/auth');

// Helper: check if user is owner or team member
async function getProjectAccess(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isOwner  = project.createdBy.toString() === userId.toString();
  const isMember = project.teamMembers.some((m) => m.user?.toString() === userId.toString());
  return { project, canAccess: isOwner || isMember, isOwner };
}

// GET /api/projects/:id/tasks
router.get('/', protect, async (req, res, next) => {
  try {
    const { project, canAccess } = await getProjectAccess(req.params.id, req.user._id) || {};
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!canAccess) return res.status(403).json({ success: false, message: 'Not authorized' });

    const tasks = await Task.find({ project: req.params.id })
      .populate('assignee', 'name username profileImage')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) { next(error); }
});

// POST /api/projects/:id/tasks
router.post('/', protect, async (req, res, next) => {
  try {
    const { project, canAccess } = await getProjectAccess(req.params.id, req.user._id) || {};
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!canAccess) return res.status(403).json({ success: false, message: 'Not authorized' });

    const { title, description, assignee, status, priority, dueDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' });

    const task = await Task.create({
      project: req.params.id,
      title:   title.trim(),
      description, assignee: assignee || null,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    await task.populate('assignee', 'name username profileImage');
    await task.populate('createdBy', 'name username');

    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
});

// PATCH /api/projects/:id/tasks/:taskId
router.patch('/:taskId', protect, async (req, res, next) => {
  try {
    const { project, canAccess } = await getProjectAccess(req.params.id, req.user._id) || {};
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!canAccess) return res.status(403).json({ success: false, message: 'Not authorized' });

    const { title, description, assignee, status, priority, dueDate } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, project: req.params.id },
      { ...(title && { title }), ...(description !== undefined && { description }),
        ...(assignee !== undefined && { assignee: assignee || null }),
        ...(status && { status }), ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate || null }) },
      { new: true }
    ).populate('assignee', 'name username profileImage').populate('createdBy', 'name username');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (error) { next(error); }
});

// DELETE /api/projects/:id/tasks/:taskId
router.delete('/:taskId', protect, async (req, res, next) => {
  try {
    const { project, canAccess } = await getProjectAccess(req.params.id, req.user._id) || {};
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!canAccess) return res.status(403).json({ success: false, message: 'Not authorized' });

    await Task.findOneAndDelete({ _id: req.params.taskId, project: req.params.id });
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
