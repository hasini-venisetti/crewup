const express = require('express');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, type, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, subject and message are required.' });
    }

    const adminEmail = process.env.CONTACT_EMAIL || 'crewupfilms@gmail.com';

    const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e0e0e0;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:20px 32px;border-bottom:1px solid #e8e8e8;background:#111110;">
            <span style="font-size:15px;font-weight:700;color:#ffffff;letter-spacing:0.05em;">CREWUPFILMS — New Contact Message</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:0 0 16px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;">From</p>
                <p style="margin:0;font-size:15px;color:#111110;font-weight:600;">${name}</p>
                <p style="margin:2px 0 0;font-size:13px;color:#6b6b66;"><a href="mailto:${email}" style="color:#6055de;">${email}</a></p>
              </td></tr>
              <tr><td style="padding:0 0 16px;border-top:1px solid #f0f0ee;padding-top:16px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Subject</p>
                <p style="margin:0;font-size:15px;color:#111110;">${subject}</p>
              </td></tr>
              ${type ? `<tr><td style="padding:0 0 16px;border-top:1px solid #f0f0ee;padding-top:16px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Inquiry Type</p>
                <p style="margin:0;font-size:14px;color:#111110;">${type}</p>
              </td></tr>` : ''}
              <tr><td style="padding:0;border-top:1px solid #f0f0ee;padding-top:16px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Message</p>
                <div style="background:#fafaf9;border:1px solid #e8e8e6;border-radius:6px;padding:16px;">
                  <p style="margin:0;font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                </div>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 32px;border-top:1px solid #e8e8e8;background:#fafafa;">
            <p style="margin:0;font-size:12px;color:#999;">Reply directly to this email to respond to ${name}.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send to admin inbox with reply-to set to the sender
    await sendEmail(
      adminEmail,
      `[Contact] ${subject} — from ${name}`,
      html,
      `From: ${name} <${email}>\nType: ${type || 'N/A'}\nSubject: ${subject}\n\n${message}`
    );

    // Send confirmation to the user
    const confirmHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e0e0e0;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="padding:20px 32px;border-bottom:1px solid #e8e8e8;">
          <span style="font-size:15px;font-weight:700;color:#111110;letter-spacing:0.05em;">CREWUPFILMS</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111110;">Hi ${name},</p>
          <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">
            Thanks for reaching out! We've received your message and will get back to you within 24 hours.
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#888;">Your message:</p>
          <div style="background:#f7f7f6;border-left:3px solid #6055de;padding:12px 16px;border-radius:0 6px 6px 0;margin:0 0 24px;">
            <p style="margin:0;font-size:13px;color:#555;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 300)}${message.length > 300 ? '…' : ''}</p>
          </div>
          <p style="margin:0;font-size:13px;color:#999;">— CREWUPFILMS Team</p>
        </td></tr>
        <tr><td style="padding:14px 32px;border-top:1px solid #e8e8e8;background:#fafafa;">
          <p style="margin:0;font-size:12px;color:#999;">crewupfilms.com · crewupfilms@gmail.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await sendEmail(email, 'We received your message — CREWUPFILMS', confirmHtml,
      `Hi ${name},\n\nThanks for reaching out! We'll get back to you within 24 hours.\n\n— CREWUPFILMS Team`);

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('[CONTACT] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send message. Please email us directly at crewupfilms@gmail.com' });
  }
});

module.exports = router;
