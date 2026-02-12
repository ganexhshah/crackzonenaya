# System Design - CrackZoneNaya

## 1) Goal
Build a scalable esports platform with:
- Player features: auth, profile, teams, matches, tournaments, wallet, notifications, support.
- Admin features: moderation, operations, payments, tournaments/scrims management, analytics.

## 2) Current Architecture
- Frontend: Next.js 16 (App Router, client/server components) in `frontend/`.
- Backend: Express + TypeScript in `backend/`.
- Database: PostgreSQL with Prisma ORM.
- Auth: JWT + role-based authorization (`USER`, `ADMIN`, `MODERATOR`).
- File uploads: Multer (avatars, logos, receipts, evidence).
- Email: SMTP flow for OTP and password reset.

## 3) High-Level Components
1. Web App (Player + Admin UI)
2. API Gateway (Express routes under `/api/*`)
3. Domain Services (auth, team, tournament, transaction, support)
4. Data Layer (Prisma + Postgres)
5. Async/Side Effects (email, notification creation)
6. Storage (uploaded media)

## 4) Core Domains and Features
- Identity & Access
  - Register/login/local+Google, verify OTP, forgot/reset password, `/auth/me`.
- User & Profile
  - Profile read/update, avatar upload, wallet balance.
- Team Management
  - Create/edit teams, invites, join requests, members, team wallet and money requests.
- Match & Scrim
  - Match CRUD, status/result updates, admin scrim operations.
- Tournament
  - Public listing/details, registration, admin approval/rejection.
- Payments & Wallet
  - Deposit/withdrawal requests, admin transaction status handling, payment methods.
- Notifications
  - Fetch unread/read, mark read/all read, delete/clear read.
- Support Center
  - FAQs, contact form, tickets with messages/attachments, abuse reports.

## 5) Admin Panel Design
Admin routes already exist in frontend (`/admin/*`) and backend (`/api/admin/*`, `/api/support/admin/*`, `/api/payment-methods/*`, admin scrim/tournament endpoints).

### Admin Modules
1. Dashboard
- KPIs: users, teams, tournaments, matches, pending registrations, pending transactions.

2. User Management
- List/search users, view details, update status (`ACTIVE/SUSPENDED/BANNED`), update role, delete user.

3. Registration Review
- Approve/reject tournament registrations; show team/member context.

4. Payment Operations
- Review deposits/withdrawals, verify proof, approve/reject with audit log.

5. Tournament & Scrim Ops
- Create/edit/delete events, update room details, publish results.

6. Support & Moderation
- Ticket queue, assignment, status transitions, report review and resolution.

7. Notification Broadcast (recommended)
- Add admin announcement tool to create system-wide notifications.

8. Settings
- Payment methods, FAQ management, platform configs.

## 6) API Boundary (Suggested)
Keep this split stable:
- Player APIs: `/api/auth`, `/api/users`, `/api/teams`, `/api/matches`, `/api/tournaments`, `/api/transactions`, `/api/notifications`, `/api/support`
- Admin APIs: `/api/admin`, `/api/support/admin/*`, `/api/payment-methods` (admin ops), admin tournament/scrim mutation endpoints.

## 7) Data Model (Already Strong)
Main entities in Prisma:
- `User`, `Profile`, `Team`, `TeamMember`, `TeamJoinRequest`, `TeamInvitation`
- `Match`, `MatchPlayer`
- `Tournament`, `TournamentRegistration`
- `Transaction`, `TeamTransaction`, `TeamMoneyRequest`, `PaymentMethod`
- `Notification`
- `FAQ`, `SupportTicket`, `TicketMessage`, `Report`, `ContactMessage`

## 8) Security and Access Control
- Enforce `authenticate` on all private routes.
- Enforce `isAdmin`/`authorize('ADMIN')` on admin mutations.
- Validate all request bodies (Zod or Joi recommended).
- Add rate limits for auth, contact, ticket, report endpoints.
- Use signed URLs/private storage for sensitive uploads.

## 9) Reliability and Scalability
- Add Redis for cache/session/rate-limit counters.
- Move notifications and emails to a queue (BullMQ + Redis).
- Add DB indexes for dashboard/reporting queries.
- Add background jobs for analytics aggregation.

## 10) Observability
- Structured logging (request id, user id, route, latency).
- Error tracking (Sentry).
- Metrics: API latency, error rate, queue backlog, DB query duration.

## 11) Recommended Next Implementation Steps
1. Fix current type/build blockers (registration type mismatch).
2. Introduce shared API response typing between frontend and backend.
3. Add admin audit log table (`AdminActionLog`) for all sensitive actions.
4. Implement FAQ CRUD + announcement broadcast in admin panel.
5. Add queue-based notifications/email and retry policy.
6. Add automated tests for critical flows (auth, payments, admin moderation).

## 12) Suggested Admin RBAC Matrix
- `ADMIN`: full access.
- `MODERATOR`: support/reports/users(status only), no payment approval.
- `FINANCE_ADMIN` (future): transactions/payment methods only.

This design matches your existing codebase and can be implemented incrementally without major rewrites.
