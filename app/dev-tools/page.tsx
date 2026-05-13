"use client";

import { RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { adminStorageKeys, ADMIN_LOGIN_KEY } from "@/lib/adminData";
import {
  PARTNER_FIREBASE_PHONE_KEY,
  PARTNER_FIREBASE_TOKEN_KEY,
  PARTNER_FIREBASE_UID_KEY,
  USER_FIREBASE_PHONE_KEY,
  USER_FIREBASE_TOKEN_KEY,
  USER_FIREBASE_UID_KEY,
  getCurrentFirebaseUser,
  isFirebaseOtpEnabled,
} from "@/lib/auth/firebasePhoneAuth";
import { BOOKINGS_KEY } from "@/lib/bookings";
import { DEMO_LOGGED_IN_KEY, DEMO_PHONE_KEY, PROMO_HIDDEN_KEY } from "@/lib/demoAuth";
import {
  PARTNER_BOOKINGS_KEY,
  PARTNER_EARNINGS_KEY,
  PARTNER_LOGGED_IN_KEY,
  PARTNER_MESSAGES_KEY,
  PARTNER_ONBOARDING_COMPLETE_KEY,
  PARTNER_ONLINE_KEY,
  PARTNER_PHONE_KEY,
  PARTNER_PROFILE_DRAFT_KEY,
  PARTNER_PROFILE_KEY,
  PARTNER_SESSIONS_KEY,
  PARTNER_SETTINGS_KEY,
} from "@/lib/partnerAuth";
import { WALLET_BALANCE_KEY, WALLET_TRANSACTIONS_KEY } from "@/lib/wallet";
import { useEffect, useMemo, useState } from "react";

const USER_KEYS = [
  DEMO_LOGGED_IN_KEY,
  DEMO_PHONE_KEY,
  PROMO_HIDDEN_KEY,
  "yopartner_profile_preferences",
  USER_FIREBASE_UID_KEY,
  USER_FIREBASE_PHONE_KEY,
  USER_FIREBASE_TOKEN_KEY,
];
const WALLET_KEYS = [WALLET_BALANCE_KEY, WALLET_TRANSACTIONS_KEY];
const BOOKING_KEYS = [BOOKINGS_KEY, "yopartner_demo_bookings"];
const PARTNER_KEYS = [
  PARTNER_LOGGED_IN_KEY,
  PARTNER_PHONE_KEY,
  PARTNER_PROFILE_KEY,
  PARTNER_PROFILE_DRAFT_KEY,
  PARTNER_ONBOARDING_COMPLETE_KEY,
  PARTNER_ONLINE_KEY,
  PARTNER_SESSIONS_KEY,
  PARTNER_MESSAGES_KEY,
  PARTNER_BOOKINGS_KEY,
  PARTNER_EARNINGS_KEY,
  PARTNER_SETTINGS_KEY,
  PARTNER_FIREBASE_UID_KEY,
  PARTNER_FIREBASE_PHONE_KEY,
  PARTNER_FIREBASE_TOKEN_KEY,
];
const ADMIN_KEYS = [ADMIN_LOGIN_KEY, ...Object.values(adminStorageKeys), "yopartner_admin_media_items", "yopartner_admin_diary_items"];

function clearKeys(keys: string[]) {
  if (typeof window === "undefined") return;
  keys.forEach((key) => window.localStorage.removeItem(key));
}

export default function DevToolsPage() {
  const [hostname] = useState<string>(() => (typeof window !== "undefined" ? window.location.hostname : "unknown"));
  const [firebaseUserId] = useState<string>(() => getCurrentFirebaseUser()?.uid ?? "None");
  const [firebasePhone] = useState<string>(() => getCurrentFirebaseUser()?.phoneNumber ?? "None");
  const [adminConfigured, setAdminConfigured] = useState<"checking" | "yes" | "no">("checking");
  const [verifyMessage, setVerifyMessage] = useState("");
  const firebaseClientConfigured = isFirebaseOtpEnabled();

  const availableToken = useMemo(() => {
    if (typeof window === "undefined") return "";
    return (
      window.localStorage.getItem(USER_FIREBASE_TOKEN_KEY) ||
      window.localStorage.getItem(PARTNER_FIREBASE_TOKEN_KEY) ||
      ""
    );
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/verify-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: "" }),
        });
        setAdminConfigured(response.status === 503 ? "no" : "yes");
      } catch {
        setAdminConfigured("no");
      }
    };

    void checkAdmin();
  }, []);

  const actions = [
    {
      label: "Reset User Demo Data",
      description: "Clears user login/profile demo state.",
      keys: USER_KEYS,
    },
    {
      label: "Reset Wallet",
      description: "Clears wallet balance and transactions.",
      keys: WALLET_KEYS,
    },
    {
      label: "Reset Bookings",
      description: "Clears demo bookings history.",
      keys: BOOKING_KEYS,
    },
    {
      label: "Reset Partner Demo Data",
      description: "Clears partner auth, onboarding, chats, and settings.",
      keys: PARTNER_KEYS,
    },
    {
      label: "Reset Admin Demo Data",
      description: "Clears admin auth and operational store.",
      keys: ADMIN_KEYS,
    },
    {
      label: "Reset All Demo Data",
      description: "Clears all user, wallet, booking, partner, and admin demo keys.",
      keys: Array.from(new Set([...USER_KEYS, ...WALLET_KEYS, ...BOOKING_KEYS, ...PARTNER_KEYS, ...ADMIN_KEYS])),
      danger: true,
    },
  ];

  return (
    <section className="min-h-screen bg-[#f8fafc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert size={16} />
            Developer Utilities
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Dev Tools</h1>
          <p className="mt-1 text-sm text-slate-700">Use these reset actions while testing flows during Phase 2.</p>
        </div>

        <div className="mt-5 space-y-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">Firebase Status</h2>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p>Current hostname: {hostname}</p>
              <p>Firebase client config present: {firebaseClientConfigured ? "Yes" : "No"}</p>
              <p>Firebase admin config present: {adminConfigured === "checking" ? "Checking..." : adminConfigured === "yes" ? "Yes" : "No"}</p>
              <p>Current Firebase user UID: {firebaseUserId}</p>
              <p>Current Firebase phone: {firebasePhone}</p>
            </div>
            {!firebaseClientConfigured ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Firebase Client not configured - OTP will use demo mode.
              </p>
            ) : null}
            {adminConfigured === "no" ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Firebase Admin not configured - token verification API will run in demo/fallback mode.
              </p>
            ) : null}
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">Firebase OTP Checklist</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>Phone provider enabled</li>
                <li>localhost authorized</li>
                <li>127.0.0.1 authorized</li>
                <li>Test phone number configured</li>
              </ul>
            </div>
            {availableToken ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/auth/verify-token", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ idToken: availableToken }),
                    });
                    if (!response.ok) {
                      setVerifyMessage(`Verify token API failed (${response.status}).`);
                      return;
                    }
                    const payload = (await response.json()) as { uid?: string; phoneNumber?: string };
                    setVerifyMessage(`Token verified for UID ${payload.uid ?? "unknown"} (${payload.phoneNumber ?? "no phone"}).`);
                  } catch {
                    setVerifyMessage("Unable to verify token right now.");
                  }
                }}
                className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Test verify token API
              </button>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No Firebase ID token available for verification test.</p>
            )}
            {verifyMessage ? <p className="mt-2 text-xs font-medium text-slate-600">{verifyMessage}</p> : null}
          </article>

          {actions.map((action) => (
            <article key={action.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{action.label}</h2>
                  <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearKeys(action.keys);
                    window.alert(`${action.label} completed.`);
                  }}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white ${
                    action.danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[#2563eb] hover:bg-[#1d4ed8]"
                  }`}
                >
                  {action.danger ? <Trash2 size={15} /> : <RotateCcw size={15} />}
                  Run
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
