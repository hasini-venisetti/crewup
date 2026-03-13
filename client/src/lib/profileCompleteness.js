/**
 * Profile Completeness Score — Phase 4
 * Computes a 0–100 score based on how many profile fields are filled.
 * Used on the profile page and dashboard to encourage users to complete profiles.
 */

export function computeCompletenessScore(profile, user) {
  if (!profile || !user) return { score: 0, missing: [], label: 'Incomplete' };

  const checks = [
    { key: 'profileImage',   label: 'Profile photo',       value: Boolean(user?.profileImage) },
    { key: 'bio',            label: 'Bio',                  value: Boolean(profile?.bio?.trim()) },
    { key: 'location',       label: 'Location',             value: Boolean(profile?.location?.city?.trim()) },
    { key: 'skills',         label: 'Skills (min 3)',        value: (profile?.skills?.length || 0) >= 3 },
    { key: 'experienceLevel',label: 'Experience level',     value: Boolean(profile?.experienceLevel) },
    { key: 'portfolio',      label: 'Portfolio item',       value: (profile?.portfolio?.length || 0) > 0 },
    { key: 'socialLinks',    label: 'Social link',          value: Object.values(profile?.socialLinks || {}).some(v => v?.trim()) },
    { key: 'availability',   label: 'Availability status',  value: Boolean(profile?.availability) },
    { key: 'emailVerified',  label: 'Verified email',       value: Boolean(user?.isEmailVerified) },
    { key: 'portfolioLinks', label: 'Portfolio / reel link', value: (profile?.portfolioLinks || []).some(l => l.url?.trim()) },
  ];

  const filled   = checks.filter(c => c.value);
  const missing  = checks.filter(c => !c.value).map(c => c.label);
  const score    = Math.round((filled.length / checks.length) * 100);

  let label = 'Incomplete';
  if (score >= 90) label = 'Complete';
  else if (score >= 70) label = 'Almost there';
  else if (score >= 50) label = 'Getting started';

  return { score, missing, label };
}

export function getCompletenessColor(score) {
  if (score >= 90) return '#22c55e'; // green
  if (score >= 70) return '#f59e0b'; // amber
  return '#ef4444'; // red
}
