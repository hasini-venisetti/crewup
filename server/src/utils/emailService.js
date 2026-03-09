// ─── Email Service ────────────────────────────────────────────────────────────
// Option 1: Brevo HTTP API  (set BREVO_API_KEY in Railway) — FREE 300/day
// Option 2: Resend HTTP API (set RESEND_API_KEY in Railway) — FREE 100/day
// Fallback:  SMTP via nodemailer (EMAIL_HOST/PORT/USER/PASS or GMAIL_USER/GMAIL_PASS)
//
// Brevo signup: https://app.brevo.com  → Settings → API Keys → Generate
// ─────────────────────────────────────────────────────────────────────────────

const BREVO_API_KEY  = process.env.BREVO_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_NAME    = process.env.SENDER_NAME  || 'CREWUPFILMS';
const SENDER_EMAIL   = process.env.SENDER_EMAIL || 'noreply@crewupfilms.com';

// ── Brevo HTTP sender ─────────────────────────────────────────────────────────
const sendViaBrevo = async (to, subject, html) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'api-key':      BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender:      { name: SENDER_NAME, email: SENDER_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
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
const sendViaResend = async (to, subject, html) => {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
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
    console.warn('[EMAIL SERVICE] ⚠️  No email provider configured. Set BREVO_API_KEY in Railway (free at brevo.com). Emails will be skipped.');
  }
} else if (BREVO_API_KEY) {
  console.log('[EMAIL SERVICE] Using Brevo HTTP API ✓');
} else {
  console.log('[EMAIL SERVICE] Using Resend HTTP API ✓');
}

// ── Central send function ─────────────────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  if (BREVO_API_KEY) {
    await sendViaBrevo(to, subject, html);
    return;
  }
  if (RESEND_API_KEY) {
    await sendViaResend(to, subject, html);
    return;
  }
  if (smtpTransporter) {
    await Promise.race([
      smtpTransporter.sendMail({ from: SMTP_FROM, to, subject, html }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout after 20s')), 20000)
      ),
    ]);
    return;
  }
  console.log(`[EMAIL SKIPPED] No provider configured — would have sent to ${to}`);
};

// ─── Email templates ──────────────────────────────────────────────────────────

