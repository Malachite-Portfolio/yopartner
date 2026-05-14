# YoPartner Deployment Guide (GitHub + Vercel)

Repository: [https://github.com/Malachite-Portfolio/yopartner.git](https://github.com/Malachite-Portfolio/yopartner.git)

## 1) Push Code To GitHub
1. Ensure your local branch is ready.
2. Set remote:
   - `git remote add origin https://github.com/Malachite-Portfolio/yopartner.git`
   - or update existing: `git remote set-url origin https://github.com/Malachite-Portfolio/yopartner.git`
3. Push:
   - `git add .`
   - `git commit -m "prepare yopartner for vercel deployment"`
   - `git branch -M main`
   - `git push -u origin main`

## 2) Import Into Vercel
1. Sign in to Vercel.
2. Click **Add New Project**.
3. Import `Malachite-Portfolio/yopartner` from GitHub.
4. Framework should auto-detect as **Next.js**.
5. Keep default build command (`npm run build`) and output settings.
6. Add required environment variables (below) before first deploy.
7. Deploy.

## 3) Environment Variables (Vercel)
Set these in Vercel Project Settings -> Environment Variables:

### Firebase Public (Client)
- `NEXT_PUBLIC_APP_MODE=production`
- `NEXT_PUBLIC_API_BASE_URL=https://your-railway-api-url.up.railway.app`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_USE_TEST_NUMBERS=false`

### Firebase Admin (Server only)
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

### Backend / Database
- `DATABASE_URL`
- `ADMIN_UID_ALLOWLIST` (optional bootstrap)
- `ADMIN_PHONE_ALLOWLIST` (optional bootstrap)

### Agora
- `NEXT_PUBLIC_AGORA_APP_ID`
- `NEXT_PUBLIC_AGORA_CHAT_APP_KEY`
- `AGORA_APP_CERTIFICATE`
- `AGORA_CHAT_APP_KEY`
- `AGORA_CHAT_ORG_NAME`
- `AGORA_CHAT_APP_NAME`
- `AGORA_CHAT_REST_HOST`
- `AGORA_CHAT_WS_HOST`

## 4) Firebase Authorized Domains (After Vercel URL Exists)
After first deployment, open Firebase Console -> Authentication -> Settings -> Authorized domains and add:
- your Vercel production domain (for example `your-project.vercel.app`)
- any custom production domain you connect
- `yopartner.com`
- `www.yopartner.com`

Keep existing local entries (`localhost`, `127.0.0.1`) for development.

## 5) Security Notes
- Never commit `.env.local`.
- Never expose `FIREBASE_ADMIN_PRIVATE_KEY` in frontend code.
- Never expose `AGORA_APP_CERTIFICATE` in frontend code.
- Keep server-only secrets only in Vercel server env vars.
- Do not rely on demo/localStorage data when `NEXT_PUBLIC_APP_MODE=production`.

## 6) Local Validation Before Deploy
Run:
- `npm run lint`
- `npm run build`

If both pass, deployment is usually safe to proceed.
