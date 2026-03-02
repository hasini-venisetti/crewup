const express  = require('express');
const router   = express.Router({ mergeParams: true });
const Project  = require('../models/Project');
const { protect } = require('../middleware/auth');

async function getProjectAccess(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isOwner  = project.createdBy.toString() === userId.toString();
  const isMember = project.teamMembers.some((m) => m.user?.toString() === userId.toString());
  return { project, canAccess: isOwner || isMember, isOwner };
}

// GET /api/projects/:id/files
router.get('/', protect, async (req, res, next) => {
  try {
    const result = await getProjectAccess(req.params.id, req.user._id);
    if (!result) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!result.canAccess) return res.status(403).json({ success: false, message: 'Not authorized' });

    const project = await Project.findById(req.params.id)
      .populate('teamFiles.uploadedBy', 'name username');
    res.status(200).json({ success: true, data: project.teamFiles || [] });
  } catch (error) { next(error); }
});

// POST /api/projects/:id/files
router.post('/', protect, async (req, res, next) => {
  try {
    const result = await getProjectAccess(req.params.id, req.user._id);
    if (!result) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!result.canAccess) return res.status(403).json({ success: false, message: 'Not authorized' });

    const { name, url, type, description } = req.body;
    if (!name?.trim() || !url?.trim()) {
      return res.status(400).json({ success: false, message: 'Name and URL are required' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $push: { teamFiles: { name: name.trim(), url: url.trim(), type: type || 'link', description: description || '', uploadedBy: req.user._id } } },
      { new: true }
    ).populate('teamFiles.uploadedBy', 'name username');

    const added = project.teamFiles[project.teamFiles.length - 1];
    res.status(201).json({ success: true, data: added });
  } catch (error) { next(error); }
});

// DELETE /api/projects/:id/files/:fileId
router.delete('/:fileId', protect, async (req, res, next) => {
  try {
    const result = await getProjectAccess(req.params.id, req.user._id);
    if (!result) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!result.canAccess) return res.status(403).json({ success: false, message: 'Not authorized' });

    await Project.findByIdAndUpdate(req.params.id,
      { $pull: { teamFiles: { _id: req.params.fileId } } });
    res.status(200).json({ success: true, message: 'File removed' });
  } catch (error) { next(error); }
});

module.exports = router;
