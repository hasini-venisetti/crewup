const Project = require('../models/Project');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const { getRecommendedProjects } = require('../services/recommendationService');
const emailService = require('../utils/emailService');

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { title, description, projectType, requiredRoles, isPaid, budget, location, deadline } =
      req.body;

    const project = await Project.create({
      title,
      description,
      projectType,
      requiredRoles,
      isPaid,
      budget,
      location,
      deadline,
      createdBy: req.user._id,
    });

    await project.populate('createdBy', 'name username role profileImage');

    res.status(201).json({ success: true, message: 'Project created', data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects (with filters)
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res, next) => {
  try {
    const { projectType, role, location, isPaid, isRemote, status = 'open', page = 1, limit = 12 } = req.query;

    const filter = { status };
    if (projectType) filter.projectType = projectType;
    if (role) filter.requiredRoles = { $in: [role] };
    if (location) filter['location.country'] = new RegExp(location, 'i');
    if (isRemote === 'true') filter['location.isRemote'] = true;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    // Only show projects that still have at least one open role
    // (teamMembers count < requiredRoles count)
    filter.$expr = { $lt: [{ $size: '$teamMembers' }, { $size: '$requiredRoles' }] };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('createdBy', 'name username role profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name username role profileImage')
      .populate('teamMembers.user', 'name username role profileImage');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (owner only)
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name username role profileImage');

    res.status(200).json({ success: true, message: 'Project updated', data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (owner only)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Application.deleteMany({ project: req.params.id });

    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get own projects
// @route   GET /api/projects/my
// @access  Private
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommended projects for logged-in user (weighted scoring)
// @route   GET /api/projects/recommended
// @access  Private
//
// Delegates to recommendationService which scores projects across four signals:
//   role match (+40) · skill overlap (+30) · location similarity (+20) · experience proximity (+10)
const getRecommended = async (req, res, next) => {
  try {
    const projects = await getRecommendedProjects(req.user._id);
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a specific required role as filled on a project
// @route   PATCH /api/projects/:id/roles/fill
// @access  Private (project owner only)
const fillRole = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('teamMembers.user', 'email name');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { role, note = '' } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    const roleExists = project.requiredRoles.includes(role);
    if (!roleExists) {
      return res.status(400).json({ success: false, message: 'Role does not exist in required roles' });
    }

    const alreadyFilled = project.filledRoles.some((f) => f.role === role);
    if (alreadyFilled) {
      return res.status(400).json({ success: false, message: 'This role is already marked as filled' });
    }

    project.filledRoles.push({ role, note });
    const updated = await project.save();

    // Create notifications for all team members and project owner
    const notificationRecipients = new Set();
    notificationRecipients.add(project.createdBy.toString());
    project.teamMembers.forEach((member) => {
      notificationRecipients.add(member.user._id.toString());
    });

    for (const recipientId of notificationRecipients) {
      if (recipientId !== project.createdBy.toString() || recipientId === project.createdBy.toString()) {
        await Notification.create({
          recipient: recipientId,
          sender: req.user._id,
          type: 'role_filled',
          title: 'Role Filled',
          message: `The ${role} role has been filled on "${project.title}".`,
          link: `/projects/${project._id}`,
        });
      }
    }

    // Send emails to team members
    for (const member of project.teamMembers) {
      if (member.user && member.user.email) {
        await emailService.sendRoleFilled(
          member.user.email,
          member.user.name,
          project.title,
          role,
          note,
          project._id
        );
      }
    }

    await updated.populate('createdBy', 'name username role profileImage');

    res.status(200).json({ success: true, message: 'Role marked as filled', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getMyProjects,
  getRecommended,
  fillRole,
};
