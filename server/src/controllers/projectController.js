const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const { getRecommendedProjects } = require('../services/recommendationService');
const emailService = require('../utils/emailService');
const { logActivity } = require('./activityController');

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const {
      title, description, projectType, requiredRoles, isPaid, budget, location, deadline,
      experienceLevel, projectTags,
      // Phase 2: new safety fields
      productionType, auditionFormat, shootingLocationType, compensationDetails,
    } = req.body;

    // Safety guard: compensationDetails required when isPaid
    if (isPaid && !compensationDetails?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please describe the compensation clearly (required for paid projects).',
      });
    }

    const project = await Project.create({
      title,
      description,
      projectType,
      requiredRoles,
      isPaid,
      budget,
      location,
      deadline,
      experienceLevel,
      projectTags,
      productionType:       productionType       || 'indie',
      auditionFormat:       auditionFormat       || 'not-applicable',
      shootingLocationType: shootingLocationType || 'not-specified',
      compensationDetails:  compensationDetails  || '',
      moderationStatus:     'pending',   // all new projects start in the moderation queue
      createdBy:            req.user._id,
    });

    await project.populate('createdBy', 'name username role profileImage');

    // Notify the creator that their project is pending review
    await Notification.create({
      recipient: req.user._id,
      type:      'platform_update',
      title:     'Project submitted for review',
      message:   `Your project "${project.title}" has been submitted and is pending moderation. It will be live shortly after review.`,
      link:      `/projects/${project._id}`,
    });

    // Log activity (fire-and-forget)
    logActivity({
      actor:      req.user._id,
      type:       'project_created',
      title:      `submitted a new project: "${project.title}"`,
      link:       `/projects/${project._id}`,
      projectRef: project._id,
    });

    res.status(201).json({
      success: true,
      message: 'Project submitted for review. It will be live once approved by our team.',
      data: project,
    });
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
    // Phase 2: Only show approved projects in public listing
    filter.moderationStatus = 'approved';

    // Hide released projects — they belong on the Films page, not Projects
    filter.timelineStage = { $ne: 'released' };

    // Hide full teams — only show projects that still have at least one open role
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

    // Phase 4: Build a summary of what changed for the audit trail
    const TRACKED = ['title', 'description', 'location', 'isPaid', 'compensationDetails', 'deadline', 'auditionFormat', 'shootingLocationType'];
    const changedFields = TRACKED.filter((f) => {
      if (req.body[f] === undefined) return false;
      return JSON.stringify(project[f]) !== JSON.stringify(req.body[f]);
    });
    const changeSummary = changedFields.length
      ? changedFields.map((f) => f.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')
      : '';

    // Don't allow owner to change moderationStatus — admin only
    const { moderationStatus: _ms, ...safeBody } = req.body;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      {
        ...safeBody,
        ...(changeSummary && {
          $push: {
            editHistory: {
              editedAt: new Date(),
              editedBy: req.user._id,
              summary:  changeSummary,
            },
          },
        }),
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name username role profileImage');

    // Phase 4: Notify all accepted applicants that the project was updated
    if (changeSummary) {
      try {
        const acceptedApps = await Application.find({
          project: project._id,
          status: { $in: ['accepted', 'pending'] },
        }).populate('applicant', 'name email');

        for (const app of acceptedApps) {
          if (app.applicant._id.toString() === req.user._id.toString()) continue;
          // In-app notification
          Notification.create({
            recipient: app.applicant._id,
            sender:    req.user._id,
            type:      'platform_update',
            title:     'Project updated',
            message:   `"${project.title}" was updated. Changes: ${changeSummary}.`,
            link:      `/projects/${project._id}`,
          }).catch(() => {});
          // Email (fire-and-forget)
          if (app.applicant.email) {
            emailService.sendProjectEditedNotice(
              app.applicant.email,
              app.applicant.name,
              project.title,
              changeSummary,
              project._id
            ).catch(() => {});
          }
        }
      } catch (_) {}
    }

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
      if (recipientId !== req.user._id.toString()) {
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

// ── YouTube link helpers ───────────────────────────────────────────────────
function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// @desc    Set YouTube link (or episode links for web-series) for a released project
// @route   PATCH /api/projects/:id/youtube-link
// @access  Private (project owner only)
const setYoutubeLink = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { youtubeLink, episodeLinks } = req.body;

    // Web-series: accept array of episode links
    if (project.projectType === 'web-series' && episodeLinks) {
      if (!Array.isArray(episodeLinks) || episodeLinks.length === 0) {
        return res.status(400).json({ success: false, message: 'episodeLinks must be a non-empty array' });
      }
      // Validate all URLs
      for (const ep of episodeLinks) {
        if (!ep.url) return res.status(400).json({ success: false, message: 'Each episode must have a url' });
        const id = extractYoutubeId(ep.url);
        if (!id) return res.status(400).json({ success: false, message: `Invalid YouTube URL: ${ep.url}` });
      }
      project.episodeLinks = episodeLinks;
      // Use first episode as the main youtubeLink so it shows up in films lists
      project.youtubeLink = episodeLinks[0].url;
      project.status = 'completed';
      await project.save();
      return res.status(200).json({ success: true, message: 'Episode links saved', data: { episodeLinks, youtubeLink: episodeLinks[0].url } });
    }

    // All other types: single YouTube link
    if (!youtubeLink) return res.status(400).json({ success: false, message: 'youtubeLink is required' });
    const videoId = extractYoutubeId(youtubeLink);
    if (!videoId) return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });

    project.youtubeLink = youtubeLink;
    project.status      = 'completed';
    await project.save();

    // Log activity
    logActivity({
      actor:      req.user._id,
      type:       'film_uploaded',
      title:      `uploaded a film: "${project.title}"`,
      link:       `/films`,
      projectRef: project._id,
    });

    res.status(200).json({ success: true, message: 'YouTube link saved', data: { youtubeLink, videoId } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all released films platform-wide (have a youtubeLink)
// @route   GET /api/projects/films
// @access  Public
const getAllFilms = async (req, res, next) => {
  try {
    const { genre, page = 1, limit = 24 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { youtubeLink: { $ne: '' } };
    if (genre) filter.projectType = genre;

    const films = await Project.find(filter)
      .select('title youtubeLink episodeLinks projectType createdBy teamMembers createdAt')
      .populate('createdBy', 'name username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const annotated = films.map((film) => {
      const videoId   = extractYoutubeId(film.youtubeLink);
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : null;
      return {
        _id:          film._id,
        title:        film.title,
        youtubeLink:  film.youtubeLink,
        episodeLinks: film.episodeLinks || [],
        projectType:  film.projectType,
        videoId,
        thumbnail,
        director:  film.createdBy,
        teamSize:  (film.teamMembers?.length || 0) + 1,
        createdAt: film.createdAt,
      };
    });

    const total = await Project.countDocuments(filter);

    res.status(200).json({
      success: true,
      data:    annotated,
      total,
      page:    Number(page),
      pages:   Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all released films for a specific user (as owner or team member)
// @route   GET /api/projects/films/:userId
// @access  Public
const getUserFilms = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const mongoose   = require('mongoose');
    const uid        = new mongoose.Types.ObjectId(userId);

    // Released projects where user is owner OR a team member, AND has a youtubeLink
    const films = await Project.find({
      youtubeLink:  { $ne: '' },
      $or: [
        { createdBy: uid },
        { 'teamMembers.user': uid },
      ],
    })
      .select('title youtubeLink episodeLinks projectType createdBy teamMembers status createdAt')
      .populate('createdBy', 'name username')
      .lean();

    // Annotate each film with the user's role in that project
    const annotated = films.map((film) => {
      const isOwner = film.createdBy?._id?.toString() === userId;
      let userRole  = isOwner ? 'Director' : null;
      if (!userRole) {
        const member = film.teamMembers?.find(
          (m) => (m.user?._id || m.user)?.toString() === userId
        );
        userRole = member?.role || 'Team Member';
      }

      const videoId   = extractYoutubeId(film.youtubeLink);
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : null;

      return {
        _id:          film._id,
        title:        film.title,
        youtubeLink:  film.youtubeLink,
        episodeLinks: film.episodeLinks || [],
        projectType:  film.projectType,
        videoId,
        thumbnail,
        userRole,
        createdAt:    film.createdAt,
      };
    });

    // Newest first
    annotated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, data: annotated });
  } catch (error) {
    next(error);
  }
};

// @desc    Owner removes a team member (opens that role back up)
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (project owner only)
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can remove members' });
    }

    const member = project.teamMembers.find(
      (m) => m.user.toString() === req.params.userId
    );
    if (!member) return res.status(404).json({ success: false, message: 'Member not found in project' });

    const roleToReopen = member.role;

    // Remove from teamMembers and filledRoles so the role is open again
    await Project.findByIdAndUpdate(project._id, {
      $pull: {
        teamMembers: { user: member.user },
        filledRoles: { role: roleToReopen },
      },
    });

    // Notify the removed member
    await Notification.create({
      recipient: member.user,
      sender:    req.user._id,
      type:      'general',
      title:     'Removed from project',
      message:   `You have been removed from "${project.title}".`,
      link:      `/projects/${project._id}`,
    });

    res.status(200).json({ success: true, message: 'Member removed and role is open again' });
  } catch (error) {
    next(error);
  }
};

// @desc    Team member leaves the project themselves (opens that role back up)
// @route   DELETE /api/projects/:id/leave
// @access  Private (team member only)
const leaveProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Project owner cannot leave — delete the project instead' });
    }

    const member = project.teamMembers.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!member) return res.status(404).json({ success: false, message: 'You are not a member of this project' });

    const roleToReopen = member.role;

    // Remove from teamMembers and filledRoles so the role is open again
    await Project.findByIdAndUpdate(project._id, {
      $pull: {
        teamMembers: { user: req.user._id },
        filledRoles: { role: roleToReopen },
      },
    });

    // Notify the project owner
    await Notification.create({
      recipient: project.createdBy,
      sender:    req.user._id,
      type:      'general',
      title:     'Team member left',
      message:   `A team member left "${project.title}" — the ${roleToReopen} role is open again.`,
      link:      `/projects/${project._id}`,
    });

    res.status(200).json({ success: true, message: 'You have left the project. The role is now open again.' });
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
  setYoutubeLink,
  getAllFilms,
  getUserFilms,
  removeMember,
  leaveProject,
};
