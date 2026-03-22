/**
 * youtubeChecker.js
 *
 * Fetches a YouTube video's description via the YouTube Data API v3
 * and checks whether it contains the required CrewUp mentions.
 *
 * Required env var: YOUTUBE_API_KEY
 * If the key is missing the check is skipped and the submission goes
 * straight to admin review (pending_review).
 *
 * Mention rules (both must be present to pass):
 *   1. Description contains "crewupfilms" or "crewup films" (case-insensitive)
 *   2. Description contains the submitter's username (case-insensitive),
 *      with or without a leading "@"
 */

/**
 * Fetch the description text of a YouTube video.
 * Returns null if the API key is absent, the video is not found, or the
 * request fails for any reason.
 *
 * @param {string} videoId  11-char YouTube video ID
 * @returns {Promise<string|null>}
 */
async function fetchYoutubeDescription(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const json = await res.json();
    return json?.items?.[0]?.snippet?.description ?? null;
  } catch {
    return null;
  }
}

/**
 * Check whether a YouTube description satisfies the CrewUp submission rules.
 *
 * @param {string|null} description  Raw description text (or null if fetch failed)
 * @param {string}      username     Submitter's username (without @)
 * @returns {{ passed: boolean, hasCrewupMention: boolean, hasUsernameMention: boolean }}
 */
function checkDescription(description, username) {
  if (!description) {
    return { passed: false, hasCrewupMention: false, hasUsernameMention: false };
  }

  const lower = description.toLowerCase();
  const user  = (username || '').toLowerCase();

  const hasCrewupMention =
    lower.includes('crewupfilms') ||
    lower.includes('crewup films') ||
    lower.includes('crewup');

  const hasUsernameMention =
    user.length > 0 &&
    (lower.includes(user) || lower.includes(`@${user}`));

  return {
    passed: hasCrewupMention && hasUsernameMention,
    hasCrewupMention,
    hasUsernameMention,
  };
}

/**
 * Run the full auto-check pipeline for a contest submission.
 *
 * @param {string} videoId    YouTube video ID
 * @param {string} username   Submitter's username
 * @returns {Promise<{
 *   ran: boolean,
 *   passed: boolean,
 *   hasCrewupMention: boolean,
 *   hasUsernameMention: boolean,
 *   fetchedDescription: string,
 *   checkedAt: Date,
 *   skipped: boolean,   // true when no API key — submission goes to admin review
 * }>}
 */
async function runAutoCheck(videoId, username) {
  const description = await fetchYoutubeDescription(videoId);

  // No API key configured — skip auto-check, go straight to admin review
  if (description === null && !process.env.YOUTUBE_API_KEY) {
    return {
      ran:                false,
      passed:             false,
      hasCrewupMention:   false,
      hasUsernameMention: false,
      fetchedDescription: '',
      checkedAt:          new Date(),
      skipped:            true,
    };
  }

  const { passed, hasCrewupMention, hasUsernameMention } = checkDescription(description, username);

  return {
    ran:                true,
    passed,
    hasCrewupMention,
    hasUsernameMention,
    fetchedDescription: description || '',
    checkedAt:          new Date(),
    skipped:            false,
  };
}

module.exports = { fetchYoutubeDescription, checkDescription, runAutoCheck };
