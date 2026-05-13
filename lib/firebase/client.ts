"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasClientConfig = Object.values(firebaseConfig).every((value) => typeof value === "string" && value.length > 0);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

if (hasClientConfig) {
  try {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
  } catch {
    appInstance = null;
    authInstance = null;
  }
}

export const firebaseApp = appInstance;
export const firebaseAuth = authInstance;

export function isFirebaseClientConfigured() {
  return hasClientConfig;
}
