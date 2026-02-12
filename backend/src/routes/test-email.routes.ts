import { Router } from 'express';
import { sendEmail } from '../config/email';
import { authenticate, authorize } from '../middleware/auth';
import { createRateLimit } from '../middleware/rateLimit';

const router = Router();
const testEmailLimiter = createRateLimit(3, 10 * 60 * 1000);

// Test email endpoint
router.post('/send-test', authenticate, authorize('ADMIN'), testEmailLimiter, async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const result = await sendEmail(
      to,
      'Test Email from CrackZone',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5; text-align: center;">Email Configuration Test</h1>
        <p>Hi there!</p>
        <p>This is a test email from your CrackZone application to verify that email sending is working correctly.</p>
        
        <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">✅ Email Configuration Status</h3>
          <ul>
            <li><strong>SMTP Host:</strong> ${process.env.EMAIL_HOST}</li>
            <li><strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
            <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
            <li><strong>Status:</strong> <span style="color: green; font-weight: bold;">Working!</span></li>
          </ul>
        </div>

        <div style="background: #e0f2fe; padding: 15px; border-left: 4px solid #0284c7; margin: 20px 0;">
          <p style="margin: 0;"><strong>🎉 Success!</strong> Your email configuration is working properly.</p>
        </div>

        <p>You can now use the following features:</p>
        <ul>
          <li>Registration with OTP verification</li>
          <li>Password reset emails</li>
          <li>Welcome emails for Google OAuth users</li>
          <li>Notification emails</li>
        </ul>

        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
          This is an automated test email from CrackZone.<br>
          Sent at: ${new Date().toLocaleString()}
        </p>
      </div>
      `
    );

    if (result) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully!',
        messageId: result.messageId,
        to: to
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Email configuration not working. Check backend logs.' 
      });
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send test email' 
    });
  }
});

export default router;
