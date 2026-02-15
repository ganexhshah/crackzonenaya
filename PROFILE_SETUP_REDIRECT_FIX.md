# Profile Setup Redirect Fix

## Issue Description
After completing profile setup at `/profile/setup`, when users login again with Google, they are redirected back to the setup page instead of the dashboard.

## Root Cause
The backend was checking if a `profile` record exists (`!!user.profile`), but not checking if the profile is actually **complete** with required gaming information.

**Problem**: A profile record could exist but be empty (no `gameId` or `gameUsername`), causing the system to think the profile is complete when it's not.

## Solution
Updated the Google login endpoint to check for **profile completion** instead of just profile existence.

### Before
```typescript
hasProfile: !!user.profile  // ❌ Only checks if record exists
```

### After
```typescript
// Check if profile is complete (has essential gaming info)
const hasCompleteProfile = user.profile && 
  user.profile.gameId && 
  user.profile.gameUsername;

hasProfile: hasCompleteProfile  // ✅ Checks for required fields
```

## Required Profile Fields
For a profile to be considered "complete":
- ✅ `gameId` - User's in-game ID
- ✅ `gameUsername` - User's in-game username

Optional fields (not required for completion):
- `rank` - Player rank
- `bio` - User biography
- `phone` - Phone number
- `country` - Country
- `discordId` - Discord ID
- `instagramHandle` - Instagram handle
- `stats` - Game statistics

## User Flow

### First Time Login (New User)
```
User logs in with Google
  ↓
Backend creates user account
  ↓
No profile exists
  ↓
hasProfile = false
  ↓
Redirect to /profile/setup ✅
```

### After Profile Setup
```
User completes profile setup
  ↓
Profile created with gameId and gameUsername
  ↓
User logs out
  ↓
User logs in again with Google
  ↓
Backend checks: profile exists AND has gameId AND has gameUsername
  ↓
hasProfile = true
  ↓
Redirect to /dashboard ✅
```

### Incomplete Profile
```
User has profile but missing gameId or gameUsername
  ↓
hasProfile = false
  ↓
Redirect to /profile/setup ✅
```

## Files Modified

### 1. backend/src/routes/auth.routes.ts
**Google Login Endpoint** (`POST /auth/google`)
- Added profile completion check
- Checks for `gameId` and `gameUsername`
- Returns `hasProfile: hasCompleteProfile`

### 2. frontend/src/app/dashboard/teams/[id]/page.tsx
**Invitation Error Handling**
- Improved error handling for duplicate invitations
- Shows info toast instead of error for "already invited"
- Marks user as invited in UI even if backend says already invited

## API Response

### Google Login Response
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "username",
    "fullName": "Full Name",
    "avatar": "https://...",
    "role": "USER",
    "isVerified": true
  },
  "isNewUser": false,
  "hasProfile": true  // ✅ Now checks for complete profile
}
```

## Frontend Logic (AuthContext)
```typescript
const googleLogin = async (credential: string) => {
  const response = await authService.googleLogin(credential);
  setUser(response.user);
  
  // Check if new user or user without complete profile
  if (response.isNewUser || !response.hasProfile) {
    router.push('/profile/setup');  // Setup needed
  } else {
    router.push('/dashboard');      // Profile complete
  }
};
```

## Testing Steps

### Test 1: New User
1. Login with Google (first time)
2. Should redirect to `/profile/setup`
3. Complete profile with gameId and gameUsername
4. Should redirect to `/dashboard`
5. Logout
6. Login with Google again
7. Should redirect to `/dashboard` ✅

### Test 2: Existing User with Complete Profile
1. Login with Google (existing user)
2. Should redirect to `/dashboard` ✅

### Test 3: Existing User with Incomplete Profile
1. User has profile but missing gameId
2. Login with Google
3. Should redirect to `/profile/setup` ✅
4. Complete missing fields
5. Should redirect to `/dashboard` ✅

## Benefits

### For Users
- ✅ No more repeated profile setup
- ✅ Smooth login experience
- ✅ Only prompted for setup when actually needed

### For System
- ✅ Ensures all users have complete gaming profiles
- ✅ Better data quality
- ✅ Proper user onboarding flow

## Additional Improvements

### Invitation Error Handling
Also improved the team invitation error handling:
- Duplicate invitation errors now show as info toast
- User is marked as "Invited" in UI
- Prevents confusion from repeated error messages

## Notes

- The fix requires backend server restart to take effect
- Existing users with incomplete profiles will be prompted to complete them on next login
- Profile completion check is only for Google login (can be extended to regular login if needed)
- The check is minimal (only gameId and gameUsername) to not be too restrictive
