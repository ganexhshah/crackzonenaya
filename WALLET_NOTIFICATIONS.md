# Wallet System Notifications

## Overview
Added comprehensive notification system for all wallet operations including deposits, withdrawals, and transaction reports.

## Features Added

### 1. Deposit Notifications
- **Deposit Submitted**: When user submits a deposit request
  - Title: "Deposit Request Submitted"
  - Message: Shows amount and reference number
  - Link: `/dashboard/wallet`

- **Deposit Approved**: When admin approves deposit
  - Title: "Deposit Approved ✓"
  - Message: Confirms amount added to wallet
  - Link: `/dashboard/wallet`

- **Deposit Rejected**: When admin rejects deposit
  - Title: "Deposit Rejected"
  - Message: Asks user to verify payment details
  - Link: `/dashboard/wallet`

### 2. Withdrawal Notifications
- **Withdrawal Submitted**: When user requests withdrawal
  - Title: "Withdrawal Request Submitted"
  - Message: Confirms amount deducted from wallet
  - Link: `/dashboard/wallet`

- **Withdrawal Completed**: When admin completes withdrawal
  - Title: "Withdrawal Completed ✓"
  - Message: Confirms successful processing
  - Link: `/dashboard/wallet`

- **Withdrawal Failed**: When withdrawal fails
  - Title: "Withdrawal Failed - Refunded"
  - Message: Confirms refund to wallet
  - Link: `/dashboard/wallet`

### 3. Transaction Report Notifications
- **Report Submitted**: When user creates a report
  - Title: "Issue Report Submitted"
  - Message: Confirms submission and 24-hour review time
  - Link: `/dashboard/reports`

- **Report Under Review**: When admin starts reviewing
  - Title: "Report Under Review 🔍"
  - Message: Informs user team is reviewing
  - Link: `/dashboard/reports`

- **Report Resolved**: When admin resolves the issue
  - Title: "Report Resolved ✓"
  - Message: Confirms resolution with admin response
  - Link: `/dashboard/reports`

- **Report Rejected**: When admin rejects the report
  - Title: "Report Rejected ✗"
  - Message: Shows admin response
  - Link: `/dashboard/reports`

## Files Modified

### Backend Routes
1. **backend/src/routes/transaction.routes.ts**
   - Added notification import
   - Added notifications for deposit submission
   - Added notifications for withdrawal submission
   - Added notifications for transaction status updates (admin)

2. **backend/src/routes/admin.routes.ts**
   - Added notification import
   - Added notifications for deposit approval/rejection
   - Added notifications for withdrawal completion/failure
   - Added notifications for report status updates

3. **backend/src/routes/transaction-report.routes.ts**
   - Added notification import
   - Added notification for report submission

### New Utility File
4. **backend/src/utils/walletNotifications.ts**
   - Centralized notification creation functions
   - Helper functions for all wallet notification types
   - Consistent formatting and messaging

## Notification Flow

### Deposit Flow
```
User submits deposit
  ↓
📧 Email + 🔔 Notification: "Deposit Request Submitted"
  ↓
Admin reviews
  ↓
Admin approves/rejects
  ↓
📧 Email + 🔔 Notification: "Deposit Approved ✓" or "Deposit Rejected"
```

### Withdrawal Flow
```
User requests withdrawal
  ↓
🔔 Notification: "Withdrawal Request Submitted"
  ↓
Admin processes
  ↓
Admin completes/fails
  ↓
🔔 Notification: "Withdrawal Completed ✓" or "Withdrawal Failed - Refunded"
```

### Report Flow
```
User creates report
  ↓
📧 Email + 🔔 Notification: "Issue Report Submitted"
  ↓
Admin reviews
  ↓
Admin updates status
  ↓
📧 Email + 🔔 Notification: Status update with admin response
```

## Database Schema
Uses existing `Notification` model with:
- `type`: 'WALLET' for all wallet notifications
- `link`: Direct link to relevant page
- `isRead`: Track read/unread status
- `createdAt`: Timestamp for sorting

## Next Steps
1. Run `npx prisma generate` to regenerate Prisma client
2. Test all notification flows
3. Verify notifications appear in user dashboard
4. Check email + notification delivery for each scenario

## API Endpoints
Existing notification endpoints (no changes needed):
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/clear/read` - Clear read notifications
