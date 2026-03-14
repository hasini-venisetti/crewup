/**
 * Fraud Detection Service
 * Analyses a project + its creator and returns a risk score, level, and
 * human-readable flags that are stored on the project and surfaced to admins.
 *
 * Risk levels:
 *   low    (0–29)  → verified creator: auto-approve
 *   medium (30–59) → verified creator: auto-approve but admin sees amber warning
 *   high   (60+)   → always goes to pending queue; admin gets an instant alert
 */

const SCAM_KEYWORDS = [
  // Money demands
  'pay a fee', 'pay fee', 'registration fee', 'audition fee', 'casting fee',
  'deposit required', 'advance payment', 'pay in advance', 'upfront payment',
  'wire transfer', 'western union', 'moneygram', 'send money', 'payment required',
  // Contact redirection
  'whatsapp only', 'whatsapp me', 'contact via whatsapp', 'telegram only',
  'text only', 'no email', 'direct message only', 'dm only', 'call only',
  // Suspicious casting phrases
  'casting couch', 'open to all looks', 'no experience needed pay', 'guaranteed role',
  'immediate casting', 'casting now pay', 'urgent casting fee',
  // Crypto / gift cards
  'bitcoin', 'crypto payment', 'gift card', 'itunes card', 'google play card',
  // Fake legitimacy signals
  'netflix production', 'amazon production', 'disney project', 'hollywood casting',
  'paid in cash only', 'cash only', 'no contract needed',
];

/**
 * Scan text for scam keyword matches.
 * Returns array of matched keyword strings.
 */
function scanKeywords(text = '') {
  const lower = text.toLowerCase();
  return SCAM_KEYWORDS.filter((kw) => lower.includes(kw));
}

/**
 * Calculate days since a given date.
 */
function daysSince(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Main analysis function.
 *
 * @param {Object} project  - Mongoose project document (not yet saved, plain object is fine)
 * @param {Object} user     - Mongoose user document (should include createdAt, isEmailVerified)
 * @param {Object} [opts]
 * @param {number} opts.existingProjectCount  - How many projects this user has already created
 * @param {number} opts.reportCount           - Number of reports submitted against this user
 * @param {boolean} opts.profileComplete      - Whether the user has a reasonably complete profile
 * @returns {{ score: number, level: 'low'|'medium'|'high', flags: string[] }}
 */
function analyzeProject(project, user, opts = {}) {
  const flags = [];
  let score   = 0;

  const { existingProjectCount = 0, reportCount = 0, profileComplete = false } = opts;
  const accountAgeDays = daysSince(user.createdAt || Date.now());
  const isNewAccount   = accountAgeDays < 7;
  const isPaid         = project.isPaid || false;
  const isPrivateRes   = project.shootingLocationType === 'private-residence';

  // ── 1. Keyword scanning ────────────────────────────────────────────────────
  const textToScan = [
    project.title || '',
    project.description || '',
    project.compensationDetails || '',
    project.location?.city || '',
  ].join(' ');

  const matchedKeywords = scanKeywords(textToScan);
  if (matchedKeywords.length > 0) {
    const points = Math.min(matchedKeywords.length * 25, 60); // cap at 60 per keyword group
    score += points;
    flags.push(`🚨 Suspicious keywords detected: "${matchedKeywords.slice(0, 3).join('", "')}"`);
  }

  // ── 2. New account checks ──────────────────────────────────────────────────
  if (isNewAccount) {
    score += 20;
    flags.push(`⚠️ Account is only ${accountAgeDays} day${accountAgeDays !== 1 ? 's' : ''} old`);
  }

  // ── 3. New account + paid project ─────────────────────────────────────────
  if (isNewAccount && isPaid) {
    score += 20;
    flags.push('🔴 New account posting a paid opportunity');
  }

  // ── 4. Private residence + paid + new account = instant red flag ───────────
  if (isPrivateRes && isPaid && isNewAccount) {
    score += 25;
    flags.push('🔴 Private residence + paid + new account — high scam risk');
  } else if (isPrivateRes && isNewAccount) {
    score += 10;
    flags.push('⚠️ Private residence audition with new account');
  }

  // ── 5. No existing projects on this account ────────────────────────────────
  if (existingProjectCount === 0 && isPaid) {
    score += 10;
    flags.push('⚠️ First-ever project on this account — paid');
  }

  // ── 6. Prior reports against this creator ─────────────────────────────────
  if (reportCount > 0) {
    const pts = Math.min(reportCount * 15, 40);
    score += pts;
    flags.push(`🚨 Creator has ${reportCount} prior report${reportCount !== 1 ? 's' : ''} against them`);
  }

  // ── 7. Profile incomplete ──────────────────────────────────────────────────
  if (!profileComplete) {
    score += 5;
    flags.push('ℹ️ Creator profile is incomplete');
  }

  // ── 8. Email not verified ──────────────────────────────────────────────────
  if (!user.isEmailVerified) {
    score += 10;
    flags.push('⚠️ Creator email is not verified');
  }

  // Cap at 100
  score = Math.min(score, 100);

  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

  return { score, level, flags };
}

module.exports = { analyzeProject, scanKeywords };
