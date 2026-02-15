# Join Requests Button & Dialog Component

## Overview
Replaced the "Invite" button with a "Requests" button that shows pending join requests count and opens a dedicated dialog to manage all join requests.

## Changes Made

### 1. Removed
- ❌ "Invite" button from main action buttons area
- ❌ Inline invite dialog trigger

### 2. Added
- ✅ "Requests" button with pending count badge
- ✅ Dedicated Join Requests Dialog component
- ✅ Moved "Invite Code" option to Settings dropdown menu

## New Button Location

### Requests Button
**Position**: Main action buttons area (top of page)
**Visibility**: Team owners only
**Features**:
- Users icon
- "Requests" label
- Red badge with pending count (only shows if > 0)
- Opens join requests dialog on click

```
[Refresh] [Requests 3] [QR Code] [Edit Team] [⚙️]
           ↑ New button with badge
```

### Badge Indicator
- **Color**: Red (destructive variant)
- **Position**: Top-right corner of button
- **Shows**: Number of pending requests
- **Hidden**: When no pending requests

## Join Requests Dialog

### Layout
```
┌─────────────────────────────────────────────┐
│ Join Requests [3 Pending]                   │
│ Users who requested to join your team       │
├─────────────────────────────────────────────┤
│                                             │
│ [Scrollable Content Area]                  │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ [Avatar] Username        [PENDING]  │   │
│  │          email@example.com          │   │
│  │          🎮 PUBG (ID123)            │   │
│  │          📅 Requested: 2/14/2026    │   │
│  │                                     │   │
│  │  [✓ Approve]  [✗ Reject]           │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                              [Close]        │
└─────────────────────────────────────────────┘
```

### Features

#### Header
- Title: "Join Requests"
- Badge showing pending count
- Description text
- Fixed at top (doesn't scroll)

#### Content Area
- Scrollable list of all requests
- Pending requests highlighted in blue
- Approved/rejected requests in gray
- Each request shows:
  - User avatar (with gradient fallback)
  - Username
  - Email
  - Game name and ID (if available)
  - Request date and time
  - Status badge
  - Action buttons (for pending only)

#### Footer
- Close button
- Fixed at bottom (doesn't scroll)

### Request Card States

#### Pending (Blue)
- Blue background
- Blue border
- "PENDING" badge (default variant)
- Approve and Reject buttons visible

#### Approved (Gray)
- Gray background
- "APPROVED" badge (secondary variant)
- No action buttons

#### Rejected (Gray)
- Gray background
- "REJECTED" badge (destructive variant)
- No action buttons

### Actions

#### Approve Button
- Green background
- Checkmark icon
- Adds user to team
- Updates status to APPROVED
- Shows success toast
- Refreshes team data

#### Reject Button
- Red outline
- X icon
- Updates status to REJECTED
- Shows success toast
- Refreshes requests list

### Empty State
When no requests exist:
- Large Users icon (faded)
- "No Join Requests" heading
- Helpful message about team code/QR

### Loading State
- Spinning refresh icon
- Centered in dialog
- Shows while fetching requests

## Settings Dropdown Update

Added "Invite Code" option to Settings dropdown:
```
Team Settings
├── Edit Team Info
├── Add Member
├── Invite Code  ← NEW
└── Delete Team
```

## Technical Details

### State Management
```typescript
const [showRequestsDialog, setShowRequestsDialog] = useState(false);
const [joinRequests, setJoinRequests] = useState<any[]>([]);
const [isLoadingRequests, setIsLoadingRequests] = useState(false);
```

### Button Click Handler
```typescript
onClick={() => {
  setShowRequestsDialog(true);
  fetchJoinRequests(); // Fetch latest data
}}
```

### Dialog Features
- Max width: 3xl (768px)
- Max height: 90vh
- Flex column layout
- Fixed header and footer
- Scrollable content area
- Responsive padding

## User Flow

### Opening Dialog
1. User clicks "Requests" button
2. Dialog opens immediately
3. Join requests load in background
4. Pending requests show at top

### Managing Requests
1. User sees all requests in dialog
2. Pending requests highlighted in blue
3. User clicks "Approve" or "Reject"
4. Action processes immediately
5. Toast notification shows
6. Request status updates
7. Team roster updates (if approved)
8. Badge count updates

### Closing Dialog
- Click "Close" button
- Click outside dialog
- Press Escape key

## Visual Design

### Colors
- **Pending**: Blue (#3b82f6)
- **Approved**: Gray (secondary)
- **Rejected**: Red (destructive)
- **Approve Button**: Green (#16a34a)
- **Reject Button**: Red outline

### Icons
- 👥 Users (button and empty state)
- ✓ Check (approve)
- ✗ X Circle (reject)
- 🎮 Game controller (game name)
- 📅 Calendar (date)
- 🔄 Refresh (loading)

### Spacing
- Card padding: 16px
- Gap between cards: 12px
- Button gap: 8px
- Avatar size: 48px

## Responsive Design

### Mobile (< 640px)
- Full width dialog
- Stacked buttons
- Smaller text
- Compact spacing

### Tablet (640px - 1024px)
- Wider dialog
- Side-by-side buttons
- Better spacing

### Desktop (> 1024px)
- Max width dialog
- Optimal layout
- Generous spacing

## Benefits

### For Team Owners
- ✅ Quick access from main page
- ✅ See pending count at a glance
- ✅ Manage all requests in one place
- ✅ No need to navigate to Management tab
- ✅ Cleaner action buttons area

### For UX
- ✅ Dedicated component for requests
- ✅ Better organization
- ✅ Clearer visual hierarchy
- ✅ Faster access to important feature
- ✅ Less clutter in main UI

## Files Modified

1. **frontend/src/app/dashboard/teams/[id]/page.tsx**
   - Removed Invite button from action buttons
   - Added Requests button with badge
   - Added showRequestsDialog state
   - Added Join Requests Dialog component
   - Moved Invite Code to Settings dropdown
   - Added dialog open handler

## Testing Checklist

- [x] Requests button shows in action area
- [x] Badge shows correct pending count
- [x] Badge hidden when no pending requests
- [x] Dialog opens on button click
- [x] Requests load automatically
- [x] Pending requests highlighted
- [x] Approve button works
- [x] Reject button works
- [x] Status updates correctly
- [x] Toast notifications show
- [x] Empty state displays
- [x] Loading state works
- [x] Dialog closes properly
- [x] Responsive on all devices
- [x] Invite Code in Settings dropdown

## Comparison

### Before
```
[Refresh] [Invite] [QR] [Edit] [⚙️]
```

### After
```
[Refresh] [Requests 3] [QR] [Edit] [⚙️]
                ↑ Badge shows pending count
```

The new design provides better visibility and quicker access to join requests while keeping the UI clean and organized!
