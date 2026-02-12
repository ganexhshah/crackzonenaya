# Notifications System Implementation

## Overview
Complete notifications system that tracks all activities across wallet, teams, tournaments, matches, scrims, and more.

## Features Implemented

### Backend

#### Database Schema Updates
Updated `NotificationType` enum in `backend/prisma/schema.prisma`:
```prisma
enum NotificationType {
  MATCH
  TOURNAMENT
  TEAM
  PAYMENT
  WALLET
  SCRIM
  TEAM_INVITE
  TEAM_JOIN
  MATCH_RESULT
  TOURNAMENT_START
  TRANSACTION
  SYSTEM
  ANNOUNCEMENT
}
```

#### API Endpoints (`/api/notifications`)

1. **GET `/`** - Get all notifications for current user
   - Returns: `{ notifications, unreadCount }`
   - Sorted by newest first

2. **GET `/unread-count`** - Get unread notifications count
   - Returns: `{ count }`

3. **PATCH `/:id/read`** - Mark notification as read
   - Params: `id` (notification ID)
   - Returns: Updated notification

4. **PATCH `/mark-all-read`** - Mark all notifications as read
   - Returns: Success message

5. **DELETE `/:id`** - Delete notification
   - Params: `id` (notification ID)
   - Returns: Success message

6. **DELETE `/clear/read`** - Delete all read notifications
   - Returns: Success message

#### Helper Function
```typescript
createNotification(userId, title, message, type, link?)
```
Use this function throughout your app to create notifications.

### Frontend

#### Notifications Page (`/dashboard/notifications`)

Features:
- ✅ View all notifications in one place
- ✅ Filter by read/unread status
- ✅ Filter by notification type
- ✅ Mark individual notifications as read
- ✅ Mark all notifications as read
- ✅ Delete individual notifications
- ✅ Clear all read notifications
- ✅ Click notification to navigate to related page
- ✅ Beautiful icons for each notification type
- ✅ Color-coded by type
- ✅ Relative timestamps (e.g., "2 hours ago")
- ✅ Unread count badge
- ✅ Responsive design

#### Notification Types & Icons

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| MATCH | Swords | Orange | Match invites, updates |
| TOURNAMENT | Trophy | Purple | Tournament registrations, updates |
| TEAM | Users | Blue | Team updates, member changes |
| PAYMENT | DollarSign | Green | Payment confirmations |
| WALLET | Wallet | Emerald | Wallet transactions |
| SCRIM | Swords | Red | Scrim invites, updates |
| TEAM_INVITE | UserPlus | Cyan | Team invitations |
| TEAM_JOIN | Users | Indigo | Join requests |
| MATCH_RESULT | Trophy | Yellow | Match results |
| TOURNAMENT_START | Trophy | Pink | Tournament starting |
| TRANSACTION | DollarSign | Teal | Transaction updates |
| SYSTEM | Settings | Gray | System messages |
| ANNOUNCEMENT | Megaphone | Violet | Admin announcements |

#### Navigation

Added to:
- ✅ Desktop sidebar (2nd item)
- ✅ Mobile bottom navigation (2nd item)

### Service Layer

Created `frontend/src/services/notification.service.ts`:
```typescript
notificationService.getAll()
notificationService.getUnreadCount()
notificationService.markAsRead(id)
notificationService.markAllAsRead()
notificationService.delete(id)
notificationService.clearRead()
```

## How to Use

### Creating Notifications

In your backend routes, import and use the helper function:

```typescript
import { createNotification } from './routes/notification.routes';

// Example: Team invitation
await createNotification(
  userId,
  'Team Invitation',
  `You've been invited to join ${teamName}`,
  'TEAM_INVITE',
  `/dashboard/teams/${teamId}`
);

// Example: Match result
await createNotification(
  userId,
  'Match Result',
  `Your team won the match! +${points} points`,
  'MATCH_RESULT',
  `/dashboard/matches/${matchId}`
);

// Example: Wallet transaction
await createNotification(
  userId,
  'Payment Received',
  `₹${amount} has been credited to your wallet`,
  'WALLET',
  '/dashboard/wallet'
);

// Example: Tournament start
await createNotification(
  userId,
  'Tournament Starting',
  `${tournamentName} is starting in 30 minutes!`,
  'TOURNAMENT_START',
  `/dashboard/tournaments/${tournamentId}`
);
```

### Integration Points

Add notifications in these places:

#### 1. Team Operations
```typescript
// Team invitation sent
await createNotification(invitedUserId, 'Team Invitation', ...);

// Team join request
await createNotification(teamOwnerId, 'Join Request', ...);

// Member joined
await createNotification(memberId, 'Welcome to Team', ...);

// Member removed
await createNotification(memberId, 'Removed from Team', ...);
```

#### 2. Tournament Operations
```typescript
// Registration confirmed
await createNotification(userId, 'Tournament Registration', ...);

// Tournament starting soon
await createNotification(userId, 'Tournament Starting', ...);

// Tournament results
await createNotification(userId, 'Tournament Results', ...);
```

#### 3. Match Operations
```typescript
// Match scheduled
await createNotification(userId, 'Match Scheduled', ...);

