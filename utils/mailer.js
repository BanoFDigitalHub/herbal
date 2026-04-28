// mailer.js
const nodemailer = require('nodemailer');

// Create transporter with better configuration
const createTransporter = () => {
  // For Gmail
  if (process.env.EMAIL_SERVICE === 'gmail' || process.env.EMAIL_USER?.includes('gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add timeout and better error handling
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }
  
  // For custom SMTP (like SendGrid, AWS SES, etc.)
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service connection failed:', error.message);
    console.error('   Please check your EMAIL_USER and EMAIL_PASS in .env file');
  } else {
    console.log('✅ Email service ready - Connected as:', process.env.EMAIL_USER);
  }
});

/**
 * Send an email with proper error handling and logging
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html - HTML content of the email
 * @returns {Promise<object>} - Nodemailer send info
 */
const sendMail = async (to, subject, html) => {
  // Validate inputs
  if (!to || !to.trim()) {
    console.warn('⚠️ Email skipped: No recipient provided');
    return null;
  }
  
  if (!html || html.trim().length < 50) {
    console.error('❌ Email failed: HTML content is empty or too short');
    throw new Error('Email content is empty or invalid');
  }
  
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!fromEmail) {
    console.error('❌ Email failed: No sender email configured (EMAIL_FROM or EMAIL_USER)');
    throw new Error('Sender email not configured');
  }

  console.log(`📧 Preparing email for: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Content length: ${html.length} characters`);

  try {
    const mailOptions = {
      from: `"Herbal Power" <${fromEmail}>`,
      to: to.trim(),
      subject: subject.trim(),
      html: html,
      // Add plain text version as fallback
      text: html.replace(/<[^>]*>/g, '').substring(0, 500),
      // Add headers to improve deliverability
      headers: {
        'X-Entity-Ref-ID': `order-${Date.now()}`,
        'X-Priority': '3',
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response?.substring(0, 100) || 'OK'}`);
    
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    // Provide helpful troubleshooting info
    if (error.code === 'EAUTH') {
      console.error('   🔐 Authentication failed. Please check:');
      console.error('      - EMAIL_USER is correct');
      console.error('      - EMAIL_PASS is correct (for Gmail, use App Password, not regular password)');
      console.error('      - Less secure app access is enabled (if using regular password)');
    } else if (error.code === 'ESOCKET') {
      console.error('   🌐 Network error. Check your internet connection and firewall settings');
    }
    
    throw error;
  }
};

/**
 * Test email configuration by sending a test email
 * @param {string} testEmail - Email address to send test to
 */
const sendTestEmail = async (testEmail) => {
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #2e7d32;">✅ Herbal Power Email Test</h2>
      <p>If you're reading this, your email configuration is working correctly!</p>
      <p>Time: ${new Date().toLocaleString()}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Herbal Power - Natural Wellness</p>
    </body>
    </html>
  `;
  
  return sendMail(testEmail, '🧪 Herbal Power - Email Configuration Test', testHtml);
};

module.exports = { sendMail, sendTestEmail };