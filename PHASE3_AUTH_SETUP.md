# YoPartner Phase 3 Auth Setup (Firebase Phone OTP)

## Overview
Phase 3 introduces Firebase Phone OTP for user and partner login while preserving demo fallback if Firebase env is missing.

## 1) Firebase Project Setup
1. Create/select a Firebase project.
2. In Firebase Web App setup, choose the **npm** option.
3. Do not use the script-tag integration for this project.
4. Use only Phone OTP auth setup, no `measurementId` is required.
5. Open Authentication > Sign-in method.
6. Enable **Phone** provider.
7. Add authorized domains for local testing:
   - `localhost`
   - `127.0.0.1`
8. (Recommended) Configure test phone numbers in Firebase Auth for development.

## 2) Environment Variables
Create `.env.local` (do not commit) based on `.env.local.example`.

Required client config:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Required server admin config:
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Private key format note:
- Keep it as a single escaped string in env and convert with:
  `privateKey.replace(/\\n/g, "\n")`

## 3) Auth Routes Added
- `POST /api/auth/session`
  - Input: `{ idToken, role: "user" | "partner" }`
  - Verifies ID token using Firebase Admin SDK
  - Returns: `uid`, `phoneNumber`, `role`, `isNewUser`

- `POST /api/auth/verify-token`
  - Input: `{ idToken }`
  - Returns decoded token info for testing

## 4) User Auth Flow
- `/login`
  - If Firebase client config exists: sends OTP via Firebase reCAPTCHA + phone auth
  - Else: falls back to demo OTP mode
- `/otp`
  - Verifies OTP via Firebase when pending confirmation exists
  - Calls `/api/auth/session` with role `user`
  - Stores test session keys in localStorage

## 5) Partner Auth Flow
- `/partner/login`
  - Same Firebase/demo split as user flow
- `/partner/otp`
  - Verifies OTP via Firebase when available
  - Calls `/api/auth/session` with role `partner`
  - Preserves onboarding redirect logic

## 6) Logout Behavior
- User and partner logout now:
  1. Attempt Firebase `signOut()`
  2. Clear local demo/Firebase auth keys
  3. Redirect to proper entry page

## 7) Dev Tools Support
`/dev-tools` now shows:
- Firebase client config presence
- Firebase admin config presence (API-based check)
- Current Firebase user UID/phone
- Test button for `/api/auth/verify-token`

## 8) Security Notes
- Never expose Firebase Admin private key to frontend.
- Never commit `.env.local`.
- Use only `NEXT_PUBLIC_*` keys on client.
- Keep Admin SDK usage server-only (`app/api/*` routes).
- Do not log tokens/secrets in console.
- Generate Firebase service-account private key only for server-side admin token verification.
- Never expose `FIREBASE_ADMIN_PRIVATE_KEY` in any client component, bundle, or browser logs.

## 9) Current Scope / Limitations
- No production database session linkage yet.
- No secure httpOnly cookie session in this phase.
- LocalStorage test keys are used for MVP flow continuity.
- Admin login remains demo auth in this phase.

## 10) Production Checklist (Next Step)
- Move from localStorage tokens to secure session cookies.
- Add backend user/partner profile persistence and role claims.
- Add token refresh/session invalidation strategy.
- Add audit logging for auth events.
- Add automated E2E OTP and guard tests.

## 11) Troubleshooting
- `auth/invalid-app-credential` usually means Firebase app verification/reCAPTCHA failed.
- Use `http://localhost:3000` for local testing; avoid relying only on IP URL.
- Add both `localhost` and `127.0.0.1` to Firebase Authorized domains.
- If testing over LAN, add the network IP domain used by testers.
- Use Firebase test phone numbers during development.
- Disable browser extensions or retry in Incognito mode.
- Use visible reCAPTCHA in development for easier debugging.

## 12) Real OTP Test Steps
1. Set `NEXT_PUBLIC_FIREBASE_USE_TEST_NUMBERS=false` in `.env.local`.
2. Open `http://localhost:3000/login`.
3. Confirm visible reCAPTCHA is rendered on the page.
4. Solve reCAPTCHA, then enter a real phone number and request OTP.
5. Wait for SMS and verify on `/otp`.
6. If testing from a LAN URL/IP, add that host/IP to Firebase Authorized domains.
