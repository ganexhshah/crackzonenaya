require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendTestEmail() {
  try {
    console.log('📧 Testing email configuration...');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);
    console.log('From:', process.env.EMAIL_FROM);
    console.log('');

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!');
    console.log('');

    // Send test email
    console.log('📨 Sending test email to ganesh.ffx@gmail.com...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'ganesh.ffx@gmail.com',
      subject: '✅ Test Email from CrackZone - Email Working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5; text-align: center;">🎉 Email Configuration Test</h1>
          <p>Hi Ganesh!</p>
          <p>Great news! Your email configuration is working perfectly.</p>
          
          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0; color: #16a34a;">✅ Email Status: Working!</h3>
            <p style="margin: 0;">All authentication emails will now be sent successfully.</p>
          </div>

          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📧 Configuration Details</h3>
            <ul>
              <li><strong>SMTP Host:</strong> ${process.env.EMAIL_HOST}</li>
              <li><strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
              <li><strong>From Email:</strong> ${process.env.EMAIL_FROM}</li>
              <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>

          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0284c7;">🚀 Ready to Use</h3>
            <p>Your application can now send:</p>
            <ul>
              <li>✅ Registration OTP emails</li>
              <li>✅ Password reset emails</li>
              <li>✅ Welcome emails for Google OAuth</li>
              <li>✅ Notification emails</li>
            </ul>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:3000/auth/register" 
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Try Registration Now
            </a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; text-align: center;">
            This is an automated test email from CrackZone<br>
            If you didn't request this, you can safely ignore it.
          </p>
        </div>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('');
    console.log('🎉 Check your inbox at ganesh.ffx@gmail.com');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

sendTestEmail();
