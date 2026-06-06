"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IncomingRequestScreen } from "@/components/partner/IncomingRequestScreen";
import { hasRingtoneUnlockPreference, unlockRingtoneAudio } from "@/hooks/useLoopingRingtone";
import { requestAudioPermission, requestVideoPermission } from "@/lib/agora";
import {
  acceptPartnerRequest,
  declinePartnerRequest,
  heartbeatPartnerPresence,
  getPartnerDashboard,
  markPartnerPresenceOffline,
  markPartnerPresenceOnline,
  type PartnerActiveSession,
  type PartnerIncomingRequest,
} from "@/lib/api/partner";
import { endSession } from "@/lib/api/sessions";
import {
  fetchPartnerApprovalState,
  getLocalPartnerApprovalState,
  getPartnerApprovalLabel,
  isPartnerApproved,
  normalizePartnerApprovalState,
  type PartnerApprovalState,
} from "@/lib/partnerApproval";
import {
  getPartnerOnlineStatus,
  getPartnerProfile,
  setPartnerOnlineStatus,
} from "@/lib/partnerAuth";
import { defaultPartnerProfile, type PartnerProfile } from "@/lib/partnerData";

type DashboardStats = {
  peopleSupportedToday: number;
  audioConversations: number;
  videoConversations: number;
  pendingRequests: number;
  earningsToday: number;
  averageRating: number;
};

const defaultStats: DashboardStats = {
  peopleSupportedToday: 0,
  audioConversations: 0,
  videoConversations: 0,
  pendingRequests: 0,
  earningsToday: 0,
  averageRating: 0,
};

const lockedState: PartnerApprovalState = {
  applicationStatus: "UNDER_REVIEW",
  kycStatus: "PENDING",
  companionStatus: "UNDER_REVIEW",
  verificationStatus: "PENDING",
  reviewStatus: "under_review",
};

const PARTNER_NOTIFICATION_PREF_KEY = "yopartner_partner_notifications_enabled";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRequest(raw: unknown): PartnerIncomingRequest | null {
  const item = asRecord(raw);
  const type = String(item.type ?? "").toUpperCase();
  if (type !== "CHAT" && type !== "AUDIO" && type !== "VIDEO") return null;
  const id = String(item.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    type,
    memberLabel: String(item.memberPhoneMasked ?? item.memberLabel ?? item.userMaskedPhone ?? item.memberName ?? "Member"),
    expectedRate: asNumber(item.expectedRate, 0),
    createdAt: String(item.createdAt ?? new Date().toISOString()),
  };
}

function normalizeActiveSession(raw: unknown): PartnerActiveSession | null {
  const item = asRecord(raw);
  const type = String(item.type ?? "").toUpperCase();
  if (type !== "CHAT" && type !== "AUDIO" && type !== "VIDEO") return null;
  const id = String(item.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    type,
    memberLabel: String(item.memberPhoneMasked ?? item.memberLabel ?? item.userMaskedPhone ?? item.memberName ?? "Member"),
    expectedRate: asNumber(item.expectedRate, 0),
    startedAt: item.startedAt ? String(item.startedAt) : null,
    status: String(item.status ?? "LIVE"),
  };
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(value, 0));
}

function formatRequestType(type: PartnerIncomingRequest["type"]) {
  if (type === "AUDIO") return "Audio";
  if (type === "VIDEO") return "Video";
  return "Chat";
}

function getIncomingNotificationTitle(type: PartnerIncomingRequest["type"]) {
  if (type === "AUDIO") return "Incoming audio call";
  if (type === "VIDEO") return "Incoming video call";
  return "Incoming chat request";
}

function getStoredBoolean(key: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setStoredBoolean(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Preferences are best-effort; alerts continue to work for this tab.
  }
}

