// ─── Email Service ────────────────────────────────────────────────────────────
// Option 1: Brevo HTTP API  (set BREVO_API_KEY in Railway) — FREE 300/day
// Option 2: Resend HTTP API (set RESEND_API_KEY in Railway) — FREE 100/day
// Fallback:  SMTP via nodemailer (EMAIL_HOST/PORT/USER/PASS or GMAIL_USER/GMAIL_PASS)
// ─────────────────────────────────────────────────────────────────────────────

const BREVO_API_KEY  = process.env.BREVO_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_NAME    = process.env.SENDER_NAME  || 'CREWUPFILMS';
const SENDER_EMAIL   = process.env.SENDER_EMAIL || 'noreply@crewupfilms.com';

// ── Brevo HTTP sender ─────────────────────────────────────────────────────────
// Sends both HTML + plain text so Gmail treats it as transactional
const sendViaBrevo = async (to, subject, html, text) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'api-key':      BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender:       { name: SENDER_NAME, email: SENDER_EMAIL },
      to:           [{ email: to }],
      subject,
      htmlContent:  html,
      textContent:  text || stripHtml(html),   // always include plain text
      headers:      { 'X-Mailin-notimestamp': 'true' },
      trackClicks:  false,   // disable Brevo link-wrapping so links go directly to the site
      trackOpens:   false,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`Brevo API error ${res.status}: ${err.message || JSON.stringify(err)}`);
  }

  return res.json();
};

// ── Resend HTTP sender ────────────────────────────────────────────────────────
const RESEND_FROM = process.env.RESEND_FROM || `${SENDER_NAME} <${SENDER_EMAIL}>`;
const sendViaResend = async (to, subject, html, text) => {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html, text: text || stripHtml(html) }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`Resend API error ${res.status}: ${err.message || JSON.stringify(err)}`);
  }

  return res.json();
};

// ── SMTP fallback (nodemailer) ────────────────────────────────────────────────
let smtpTransporter = null;
let SMTP_FROM        = process.env.EMAIL_FROM;

if (!BREVO_API_KEY && !RESEND_API_KEY) {
  const nodemailer = require('nodemailer');
  const EMAIL_HOST = process.env.EMAIL_HOST;
  const EMAIL_PORT = process.env.EMAIL_PORT;
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_PASS = process.env.GMAIL_PASS;

  if (EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS) {
    smtpTransporter = nodemailer.createTransport({
      host:              EMAIL_HOST,
      port:              Number(EMAIL_PORT),
      secure:            Number(EMAIL_PORT) === 465,
      auth:              { user: EMAIL_USER, pass: EMAIL_PASS },
      connectionTimeout: 10000,
      greetingTimeout:   10000,
      socketTimeout:     15000,
    });
    SMTP_FROM = SMTP_FROM || `${SENDER_NAME} <${EMAIL_USER}>`;
    console.log('[EMAIL SERVICE] Using custom SMTP');
  } else if (GMAIL_USER && GMAIL_PASS) {
    smtpTransporter = nodemailer.createTransport({
      host:              'smtp.gmail.com',
      port:              587,
      secure:            false,
      requireTLS:        true,
      auth:              { user: GMAIL_USER, pass: GMAIL_PASS },
      connectionTimeout: 10000,
      greetingTimeout:   10000,
      socketTimeout:     15000,
    });
    SMTP_FROM = SMTP_FROM || `${SENDER_NAME} <${GMAIL_USER}>`;
    console.log('[EMAIL SERVICE] Using Gmail SMTP (587)');
  } else {
    console.warn('[EMAIL SERVICE] No email provider configured. Set BREVO_API_KEY in Railway. Emails will be skipped.');
  }
} else if (BREVO_API_KEY) {
  console.log('[EMAIL SERVICE] Using Brevo HTTP API with plain-text fallback ✓');
} else {
  console.log('[EMAIL SERVICE] Using Resend HTTP API ✓');
}

// ── Utility: strip HTML tags to produce plain text ────────────────────────────
const stripHtml = (html) =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

