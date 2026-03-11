const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter with explicit settings
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Email options
  const mailOptions = {
    from: `ServiceWala <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;