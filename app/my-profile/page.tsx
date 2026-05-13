"use client";

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Languages,
  LayoutGrid,
  Monitor,
  ShieldCheck,
  Sparkles,
  UserCheck2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { USER_FIREBASE_PHONE_KEY, USER_FIREBASE_UID_KEY } from "@/lib/auth/firebasePhoneAuth";
import { getDemoLoggedIn, getDemoPhone, subscribeDemoAuthUpdates } from "@/lib/demoAuth";

type ProfileTab = "overview" | "sessions" | "preferences";
type PreferenceState = {
  sms: boolean;
  email: boolean;
  push: boolean;
};

const PROFILE_PREFERENCES_KEY = "yopartner_profile_preferences";

const tabItems: Array<{ id: ProfileTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Sessions" },
  { id: "preferences", label: "Preferences" },
];

const statCards = [
  {
    title: "Total Logins",
    value: "2",
    subtitle: "Last: May 12, 2026, 12:18 PM",
    icon: Users,
    iconTint: "from-[#2563eb] to-[#06b6d4]",
  },
  {
    title: "Active Sessions",
    value: "1",
    subtitle: "Across all devices",
    icon: Clock3,
    iconTint: "from-[#0ea5e9] to-[#8b5cf6]",
  },
  {
    title: "Member Since",
    value: "2026",
    subtitle: "May 11, 2026",
    icon: CalendarClock,
    iconTint: "from-[#14b8a6] to-[#0ea5e9]",
  },
  {
    title: "Account Status",
    value: "Active",
    subtitle: "Fully verified",
    icon: UserCheck2,
    iconTint: "from-[#22c55e] to-[#06b6d4]",
  },
];

export default function MyProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [authReady, setAuthReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [phone, setPhone] = useState("+919958719363");
  const [preferences, setPreferences] = useState<PreferenceState>(() => {
    if (typeof window === "undefined") {
      return { sms: true, email: true, push: true };
    }
    try {
      const raw = window.localStorage.getItem(PROFILE_PREFERENCES_KEY);
      if (!raw) return { sms: true, email: true, push: true };
      const parsed = JSON.parse(raw) as Partial<PreferenceState>;
      return {
        sms: parsed.sms ?? true,
        email: parsed.email ?? true,
        push: parsed.push ?? true,
      };
    } catch {
      return { sms: true, email: true, push: true };
    }
  });

  useEffect(() => {
    const sync = () => {
      const hasFirebaseSession =
        typeof window !== "undefined" && Boolean(window.localStorage.getItem(USER_FIREBASE_UID_KEY));
      setLoggedIn(getDemoLoggedIn() || hasFirebaseSession);
      if (typeof window !== "undefined") {
        const firebasePhone = window.localStorage.getItem(USER_FIREBASE_PHONE_KEY);
        setPhone(firebasePhone || getDemoPhone());
      } else {
        setPhone(getDemoPhone());
      }
      setAuthReady(true);
    };

    sync();
    return subscribeDemoAuthUpdates(sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROFILE_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (authReady && !loggedIn) {
      router.replace("/login");
    }
  }, [authReady, loggedIn, router]);

  const formattedPhone = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return "+919958719363";
    return `+91${digits.slice(-10)}`;
  }, [phone]);

  if (!authReady || !loggedIn) {
    return <section className="min-h-[60vh] bg-gradient-to-b from-[#f4f8ff] to-[#f8fbfc]" />;
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#f4f8ff] to-[#f8fbfc]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                    <p className="mt-2 text-xs text-slate-500">{card.subtitle}</p>
                  </div>
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.iconTint} text-white`}>
                    <Icon size={18} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-2">
            {tabItems.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selected
                      ? "bg-gradient-to-r from-[#2563eb] to-[#8b5cf6] text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "overview" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold text-slate-900">Account Information</h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">Not set</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{formattedPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Country Code</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">+91</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Created</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">May 11, 2026</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Updated</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">May 12, 2026</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification Status</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      <ShieldCheck size={15} />
                      Verified
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold text-slate-900">Active Sessions</h2>
              <div className="mt-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                1 Active
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-2 text-sm sm:grid-cols-4">
                  <p className="inline-flex items-center gap-2 font-medium text-slate-900">
                    <Monitor size={14} />
                    web
                  </p>
                  <p className="text-slate-600">May 12, 2026, 12:18 PM</p>
                  <p className="text-slate-600">Unknown</p>
                  <p className="font-semibold text-[#2563eb]">Current</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-semibold text-slate-900">Preferences</h2>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Languages size={14} />
                      Language
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">En</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <LayoutGrid size={14} />
                      Theme
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Auto</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notification Settings</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {[
                      { id: "sms", label: "SMS Notifications", value: preferences.sms },
                      { id: "email", label: "Email Notifications", value: preferences.email },
                      { id: "push", label: "Push Notifications", value: preferences.push },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setPreferences((current) => ({
                            ...current,
                            [item.id]: !item.value,
                          }))
                        }
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <span>{item.label}</span>
                        <span className={item.value ? "font-semibold text-emerald-700" : "font-semibold text-slate-500"}>
                          {item.value ? "On" : "Off"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Sparkles size={18} className="text-[#8b5cf6]" />
                  Login Statistics
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Login</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">May 12, 2026, 12:18 PM</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Login IP</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">104.23.160.193</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Created IP</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">104.23.160.229</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} />
          Your profile is in good standing and fully verified.
        </div>
      </div>
    </section>
  );
}
