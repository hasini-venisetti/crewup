// ─── SMS Service ──────────────────────────────────────────────────────────────
// Provider: Twilio (global)
// Set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE in Railway env vars
// ─────────────────────────────────────────────────────────────────────────────

const TWILIO_SID        = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE      = process.env.TWILIO_PHONE;

// ── Twilio ────────────────────────────────────────────────────────────────────
const sendViaTwilio = async (phone, message) => {
  const credentials = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

  const body = new URLSearchParams({
    To:   phone,
    From: TWILIO_PHONE,
    Body: message,
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  const json = await res.json();
  if (json.status >= 400 || json.error_code) {
    throw new Error(`Twilio error: ${json.message || json.error_message}`);
  }
  return json;
};

// ── Log active provider ───────────────────────────────────────────────────────
if (TWILIO_SID) console.log('[SMS SERVICE] Using Twilio ✓');
else            console.warn('[SMS SERVICE] No provider configured — OTPs will be logged only. Set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE in Railway.');

// ── Send OTP via SMS ──────────────────────────────────────────────────────────
const normalisePhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  // Indian numbers: 10 digits starting with 6-9 → add +91
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  // Already has country code (12 digits for India: 91XXXXXXXXXX)
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  // Already in E.164 format or unknown — send as-is
  return phone.startsWith('+') ? phone : `+${digits}`;
};

const sendPhoneOTPSMS = async (phone, otp) => {
  const message = `${otp} is your CrewUpFilms verification code. Valid for 10 minutes. Do not share this code with anyone.`;

  if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE) {
    await sendViaTwilio(normalisePhone(phone), message);
    console.log(`[SMS SENT] OTP via Twilio to ${phone}`);
    return;
  }

  // No provider — log only (dev mode)
  console.log(`[SMS SKIPPED] No provider configured — OTP for ${phone}: "${otp}"`);
};

// ── Generic SMS ───────────────────────────────────────────────────────────────
const sendSMS = async (phone, message) => {
  if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE) {
    await sendViaTwilio(phone, message);
    return;
  }
  console.log(`[SMS SKIPPED] No provider — would have sent to ${phone}: "${message}"`);
};

module.exports = { sendSMS, sendPhoneOTPSMS };
