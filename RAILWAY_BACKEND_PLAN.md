# YoPartner Railway Backend Plan

## 1) Railway Services Required
- PostgreSQL database service
- Backend API service
- Environment variable management
- Firebase Admin credentials (server-side only)
- Agora credentials (token generation + chat/call auth)
- Payment gateway credentials (later phase)

## 2) Recommended Backend Stack
- Option A: Next.js API routes (monorepo)
- Option B: Separate Node.js service (NestJS/Express/Fastify)
- ORM: Prisma
- Database: PostgreSQL (Railway)
- Auth: Firebase Admin token verification
- Roles: `USER`, `PARTNER`, `ADMIN`

## 3) Core Database Tables
- `users`
- `partners`
- `partner_applications`
- `companions`
- `services`
- `bookings`
- `sessions`
- `wallet_accounts`
- `wallet_transactions`
- `payments`
- `payouts`
- `reviews`
- `support_tickets`
- `media_items`
- `client_diaries`
- `verification_records`
- `admin_users`
- `audit_logs`

## 4) API Groups
- `auth`
- `users`
- `companions`
- `bookings`
- `wallet`
- `payments`
- `sessions`
- `chat`
- `partner`
- `admin`
- `support`
- `media`
- `reports`

## 5) Railway Deployment Checklist
1. Create a new Railway project.
2. Add PostgreSQL service.
3. Add backend API service.
4. Configure `DATABASE_URL`.
5. Configure Firebase Admin environment variables.
6. Configure admin bootstrap allowlist:
   - `ADMIN_UID_ALLOWLIST`
   - `ADMIN_PHONE_ALLOWLIST`
7. Configure Agora environment variables.
8. Run Prisma commands on Railway:
   - `npm run prisma:generate`
   - `npx prisma migrate deploy`
9. Deploy backend API.
10. Set frontend `NEXT_PUBLIC_API_BASE_URL` to Railway API URL.
