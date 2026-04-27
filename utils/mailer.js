const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Mailer connection failed:', error.message);
  } else {
    console.log('✅ Mailer ready:', process.env.EMAIL_USER);
  }
});

const sendMail = async (to, subject, html) => {
  if (!to || !to.trim()) {
    console.warn('⚠️ sendMail skipped — no recipient');
    return;
  }
  console.log(`📧 Sending email to: ${to} | Subject: ${subject}`);
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
  console.log('📨 Email sent:', info.messageId);
};

module.exports = { sendMail };