// Match starting
await createNotification(userId, 'Match Starting', ...);

// Match result
await createNotification(userId, 'Match Result', ...);
```

#### 4. Wallet/Payment Operations
```typescript
// Payment received
await createNotification(userId, 'Payment Received', ...);

// Payment sent
await createNotification(userId, 'Payment Sent', ...);

// Withdrawal processed
await createNotification(userId, 'Withdrawal Processed', ...);

// Low balance warning
await createNotification(userId, 'Low Balance', ...);
```

#### 5. Scrim Operations
```typescript
// Scrim invitation
await createNotification(userId, 'Scrim Invitation', ...);

// Scrim starting
await createNotification(userId, 'Scrim Starting', ...);

// Scrim result
await createNotification(userId, 'Scrim Result', ...);
```

#### 6. System/Admin
```typescript
// System maintenance
await createNotification(userId, 'System Maintenance', ...);

// New feature announcement
await createNotification(userId, 'New Feature', ...);

// Account verification
await createNotification(userId, 'Account Verified', ...);
```

## Example Integration

### In Team Routes (`backend/src/routes/team.routes.ts`)

```typescript
import { createNotification } from './notification.routes';

// When inviting a user to team
router.post('/:id/invite', authenticate, async (req: any, res) => {
  // ... existing code ...
  
  // Create notification
  await createNotification(
    invitedUserId,
    'Team Invitation',
    `You've been invited to join ${team.name}`,
    'TEAM_INVITE',
    `/dashboard/teams/${team.id}`
  );
  
  res.json({ message: 'Invitation sent' });
});

// When user joins team
router.post('/:id/join', authenticate, async (req: any, res) => {
  // ... existing code ...
  
  // Notify team owner
  await createNotification(
    team.ownerId,
    'New Team Member',
    `${user.username} joined your team ${team.name}`,
    'TEAM_JOIN',
    `/dashboard/teams/${team.id}`
  );
  
  // Notify user
  await createNotification(
    req.user.id,
    'Welcome to Team',
    `You've successfully joined ${team.name}`,
    'TEAM',
    `/dashboard/teams/${team.id}`
  );
  
  res.json({ message: 'Joined team successfully' });
});
```

### In Transaction Routes (`backend/src/routes/transaction.routes.ts`)

```typescript
import { createNotification } from './notification.routes';

// When creating a transaction
router.post('/', authenticate, async (req: any, res) => {
  // ... existing code ...
  
  await createNotification(
    req.user.id,
    'Transaction Successful',
    `₹${amount} has been ${type === 'CREDIT' ? 'credited to' : 'debited from'} your wallet`,
    'TRANSACTION',
    '/dashboard/wallet'
  );
  
  res.json(transaction);
});
```

## Testing

### 1. Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### 2. Restart Backend
```bash
npm run dev
```

### 3. Test Notifications Page
1. Go to http://localhost:3000/dashboard/notifications
2. Should see empty state if no notifications
3. Create test notifications via API or through app actions

### 4. Test Filters
- Click "Unread" tab
- Click "Read" tab
- Click notification type filters
- Mark notifications as read
- Delete notifications

## UI Features

### Notification Card
- Icon with color-coded background
- Title and message
- Type badge
- Relative timestamp
- Mark as read button (for unread)
- Delete button
- Click to navigate

### Tabs
- All (total count)
- Unread (unread count)
- Read (read count)

### Type Filters
- All Types button
- Individual type buttons with icons
- Active state highlighting

### Actions
- Mark All Read button
- Clear Read button
- Individual mark as read
- Individual delete

### States
- Loading state with spinner
- Empty state with icon and message
- Unread badge in header
- Visual distinction for unread notifications

## Mobile Responsive

- ✅ Responsive grid layout
- ✅ Touch-friendly buttons
- ✅ Bottom navigation integration
- ✅ Optimized for small screens

## Next Steps

1. **Add Real-time Updates:**
   - Implement WebSocket for live notifications
   - Show toast notifications for new items
   - Update unread count in real-time

2. **Add Notification Preferences:**
   - Let users choose which notifications to receive
   - Email notification settings
   - Push notification settings

3. **Add Notification Grouping:**
   - Group similar notifications
   - "5 new team invitations"
   - Expandable groups

4. **Add Notification Sound:**
   - Play sound for new notifications
   - Customizable sounds

5. **Add Push Notifications:**
   - Browser push notifications
   - Mobile app push notifications

6. **Add Email Notifications:**
   - Send email for important notifications
   - Daily/weekly digest emails

## Database Migration

If you need to reset the database:
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev --name init
```

Or just update the enum:
```bash
npx prisma db push
```

## Summary

✅ Complete notifications system
✅ 13 notification types
✅ Beautiful UI with filters
✅ Mark as read/unread
✅ Delete notifications
✅ Navigation integration
✅ Mobile responsive
✅ Ready to integrate throughout app

The notifications page is now live at `/dashboard/notifications` and accessible from both desktop sidebar and mobile bottom navigation!
