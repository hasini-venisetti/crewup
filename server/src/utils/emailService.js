const nodemailer = require('nodemailer');

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'CREWUPFILMS <crewupfilms@gmail.com>';

let transporter = null;

if (EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT == 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  console.warn(
    '[EMAIL SERVICE] Email environment variables not configured. Emails will be skipped in development.'
  );
}

const sendApplicationReceived = async (ownerEmail, ownerName, applicantName, projectTitle, projectId) => {
  if (!transporter) {
    console.log('[EMAIL SKIPPED] sendApplicationReceived to', ownerEmail);
    return;
  }

  try {
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
            .content { line-height: 1.6; }
            .greeting { font-size: 18px; color: #ffffff; font-weight: 500; margin-bottom: 20px; }
            .message { margin: 20px 0; color: #d0d0d0; }
            .highlight { background-color: #2a2a2a; padding: 15px; border-left: 4px solid #6366f1; margin: 20px 0; }
            .button { display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; border-top: 2px solid #333333; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #888888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CREWUP</div>
            </div>
            <div class="content">
              <p class="greeting">Hi ${ownerName},</p>
              <p class="message">Great news! You have a new application for your project.</p>
              <div class="highlight">
                <p><strong>Applicant:</strong> ${applicantName}</p>
                <p><strong>Project:</strong> ${projectTitle}</p>
              </div>
              <p class="message">Head to your project dashboard to review the application and make a decision.</p>
              <a href="${process.env.CLIENT_URL || 'https://crewup.com'}/projects/${projectId}/applications" class="button">View Application</a>
            </div>
            <div class="footer">
              <p>This is an automated message from CREWUP. Please do not reply to this email.</p>
              <p>&copy; 2026 CREWUP. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: ownerEmail,
      subject: `New Application: ${applicantName} applied to "${projectTitle}"`,
      html,
    });

    console.log(`[EMAIL SENT] sendApplicationReceived to ${ownerEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendApplicationReceived:', error.message);
  }
};

const sendApplicationAccepted = async (applicantEmail, applicantName, projectTitle, projectId) => {
  if (!transporter) {
    console.log('[EMAIL SKIPPED] sendApplicationAccepted to', applicantEmail);
    return;
  }

  try {
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
            .content { line-height: 1.6; }
            .greeting { font-size: 18px; color: #ffffff; font-weight: 500; margin-bottom: 20px; }
            .message { margin: 20px 0; color: #d0d0d0; }
            .highlight { background-color: #2a2a2a; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
            .button { display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; border-top: 2px solid #333333; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #888888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CREWUP</div>
            </div>
            <div class="content">
              <p class="greeting">Hi ${applicantName},</p>
              <p class="message">Congratulations! Your application has been accepted!</p>
              <div class="highlight">
                <p><strong>Project:</strong> ${projectTitle}</p>
                <p style="color: #10b981; font-weight: 600;">You're on the team! Welcome aboard.</p>
              </div>
              <p class="message">Log in to your CREWUP account to see the full project details and connect with your team members.</p>
              <a href="${process.env.CLIENT_URL || 'https://crewup.com'}/projects/${projectId}" class="button">View Project</a>
            </div>
            <div class="footer">
              <p>This is an automated message from CREWUP. Please do not reply to this email.</p>
              <p>&copy; 2026 CREWUP. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: applicantEmail,
      subject: `Application Accepted! You're in for "${projectTitle}"`,
      html,
    });

    console.log(`[EMAIL SENT] sendApplicationAccepted to ${applicantEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendApplicationAccepted:', error.message);
  }
};

const sendApplicationDeclined = async (applicantEmail, applicantName, projectTitle) => {
  if (!transporter) {
    console.log('[EMAIL SKIPPED] sendApplicationDeclined to', applicantEmail);
    return;
  }

  try {
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
            .content { line-height: 1.6; }
            .greeting { font-size: 18px; color: #ffffff; font-weight: 500; margin-bottom: 20px; }
            .message { margin: 20px 0; color: #d0d0d0; }
            .highlight { background-color: #2a2a2a; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .button { display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; border-top: 2px solid #333333; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #888888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CREWUP</div>
            </div>
            <div class="content">
              <p class="greeting">Hi ${applicantName},</p>
              <p class="message">Thank you for your interest in contributing to this project.</p>
              <div class="highlight">
                <p><strong>Project:</strong> ${projectTitle}</p>
                <p>Unfortunately, your application was not selected at this time. Keep creating and connecting on CREWUP!</p>
              </div>
              <p class="message">Don't worry—there are plenty of other amazing projects and opportunities on the platform. Keep building!</p>
              <a href="${process.env.CLIENT_URL || 'https://crewup.com'}/projects" class="button">Explore More Projects</a>
            </div>
            <div class="footer">
              <p>This is an automated message from CREWUP. Please do not reply to this email.</p>
              <p>&copy; 2026 CREWUP. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: applicantEmail,
      subject: `Update on your application for "${projectTitle}"`,
      html,
    });

    console.log(`[EMAIL SENT] sendApplicationDeclined to ${applicantEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendApplicationDeclined:', error.message);
  }
};

const sendRoleFilled = async (memberEmail, memberName, projectTitle, role, note, projectId) => {
  if (!transporter) {
    console.log('[EMAIL SKIPPED] sendRoleFilled to', memberEmail);
    return;
  }

  try {
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
            .content { line-height: 1.6; }
            .greeting { font-size: 18px; color: #ffffff; font-weight: 500; margin-bottom: 20px; }
            .message { margin: 20px 0; color: #d0d0d0; }
            .highlight { background-color: #2a2a2a; padding: 15px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
            .button { display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; border-top: 2px solid #333333; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #888888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CREWUP</div>
            </div>
            <div class="content">
              <p class="greeting">Hi ${memberName},</p>
              <p class="message">Update on the project "${projectTitle}" — a role has been filled!</p>
              <div class="highlight">
                <p><strong>Filled Role:</strong> ${role}</p>
                ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
              </div>
              <p class="message">Check the project updates to see who joined the team and stay coordinated with your crew.</p>
              <a href="${process.env.CLIENT_URL || 'https://crewup.com'}/projects/${projectId}" class="button">View Project Updates</a>
            </div>
            <div class="footer">
              <p>This is an automated message from CREWUP. Please do not reply to this email.</p>
              <p>&copy; 2026 CREWUP. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: memberEmail,
      subject: `${role} role filled on "${projectTitle}"`,
      html,
    });

    console.log(`[EMAIL SENT] sendRoleFilled to ${memberEmail}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendRoleFilled:', error.message);
  }
};

const sendLaunchNotification = async (email, name) => {
  if (!transporter) {
    console.log('[EMAIL SKIPPED] sendLaunchNotification to', email);
    return;
  }

  const displayName = name || 'Filmmaker';
  const siteUrl = process.env.CLIENT_URL || 'https://crewupfilms.com';

  try {
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
            .cta-wrap { text-align: center; margin: 32px 0 8px; }
            .cta { display: inline-block; background: linear-gradient(135deg, #6C63FF, #4f46e5); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700; letter-spacing: 0.02em; }
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
                <p class="text">
                  You signed up early and we didn't forget you. CREWUPFILMS is officially live — the platform where Indian filmmakers find their crew, showcase their films, and grow together.
                </p>
                <div class="features">
                  <div class="feature">
                    <span class="feat-icon">🎥</span>
                    <span class="feat-text"><span class="feat-title">Post Projects & Find Crew</span>Directors, writers, DPs, editors — build your dream team here.</span>
                  </div>
                  <div class="feature">
                    <span class="feat-icon">🏆</span>
                    <span class="feat-text"><span class="feat-title">Enter Film Contests</span>Submit your short films, earn community votes, and win prizes in INR.</span>
                  </div>
                  <div class="feature">
                    <span class="feat-icon">🎞️</span>
                    <span class="feat-text"><span class="feat-title">Showcase Your Films</span>Your finished films get a permanent home — share them with the world.</span>
                  </div>
                  <div class="feature">
                    <span class="feat-icon">🤝</span>
                    <span class="feat-text"><span class="feat-title">Connect with Mentors</span>Learn from experienced filmmakers and grow your craft.</span>
                  </div>
                </div>
                <p class="text">You were one of the first to believe in this. Now it's your turn to be first on the platform.</p>
                <div class="cta-wrap">
                  <a href="${siteUrl}" class="cta">Enter CREWUPFILMS →</a>
                </div>
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

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: `🎬 CREWUPFILMS is Live — You're In, ${displayName}!`,
      html,
    });

    console.log(`[EMAIL SENT] sendLaunchNotification to ${email}`);
  } catch (error) {
    console.error('[EMAIL ERROR] sendLaunchNotification:', error.message);
    throw error;
  }
};

module.exports = {
  sendApplicationReceived,
  sendApplicationAccepted,
  sendApplicationDeclined,
  sendRoleFilled,
  sendLaunchNotification,
};
