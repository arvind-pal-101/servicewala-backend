/**
 * Send email - uses Resend API on Render (reliable), or Nodemailer SMTP locally.
 * Render/cloud often block or throttle SMTP; Resend uses HTTPS API so it works everywhere.
 */

async function sendEmail(options) {
  const { email: to, subject, message, html } = options;

  // Prefer Resend when API key is set (recommended for Render/Vercel/any cloud)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      // Resend: default "Resend <onboarding@resend.dev>" for testing
      const from = (process.env.RESEND_FROM || 'Resend <onboarding@resend.dev>').trim();

      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject,
        text: message,
        html: html || message.replace(/\n/g, '<br>')
      });

      if (error) {
        console.error('Resend API error:', error);
        throw new Error(error.message || 'Resend failed');
      }
      return;
    } catch (err) {
      console.error('sendEmail (Resend) error:', err.message || err);
      throw err;
    }
  }

  // Fallback: Nodemailer SMTP (works locally; may fail on Render free tier)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email not configured: set RESEND_API_KEY (recommended on Render) or EMAIL_USER + EMAIL_PASS');
  }
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `ServiceWala <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    text: message,
    html: html || message
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;
