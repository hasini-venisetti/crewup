/**
 * recommendationService.js
 *
 * Weighted scoring engine that matches open projects to a creator based on
 * four signals pulled from their User + Profile documents.
 *
 * ┌─────────────────────────────────────────┐
 * │  Signal              Max Points         │
 * │  ─────────────────────────────────────  │
 * │  Role match              +40            │
 * │  Skill overlap           +30            │
 * │  Location similarity     +20            │
 * │  Experience proximity    +10            │
 * │  ─────────────────────────────────────  │
 * │  Perfect score           100            │
 * └─────────────────────────────────────────┘
 *
 * Returns projects sorted by score descending, capped at MAX_RESULTS.
 * Falls back to latest open projects when fewer than MIN_RESULTS are found.
 */

const User        = require('../models/User');
const Profile     = require('../models/Profile');
const Project     = require('../models/Project');
const Application = require('../models/Application');

// ── Constants ──────────────────────────────────────────────────────────────
const MAX_RESULTS = 9;   // maximum projects to return
const MIN_RESULTS = 3;   // minimum before triggering fallback padding
const MIN_SCORE   = 0;   // projects with 0 score are still included (avoids empty state)

// Experience levels ordered from least → most experienced.
// Used to compute the "distance" between two levels for the proximity bonus.
const EXPERIENCE_ORDER = ['beginner', 'intermediate', 'advanced', 'professional'];

// ── Scoring helpers ────────────────────────────────────────────────────────

/**
 * roleScore — +40 if the user's role appears (case-insensitively) in at least
 * one of the project's requiredRoles strings.
 *
 * Example: user.role = "editor"  matches requiredRoles = ["Video Editor", "editor"]
 */
function roleScore(userRole, requiredRoles) {
  if (!userRole || !requiredRoles?.length) return 0;
  const regex = new RegExp(userRole, 'i');
  return requiredRoles.some((r) => regex.test(r)) ? 40 : 0;
}

/**
 * skillScore — proportional +0…+30 based on what fraction of the user's
 * skills overlap with the project's requiredRoles (used as a proxy for
 * required skills since projects store roles, not a separate skills array).
 *
 * If the user has no skills listed the signal is skipped (returns 0) so it
 * doesn't unfairly penalise new members.
 *
 * Overlap check is case-insensitive and checks for partial matches
 * (e.g. user skill "Premiere Pro" partially matches role "Video Editor" via
 * the role-to-keyword mapping below).
 */
function skillScore(userSkills, requiredRoles) {
  if (!userSkills?.length || !requiredRoles?.length) return 0;

  // Count how many of the user's skills appear (partially) in any role string
  const matched = userSkills.filter((skill) =>
    requiredRoles.some((role) =>
      role.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(role.toLowerCase())
    )
  ).length;

  // Proportional: matched / total user skills, scaled to 30 points
  const ratio = matched / userSkills.length;
  return Math.round(ratio * 30);
}

/**
 * locationScore — +20 for same country, +10 for same country AND same city.
 * Remote projects also earn +10 (since they accept everyone).
 *
 * Returns the higher of the two applicable bonuses, max 20.
 */
function locationScore(userLocation, projectLocation) {
  if (!userLocation) return 0;

  // Remote projects are universally accessible — partial bonus
  if (projectLocation?.isRemote) return 10;

  const sameCountry =
    userLocation.country &&
    projectLocation?.country &&
    userLocation.country.toLowerCase() === projectLocation.country.toLowerCase();

  if (!sameCountry) return 0;

  const sameCity =
    userLocation.city &&
    projectLocation?.city &&
    userLocation.city.toLowerCase() === projectLocation.city.toLowerCase();

  return sameCity ? 20 : 15; // same city = full 20, same country only = 15
}

/**
 * experienceScore — +10 when the user's experience level exactly matches the
 * project creator's level, scaled down linearly by the ordinal distance between
 * the two levels (each step away loses 2.5 points, min 0).
 *
 * Why compare against the creator? Projects don't store a required experience
 * level, but creators tend to look for collaborators at similar skill levels.
 * This is the best available proxy until a requiredExperience field is added.
 *
 * @param {string} userLevel     — e.g. 'intermediate'
 * @param {string} creatorLevel  — fetched from the project creator's Profile
 */
