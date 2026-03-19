const Application = require('../models/Application');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../utils/emailService');
const { logActivity } = require('./activityController');

// @desc    Apply to a project
// @route   POST /api/apply
// @access  Private
const applyToProject = async (req, res, next) => {
  try {
    const { projectId, roleApplyingFor, message } = req.body;

    const project = await Project.findById(projectId).populate('createdBy', 'email name');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Project is not accepting applications' });
    }

    if (project.createdBy._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot apply to your own project' });
    }

    const existing = await Application.findOne({ project: projectId, applicant: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied to this project' });
    }

    const application = await Application.create({
      project: projectId,
      applicant: req.user._id,
      roleApplyingFor,
      message,
    });

    await application.populate('applicant', 'name username role profileImage');
    await application.populate('project', 'title');

    // Create notification for project owner
    const applicant = await User.findById(req.user._id);
    await Notification.create({
      recipient: project.createdBy._id,
      sender: req.user._id,
      type: 'application_received',
      title: 'New Application',
      message: `${applicant.name} applied to join "${project.title}"`,
      link: `/projects/${project._id}/applications`,
    });

    // Send email to project owner (fire-and-forget — don't block response)
    emailService.sendApplicationReceived(
      project.createdBy.email,
      project.createdBy.name,
      applicant.name,
      project.title,
      project._id
    ).catch(() => {});

    res.status(201).json({ success: true, message: 'Application submitted', data: application });
  } catch (error) {
    next(error);
  }
};

// @desc    Get applications for a project (owner only)
// @route   GET /api/applications/:projectId
// @access  Private
const getProjectApplications = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const applications = await Application.find({ project: req.params.projectId })
      .populate('applicant', 'name username role profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status (accept/reject)
// @route   PUT /api/application/status
// @access  Private (project owner)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId, status, reviewNote } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await Application.findById(applicationId)
      .populate('project', 'title createdBy')
      .populate('applicant', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    application.status = status;
    application.reviewNote = reviewNote || '';
    application.reviewedAt = Date.now();
    await application.save();

    // Add to team if accepted
    if (status === 'accepted') {
      const project = await Project.findById(application.project._id);
      const alreadyMember = project.teamMembers.some(
        (m) => m.user.toString() === application.applicant._id.toString()
      );
      if (!alreadyMember) {
        project.teamMembers.push({
          user: application.applicant._id,
          role: application.roleApplyingFor,
        });
        await project.save();
      }

      // Create notification for applicant
      await Notification.create({
        recipient: application.applicant._id,
        sender: req.user._id,
        type: 'application_accepted',
        title: 'Application Accepted',
        message: `Your application for "${application.project.title}" was accepted! You're on the team.`,
        link: `/projects/${application.project._id}`,
      });

      // Send email to applicant (fire-and-forget)
      emailService.sendApplicationAccepted(
        application.applicant.email,
        application.applicant.name,
        application.project.title,
        application.project._id
      ).catch(() => {});

      // Log activity for the applicant joining the project
      logActivity({
        actor:      application.applicant._id,
        type:       'project_joined',
        title:      `joined the project "${application.project.title}" as ${application.roleApplyingFor}`,
        link:       `/projects/${application.project._id}`,
        projectRef: application.project._id,
      });
    } else if (status === 'rejected') {
      // Create notification for applicant (include reviewNote if provided)
      const declineMsg = reviewNote?.trim()
        ? `Your application for "${application.project.title}" was not selected this time. Note from the creator: "${reviewNote.trim()}"`
        : `Your application for "${application.project.title}" was not selected this time.`;
      await Notification.create({
        recipient: application.applicant._id,
        sender: req.user._id,
        type: 'application_declined',
        title: 'Application Update',
        message: declineMsg,
        link: `/projects/${application.project._id}`,
      });

      // Send email to applicant (fire-and-forget)
      emailService.sendApplicationDeclined(
        application.applicant.email,
        application.applicant.name,
        application.project.title
      ).catch(() => {});
    }

    res.status(200).json({ success: true, message: `Application ${status}`, data: application });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my applications
// @route   GET /api/applications/my
// @access  Private
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('project', 'title projectType status timelineStage createdBy')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

module.exports = { applyToProject, getProjectApplications, updateApplicationStatus, getMyApplications };
