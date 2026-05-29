"use client";

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Languages,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  UserCheck2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserProfileSummary, type UserProfileRecord, type UserProfileSummaryStats } from "@/lib/api/users";
import { getUserAuthState, restoreUserAuthSessionFromFirebase, subscribeUserAuthState } from "@/lib/auth/userAuth";

type ProfileTab = "overview" | "sessions" | "preferences";
type PreferenceState = {
  sms: boolean;
  email: boolean;
  push: boolean;
};

const PROFILE_PREFERENCES_KEY = "yopartner_profile_preferences";

const tabItems: Array<{ id: ProfileTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Conversations" },
  { id: "preferences", label: "Preferences" },
];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not tracked";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not tracked";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "Not tracked";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not tracked";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function maskPhone(value: string | null | undefined) {
  if (!value) return "Not available";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return value;
  return `+${digits.slice(0, digits.length - 10)}${digits.slice(-10)}`;
}

function initialStats(): UserProfileSummaryStats {
  return {
    activeConversations: 0,
    totalSessions: 0,
    completedSessions: 0,
    memberSince: null,
    lastLogin: null,
  };
}

export default function MyProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [authReady, setAuthReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authPhone, setAuthPhone] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [stats, setStats] = useState<UserProfileSummaryStats>(initialStats);
  const [profileComplete, setProfileComplete] = useState(false);
  const [preferences, setPreferences] = useState<PreferenceState>(() => {
    if (typeof window === "undefined") return { sms: true, email: true, push: true };
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
    let active = true;
    const sync = () => {
      if (!active) return;
      const state = getUserAuthState();
      setLoggedIn(state.loggedIn);
      setAuthPhone(state.phone);
      setAuthReady(true);
    };
    const unsubscribe = subscribeUserAuthState(sync);
    void restoreUserAuthSessionFromFirebase(false).then(sync);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !loggedIn) return;
    let active = true;

    void (async () => {
      setLoadingProfile(true);
      setProfileError("");
      const response = await getCurrentUserProfileSummary();
      if (!active) return;
      if (response.error || !response.data) {
        setProfileError(response.error?.message || "Unable to load profile details right now.");
        setLoadingProfile(false);
        return;
      }

      setProfile(response.data.user);
      setStats(response.data.stats);
      setProfileComplete(response.data.profileComplete);
      setLoadingProfile(false);
    })();

    return () => {
      active = false;
    };
  }, [authReady, loggedIn]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROFILE_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (authReady && !loggedIn) {
      router.replace("/login");
    }
  }, [authReady, loggedIn, router]);

  const phoneLabel = maskPhone(profile?.phoneNumber ?? authPhone);
  const verificationLabel = profile?.verificationStatus ?? (profileComplete ? "VERIFIED" : "PENDING_PROFILE");
  const statCards = [
    {
      title: "Total Sessions",
      value: String(stats.totalSessions),
      subtitle: "Across all chats and calls",
      icon: Users,
    },
    {
      title: "Active Conversations",
      value: String(stats.activeConversations),
      subtitle: "Live sessions right now",
      icon: Clock3,
    },
    {
      title: "Member Since",
      value: formatDateOnly(stats.memberSince),
      subtitle: "Account creation date",
      icon: CalendarClock,
    },
    {
      title: "Account Status",
      value: verificationLabel,
      subtitle: profileComplete ? "Profile completed" : "Complete onboarding profile",
      icon: UserCheck2,
    },
  ];

  if (!authReady || !loggedIn) {
    return <section className="min-h-[60vh] bg-[#f8fafc]" />;
  }

  return (
    <section className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {profileError ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {profileError}
          </p>
        ) : null}

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
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
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
                      ? "bg-[#2563eb] text-white shadow-sm"
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
              {loadingProfile ? (
                <p className="mt-4 text-sm text-slate-600">Loading your profile...</p>
              ) : (
                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{profile?.name ?? "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{phoneLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{profile?.email ?? "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Age</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {typeof profile?.age === "number" ? profile.age : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{profile?.gender ?? "Not provided"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Created</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(profile?.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Updated</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(profile?.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification Status</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                        <ShieldCheck size={15} />
                        {verificationLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile Photo</p>
                      {profile?.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.profileImageUrl}
                          alt="Profile"
                          className="mt-2 h-20 w-20 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <p className="mt-1 text-sm font-medium text-slate-900">Not uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold text-slate-900">Conversation Summary</h2>
              <div className="mt-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {stats.activeConversations} Active
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Conversations</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{stats.activeConversations}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Sessions</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{stats.totalSessions}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed Sessions</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{stats.completedSessions}</p>
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
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Login</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(stats.lastLogin)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Logins</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">Not tracked</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} />
          {profileComplete
            ? "Your profile is in good standing and fully verified."
            : "Complete your onboarding profile to unlock full account features."}
        </div>
      </div>
    </section>
  );
}
