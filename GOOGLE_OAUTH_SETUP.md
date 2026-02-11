# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your application.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "GameHub Auth")
5. Click "Create"

## Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in the required information:
   - App name: Your app name (e.g., "GameHub")
   - User support email: Your email
   - Developer contact information: Your email
5. Click "Save and Continue"
6. Skip the "Scopes" section (click "Save and Continue")
7. Add test users if needed (for development)
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Configure the following:
   - Name: "Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
5. Click "Create"
6. Copy the "Client ID" (you'll need this)

## Step 5: Configure Environment Variables

### Backend (.env)

Add the following to your `backend/.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Frontend (.env.local)

Add the following to your `frontend/.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Replace `your_google_client_id_here` with the actual Client ID from Step 4.

## Step 6: Update Database Schema

Run the following commands to update your database:

```bash
cd backend
npm install google-auth-library
npx prisma generate
npx prisma db push
```

## Step 7: Install Frontend Dependencies

```bash
cd frontend
npm install @react-oauth/google
```

## Step 8: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:3000/auth/login`
4. Click the "Google" button
5. Sign in with your Google account

## How It Works

### New Users
- When a user signs in with Google for the first time:
  1. A new user account is created automatically
  2. User is redirected to `/profile/setup` to complete their gaming profile
  3. After setup, they can access the dashboard

### Existing Users
- When an existing user signs in with Google:
  1. System checks if they have a profile
  2. If profile exists: redirect to `/dashboard`
  3. If no profile: redirect to `/profile/setup`

### Account Linking
- If a user already has an account with the same email:
  - The Google account is automatically linked to the existing account
  - User can sign in with either email/password or Google

## Security Notes

- Google OAuth tokens are verified on the backend
- User passwords are optional for OAuth users
- All OAuth users are automatically verified
- JWT tokens are used for session management

## Troubleshooting

### "Invalid Client ID" Error
- Make sure the Client ID in your .env files matches the one from Google Cloud Console
- Check that you've added the correct authorized origins

### "Redirect URI Mismatch" Error
- Verify that your redirect URIs in Google Cloud Console match your application URLs
- Make sure to include both http://localhost:3000 for development

### Google Button Not Working
- Check browser console for errors
- Verify that @react-oauth/google is installed
- Make sure NEXT_PUBLIC_GOOGLE_CLIENT_ID is set correctly

## Production Deployment

When deploying to production:

1. Add your production domain to authorized origins in Google Cloud Console
2. Update environment variables on your hosting platform (Vercel, etc.)
3. Make sure both frontend and backend have the correct GOOGLE_CLIENT_ID

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google Library](https://www.npmjs.com/package/@react-oauth/google)
- [Google Cloud Console](https://console.cloud.google.com/)
