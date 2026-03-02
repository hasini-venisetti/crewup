const nodemailer = require('nodemailer');

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@crewup.com';

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

module.exports = {
  sendApplicationReceived,
  sendApplicationAccepted,
  sendApplicationDeclined,
  sendRoleFilled,
};
