# Team Join Requests Feature

## Overview
Added a comprehensive join requests section in the team management tab that shows all users who have requested to join the team, with approve/reject functionality.

## Features Added

### 1. Join Requests Section
Located at the bottom of the "Management" tab (owner only), displays:
- All join requests (pending, approved, rejected)
- User profile information
- Request timestamp
- Status badges
- Action buttons for pending requests

### 2. Visual Design

#### Request Card Layout
```
┌─────────────────────────────────────────────┐
│ [Avatar]  Username                  [Badge] │
│           email@example.com                 │
│           Game: PUBG (ID123)                │
│           Requested: 2/14/2026, 10:30 PM    │
│                                             │
│  [✓ Approve]  [✗ Reject]                   │
└─────────────────────────────────────────────┘
```

#### Status Indicators
- **Pending**: Blue background + blue border + "PENDING" badge
- **Approved**: Gray background + "APPROVED" badge
- **Rejected**: Gray background + red "REJECTED" badge

#### Badge Counter
- Shows number of pending requests in section header
- Red badge with count (e.g., "3")
- Only visible when there are pending requests

### 3. User Information Displayed
For each join request:
- User avatar (with gradient fallback)
- Username
- Email address
- Game name and ID (if available)
- Request date and time
- Current status

### 4. Actions Available

#### For Pending Requests
- **Approve Button**: Green button with checkmark
  - Adds user to team as member
  - Updates request status to APPROVED
  - Refreshes team data
  
- **Reject Button**: Red outline button with X icon
  - Updates request status to REJECTED
  - User remains not in team

#### Refresh Button
- Manual refresh button in header
- Spinning icon while loading
- Fetches latest join requests

### 5. Empty State
When no join requests exist:
- Users icon (large, faded)
- "No join requests yet" message
- Helpful hint: "Users can request to join using your team code or QR code"

## Technical Implementation

### State Management
```typescript
const [joinRequests, setJoinRequests] = useState<any[]>([]);
const [isLoadingRequests, setIsLoadingRequests] = useState(false);
```

### API Endpoints Used
- `GET /teams/:id/join-requests` - Fetch all join requests
- `POST /teams/:id/join-requests/:requestId/approve` - Approve request
- `POST /teams/:id/join-requests/:requestId/reject` - Reject request

### Functions Added
```typescript
// Fetch join requests from backend
const fetchJoinRequests = async () => {
  // Loads all requests for the team
}

// Handle approve/reject actions
const handleJoinRequestAction = async (requestId, action) => {
  // Processes the request and refreshes data
}
```

### Auto-Loading
- Automatically fetches join requests when:
  - Team page loads (if user is owner)
  - User navigates to Management tab
  - After approving/rejecting a request

## User Flow

### For Team Owner
1. Navigate to team details page
2. Click "Management" tab
3. Scroll to "Join Requests" section
4. See all pending requests with user info
5. Click "Approve" to add user to team
6. OR click "Reject" to decline request
7. Request status updates immediately
8. Team roster updates automatically

### Request States
```
User submits join request
  ↓
Status: PENDING (shows in blue card)
  ↓
Owner clicks Approve → Status: APPROVED (gray card, user added to team)
  OR
Owner clicks Reject → Status: REJECTED (gray card, user not added)
```

## Responsive Design

### Mobile (< 640px)
- Stacked layout
- Full-width buttons
- Smaller text sizes
- Compact spacing
- Avatar: 40px

### Tablet (640px - 1024px)
- Side-by-side buttons
- Better spacing
- Avatar: 48px

### Desktop (> 1024px)
- Optimal layout
- Generous spacing
- Avatar: 48px
- Comfortable reading

## Visual Feedback

### Loading States
- Spinning refresh icon while fetching
- Disabled buttons during actions
- Loading spinner in empty state

### Success/Error Messages
- Toast notification on approve: "Request approved!"
- Toast notification on reject: "Request rejected"
- Error toast if action fails

### Status Colors
- **Pending**: Blue (#3b82f6)
- **Approved**: Gray (secondary)
- **Rejected**: Red (destructive)

## Benefits

### For Team Owners
- ✅ See all join requests in one place
- ✅ View complete user information
- ✅ Quick approve/reject actions
- ✅ Track request history
- ✅ No need to manually add users

### For Platform
- ✅ Streamlined team joining process
- ✅ Better user management
- ✅ Audit trail of requests
- ✅ Reduced manual work

## Integration Points

### Existing Features
- Works with existing team invite system
- Complements QR code invites
- Integrates with team member management
- Updates team roster automatically

### Backend Requirements
- Team join request model (already exists)
- Join request endpoints (already exist)
- User data in requests (already included)

## Files Modified

1. **frontend/src/app/dashboard/teams/[id]/page.tsx**
   - Added join requests state
   - Added fetch function
   - Added action handler
   - Added join requests section UI
   - Added XCircle icon import
   - Added auto-loading effect

## Testing Checklist

- [x] Join requests load on page load
- [x] Pending requests show in blue
- [x] Approved/rejected requests show in gray
- [x] Badge counter shows correct number
- [x] Approve button adds user to team
- [x] Reject button updates status
- [x] Refresh button works
- [x] Empty state displays correctly
- [x] Responsive on mobile
- [x] Responsive on tablet
- [x] Responsive on desktop
- [x] Toast notifications work
- [x] User info displays correctly
- [x] Timestamps format correctly

## Future Enhancements

Potential additions:
- Filter by status (pending/approved/rejected)
- Search join requests
- Bulk approve/reject
- Request notes/messages
- Notification when new request arrives
- Request expiration
- Auto-reject after X days
