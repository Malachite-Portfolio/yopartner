# YoPartner Production Readiness

## Production Mode Gating
- Runtime flag: `NEXT_PUBLIC_APP_MODE`
- Values:
  - `production`: disables demo fallbacks and demo data mutations
  - `demo`: keeps local demo behaviors for local development

## What Is Production-Gated Now
- User/Partner OTP demo fallback is blocked in production if Firebase config is missing.
- `/dev-tools` is hidden in production (redirects to `/`).
- Wallet fake recharge is disabled in production; recharge now depends on API connectivity.
- Local demo bookings are disabled in production; booking flow depends on API connectivity.
- Connect profile screens show unavailable state in production when companion API is not connected.
- User and partner chat/call demo simulations are blocked in production and show configuration-required states.
- Partner onboarding submit in production uses API submit path and does not create local demo records.
- Admin demo login/actions are blocked in production until real admin auth is wired.

## Required Backend Services
- Auth/session service (Firebase token verification + app session)
- Companions service (`list`, `detail`, `featured`)
- Wallet service (balance, transactions, recharge order, payment verification)
- Bookings service (create/list/cancel/detail)
- Partner service (onboarding, dashboard, chats, bookings, earnings, settings)
- Admin service (dashboard + moderation/ops endpoints)
- Realtime service for chat and call token lifecycle

## Required Database Tables (Indicative)
- users
- user_sessions
- companions
- companion_verifications
- partner_applications
- bookings
- wallet_accounts
- wallet_transactions
- payouts
- reviews
- support_tickets
- media_items
- client_diaries
- admin_users
- audit_logs

## Required Firebase Setup
- Phone Auth enabled
- Authorized domains include production domains (`yopartner.com`, `www.yopartner.com`, Vercel domain)
- Server-side Firebase Admin credentials configured in deployment env vars

## Required Payment Setup
- Gateway order creation endpoint
- Gateway signature verification endpoint
- Wallet credit only after verified payment callback
- Refund flow with server-side reconciliation

## Required Agora Setup
- Secure token APIs for RTC and chat
- Token expiry/refresh handling
- Participant/session state tracking in backend

## Required Admin Auth/Roles
- Real admin login (not localStorage)
- Role-based access control (`super_admin`, `ops_admin`, `support_admin`)
- Server-side permission checks for all admin mutations

## What Still Blocks Real Launch
- Backend APIs currently return `501 NOT_IMPLEMENTED`
- No production database wiring yet
- No real payment verification yet
- No live chat/call transport integration yet
- No production-grade admin authentication yet
