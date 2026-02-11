# Google Login Flow Diagram

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User visits /auth/login                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Clicks "Google" Button                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Google OAuth Popup Opens                            │
│         User signs in with Google account                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         Google returns user info & access token                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│      Frontend sends credential to backend                        │
│           POST /api/auth/google                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend verifies Google token                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐    ┌───────────────────┐
    │   User Exists?    │    │   Create New      │
    │   Link Google ID  │    │   User Account    │
    └─────────┬─────────┘    └─────────┬─────────┘
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │   Generate JWT Token             │
        │   Return user info + flags       │
        │   - isNewUser                    │
        │   - hasProfile                   │
        └──────────────┬───────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │   Frontend receives response     │
        │   Stores token & user info       │
        └──────────────┬───────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  New User OR     │    │  Existing User   │
│  No Profile?     │    │  With Profile?   │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  Redirect to     │    │  Redirect to     │
│ /profile/setup   │    │   /dashboard     │
└──────────────────┘    └──────────────────┘
```

## Technical Flow

### 1. Frontend (Login Page)
```typescript
User clicks Google button
  ↓
useGoogleLogin hook triggered
  ↓
Google OAuth popup opens
  ↓
User authenticates with Google
  ↓
Receive access token from Google
  ↓
Fetch user info from Google API
  ↓
Send to backend: POST /api/auth/google
```

### 2. Backend (Auth Routes)
```typescript
Receive Google credential
  ↓
Parse credential (JSON or ID token)
  ↓
Verify with Google (if ID token)
  ↓
Extract: email, name, picture, googleId
  ↓
Check database for existing user
  ↓
┌─────────────────────────────┐
│ User exists with this email?│
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
   YES           NO
    │             │
    ▼             ▼
Link Google   Create new
account       user account
    │             │
    └──────┬──────┘
           │
           ▼
Check if user has profile
           │
           ▼
Generate JWT token
           │
           ▼
Return response:
- token
- user info
- isNewUser flag
- hasProfile flag
```

### 3. Frontend (Auth Context)
```typescript
Receive backend response
  ↓
Store token in localStorage
  ↓
Store user in state
  ↓
Check flags:
  ↓
┌─────────────────────────────┐
│ isNewUser OR !hasProfile?   │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
   YES           NO
    │             │
    ▼             ▼
/profile/setup  /dashboard
```

## Database Schema

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  username   String   @unique
  password   String?  // Optional for OAuth users
  googleId   String?  @unique  // NEW
  provider   AuthProvider @default(LOCAL)  // NEW
  isVerified Boolean  @default(false)
  profile    Profile?
  // ... other fields
}

enum AuthProvider {
  LOCAL
  GOOGLE
  FACEBOOK
}
```

## API Endpoints

### POST /api/auth/google
**Request:**
```json
{
  "credential": "google_user_info_json_or_id_token"
}
```

**Response (New User):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@gmail.com",
    "username": "user1234",
    "fullName": "John Doe",
    "avatar": "https://...",
    "role": "USER",
    "isVerified": true
  },
  "isNewUser": true,
  "hasProfile": false
}
```

**Response (Existing User):**
```json
{
  "token": "jwt_token_here",
  "user": { /* user info */ },
  "isNewUser": false,
  "hasProfile": true
}
```

## Security Features

1. **Token Verification**: Google tokens are verified server-side
2. **JWT Authentication**: Standard JWT tokens for session management
3. **Auto-verification**: OAuth users are automatically verified
4. **Account Linking**: Existing emails are automatically linked
5. **No Password Required**: OAuth users don't need passwords
6. **Secure Storage**: Tokens stored in localStorage (client-side)

## Error Handling

### Frontend
- Invalid credentials → Show error message
- Network error → Show error message
- Google popup blocked → User notification

### Backend
- Invalid token → 400 Bad Request
- Missing credential → 400 Bad Request
- Server error → 500 Internal Server Error
- Database error → 500 Internal Server Error

## Environment Variables Required

### Backend
```env
GOOGLE_CLIENT_ID=your_google_client_id
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
```

### Frontend
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_API_URL=your_api_url
```
