// ─── SMS Service ──────────────────────────────────────────────────────────────
// Provider priority:
//   1. Fast2SMS  (set FAST2SMS_API_KEY)  — Cheapest for India, ~₹0.10/SMS
//      Uses the OTP route (no DLT registration needed for OTPs)
//   2. Twilio    (set TWILIO_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE) — Global
//   3. MSG91     (set MSG91_AUTH_KEY + MSG91_SENDER_ID) — India
//   Fallback: console.log (dev mode)
// ─────────────────────────────────────────────────────────────────────────────

const FAST2SMS_API_KEY   = process.env.FAST2SMS_API_KEY;
const TWILIO_SID         = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE       = process.env.TWILIO_PHONE;
const MSG91_AUTH_KEY     = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID    = process.env.MSG91_SENDER_ID || 'CREWUP';

// ── Fast2SMS OTP Route (India) ────────────────────────────────────────────────
// Docs: https://docs.fast2sms.com
// Uses the dedicated OTP route — NO DLT registration required.
// Sign up at fast2sms.com → Dev API → copy API key → add to Railway as FAST2SMS_API_KEY
//
// The OTP route sends a system template: "Your OTP is <otp>. Please do not share..."
// Pass just the numeric OTP as variables_values.
const sendViaFast2SMS = async (phone, otp) => {
  // Fast2SMS expects Indian numbers without country code (10 digits)
  const number = phone.replace(/^\+91/, '').replace(/^91/, '').replace(/\s/g, '').trim();

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method:  'POST',
    headers: {
      authorization: FAST2SMS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route:            'otp',   // OTP route — no DLT needed
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

// ── Twilio ────────────────────────────────────────────────────────────────────
// Docs: https://www.twilio.com/docs/sms
// Sign up at twilio.com → get SID, Auth Token, and a phone number
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

// ── MSG91 (India) ─────────────────────────────────────────────────────────────
// Docs: https://msg91.com/apidoc
const sendViaMSG91 = async (phone, message) => {
  const number = phone.startsWith('+') ? phone.slice(1) : phone;

  const res = await fetch('https://api.msg91.com/api/v5/flow/', {
    method:  'POST',
    headers: {
      authkey:        MSG91_AUTH_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender:    MSG91_SENDER_ID,
      route:     '4',
      country:   '91',
      sms: [{
        message,
        to: [number],
      }],
    }),
    signal: AbortSignal.timeout(15000),
  });

  const json = await res.json();
  if (json.type === 'error') {
    throw new Error(`MSG91 error: ${json.message}`);
  }
  return json;
};

// ── Log which provider is active ─────────────────────────────────────────────
if      (FAST2SMS_API_KEY)  console.log('[SMS SERVICE] Using Fast2SMS ✓');
else if (TWILIO_SID)        console.log('[SMS SERVICE] Using Twilio ✓');
else if (MSG91_AUTH_KEY)    console.log('[SMS SERVICE] Using MSG91 ✓');
else                        console.warn('[SMS SERVICE] No provider configured — SMS will be logged only. Set FAST2SMS_API_KEY in Railway.');

// ── OTP sender — routes to correct provider ───────────────────────────────────
// Fast2SMS uses its own OTP route (just the numeric code).
// Twilio / MSG91 send a full text message.
const sendPhoneOTPSMS = async (phone, otp) => {
  if (FAST2SMS_API_KEY) {
    await sendViaFast2SMS(phone, otp);          // OTP route: no DLT needed
    console.log(`[SMS SENT] OTP via Fast2SMS to ${phone}`);
    return;
  }

  const message = `${otp} is your CREWUPFILMS verification code. Valid for 10 minutes. Do not share this code with anyone.`;

  if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE) {
    await sendViaTwilio(phone, message);
    console.log(`[SMS SENT] OTP via Twilio to ${phone}`);
    return;
  }
  if (MSG91_AUTH_KEY) {
    await sendViaMSG91(phone, message);
    console.log(`[SMS SENT] OTP via MSG91 to ${phone}`);
    return;
  }
  // No provider — log only (dev mode)
  console.log(`[SMS SKIPPED] No provider configured — OTP for ${phone}: "${otp}"`);
};

// ── Generic SMS (Twilio / MSG91 only — Fast2SMS OTP route is OTP-only) ────────
const sendSMS = async (phone, message) => {
  if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE) {
    await sendViaTwilio(phone, message);
    return;
  }
  if (MSG91_AUTH_KEY) {
    await sendViaMSG91(phone, message);
    return;
  }
  console.log(`[SMS SKIPPED] No provider — would have sent to ${phone}: "${message}"`);
};

module.exports = { sendSMS, sendPhoneOTPSMS };
