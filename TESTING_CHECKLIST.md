# YoPartner Phase 2+3 Testing Checklist

## User Flow Checklist
- [ ] `/` homepage loads and main CTA links work.
- [ ] `/connect-now` loads, filter/search works, empty state appears when no matches.
- [ ] `/connect-now/[id]` profile page loads with booking panel actions.
- [ ] `/home-visit` and `/home-visit/[id]` routes load and card navigation works.
- [ ] `/login` validates 10-digit phone and terms checkbox.
- [ ] `/otp` accepts numeric 6-digit OTP only and redirects after verify.
- [ ] `/wallet` tabs, recharge modal, and transaction list behave correctly.
- [ ] `/my-profile` loads only for logged-in user and persists preferences.
- [ ] `/bookings` shows demo booking rows and empty state when none.
- [ ] `/chat/[id]`, `/call/audio/[id]`, `/call/video/[id]` load as full app screens without navbar/footer.
- [ ] `/media`, `/client-diaries`, `/about`, `/support` load without runtime errors.

## Partner Flow Checklist
- [ ] `/partner/login` validates phone + terms.
- [ ] `/partner/otp` validates numeric 6-digit OTP and redirects correctly.
- [ ] `/partner/onboarding` validates all required steps and saves profile draft.
- [ ] `/partner/dashboard` loads with requests and action routing.
- [ ] `/partner/chats` search works and empty state appears when no match.
- [ ] `/partner/chats/[id]` send message works locally.
- [ ] `/partner/calls/audio/[id]` and `/partner/calls/video/[id]` controls + timer work.
- [ ] `/partner/bookings`, `/partner/earnings`, `/partner/profile`, `/partner/settings` load and update localStorage state.
- [ ] Partner logout redirects to `/partner/login`.

## Admin Flow Checklist
- [ ] `/admin/login` validates credentials.
- [ ] `/admin` dashboard metrics and tables render.
- [ ] Sidebar links open all admin routes.
- [ ] `/admin/applications` approve/reject/needs-info persists.
- [ ] `/admin/companions` add/edit/suspend/verify persists.
- [ ] `/admin/users` block/unblock/add-credit persists.
- [ ] `/admin/sessions` view/flag/end actions persist.
- [ ] `/admin/bookings` complete/cancel/refund/assign persists.
- [ ] `/admin/wallet` manual credit and refund-demo actions persist.
- [ ] `/admin/payouts` approve/paid/reject persists.
- [ ] `/admin/verification` step updates and overall status persist.
- [ ] `/admin/reviews`, `/admin/support`, `/admin/media`, `/admin/client-diaries`, `/admin/reports`, `/admin/settings` actions behave correctly.

## Firebase Auth Test Checklist
- [ ] Firebase Console: Phone provider enabled.
- [ ] Firebase Console: `localhost` added in Authorized domains.
- [ ] `.env.local` includes all `NEXT_PUBLIC_FIREBASE_*` values.
- [ ] `.env.local` includes `FIREBASE_ADMIN_*` values with escaped newline private key.
- [ ] User flow uses `Firebase OTP` badge when configured.
- [ ] Partner flow uses `Firebase OTP` badge when configured.
- [ ] OTP success hits `/api/auth/session` and returns UID + phone.
- [ ] `/api/auth/verify-token` returns decoded claims for valid token.
- [ ] Logout signs out Firebase user and clears local auth keys.
- [ ] Without Firebase env, login/OTP pages stay functional via `Demo OTP` mode.

## Mobile Checklist
- [ ] No horizontal overflow on major pages.
- [ ] Cards stack correctly on narrow screens.
- [ ] Tables are scrollable where needed.
- [ ] Modals remain usable within viewport.
- [ ] Tap targets are accessible for primary actions.
- [ ] Partner/Admin sidebars open/close correctly on mobile.

## localStorage Reset Instructions
Use `/dev-tools` for quick resets:
- Reset User Demo Data
- Reset Wallet
- Reset Bookings
- Reset Partner Demo Data
- Reset Admin Demo Data
- Reset All Demo Data
- Check Firebase status block + verify token API test button

## Known Demo Limitations
- No production database wiring.
- Firebase phone auth is test-mode only in this phase.
- No production payment gateway.
- No real WebRTC/Agora calls.
- No real file upload/media storage.
- Some actions intentionally show demo messages.

## Phase 3+ Production Requirements
- Add server-side session cookies and refresh-token flow.
- Integrate user/partner profiles into backend database.
- Harden role-based auth and authorization middleware.
- Add payment gateway integration with webhooks and reconciliation.
- Add real-time messaging + call infrastructure.
- Add audit logs, monitoring, and security alerting.
- Add end-to-end tests for OTP and protected route flows.
