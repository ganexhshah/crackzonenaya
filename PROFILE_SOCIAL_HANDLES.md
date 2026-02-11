# Profile Social Handles Feature

## Overview
Enhanced user profile page to display game ID and game name prominently, along with social handles (Discord and Instagram) with an easy-to-use edit interface.

## Features Added

### Frontend (`/dashboard/profile/[id]`)

#### Primary Game Account Display
- **Game ID**: Displayed in a large, prominent card with purple gradient background
  - Font: Monospace for better readability
  - Size: 2xl bold text
  - Visual: Purple gradient with border
- **Game Name**: Displayed in a large, prominent card with indigo gradient background
  - Size: 2xl bold text
  - Visual: Indigo gradient with border

#### Additional Game Details
- Shows alternative game IDs and usernames from Profile model
- Rank badge with star icon
- Organized in a separate section for clarity

#### Social Handles Section
- **Discord**: Icon with username display (indigo colored)
- **Instagram**: Icon with handle display (pink colored)
- Visual cards with colored icons and hover effects
- Shows "Not set" for own profile, "Private" for others

#### Edit Dialog
- Modal popup to edit social handles
- Input fields for Discord username
- Input field for Instagram handle
- Save/Cancel buttons with loading states

### Backend Updates

#### Database Schema
- Added `instagramHandle` field to Profile model
- User model already has `gameName` and `gameId` fields

#### API Endpoints
- **GET `/users/:id`**: Returns user profile including `gameName` and `gameId`
- **PUT `/users/:id/profile`**: Update specific user's profile (own profile only)
- **PUT `/users/profile`**: Update current user's profile
- All endpoints now support `instagramHandle` field

#### Validation
- Users can only update their own profiles
- Authentication required for all operations

## UI Layout

### Primary Game Account (Top Section)
```
┌─────────────────────────────────────────┐
│ Primary Game Account                    │
├─────────────────┬───────────────────────┤
│   Game ID       │   Game Name           │
│ 1234567890      │ PlayerName            │
│ (Purple card)   │ (Indigo card)         │
└─────────────────┴───────────────────────┘
```

### Additional Details (Middle Section)
```
┌─────────────────────────────────────────┐
│ Additional Game Details                 │
├──────────┬──────────┬───────────────────┤
│ Alt ID   │ Alt Name │ Rank              │
└──────────┴──────────┴───────────────────┘
```

### Social Handles (Bottom Section)
```
┌─────────────────────────────────────────┐
│ Social Handles          [Edit Socials]  │
├─────────────────┬───────────────────────┤
│ 🎮 Discord      │ 📷 Instagram          │
│ username#1234   │ @username             │
└─────────────────┴───────────────────────┘
```

## Usage

### For Users
1. Navigate to profile: `/dashboard/profile/[user-id]`
2. View game ID and game name in prominent cards at the top
3. Click "Edit Socials" button to update social handles
4. Enter Discord username (e.g., `username#1234`)
5. Enter Instagram handle (e.g., `@username`)
6. Click "Save Changes"

### API Example
```typescript
// Get user profile with game info
const profile = await api.get(`/users/${userId}`);
// Returns: { gameName, gameId, profile: { ... } }

// Update social handles
await api.put(`/users/${userId}/profile`, {
  discordId: 'username#1234',
  instagramHandle: '@username'
});
```

## UI Components Used
- Dialog (shadcn/ui) - For edit modal
- Input (shadcn/ui) - For text inputs
- Label (shadcn/ui) - For form labels
- Button (shadcn/ui) - For actions
- Card (shadcn/ui) - For information display
- Badge (shadcn/ui) - For rank display
- Separator (shadcn/ui) - For visual separation
- Lucide Icons - Discord (MessageCircle), Instagram, Edit, Save, X, Gamepad2, Star

## Visual Design
- **Primary cards**: Gradient backgrounds with 2xl bold text
- **Secondary cards**: Muted backgrounds with borders
- **Icons**: Colored circles with brand colors (Discord: indigo, Instagram: pink)
- **Responsive**: Grid layout adapts to screen size
- **Hover effects**: Cards have subtle hover transitions

## Database Migration
The `instagramHandle` field was added to the Profile table using:
```bash
npx prisma db push
```

## Security
- Authentication required for all profile operations
- Users can only update their own profiles
- Profile data is validated on the backend
- Email addresses are masked for non-owners
