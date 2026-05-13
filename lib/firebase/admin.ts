import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

const hasAdminConfig = Boolean(projectId && clientEmail && privateKey);

let authInstance: Auth | null = null;

if (hasAdminConfig) {
  try {
    const app = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

    authInstance = getAuth(app);
  } catch {
    authInstance = null;
  }
}

export const adminAuth = authInstance;

export function isFirebaseAdminConfigured() {
  return hasAdminConfig && adminAuth !== null;
}
