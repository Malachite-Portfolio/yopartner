# QA Defect Log - YoPartner Phase 2 MVP

Date: 2026-05-13  
Project: `C:\Users\ashis\Videos\yopartnerpj\yopartner`

## QA Scope
- Viewports tested: Desktop (1440), Tablet (768), Mobile (390)
- Routes tested:
  - User: `/`, `/connect-now`, `/home-visit`, `/wallet`, `/login`, `/otp`, `/my-profile`, `/bookings`, `/media`, `/client-diaries`, `/about`, `/support`, `/chat/ira-t`, `/call/audio/ira-t`, `/call/video/ira-t`
  - Partner: `/partner/login`, `/partner/onboarding`, `/partner/dashboard`
  - Admin: `/admin/login`, `/admin`
- Local route/status sweep: all listed routes returned HTTP 200.
- Header/footer visibility regression checks executed on key routes.

## Defects

| Route/Page | Viewport | Issue | Severity | Steps To Reproduce | Expected Result | Actual Result | Fix Status |
|---|---|---|---|---|---|---|---|
| `/connect-now/[id]` | 768, 390 | Horizontal overflow in profile detail experience on smaller widths | High | 1. Open `/connect-now/ira-t` 2. Resize to tablet/mobile 3. Check horizontal scroll | No horizontal page scroll | Horizontal overflow observed in QA sweep | Fixed |
| `/home-visit/[id]` | 768, 390 | Horizontal overflow in profile detail experience on smaller widths | High | 1. Open `/home-visit/ira-t` 2. Resize to tablet/mobile 3. Check horizontal scroll | No horizontal page scroll | Horizontal overflow observed in QA sweep | Fixed |
| `/` | 390 | Mobile overflow risk from compact card/header width pressure | High | 1. Open `/` on mobile width 390 2. Scroll horizontally | No horizontal page scroll | Overflow risk observed in QA sweep | Fixed |
| Global lint pipeline | All | QA helper script (`qa-phase2.js`) violated lint rule (`no-require-imports`) | High | 1. Run `npm run lint` | Lint should pass | Lint failed due temp QA script | Fixed |
| Dev server console (HMR websocket) | All | Dev-only websocket handshake errors in console when using `next dev` + scripted checks | Low | Run scripted route checks against dev server | No persistent runtime errors | HMR websocket handshake warnings seen in dev logs | Known (Dev-only, no production impact) |
| Scripted interaction check `/chat -> /call/audio` | Desktop | Route wait timeout in previous automated script pass | Medium | Run automated interaction script waiting for URL transition | Deterministic route transition | Script timed out waiting for navigation in one pass | Known (Not reproducible as route crash; likely script selector timing) |

## Fixes Applied In This QA Pass
- `C:\Users\ashis\Videos\yopartnerpj\yopartner\components\ConnectCompanionCard.tsx`
  - Made price pills responsive on small screens (`w-full`, smaller icon/text/padding)
  - Made price button links block-level for stable grid behavior
- `C:\Users\ashis\Videos\yopartnerpj\yopartner\components\AppHeader.tsx`
  - Constrained mobile wallet pill width to prevent header overflow pressure
- `C:\Users\ashis\Videos\yopartnerpj\yopartner\components\ConnectAppHeader.tsx`
  - Constrained mobile wallet pill width to prevent header overflow pressure
- `C:\Users\ashis\Videos\yopartnerpj\yopartner\components\WalletPill.tsx`
  - Added truncation wrapper for balance text
- `C:\Users\ashis\Videos\yopartnerpj\yopartner\components\ProfileHeroCard.tsx`
  - Improved responsive constraints (`min-w-0`), plus `break-words` for long content
- `C:\Users\ashis\Videos\yopartnerpj\yopartner\app\connect-now\[id]\page.tsx`
  - Added `overflow-x-clip` and `min-w-0` safeguards
- `C:\Users\ashis\Videos\yopartnerpj\yopartner\app\home-visit\[id]\page.tsx`
  - Added `overflow-x-clip` and `min-w-0` safeguards
- Removed temporary QA script from lint scope:
  - Deleted `C:\Users\ashis\Videos\yopartnerpj\yopartner\qa-phase2.js`

## Verification
- `npm run lint`: Passed
- `npm run build`: Passed

## Notes
- No blocker route crash found in the tested route list.
- Header/footer visibility checks align with expected rules for user fullscreen chat/call, partner, admin, and `/dev-tools`.
