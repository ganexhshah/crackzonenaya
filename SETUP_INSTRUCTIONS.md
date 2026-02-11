# Quick Setup Instructions

## ⚠️ Important: Stop Running Servers First

Before running these commands, make sure to stop any running backend servers to avoid file permission issues.

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Configure Google OAuth

1. Follow the detailed guide in `GOOGLE_OAUTH_SETUP.md` to get your Google Client ID
2. Update environment variables:

**backend/.env**
```env
GOOGLE_CLIENT_ID=your_actual_google_client_id
```

**frontend/.env.local**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_google_client_id
```

## Step 3: Update Database Schema

```bash
cd backend
npx prisma generate
npx prisma db push
```

If you get permission errors, stop your backend server first, then try again.

## Step 4: Start Development Servers

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Step 5: Test Google Login

1. Open browser to `http://localhost:3000/auth/login`
2. Click the "Google" button
3. Sign in with your Google account
4. Verify the flow:
   - New users → Profile Setup page
   - Existing users with profile → Dashboard

## Troubleshooting

### Prisma Permission Error
- Stop all running backend servers
- Close any terminals running the backend
- Run `npx prisma generate` again

### Google Login Not Working
- Check that GOOGLE_CLIENT_ID is set in both .env files
- Verify the Client ID matches your Google Cloud Console
- Check browser console for errors
- Make sure http://localhost:3000 is added to authorized origins in Google Cloud Console

### "Invalid Client ID" Error
- Double-check your Client ID in Google Cloud Console
- Make sure you copied the entire Client ID
- Verify no extra spaces in the .env files

## Production Deployment

When deploying to production:

1. Add production URLs to Google Cloud Console authorized origins
2. Set environment variables on your hosting platform:
   - Backend: `GOOGLE_CLIENT_ID`
   - Frontend: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
3. Run database migrations on production
4. Test the login flow on production URL

## What's Been Implemented

✅ Google OAuth login button on login page
✅ Backend API endpoint for Google authentication
✅ Automatic user creation for new Google users
✅ Smart routing: new users → profile setup, existing → dashboard
✅ Account linking for existing email addresses
✅ Database schema updated to support OAuth
✅ All dependencies installed

## Files Modified

### Backend
- `prisma/schema.prisma` - Added OAuth fields
- `src/routes/auth.routes.ts` - Added Google OAuth endpoint
- `package.json` - Added google-auth-library
- `.env` & `.env.example` - Added GOOGLE_CLIENT_ID

### Frontend
- `src/app/layout.tsx` - Added GoogleOAuthProvider
- `src/app/auth/login/page.tsx` - Added Google login button
- `src/contexts/AuthContext.tsx` - Added googleLogin method
- `src/lib/auth.ts` - Added googleLogin service
- `package.json` - Added @react-oauth/google
- `.env.local` & `.env.example` - Added NEXT_PUBLIC_GOOGLE_CLIENT_ID

## Need Help?

Refer to:
- `GOOGLE_OAUTH_SETUP.md` - Detailed Google OAuth setup
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
