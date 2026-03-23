// ─── SMS Service ──────────────────────────────────────────────────────────────
// Provider: Fast2SMS (India)
// Sign up at fast2sms.com → Dev API → copy key → add FAST2SMS_API_KEY to Railway
// ─────────────────────────────────────────────────────────────────────────────

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

// ── Fast2SMS OTP Route ────────────────────────────────────────────────────────
// Uses the dedicated OTP route — NO DLT registration required.
// Fast2SMS expects Indian numbers without country code (10 digits).
const sendViaFast2SMS = async (phone, otp) => {
  const number = phone.replace(/^\+91/, '').replace(/^91/, '').replace(/\s/g, '').trim();

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method:  'POST',
    headers: {
      authorization: FAST2SMS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route:            'otp',
      variables_values: String(otp),
      flash:            0,
      numbers:          number,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const json = await res.json();
  if (!json.return) {
    throw new Error(`Fast2SMS error: ${JSON.stringify(json.message || json)}`);
  }
  return json;
};

// ── Log active provider ───────────────────────────────────────────────────────
if (FAST2SMS_API_KEY) console.log('[SMS SERVICE] Using Fast2SMS ✓');
else                  console.warn('[SMS SERVICE] No provider configured — OTPs will be logged only. Set FAST2SMS_API_KEY in Railway.');

// ── Send OTP via SMS ──────────────────────────────────────────────────────────
const sendPhoneOTPSMS = async (phone, otp) => {
  if (FAST2SMS_API_KEY) {
    await sendViaFast2SMS(phone, otp);
    console.log(`[SMS SENT] OTP via Fast2SMS to ${phone}`);
    return;
  }
  // No provider — log only (dev mode)
  console.log(`[SMS SKIPPED] No provider configured — OTP for ${phone}: "${otp}"`);
};

// ── Generic SMS (for future use) ──────────────────────────────────────────────
const sendSMS = async (phone, message) => {
  console.log(`[SMS SKIPPED] Generic SMS not supported — would have sent to ${phone}: "${message}"`);
};

module.exports = { sendSMS, sendPhoneOTPSMS };