const sendApplicationReceived = async (ownerEmail, ownerName, applicantName, projectTitle, projectId) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f0f; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 40px; border-radius: 8px; color: #e0e0e0; }
            .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { color: #6366f1; font-size: 24px; font-weight: bold; }
            .greeting { font-size: 18px; color: #ffffff; font-weight: 500; margin-bottom: 20px; }
            .message { margin: 20px 0; color: #d0d0d0; }
            .highlight { background-color: #2a2a2a; padding: 15px; border-left: 4px solid #6366f1; margin: 20px 0; }
            .button { display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; border-top: 2px solid #333333; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #888888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><div class="logo">CREWUP</div></div>
            <p class="greeting">Hi ${ownerName},</p>
            <p class="message">Great news! You have a new application for your project.</p>
            <div class="highlight">
              <p><strong>Applicant:</strong> ${applicantName}</p>
              <p><strong>Project:</strong> ${projectTitle}</p>
            </div>
            <p class="message">Head to your project dashboard to review the application and make a decision.</p>
            <a href="${siteUrl}/projects/${projectId}/applications" class="button">View Application</a>
            <div class="footer"><p>© 2026 CREWUP. All rights reserved.</p></div>
          </div>
        </body>
      </html>
    `;
    await sendEmail(ownerEmail, `New Application: ${applicantName} applied to "${projectTitle}"`, html);
    console.log(`[EMAIL SENT] sendApplicationReceived to ${ownerEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendApplicationReceived:', error.message);
  }
};

const sendApplicationAccepted = async (applicantEmail, applicantName, projectTitle, projectId) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f0f; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 40px; border-radius: 8px; color: #e0e0e0; }
            .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { color: #10b981; font-size: 24px; font-weight: bold; }
            .greeting { font-size: 18px; color: #ffffff; font-weight: 500; margin-bottom: 20px; }
            .message { margin: 20px 0; color: #d0d0d0; }
            .highlight { background-color: #2a2a2a; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
            .button { display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; border-top: 2px solid #333333; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #888888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><div class="logo">CREWUP</div></div>
            <p class="greeting">Hi ${applicantName},</p>
            <p class="message">Congratulations! Your application has been accepted!</p>
            <div class="highlight">
              <p><strong>Project:</strong> ${projectTitle}</p>
              <p style="color: #10b981; font-weight: 600;">You're on the team! Welcome aboard.</p>
            </div>
            <a href="${siteUrl}/projects/${projectId}" class="button">View Project</a>
            <div class="footer"><p>© 2026 CREWUP. All rights reserved.</p></div>
          </div>
        </body>
      </html>
    `;
    await sendEmail(applicantEmail, `Application Accepted! You're in for "${projectTitle}"`, html);
    console.log(`[EMAIL SENT] sendApplicationAccepted to ${applicantEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendApplicationAccepted:', error.message);
  }
};

const sendApplicationDeclined = async (applicantEmail, applicantName, projectTitle) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f0f; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 40px; border-radius: 8px; color: #e0e0e0; }
            .header { text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { color: #f59e0b; font-size: 24px; font-weight: bold; }
            .greeting { font-size: 18px; color: #ffffff; font-weight: 500; margin-bottom: 20px; }
            .message { margin: 20px 0; color: #d0d0d0; }
            .highlight { background-color: #2a2a2a; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .button { display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; border-top: 2px solid #333333; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #888888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><div class="logo">CREWUP</div></div>
            <p class="greeting">Hi ${applicantName},</p>
            <p class="message">Thank you for your interest in contributing to this project.</p>
            <div class="highlight">
              <p><strong>Project:</strong> ${projectTitle}</p>
              <p>Unfortunately, your application was not selected at this time. Keep creating and connecting on CREWUP!</p>
            </div>
            <a href="${siteUrl}/projects" class="button">Explore More Projects</a>
            <div class="footer"><p>© 2026 CREWUP. All rights reserved.</p></div>
          </div>
        </body>
      </html>
    `;
    await sendEmail(applicantEmail, `Update on your application for "${projectTitle}"`, html);
    console.log(`[EMAIL SENT] sendApplicationDeclined to ${applicantEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendApplicationDeclined:', error.message);
  }
};

const sendRoleFilled = async (memberEmail, memberName, projectTitle, role, note, projectId) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f0f; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 40px; border-radius: 8px; color: #e0e0e0; }
            .header { text-align: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { color: #8b5cf6; font-size: 24px; font-weight: bold; }
            .greeting { font-size: 18px; color: #ffffff; font-weight: 500; margin-bottom: 20px; }
            .message { margin: 20px 0; color: #d0d0d0; }
            .highlight { background-color: #2a2a2a; padding: 15px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
            .button { display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; border-top: 2px solid #333333; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #888888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><div class="logo">CREWUP</div></div>
            <p class="greeting">Hi ${memberName},</p>
            <p class="message">Update on the project "${projectTitle}" — a role has been filled!</p>
            <div class="highlight">
              <p><strong>Filled Role:</strong> ${role}</p>
              ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
            </div>
            <a href="${siteUrl}/projects/${projectId}" class="button">View Project Updates</a>
            <div class="footer"><p>© 2026 CREWUP. All rights reserved.</p></div>
          </div>
        </body>
      </html>
    `;
    await sendEmail(memberEmail, `${role} role filled on "${projectTitle}"`, html);
    console.log(`[EMAIL SENT] sendRoleFilled to ${memberEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendRoleFilled:', error.message);
  }
};

const sendLaunchNotification = async (email, name) => {
  const displayName = name || 'Filmmaker';
  const siteUrl     = process.env.CLIENT_URL || 'https://crewupfilms.com';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a09; margin: 0; padding: 0; }
          .wrapper { padding: 40px 20px; }
          .container { max-width: 580px; margin: 0 auto; background-color: #111110; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e1c; }
          .hero { background: linear-gradient(135deg, #6C63FF 0%, #4f46e5 100%); padding: 48px 40px; text-align: center; }
          .logo { font-size: 13px; font-weight: 800; letter-spacing: 0.2em; color: rgba(255,255,255,0.6); text-transform: uppercase; margin-bottom: 20px; }
          .hero-title { font-size: 32px; font-weight: 900; color: #ffffff; line-height: 1.2; margin: 0 0 12px; }
          .hero-sub { font-size: 16px; color: rgba(255,255,255,0.75); margin: 0; }
          .body { padding: 40px; }
          .greeting { font-size: 18px; color: #ffffff; font-weight: 600; margin: 0 0 16px; }
          .text { font-size: 15px; color: #a3a39e; line-height: 1.7; margin: 0 0 20px; }
          .features { background: #1a1a18; border-radius: 12px; padding: 24px; margin: 28px 0; }
          .feature { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
          .feature:last-child { margin-bottom: 0; }
          .feat-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
          .feat-text { font-size: 14px; color: #d0d0cc; line-height: 1.5; }
          .feat-title { font-weight: 700; color: #ffffff; display: block; margin-bottom: 2px; }
          .contest-banner { background: linear-gradient(135deg, #1a1a18 0%, #1e1a2e 100%); border: 1px solid #6C63FF40; border-radius: 14px; padding: 28px; margin: 28px 0; text-align: center; }
          .contest-tag { display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #7C75FF; border: 1px solid #6C63FF50; background: #6C63FF15; padding: 4px 12px; border-radius: 50px; margin-bottom: 14px; }
          .contest-title { font-size: 20px; font-weight: 900; color: #ffffff; margin: 0 0 10px; line-height: 1.3; }
          .contest-desc { font-size: 14px; color: #a3a39e; line-height: 1.6; margin: 0 0 18px; }
          .contest-pills { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
          .pill { font-size: 12px; font-weight: 600; color: #d0d0cc; background: #2a2a28; border: 1px solid #333330; border-radius: 50px; padding: 5px 14px; }
          .contest-cta { display: inline-block; background: #6C63FF; color: #fff; font-size: 13px; font-weight: 700; padding: 11px 28px; border-radius: 50px; text-decoration: none; }
          .cta-wrap { text-align: center; margin: 32px 0 8px; }
          .cta { display: inline-block; background: linear-gradient(135deg, #6C63FF, #4f46e5); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700; }
          .footer { text-align: center; border-top: 1px solid #1e1e1c; padding: 24px 40px; font-size: 12px; color: #4a4a46; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="hero">
              <div class="logo">CREWUPFILMS</div>
              <h1 class="hero-title">🎬 We're Live!</h1>
              <p class="hero-sub">The wait is over. Your platform is ready.</p>
            </div>
            <div class="body">
              <p class="greeting">Hey ${displayName},</p>
              <p class="text">You signed up early and we didn't forget you. CREWUPFILMS is officially live — the platform where Indian filmmakers find their crew, showcase their films, and grow together.</p>
              <div class="features">
                <div class="feature"><span class="feat-icon">🎥</span><span class="feat-text"><span class="feat-title">Post Projects &amp; Find Crew</span>Directors, writers, DPs, editors — build your dream team here.</span></div>
                <div class="feature"><span class="feat-icon">🏆</span><span class="feat-text"><span class="feat-title">Enter Film Contests</span>Submit your short films, earn community votes, and win prizes in INR.</span></div>
                <div class="feature"><span class="feat-icon">🎞️</span><span class="feat-text"><span class="feat-title">Showcase Your Films</span>Your finished films get a permanent home — share them with the world.</span></div>
                <div class="feature"><span class="feat-icon">🤝</span><span class="feat-text"><span class="feat-title">Connect with Mentors</span>Learn from experienced filmmakers and grow your craft.</span></div>
              </div>
              <div class="contest-banner">
                <div class="contest-tag">🏆 Also Launching Today</div>
                <h2 class="contest-title">Inaugural Short Film Contest</h2>
                <p class="contest-desc">To celebrate our launch, we're kicking off our very first Short Film Contest — open to all filmmakers. Submit your short film, get community votes, and win prizes in INR.</p>
                <div class="contest-pills">
                  <span class="pill">🎬 Short Films</span>
                  <span class="pill">💰 Cash Prizes (INR)</span>
                  <span class="pill">🗳 Community Voting</span>
                </div>
                <a href="${siteUrl}/contests" class="contest-cta">View the Contest →</a>
              </div>
              <p class="text">You were one of the first to believe in this. Now it's your turn to be first on the platform.</p>
              <div class="cta-wrap"><a href="${siteUrl}" class="cta">Enter CREWUPFILMS →</a></div>
            </div>
            <div class="footer">
              <p>You're receiving this because you joined our early access waitlist.</p>
              <p>© 2026 CREWUPFILMS. Made with ❤️ for Indian filmmakers.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // throws on failure so controller can return proper error to frontend
  await sendEmail(email, `🎬 CREWUPFILMS is Live + Short Film Contest is Open, ${displayName}!`, html);
  console.log(`[EMAIL SENT] sendLaunchNotification to ${email}`);
};

module.exports = {
  sendApplicationReceived,
  sendApplicationAccepted,
  sendApplicationDeclined,
  sendRoleFilled,
  sendLaunchNotification,
};
