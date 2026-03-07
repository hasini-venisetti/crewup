/**
 * crewMatchController.js
 *
 * Given a project ID, suggests the best-matching creators for each open role.
 *
 * Scoring (100 pts max per candidate):
 *   Role match    +40  — user's declared role maps to the required role
 *   Skill overlap +20  — profile skills overlap with role keywords
 *   Location      +20  — same country (+15) / same city (+20) / remote (+10)
 *   Reputation    +20  — derived from average review rating (0-5 → 0-20 pts)
 *
 * Returns up to MAX_PER_ROLE suggestions per open role, grouped by role.
 */

const Project  = require('../models/Project');
const User     = require('../models/User');
const Profile  = require('../models/Profile');
const Review   = require('../models/Review');

const MAX_PER_ROLE = 4;   // max suggestions shown per required role

// ── Role keyword map ────────────────────────────────────────────────────────
// Maps free-text role strings (from project.requiredRoles) to User.role values.
// A required role string is tested against each keyword list (case-insensitive).
const ROLE_KEYWORD_MAP = [
  {
    userRole: 'actor',
    keywords: ['actor', 'actress', 'cast', 'talent', 'performer', 'lead', 'supporting'],
  },
  {
    userRole: 'filmmaker',
    keywords: [
      'cinematograph', 'director of photo', 'dop', 'd.o.p', 'dp', 'camera',
      'director', 'filmmaker', 'shoot', 'videograph',
    ],
  },
  {
    userRole: 'editor',
    keywords: ['edit', 'colour', 'color', 'grade', 'grading', 'post-production', 'vfx', 'visual effect'],
  },
  {
    userRole: 'writer',
    keywords: ['writer', 'script', 'screenplay', 'story', 'author', 'scenarist'],
  },
  {
    userRole: 'musician',
    keywords: ['music', 'composer', 'sound', 'audio', 'score', 'soundtrack', 'mixing', 'mastering'],
  },
  {
    userRole: 'designer',
    keywords: ['design', 'art direct', 'production design', 'costume', 'wardrobe', 'graphic'],
  },
  {
    userRole: 'photographer',
    keywords: ['photo', 'still', 'bts', 'behind the scene'],
  },
  {
    userRole: 'content-creator',
    keywords: ['content', 'social', 'influencer', 'youtube', 'tiktok', 'host', 'presenter'],
  },
];

/**
 * Map a free-text required role string to a User.role enum value.
 * Returns null if no mapping found.
 */
function mapRoleToUserRole(requiredRole) {
  const lower = requiredRole.toLowerCase();
  for (const { userRole, keywords } of ROLE_KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return userRole;
  }
  return null;
}

/**
 * Skill overlap: check how many role keywords appear in user's skill list.
 * Returns 0-20 pts.
 */
function skillScore(userSkills, requiredRole) {
  if (!userSkills?.length) return 0;
  const lowerRole  = requiredRole.toLowerCase();
  const matched = userSkills.filter((s) =>
    lowerRole.includes(s.toLowerCase()) || s.toLowerCase().includes(lowerRole.split(' ')[0])
  ).length;
  return Math.min(20, matched * 7);
}

/**
 * Location score: 0 / 10 / 15 / 20 pts.
 */
function locationScore(userLoc, projectLoc) {
  if (!userLoc || !projectLoc) return 0;
  if (projectLoc.isRemote) return 10;
  const sameCountry =
    userLoc.country && projectLoc.country &&
    userLoc.country.toLowerCase() === projectLoc.country.toLowerCase();
  if (!sameCountry) return 0;
  const sameCity =
    userLoc.city && projectLoc.city &&
    userLoc.city.toLowerCase() === projectLoc.city.toLowerCase();
  return sameCity ? 20 : 15;
}

/**
 * Reputation score: average review rating (1-5) → 0-20 pts.
 * avgRating 5.0 → 20 pts, 4.0 → 16 pts, 0 (no reviews) → 8 pts (neutral).
 */
function reputationScore(avgRating, reviewCount) {
  if (reviewCount === 0) return 8; // neutral baseline for new users
  return Math.round((avgRating / 5) * 20);
}

// ── Main handler ────────────────────────────────────────────────────────────

// @desc    Get crew match suggestions for a project
// @route   GET /api/projects/:id/crew-suggestions
// @access  Private (project owner only)
const getCrewSuggestions = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only the project owner can see suggestions
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const openRoles = (project.requiredRoles || []).filter((role) => {
      // Exclude roles already filled by team members
      return !project.teamMembers?.some((m) => m.role === role);
    });

    if (openRoles.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Collect unique userRoles needed
    const neededUserRoles = [...new Set(
      openRoles.map(mapRoleToUserRole).filter(Boolean)
    )];

    if (neededUserRoles.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Exclude: project owner + existing team members + applicants
    const excludeIds = [
      project.createdBy,
      ...(project.teamMembers || []).map((m) => m.user),
    ];

    // Fetch candidate users matching needed roles
    const candidates = await User.find({
      role:     { $in: neededUserRoles },
      _id:      { $nin: excludeIds },
      isActive: true,
    })
      .select('_id name username role profileImage')
      .lean();

    if (candidates.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const candidateIds = candidates.map((u) => u._id);

    // Batch-fetch profiles and review aggregates
    const [profiles, reviewAggs] = await Promise.all([
      Profile.find({ user: { $in: candidateIds } })
        .select('user skills location experienceLevel availability')
        .lean(),
      Review.aggregate([
        { $match: { reviewee: { $in: candidateIds } } },
        {
          $group: {
            _id:    '$reviewee',
            avg:    { $avg: '$rating' },
            count:  { $sum: 1 },
          },
        },
      ]),
    ]);

    // Build lookup maps
    const profileMap = {};
    profiles.forEach((p) => { profileMap[p.user.toString()] = p; });

    const reviewMap = {};
    reviewAggs.forEach((r) => { reviewMap[r._id.toString()] = r; });

    // Score candidates against each open role
    const suggestionsByRole = {};

    for (const requiredRole of openRoles) {
      const targetUserRole = mapRoleToUserRole(requiredRole);
      if (!targetUserRole) continue;

      const roleCandidates = candidates.filter((u) => u.role === targetUserRole);

      const scored = roleCandidates.map((user) => {
        const uid     = user._id.toString();
        const profile = profileMap[uid] || {};
        const revData = reviewMap[uid]  || { avg: 0, count: 0 };

        const score =
          40 +                                                    // role match (always, since we filtered)
          skillScore(profile.skills, requiredRole) +
          locationScore(profile.location, project.location) +
          reputationScore(revData.avg, revData.count);

        const avgRating = revData.count > 0 ? Math.round(revData.avg * 10) / 10 : null;

        return {
          _id:             user._id,
          name:            user.name,
          username:        user.username,
          role:            user.role,
          profileImage:    user.profileImage || '',
          skills:          (profile.skills || []).slice(0, 4),
          location:        profile.location || {},
          experienceLevel: profile.experienceLevel || 'beginner',
          availability:    profile.availability   || 'available',
          avgRating,
          reviewCount:     revData.count,
          matchScore:      score,
        };
      });

      // Sort by score desc, take top N
      scored.sort((a, b) => b.matchScore - a.matchScore);
      suggestionsByRole[requiredRole] = scored.slice(0, MAX_PER_ROLE);
    }

    // Convert to array for the frontend
    const data = Object.entries(suggestionsByRole).map(([role, suggestions]) => ({
      role,
      suggestions,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCrewSuggestions };
