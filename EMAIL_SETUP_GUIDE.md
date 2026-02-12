# Gmail Email Setup Guide

## Current Issue
❌ Gmail authentication failed with error: "Username and Password not accepted"

## Solution: Generate a New Gmail App Password

### Step 1: Enable 2-Step Verification (if not already enabled)

1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "How you sign in to Google", click "2-Step Verification"
4. Follow the prompts to enable 2-Step Verification

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. You may need to sign in again
3. Under "Select app", choose "Mail" or "Other (Custom name)"
4. If you choose "Other", enter: "CrackZone App"
5. Click "Generate"
6. Google will show you a 16-character password (like: `abcd efgh ijkl mnop`)
7. **Copy this password** (remove spaces: `abcdefghijklmnop`)

### Step 3: Update Your .env File

Open `backend/.env` and update:

```env
EMAIL_USER=hello.ganeshshah@gmail.com
EMAIL_PASSWORD=your_new_16_char_app_password_here
EMAIL_FROM=hello.ganeshshah@gmail.com
```

**Important:** 
- Use the 16-character app password, NOT your regular Gmail password
- Remove all spaces from the app password
- Keep the quotes if there are special characters

### Step 4: Test the Email

After updating the .env file, run:

```bash
cd backend
node test-email.js
```

You should see:
```
✅ SMTP connection verified!
✅ Email sent successfully!
🎉 Check your inbox at ganesh.ffx@gmail.com
```

## Alternative: Use a Different Email Service

If Gmail doesn't work, you can use other services:

### Option 1: SendGrid (Recommended for Production)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### Option 2: Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your_mailgun_password
EMAIL_FROM=noreply@yourdomain.com
```

### Option 3: Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your_password
EMAIL_FROM=your-email@outlook.com
```

## Troubleshooting

### Error: "Username and Password not accepted"
- ✅ Make sure 2-Step Verification is enabled
- ✅ Generate a NEW app password
- ✅ Copy the app password correctly (no spaces)
- ✅ Use the app password, not your regular password

### Error: "Connection timeout"
- ✅ Check your internet connection
- ✅ Make sure port 587 is not blocked by firewall
- ✅ Try port 465 with `secure: true`

### Error: "Self-signed certificate"
- ✅ Already handled in config with `rejectUnauthorized: false`

## Testing After Setup

1. **Test with script:**
   ```bash
   cd backend
   node test-email.js
   ```

2. **Test registration:**
   - Go to http://localhost:3000/auth/register
   - Register with ganesh.ffx@gmail.com
   - Check your email for OTP

3. **Test forgot password:**
   - Go to http://localhost:3000/auth/forgot-password
   - Enter ganesh.ffx@gmail.com
   - Check your email for reset link

## Current Configuration

Your current setup in `backend/.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hello.ganeshshah@gmail.com
EMAIL_PASSWORD=qdbwxiufuijzrref (❌ Not working)
EMAIL_FROM=hello.ganeshshah@gmail.com
```

**Action Required:** Generate a new app password and update `EMAIL_PASSWORD`

## Quick Fix Steps

1. Visit: https://myaccount.google.com/apppasswords
2. Generate new app password for "CrackZone"
3. Copy the 16-character password
4. Update `backend/.env` → `EMAIL_PASSWORD=new_password_here`
5. Run: `cd backend && node test-email.js`
6. Check ganesh.ffx@gmail.com inbox

## Need Help?

If you continue to have issues:
1. Make sure you're using the correct Google account (hello.ganeshshah@gmail.com)
2. Verify 2-Step Verification is ON
3. Try generating a new app password
4. Check if Gmail is blocking the login attempt (check security alerts)
5. Consider using SendGrid for production (more reliable)