function experienceScore(userLevel, creatorLevel) {
  if (!userLevel || !creatorLevel) return 0;

  const userIdx    = EXPERIENCE_ORDER.indexOf(userLevel);
  const creatorIdx = EXPERIENCE_ORDER.indexOf(creatorLevel);

  if (userIdx === -1 || creatorIdx === -1) return 0;

  const distance = Math.abs(userIdx - creatorIdx);
  // 0 apart → 10 pts, 1 apart → 7.5 pts, 2 apart → 5 pts, 3 apart → 2.5 pts
  return Math.max(0, 10 - distance * 2.5);
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * getRecommendedProjects
 *
 * @param {string|ObjectId} userId — the logged-in user's ID
 * @returns {Promise<Array>}       — scored + sorted project documents
 *
 * Algorithm:
 *   1. Fetch the user's role (User) and profile (skills, location, experienceLevel)
 *   2. Collect project IDs the user already applied to → exclude them
 *   3. Fetch all remaining open projects (not created by user)
 *   4. Batch-fetch creator Profiles so we can compute experience proximity
 *   5. Score every project across four signals
 *   6. Sort descending by score, return top MAX_RESULTS
 *   7. If fewer than MIN_RESULTS scored, pad with latest open projects
 */
async function getRecommendedProjects(userId) {
  // ── Step 1: Gather user data ───────────────────────────────────────────
  const [user, profile] = await Promise.all([
    User.findById(userId).select('role').lean(),
    Profile.findOne({ user: userId }).select('skills location experienceLevel').lean(),
  ]);

  const userRole        = user?.role || '';
  const userSkills      = profile?.skills || [];
  const userLocation    = profile?.location || {};
  const userExpLevel    = profile?.experienceLevel || '';

  // ── Step 2: IDs of projects already applied to ────────────────────────
  const myApplications = await Application.find(
    { applicant: userId },
    'project'
  ).lean();
  const appliedIds = myApplications.map((a) => a.project);

  // ── Step 3: Candidate projects ────────────────────────────────────────
  const candidates = await Project.find({
    status:    'open',
    createdBy: { $ne: userId },
    _id:       { $nin: appliedIds },
  })
    .populate('createdBy', 'name username role profileImage')
    .lean();

  if (!candidates.length) return [];

  // ── Step 4: Batch-fetch creator Profiles for experience comparison ─────
  // Build a map: creatorId → experienceLevel to avoid N+1 queries
  const creatorIds = [...new Set(candidates.map((p) => p.createdBy?._id?.toString()))];
  const creatorProfiles = await Profile.find(
    { user: { $in: creatorIds } },
    'user experienceLevel'
  ).lean();

  const creatorExpMap = {};
  creatorProfiles.forEach((cp) => {
    creatorExpMap[cp.user.toString()] = cp.experienceLevel;
  });

  // ── Step 5: Score every candidate ─────────────────────────────────────
  const scored = candidates.map((project) => {
    const creatorIdStr  = project.createdBy?._id?.toString() || '';
    const creatorExpLvl = creatorExpMap[creatorIdStr] || '';

    const signals = {
      role:       roleScore(userRole, project.requiredRoles),
      skill:      skillScore(userSkills, project.requiredRoles),
      location:   locationScore(userLocation, project.location),
      experience: experienceScore(userExpLevel, creatorExpLvl),
    };

    const totalScore = signals.role + signals.skill + signals.location + signals.experience;

    return {
      ...project,
      _score:   totalScore,   // attach score (stripped before API response if desired)
      _signals: signals,      // breakdown for debugging / future transparency UI
    };
  });

  // ── Step 6: Sort by score, take top MAX_RESULTS ───────────────────────
  scored.sort((a, b) => b._score - a._score || b.createdAt - a.createdAt);
  const top = scored.filter((p) => p._score >= MIN_SCORE).slice(0, MAX_RESULTS);

  // ── Step 7: Fallback padding ──────────────────────────────────────────
  // If the scored list is sparse, pad with the most recent open projects
  // that aren't already in the list (maintains minimum variety)
  if (top.length < MIN_RESULTS) {
    const topIds = new Set(top.map((p) => p._id.toString()));
    const extras = await Project.find({
      status:    'open',
      createdBy: { $ne: userId },
      _id:       { $nin: [...appliedIds, ...Array.from(topIds)] },
    })
      .populate('createdBy', 'name username role profileImage')
      .sort({ createdAt: -1 })
      .limit(MAX_RESULTS - top.length)
      .lean();

    // Extras get score 0 — they're purely recency-based padding
    extras.forEach((p) => { p._score = 0; p._signals = {}; });
    top.push(...extras);
  }

  return top;
}

module.exports = { getRecommendedProjects };