function maskMemberLabel(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 4) return `+91******${digits.slice(-4)}`;
  return value || "Member";
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const profile = getPartnerProfile<PartnerProfile>(defaultPartnerProfile);
  const [approvalState, setApprovalState] = useState<PartnerApprovalState>(() => getLocalPartnerApprovalState());
  const [online, setOnline] = useState(getPartnerOnlineStatus);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [pendingRequests, setPendingRequests] = useState<PartnerIncomingRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<PartnerActiveSession[]>([]);
  const [effectiveStatus, setEffectiveStatus] = useState<"ONLINE" | "BUSY" | "OFFLINE">("OFFLINE");
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [alertSetupMessage, setAlertSetupMessage] = useState("");
  const [requestAction, setRequestAction] = useState<"accept" | "decline" | null>(null);
  const [availabilityActionPending, setAvailabilityActionPending] = useState(false);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() =>
    getStoredBoolean(PARTNER_NOTIFICATION_PREF_KEY) ||
    (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"),
  );
  const [ringtoneEnabled, setRingtoneEnabled] = useState(hasRingtoneUnlockPreference);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const notifiedRequestIdsRef = useRef<Set<string>>(new Set());

  const isApproved = isPartnerApproved(approvalState);
  const labels = getPartnerApprovalLabel(approvalState);
  const overlayRequest = useMemo(() => {
    if (!isApproved || !online) return null;
    return pendingRequests[0] ?? null;
  }, [isApproved, online, pendingRequests]);

  const loadDashboard = useCallback(async () => {
    const [approval, dashboardResponse] = await Promise.all([
      fetchPartnerApprovalState(),
      getPartnerDashboard(),
    ]);

    let nextApproval = approval;
    if (dashboardResponse.data) {
      const fromDashboard = normalizePartnerApprovalState(
        dashboardResponse.data.approvalState ?? dashboardResponse.data,
      );
      nextApproval = {
        ...nextApproval,
        ...fromDashboard,
      };
      const root = asRecord(dashboardResponse.data);
      const companion = asRecord(root.companion);
      const availability = asRecord(root.availability);
      const companionOnlineRaw = Boolean(availability.rawIsOnline ?? companion.rawIsOnline ?? companion.isOnline);
      const companionOnlineEffective = Boolean(availability.isOnline ?? companionOnlineRaw);
      const nextStatus = String(availability.effectiveStatus ?? (companionOnlineEffective ? "ONLINE" : "OFFLINE")).toUpperCase();
      setEffectiveStatus(nextStatus === "BUSY" ? "BUSY" : nextStatus === "ONLINE" ? "ONLINE" : "OFFLINE");
      const statsRaw = asRecord(root.stats);
      setStats({
        peopleSupportedToday: asNumber(statsRaw.peopleSupportedToday, 0),
        audioConversations: asNumber(statsRaw.audioConversations, 0),
        videoConversations: asNumber(statsRaw.videoConversations, 0),
        pendingRequests: asNumber(statsRaw.pendingRequests, 0),
        earningsToday: asNumber(statsRaw.earningsToday, 0),
        averageRating: asNumber(statsRaw.averageRating, 0),
      });
      const pendingRaw = Array.isArray(root.pendingRequests) ? root.pendingRequests : [];
      const sessionsRaw = Array.isArray(root.activeSessions) ? root.activeSessions : [];
      setPendingRequests(pendingRaw.map(normalizeRequest).filter((item): item is PartnerIncomingRequest => Boolean(item)));
      const normalizedSessions = sessionsRaw
        .map(normalizeActiveSession)
        .filter((item): item is PartnerActiveSession => Boolean(item));
      const dedupedById = Array.from(new Map(normalizedSessions.map((item) => [item.id, item])).values());
      setActiveSessions(dedupedById);
      setOnline(companionOnlineRaw || getPartnerOnlineStatus());
      setPartnerOnlineStatus(companionOnlineRaw || getPartnerOnlineStatus());
      setStatusMessage(
        String(root.message ?? (isPartnerApproved(nextApproval) ? "Partner dashboard ready." : "Your profile is being reviewed by our safety team.")),
      );
    } else {
      setStats(defaultStats);
      setPendingRequests([]);
      setActiveSessions([]);
      setStatusMessage("Your profile is being reviewed by our safety team.");
      setOnline(getPartnerOnlineStatus());
      setEffectiveStatus(getPartnerOnlineStatus() ? "ONLINE" : "OFFLINE");
    }

    if (!isPartnerApproved(nextApproval)) {
      nextApproval = {
        ...lockedState,
        ...nextApproval,
      };
      if (online) {
        setPartnerOnlineStatus(false);
      }
      setPendingRequests([]);
      setActiveSessions([]);
      setStats(defaultStats);
    }

    setApprovalState(nextApproval);
    setLoading(false);
  }, [online]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!isApproved) return;
    const timer = window.setInterval(() => {
      void loadDashboard();
    }, 5000);
    return () => {
      window.clearInterval(timer);
    };
  }, [isApproved, loadDashboard]);

  useEffect(() => {
    if (!isApproved || !online) return;

    void markPartnerPresenceOnline();
    const initialHeartbeatTimer = window.setTimeout(() => {
      void heartbeatPartnerPresence();
    }, 4000);
    const heartbeatTimer = window.setInterval(() => {
      void heartbeatPartnerPresence();
    }, 25000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && online) {
        void markPartnerPresenceOnline();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(initialHeartbeatTimer);
      window.clearInterval(heartbeatTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isApproved, online]);

  useEffect(() => {
    if (!isApproved && online) {
      setPartnerOnlineStatus(false);
    }
  }, [isApproved, online]);

  useEffect(() => {
    if (!overlayRequest || notificationPermission !== "granted") return;
    if (notifiedRequestIdsRef.current.has(overlayRequest.id)) return;
    notifiedRequestIdsRef.current.add(overlayRequest.id);

    try {
      const notification = new Notification(getIncomingNotificationTitle(overlayRequest.type), {
        body: "Tap to open YoPartner dashboard",
        tag: `yopartner-request-${overlayRequest.id}`,
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[partner-alerts] Browser notification could not be shown.");
      }
    }
  }, [notificationPermission, overlayRequest]);

  const handleEnableAlerts = async () => {
    setAlertSetupMessage("");

    let nextPermission = notificationPermission;
    if (typeof window === "undefined" || !("Notification" in window)) {
      nextPermission = "unsupported";
      setNotificationPermission("unsupported");
    } else {
      nextPermission = Notification.permission;
      if (nextPermission === "default") {
        nextPermission = await Notification.requestPermission();
      }
      setNotificationPermission(nextPermission);
      if (nextPermission === "granted") {
        setNotificationsEnabled(true);
        setStoredBoolean(PARTNER_NOTIFICATION_PREF_KEY, true);
      }
    }

    const ringtoneReady = await unlockRingtoneAudio("incoming");
    setRingtoneEnabled(ringtoneReady || hasRingtoneUnlockPreference());

    if (nextPermission === "denied" && ringtoneReady) {
      setAlertSetupMessage("Notifications are blocked. Ringtone alerts are enabled while this dashboard is open.");
      return;
    }
    if (nextPermission === "unsupported" && ringtoneReady) {
      setAlertSetupMessage("This browser does not support notifications. Ringtone alerts are enabled while the dashboard is open.");
      return;
    }
    if (!ringtoneReady) {
      setAlertSetupMessage("Tap to enable ringtone again if your browser blocks audio until a stronger gesture.");
      return;
    }
    setAlertSetupMessage("Notifications and ringtone alerts are enabled for this dashboard.");
  };

  const toggleOnline = async () => {
    if (!isApproved || availabilityActionPending) return;
    const nextOnline = !online;
    setAvailabilityError("");
    setAvailabilityActionPending(true);
    const response = nextOnline ? await markPartnerPresenceOnline() : await markPartnerPresenceOffline();
    setAvailabilityActionPending(false);
    if (response.error) {
      setAvailabilityError("Could not update availability. Please try again.");
      return;
    }
    setOnline(nextOnline);
    setPartnerOnlineStatus(nextOnline);
    await loadDashboard();
  };

  const handleAccept = async () => {
    if (!overlayRequest || requestAction) return;
    setRequestMessage("");

    if (overlayRequest.type === "AUDIO") {
      try {
        await requestAudioPermission();
      } catch {
        setRequestMessage("Microphone permission is required for audio calls.");
        return;
      }
    }
    if (overlayRequest.type === "VIDEO") {
      try {
        await requestVideoPermission();
      } catch {
        setRequestMessage("Camera and microphone permission are required for video calls.");
        return;
      }
    }

    setRequestAction("accept");
    const response = await acceptPartnerRequest(overlayRequest.id);
    setRequestAction(null);

    if (response.error) {
      setRequestMessage(response.error.message || "Unable to accept request right now.");
      return;
    }

    if (overlayRequest.type === "AUDIO") {
      router.push(`/partner/audio-call/${overlayRequest.id}`);
      return;
    }
    if (overlayRequest.type === "VIDEO") {
      router.push(`/partner/video-call/${overlayRequest.id}`);
      return;
    }
    router.push(`/partner/chat/${overlayRequest.id}`);
  };

  const handleDecline = async () => {
    if (!overlayRequest || requestAction) return;
    setRequestMessage("");
    setRequestAction("decline");
    const response = await declinePartnerRequest(overlayRequest.id);
    setRequestAction(null);
    if (response.error) {
      setRequestMessage(response.error.message || "Unable to decline request right now.");
      return;
    }
    setPendingRequests((current) => current.filter((item) => item.id !== overlayRequest.id));
    await loadDashboard();
  };

  const handleEndSession = async (sessionId: string) => {
    if (endingSessionId) return;
    setRequestMessage("");
    setEndingSessionId(sessionId);
    const response = await endSession(sessionId);
    setEndingSessionId(null);
    if (response.error) {
      setRequestMessage(response.error.message || "Unable to end session right now.");
      return;
    }
    await loadDashboard();
  };

  const statusTone = isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  const secondaryStatusTone = isApproved ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700";

  return (
    <section className="space-y-5">
      <IncomingRequestScreen
        request={overlayRequest}
        accepting={requestAction === "accept"}
        declining={requestAction === "decline"}
        ringtoneEnabled={ringtoneEnabled}
        message={requestMessage}
        onEnableRingtone={() => {
          void handleEnableAlerts();
        }}
        onAccept={() => {
          void handleAccept();
        }}
        onDecline={() => {
          void handleDecline();
        }}
      />

      <div className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Welcome back, {profile.fullName || "YoPartner Companion"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">Your companion workspace for safe, respectful conversations.</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              Status:
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone}`}>{labels.kyc}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${secondaryStatusTone}`}>{labels.review}</span>
              {isApproved ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    effectiveStatus === "ONLINE"
                      ? "bg-emerald-50 text-emerald-700"
                      : effectiveStatus === "BUSY"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {effectiveStatus === "ONLINE" ? "Online" : effectiveStatus === "BUSY" ? "Busy" : "Offline"}
                </span>
              ) : null}
            </p>
            {!isApproved ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">KYC Pending</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Your profile is being reviewed by our safety team.
                </p>
                <div className="mt-3 grid gap-2 text-xs font-semibold text-amber-900 sm:grid-cols-2">
                  <span>Profile submitted</span>
                  <span>Documents uploaded</span>
                  <span>KYC review pending</span>
                  <span>Admin approval required</span>
                </div>
              </div>
            ) : null}
            {statusMessage ? <p className="mt-3 text-xs text-slate-500">{statusMessage}</p> : null}
            {availabilityError ? <p className="mt-3 text-xs font-medium text-rose-600">{availabilityError}</p> : null}
            {alertSetupMessage ? <p className="mt-3 text-xs text-slate-500">{alertSetupMessage}</p> : null}
            {isApproved && ((notificationPermission === "default" && !notificationsEnabled) || !ringtoneEnabled) ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleEnableAlerts();
                  }}
                  className="rounded-full border border-[#dceae5] bg-white px-3 py-1.5 text-xs font-semibold text-[#0f766e] hover:bg-[#f2fbf8]"
                >
                  Enable notifications
                </button>
                {!ringtoneEnabled ? (
                  <span className="text-xs text-slate-500">Also enables the incoming request ringtone.</span>
                ) : null}
              </div>
            ) : null}
            {isApproved && notificationPermission === "denied" ? (
              <p className="mt-3 text-xs text-slate-500">Browser notifications are blocked in this browser.</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              void toggleOnline();
            }}
            disabled={!isApproved || availabilityActionPending}
            className="rounded-full bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {availabilityActionPending
              ? "Updating..."
              : isApproved
                ? (online ? "Pause requests" : "Start accepting requests")
                : "Start accepting requests"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">People supported today</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.peopleSupportedToday}</p>
        </article>
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Audio conversations</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.audioConversations}</p>
        </article>
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Video conversations</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.videoConversations}</p>
        </article>
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pending requests</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.pendingRequests}</p>
        </article>
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Today&apos;s earnings</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.earningsToday)}</p>
        </article>
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Average rating</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "Not rated yet"}
          </p>
        </article>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">People waiting to talk</h3>
          <div className="mt-3 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading requests...</p>
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No new requests right now.</p>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-[#dceae5] p-3">
                  <p className="text-sm font-semibold text-slate-900">{maskMemberLabel(request.memberLabel)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatRequestType(request.type)} - {formatINR(request.expectedRate)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Ongoing conversations</h3>
          <div className="mt-3 space-y-2">
            {loading ? (
              <p className="text-sm text-slate-500">Loading conversations...</p>
            ) : activeSessions.length === 0 ? (
              <p className="text-sm text-slate-500">No ongoing conversations.</p>
            ) : (
              activeSessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-[#dceae5] p-2.5">
                  <p className="text-sm font-semibold text-slate-900">{maskMemberLabel(session.memberLabel)}</p>
                  <p className="text-xs text-slate-500">
                    {formatRequestType(session.type)} - {session.status}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (session.type === "AUDIO") {
                          router.push(`/partner/audio-call/${session.id}`);
                          return;
                        }
                        if (session.type === "VIDEO") {
                          router.push(`/partner/video-call/${session.id}`);
                          return;
                        }
                        router.push(`/partner/chat/${session.id}`);
                      }}
                      className="rounded-lg border border-[#dceae5] px-2.5 py-1 text-xs font-semibold text-slate-700"
                    >
                      Join
                    </button>
                    <button
                      type="button"
                      disabled={endingSessionId === session.id}
                      onClick={() => {
                        void handleEndSession(session.id);
                      }}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
                    >
                      {endingSessionId === session.id ? "Ending..." : "End"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