// ── Central send function ─────────────────────────────────────────────────────
const sendEmail = async (to, subject, html, text) => {
  if (BREVO_API_KEY) {
    await sendViaBrevo(to, subject, html, text);
    return;
  }
  if (RESEND_API_KEY) {
    await sendViaResend(to, subject, html, text);
    return;
  }
  if (smtpTransporter) {
    await Promise.race([
      smtpTransporter.sendMail({ from: SMTP_FROM, to, subject, html, text: text || stripHtml(html) }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout after 20s')), 20000)
      ),
    ]);
    return;
  }
  console.log(`[EMAIL SKIPPED] No provider configured — would have sent to ${to}`);
};

// ─── Shared clean transactional HTML wrapper ──────────────────────────────────
// White background, simple font, single column — looks like a real notification
const transactionalHtml = (body) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e0e0e0;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:20px 32px;border-bottom:1px solid #e8e8e8;">
            <span style="font-size:15px;font-weight:700;color:#111110;letter-spacing:0.05em;">CREWUPFILMS</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e8e8e8;background:#fafafa;">
            <p style="margin:0;font-size:12px;color:#999999;">This is a notification from CREWUPFILMS &mdash; crewupfilms.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Email templates ──────────────────────────────────────────────────────────

const sendApplicationReceived = async (ownerEmail, ownerName, applicantName, projectTitle, projectId, roleApplyingFor) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/projects/${projectId}/applications`;
    const roleText = roleApplyingFor ? ` for the <strong>${roleApplyingFor}</strong> role` : '';
    const roleTextPlain = roleApplyingFor ? ` for the "${roleApplyingFor}" role` : '';

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${ownerName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        <strong>${applicantName}</strong> has applied to your project <strong>"${projectTitle}"</strong>${roleText}.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        Review the application and decide whether to accept or decline.
      </p>
      <a href="${link}" style="display:inline-block;background:#111110;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Application</a>
    `);

    const text = `Hi ${ownerName},\n\n${applicantName} has applied to your project "${projectTitle}"${roleTextPlain}.\n\nReview the application here:\n${link}\n\n— CREWUPFILMS`;

    await sendEmail(ownerEmail, `New application from ${applicantName} for "${projectTitle}"${roleTextPlain}`, html, text);
    console.log(`[EMAIL SENT] sendApplicationReceived to ${ownerEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendApplicationReceived:', error.message);
  }
};

const sendApplicationAccepted = async (applicantEmail, applicantName, projectTitle, projectId) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/projects/${projectId}`;

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${applicantName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Your application to <strong>"${projectTitle}"</strong> has been accepted. Welcome to the team!
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        Head to the project page to meet your team and get started.
      </p>
      <a href="${link}" style="display:inline-block;background:#111110;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Project</a>
    `);

    const text = `Hi ${applicantName},\n\nYour application to "${projectTitle}" has been accepted. Welcome to the team!\n\nView the project here:\n${link}\n\n— CREWUPFILMS`;

    await sendEmail(applicantEmail, `Your application to "${projectTitle}" was accepted`, html, text);
    console.log(`[EMAIL SENT] sendApplicationAccepted to ${applicantEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendApplicationAccepted:', error.message);
  }
};

const sendApplicationDeclined = async (applicantEmail, applicantName, projectTitle) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/projects`;

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${applicantName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Thank you for applying to <strong>"${projectTitle}"</strong>. Unfortunately, your application was not selected this time.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        There are many more projects looking for talent. Keep creating!
      </p>
      <a href="${link}" style="display:inline-block;background:#111110;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Browse Projects</a>
    `);

    const text = `Hi ${applicantName},\n\nThank you for applying to "${projectTitle}". Unfortunately, your application was not selected this time.\n\nBrowse more projects here:\n${link}\n\n— CREWUPFILMS`;

    await sendEmail(applicantEmail, `Update on your application for "${projectTitle}"`, html, text);
    console.log(`[EMAIL SENT] sendApplicationDeclined to ${applicantEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendApplicationDeclined:', error.message);
  }
};

const sendRoleFilled = async (memberEmail, memberName, projectTitle, role, note, projectId) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/projects/${projectId}`;

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${memberName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        The <strong>${role}</strong> role on <strong>"${projectTitle}"</strong> has been filled.
      </p>
      ${note ? `<p style="margin:0 0 20px;font-size:14px;color:#666666;line-height:1.6;background:#f8f8f7;padding:12px 16px;border-left:3px solid #dddddd;border-radius:0 4px 4px 0;">Note: ${note}</p>` : ''}
      <a href="${link}" style="display:inline-block;background:#111110;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Project</a>
    `);

    const text = `Hi ${memberName},\n\nThe ${role} role on "${projectTitle}" has been filled.${note ? `\n\nNote: ${note}` : ''}\n\nView project:\n${link}\n\n— CREWUPFILMS`;

    await sendEmail(memberEmail, `Role filled: ${role} on "${projectTitle}"`, html, text);
    console.log(`[EMAIL SENT] sendRoleFilled to ${memberEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendRoleFilled:', error.message);
  }
};

const sendLaunchNotification = async (email, name) => {
  const displayName = name || 'Filmmaker';
  const siteUrl     = process.env.CLIENT_URL || 'https://crewupfilms.com';

  const html = transactionalHtml(`
    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${displayName},</p>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      CREWUPFILMS is officially live. You signed up early &mdash; now it's your turn to be first on the platform.
    </p>
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111110;">What you can do right now:</p>
    <p style="margin:0 0 4px;font-size:14px;color:#555555;line-height:1.6;">&#8226; Post a project and find your crew</p>
    <p style="margin:0 0 4px;font-size:14px;color:#555555;line-height:1.6;">&#8226; Browse open roles and apply to join a team</p>
    <p style="margin:0 0 4px;font-size:14px;color:#555555;line-height:1.6;">&#8226; Upload your films and share them with the community</p>
    <p style="margin:0 0 24px;font-size:14px;color:#555555;line-height:1.6;">&#8226; Enter the inaugural Short Film Contest &mdash; cash prizes in INR</p>
    <a href="${siteUrl}" style="display:inline-block;background:#111110;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Go to CREWUPFILMS</a>
  `);

  const text = `Hi ${displayName},\n\nCREWUPFILMS is officially live.\n\nYou signed up early — now it's your turn to be first on the platform.\n\nWhat you can do:\n- Post a project and find your crew\n- Browse open roles and apply\n- Upload your films\n- Enter the inaugural Short Film Contest (cash prizes in INR)\n\nGet started: ${siteUrl}\n\n— CREWUPFILMS`;

  await sendEmail(email, `CREWUPFILMS is live, ${displayName}`, html, text);
  console.log(`[EMAIL SENT] sendLaunchNotification to ${email}`);
};

// ── Phase 1: Email OTP Verification ───────────────────────────────────────────
const sendEmailOTP = async (email, name, otp) => {
  try {
    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${name},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.
      </p>
      <div style="background:#f4f4f4;border:1px solid #e0e0e0;border-radius:8px;padding:20px 32px;text-align:center;margin:0 0 24px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#111110;font-family:monospace;">${otp}</span>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#999999;line-height:1.6;">
        If you didn't create a CREWUPFILMS account, you can safely ignore this email.
      </p>
      <p style="margin:0;font-size:13px;color:#999999;">Never share this code with anyone.</p>
    `);
    const text = `Hi ${name},\n\nYour CREWUPFILMS email verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't sign up, ignore this email.\n\n— CREWUPFILMS`;
    await sendEmail(email, 'Your CREWUPFILMS verification code', html, text);
    console.log(`[EMAIL SENT] sendEmailOTP to ${email}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendEmailOTP:', error.message);
  }
};

// ── Phase 2: Moderation notification emails ────────────────────────────────────
const sendProjectApproved = async (ownerEmail, ownerName, projectTitle, projectId) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/projects/${projectId}`;
    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${ownerName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Great news — your project <strong>"${projectTitle}"</strong> has been reviewed and approved. It's now live and accepting applications.
      </p>
      <a href="${link}" style="display:inline-block;background:#111110;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Project</a>
    `);
    const text = `Hi ${ownerName},\n\nYour project "${projectTitle}" has been approved and is now live.\n\nView it here: ${link}\n\n— CREWUPFILMS`;
    await sendEmail(ownerEmail, `Your project "${projectTitle}" is now live`, html, text);
    console.log(`[EMAIL SENT] sendProjectApproved to ${ownerEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendProjectApproved:', error.message);
  }
};

const sendProjectRejected = async (ownerEmail, ownerName, projectTitle, reason) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${ownerName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Your project <strong>"${projectTitle}"</strong> could not be approved at this time.
      </p>
      ${reason ? `<p style="margin:0 0 20px;font-size:14px;color:#666666;line-height:1.6;background:#fff8f8;padding:12px 16px;border-left:3px solid #f0a0a0;border-radius:0 4px 4px 0;">Reason: ${reason}</p>` : ''}
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        Please review our <a href="${siteUrl}/legal/community-guidelines" style="color:#111110;">Community Guidelines</a> and resubmit with the necessary corrections.
      </p>
    `);
    const text = `Hi ${ownerName},\n\nYour project "${projectTitle}" was not approved.${reason ? `\n\nReason: ${reason}` : ''}\n\nPlease review our guidelines and resubmit.\n\n— CREWUPFILMS`;
    await sendEmail(ownerEmail, `Update on your project "${projectTitle}"`, html, text);
    console.log(`[EMAIL SENT] sendProjectRejected to ${ownerEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendProjectRejected:', error.message);
  }
};

// ── Phase 4: Audit trail — notify applicants of project changes ────────────────
const sendProjectEditedNotice = async (applicantEmail, applicantName, projectTitle, changes, projectId) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/projects/${projectId}`;
    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${applicantName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        A project you applied to — <strong>"${projectTitle}"</strong> — has been updated by its creator.
      </p>
      ${changes ? `<p style="margin:0 0 20px;font-size:14px;color:#666666;line-height:1.6;background:#fffdf0;padding:12px 16px;border-left:3px solid #f0d060;border-radius:0 4px 4px 0;">What changed: ${changes}</p>` : ''}
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        Please review the updated details before the shoot to make sure everything still works for you.
      </p>
      <a href="${link}" style="display:inline-block;background:#111110;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Updated Project</a>
    `);
    const text = `Hi ${applicantName},\n\nThe project "${projectTitle}" you applied to has been updated.${changes ? `\n\nWhat changed: ${changes}` : ''}\n\nView project: ${link}\n\n— CREWUPFILMS`;
    await sendEmail(applicantEmail, `"${projectTitle}" has been updated`, html, text);
    console.log(`[EMAIL SENT] sendProjectEditedNotice to ${applicantEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendProjectEditedNotice:', error.message);
  }
};

const sendPasswordReset = async (email, name, resetUrl) => {
  try {
    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${name},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        We received a request to reset your CREWUPFILMS password. Click below to set a new one. This link expires in <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#111110;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Reset Password</a>
      <p style="margin:24px 0 0;font-size:13px;color:#999999;line-height:1.6;">
        If you didn't request this, you can safely ignore this email. Your password won't change.
      </p>
    `);
    const text = `Hi ${name},\n\nClick the link below to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n\n— CREWUPFILMS`;
    await sendEmail(email, 'Reset your CREWUPFILMS password', html, text);
    console.log(`[EMAIL SENT] sendPasswordReset to ${email}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendPasswordReset:', error.message);
  }
};

// ── Mentor application emails ─────────────────────────────────────────────────

const sendMentorApplicationReceived = async (mentorEmail, mentorName, applicantName, applicantRole, message) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/messages?tab=requests`;
    const preview = message?.trim() ? `<p style="margin:0 0 20px;font-size:14px;color:#666666;font-style:italic;line-height:1.6;background:#f7f7f6;padding:12px 16px;border-left:3px solid #6C63FF;border-radius:4px;">"${message.trim()}"</p>` : '';

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${mentorName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        <strong>${applicantName}</strong> (${applicantRole || 'Filmmaker'}) has sent you a mentorship request.
      </p>
      ${preview}
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        Review their profile and decide whether to accept or decline from your messages inbox.
      </p>
      <a href="${link}" style="display:inline-block;background:#6C63FF;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Request</a>
    `);

    const text = `Hi ${mentorName},\n\n${applicantName} has sent you a mentorship request.\n\nMessage: ${message || '(no message)'}\n\nReview the request here:\n${link}\n\n— CREWUPFILMS`;
    await sendEmail(mentorEmail, `${applicantName} wants you as their mentor`, html, text);
    console.log(`[EMAIL SENT] sendMentorApplicationReceived to ${mentorEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendMentorApplicationReceived:', error.message);
  }
};

const sendMentorApplicationAccepted = async (applicantEmail, applicantName, mentorName, conversationId) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = conversationId ? `${siteUrl}/messages?conv=${conversationId}` : `${siteUrl}/messages`;

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${applicantName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Great news! <strong>${mentorName}</strong> has accepted your mentorship request. You can now chat directly.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        Open your chat to introduce yourself and get started on your journey.
      </p>
      <a href="${link}" style="display:inline-block;background:#6C63FF;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Open Chat with ${mentorName}</a>
    `);

    const text = `Hi ${applicantName},\n\n${mentorName} has accepted your mentorship request. You can now chat directly.\n\nOpen your chat here:\n${link}\n\n— CREWUPFILMS`;
    await sendEmail(applicantEmail, `${mentorName} accepted your mentorship request!`, html, text);
    console.log(`[EMAIL SENT] sendMentorApplicationAccepted to ${applicantEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendMentorApplicationAccepted:', error.message);
  }
};

const sendMentorApplicationDeclined = async (applicantEmail, applicantName, mentorName) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/mentors`;

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${applicantName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Thank you for reaching out to <strong>${mentorName}</strong>. Unfortunately, they are unable to take on a new mentee at this time.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        Don't be discouraged — there are many talented mentors on CREWUPFILMS who would love to help you grow.
      </p>
      <a href="${link}" style="display:inline-block;background:#111110;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Find Another Mentor</a>
    `);

    const text = `Hi ${applicantName},\n\nThank you for reaching out to ${mentorName}. They are currently unable to take on a new mentee.\n\nFind other mentors here:\n${link}\n\n— CREWUPFILMS`;
    await sendEmail(applicantEmail, `Update on your mentorship request to ${mentorName}`, html, text);
    console.log(`[EMAIL SENT] sendMentorApplicationDeclined to ${applicantEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendMentorApplicationDeclined:', error.message);
  }
};

// ── Contest submission emails ──────────────────────────────────────────────────

const sendSubmissionApproved = async (recipientEmail, recipientName, filmTitle, contestTitle, contestId) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/contests/${contestId}`;

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${recipientName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Great news — your film <strong>"${filmTitle}"</strong> has been reviewed and approved for <strong>${contestTitle}</strong>. It's now live in the contest!
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        Share it with your audience to get more views and votes. Good luck!
      </p>
      <a href="${link}" style="display:inline-block;background:#6C63FF;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Contest</a>
    `);

    const text = `Hi ${recipientName},\n\nYour film "${filmTitle}" has been approved for ${contestTitle} and is now live in the contest!\n\nView it here: ${link}\n\n— CREWUPFILMS`;
    await sendEmail(recipientEmail, `✅ Your film "${filmTitle}" is approved for ${contestTitle}`, html, text);
    console.log(`[EMAIL SENT] sendSubmissionApproved to ${recipientEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendSubmissionApproved:', error.message);
  }
};

const sendSubmissionRejected = async (recipientEmail, recipientName, filmTitle, contestTitle, contestId, reason) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/contests/${contestId}`;

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${recipientName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Your submission <strong>"${filmTitle}"</strong> for <strong>${contestTitle}</strong> was not approved at this time.
      </p>
      ${reason ? `<p style="margin:0 0 20px;font-size:14px;color:#666666;line-height:1.6;background:#fff8f8;padding:12px 16px;border-left:3px solid #f0a0a0;border-radius:0 4px 4px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        You can fix the issue and resubmit from the contest page. Make sure your YouTube description includes <strong>crewupfilms</strong> and your <strong>@username</strong>.
      </p>
      <a href="${link}" style="display:inline-block;background:#111110;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Resubmit Your Film</a>
    `);

    const text = `Hi ${recipientName},\n\nYour submission "${filmTitle}" for ${contestTitle} was not approved.${reason ? `\n\nReason: ${reason}` : ''}\n\nYou can fix the issue and resubmit here: ${link}\n\n— CREWUPFILMS`;
    await sendEmail(recipientEmail, `Update on your submission for ${contestTitle}`, html, text);
    console.log(`[EMAIL SENT] sendSubmissionRejected to ${recipientEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendSubmissionRejected:', error.message);
  }
};

const sendContestWinner = async (recipientEmail, recipientName, filmTitle, contestTitle, contestId, placement, note) => {
  try {
    const siteUrl   = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link      = `${siteUrl}/contests/${contestId}`;
    const claimLink = `${siteUrl}/prize-claim/${contestId}`;
    const medal     = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '🏆';
    const ordinal   = placement === 1 ? '1st' : placement === 2 ? '2nd' : placement === 3 ? '3rd' : `${placement}th`;

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${recipientName},</p>
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111110;">${medal} Congratulations!</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        Your film <strong>"${filmTitle}"</strong> has been announced as the <strong>${ordinal} place winner</strong> in <strong>${contestTitle}</strong>!
      </p>
      ${note ? `<p style="margin:0 0 20px;font-size:14px;color:#666666;line-height:1.6;background:#f7f7ff;padding:12px 16px;border-left:3px solid #6C63FF;border-radius:0 4px 4px 0;">${note}</p>` : ''}
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        To claim your prize, please submit your payment details (UPI / bank info) via the link below.
      </p>
      <a href="${claimLink}" style="display:inline-block;background:#6C63FF;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;margin-right:12px;">Claim Your Prize</a>
      <a href="${link}" style="display:inline-block;background:#f0f0f0;color:#111110;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Contest</a>
    `);

    const text = `Hi ${recipientName},\n\n${medal} Congratulations! Your film "${filmTitle}" placed ${ordinal} in ${contestTitle}!\n\n${note ? `Note from the team: ${note}\n\n` : ''}Claim your prize here: ${claimLink}\n\nView contest: ${link}\n\n— CREWUPFILMS`;
    await sendEmail(recipientEmail, `${medal} You placed ${ordinal} in ${contestTitle}!`, html, text);
    console.log(`[EMAIL SENT] sendContestWinner to ${recipientEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendContestWinner:', error.message);
  }
};

const sendContestTeamWin = async (recipientEmail, recipientName, projectTitle, contestTitle, contestId, placement) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const link    = `${siteUrl}/contests/${contestId}`;
    const medal   = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '🏆';
    const ordinal = placement === 1 ? '1st' : placement === 2 ? '2nd' : placement === 3 ? '3rd' : `${placement}th`;

    const html = transactionalHtml(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${recipientName},</p>
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111110;">${medal} Your team won!</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
        The project <strong>"${projectTitle}"</strong> you worked on has been announced as the <strong>${ordinal} place winner</strong> in <strong>${contestTitle}</strong>!
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
        Congratulations to the whole team — this is a shared achievement. Keep creating!
      </p>
      <a href="${link}" style="display:inline-block;background:#6C63FF;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Contest</a>
    `);

    const text = `Hi ${recipientName},\n\n${medal} Your team won! The project "${projectTitle}" placed ${ordinal} in ${contestTitle}.\n\nCongratulations to the whole team!\n\nView contest: ${link}\n\n— CREWUPFILMS`;
    await sendEmail(recipientEmail, `${medal} Your team placed ${ordinal} in ${contestTitle}!`, html, text);
    console.log(`[EMAIL SENT] sendContestTeamWin to ${recipientEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendContestTeamWin:', error.message);
  }
};

// ─── Booking Confirmed — sent to BOTH mentor and mentee ──────────────────────
const sendBookingConfirmed = async ({
  menteeEmail, menteeName,
  mentorEmail, mentorName,
  sessionType, date, startTime, endTime, duration, timezone, meetingLink,
}) => {
  const siteUrl   = process.env.CLIENT_URL || 'https://crewupfilms.com';
  const dashLink  = `${siteUrl}/mentors/dashboard?tab=sessions`;
  const meetBtn   = meetingLink
    ? `<a href="${meetingLink}" style="display:inline-block;margin-top:12px;padding:10px 22px;background:#6C63FF;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px;">Join Meeting →</a>`
    : `<p style="margin:8px 0 0;font-size:13px;color:#666;">The mentor will share a meeting link shortly.</p>`;

  const sessionBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eeff;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <tr><td>
        <p style="margin:0 0 6px;font-size:13px;color:#4740CC;font-weight:700;">📅 Session Details</p>
        <p style="margin:2px 0;font-size:14px;color:#111110;"><strong>Type:</strong> ${sessionType || '1:1 Session'}</p>
        <p style="margin:2px 0;font-size:14px;color:#111110;"><strong>Date:</strong> ${date}</p>
        <p style="margin:2px 0;font-size:14px;color:#111110;"><strong>Time:</strong> ${startTime} – ${endTime} (${duration} min)</p>
        <p style="margin:2px 0;font-size:14px;color:#111110;"><strong>Timezone:</strong> ${timezone}</p>
        ${meetBtn}
      </td></tr>
    </table>`;

  // Email to mentee
  try {
    const html = transactionalHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#111110;">Your session is confirmed! 🎉</h2>
      <p style="margin:0 0 16px;color:#555;font-size:14px;">Hi ${menteeName}, <strong>${mentorName}</strong> has confirmed your booking.</p>
      ${sessionBlock}
      <p style="margin:16px 0 0;font-size:13px;color:#888;">Use the Negotiation Chat on your booking card to discuss anything before the session.</p>
      <a href="${dashLink}" style="display:inline-block;margin-top:12px;padding:9px 20px;background:#111110;color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:13px;">View My Sessions →</a>
    `);
    await sendEmail(menteeEmail, `Session confirmed with ${mentorName} on ${date}`, html);
    console.log(`[EMAIL SENT] sendBookingConfirmed (mentee) to ${menteeEmail}`);
  } catch (e) { console.error('[EMAIL ERROR] sendBookingConfirmed mentee:', e.message); }

  // Email to mentor
  try {
    const html = transactionalHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#111110;">Booking confirmed ✅</h2>
      <p style="margin:0 0 16px;color:#555;font-size:14px;">Hi ${mentorName}, your session with <strong>${menteeName}</strong> is set.</p>
      ${sessionBlock}
      <a href="${dashLink}" style="display:inline-block;margin-top:12px;padding:9px 20px;background:#111110;color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:13px;">View Incoming Sessions →</a>
    `);
    await sendEmail(mentorEmail, `Session confirmed with ${menteeName} on ${date}`, html);
    console.log(`[EMAIL SENT] sendBookingConfirmed (mentor) to ${mentorEmail}`);
  } catch (e) { console.error('[EMAIL ERROR] sendBookingConfirmed mentor:', e.message); }
};

// ─── Booking Requested — notify mentor of new booking ────────────────────────
const sendBookingRequested = async ({
  mentorEmail, mentorName, menteeName,
  sessionType, date, startTime, duration, timezone, notes,
}) => {
  const siteUrl  = process.env.CLIENT_URL || 'https://crewupfilms.com';
  const dashLink = `${siteUrl}/mentors/dashboard?tab=sessions`;
  try {
    const html = transactionalHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#111110;">New session request 📅</h2>
      <p style="margin:0 0 16px;color:#555;font-size:14px;">Hi ${mentorName}, <strong>${menteeName}</strong> wants to book a session with you.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eeff;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <tr><td>
          <p style="margin:2px 0;font-size:14px;color:#111110;"><strong>Type:</strong> ${sessionType || '1:1 Session'}</p>
          <p style="margin:2px 0;font-size:14px;color:#111110;"><strong>Date:</strong> ${date}</p>
          <p style="margin:2px 0;font-size:14px;color:#111110;"><strong>Time:</strong> ${startTime} (${duration} min)</p>
          <p style="margin:2px 0;font-size:14px;color:#111110;"><strong>Timezone:</strong> ${timezone}</p>
          ${notes ? `<p style="margin:8px 0 0;font-size:13px;color:#555;"><em>"${notes}"</em></p>` : ''}
        </td></tr>
      </table>
      <a href="${dashLink}" style="display:inline-block;margin-top:4px;padding:10px 22px;background:#6C63FF;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px;">Confirm or Decline →</a>
    `);
    await sendEmail(mentorEmail, `New session request from ${menteeName} on ${date}`, html);
    console.log(`[EMAIL SENT] sendBookingRequested to ${mentorEmail}`);
  } catch (e) { console.error('[EMAIL ERROR] sendBookingRequested:', e.message); }
};

module.exports = {
  sendEmail,
  sendApplicationReceived,
  sendApplicationAccepted,
  sendApplicationDeclined,
  sendRoleFilled,
  sendLaunchNotification,
  sendEmailOTP,
  sendProjectApproved,
  sendProjectRejected,
  sendProjectEditedNotice,
  sendPasswordReset,
  sendMentorApplicationReceived,
  sendMentorApplicationAccepted,
  sendMentorApplicationDeclined,
  sendSubmissionApproved,
  sendSubmissionRejected,
  sendContestWinner,
  sendContestTeamWin,
  sendBookingConfirmed,
  sendBookingRequested,
};
