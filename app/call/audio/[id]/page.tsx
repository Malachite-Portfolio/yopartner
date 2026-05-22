"use client";

import { ArrowLeft, Lock, Mic, PhoneOff, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { IAgoraRTCClient, IMicrophoneAudioTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng";
import { EndSessionConfirmModal } from "@/components/session/EndSessionConfirmModal";
import { useSessionExitGuard } from "@/hooks/useSessionExitGuard";
import {
  cancelSession,
  createSession,
  endSession,
  getSessionAgoraToken,
  getSessionById,
  markSessionMediaReady,
  type SessionRecord,
  type SessionStatus,
} from "@/lib/api/sessions";
import {
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";
import { buildAgoraUid, createAgoraClient, normalizeChannelName, requestAudioPermission } from "@/lib/agora";
import { isActiveSessionStatus } from "@/lib/sessionStatus";
import { getUserAuthTokenWithRestore } from "@/lib/auth/userAuth";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() ?? "";
const TERMINAL_SESSION_STATUSES: SessionStatus[] = ["DECLINED", "CANCELLED", "ENDED", "EXPIRED", "COMPLETED", "FAILED", "FLAGGED"];

function isTerminalStatus(status?: SessionStatus) {
  return Boolean(status && TERMINAL_SESSION_STATUSES.includes(status));
}

function getElapsedSeconds(session: SessionRecord | null, nowMs = Date.now()) {
  const baseTime = session?.liveStartedAt;
  if (!baseTime) return 0;
  const timestamp = new Date(baseTime).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.floor((nowMs - timestamp) / 1000));
}

export default function AudioCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const preferredCompanionId = searchParams.get("companionId") ?? "";
  const debugCallEnabled = searchParams.get("debugCall") === "1";
  const currentPath = `/call/audio/${routeId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [companion, setCompanion] = useState<CompanionRouteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [localAudioReady, setLocalAudioReady] = useState(false);
  const [joined, setJoined] = useState(false);
  const [needsPermissionAction, setNeedsPermissionAction] = useState(false);
  const [joining, setJoining] = useState(false);
  const [remoteAudioReady, setRemoteAudioReady] = useState(false);
  const [remoteAudioPublished, setRemoteAudioPublished] = useState(false);
  const [remoteAudioTrackExists, setRemoteAudioTrackExists] = useState(false);
  const [audioPlaybackReady, setAudioPlaybackReady] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [audioPlaybackAttempted, setAudioPlaybackAttempted] = useState(false);
  const [audioPlaybackError, setAudioPlaybackError] = useState("");
  const [remoteUserCount, setRemoteUserCount] = useState(0);
  const [localAudioPublished, setLocalAudioPublished] = useState(false);
  const [setSinkIdSupported, setSetSinkIdSupported] = useState<boolean | null>(null);
  const [speakerMessage, setSpeakerMessage] = useState("");
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const remoteAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const isCallLive = Boolean(session?.liveStartedAt);
  const elapsedSeconds = isCallLive ? getElapsedSeconds(session, clockNow) : 0;

  const notifyMediaReady = useCallback(async () => {
    if (!session?.id) return;
    const response = await markSessionMediaReady(session.id);
    if (response.data) {
      setSession((current) => (current && current.id === response.data!.id ? response.data : current));
    }
  }, [session]);

  const cleanupAgora = useCallback(async () => {
    try {
      remoteAudioTrackRef.current?.stop();
    } catch {
      // no-op
    }
    try {
      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
    } catch {
      // no-op
    }
    localAudioTrackRef.current = null;
    remoteAudioTrackRef.current = null;
    if (clientRef.current) {
      try {
        clientRef.current.removeAllListeners();
        await clientRef.current.leave();
      } catch {
        // no-op
      }
      clientRef.current = null;
    }
    setJoined(false);
    setLocalAudioReady(false);
    setLocalAudioPublished(false);
    setRemoteAudioReady(false);
    setRemoteAudioPublished(false);
    setRemoteAudioTrackExists(false);
    setAudioPlaybackReady(false);
    setAudioPlaybackAttempted(false);
    setAudioPlaybackError("");
    setRemoteUserCount(0);
    setSetSinkIdSupported(null);
    setNeedsPermissionAction(false);
  }, []);

  useEffect(() => {
    return () => {
      void cleanupAgora();
    };
  }, [cleanupAgora]);

  useEffect(() => {
    if (!routeId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");

      const token = await getUserAuthTokenWithRestore();
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      const fetched = await getSessionById(routeId);
      if (!active) return;
      if (fetched.error?.status === 401) {
        router.replace(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (fetched.data) {
        setSession(fetched.data);
        const resolved = await resolveCompanionRouteProfile(fetched.data.companionId);
        if (!active) return;
        if (resolved) setCompanion(resolved);
        setLoading(false);
        return;
      }

      const companionId = preferredCompanionId || routeId;
      const resolved = await resolveCompanionRouteProfile(companionId);
      if (!active) return;
      if (!resolved) {
        setError("Unable to start audio call. Please open the companion profile and try again.");
        setLoading(false);
        return;
      }

      const created = await createSession({ companionId: resolved.id, serviceType: "audio" });
      if (!active) return;
      if (created.error?.status === 401) {
        router.replace(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }
      if (created.error || !created.data?.id) {
        setError(created.error?.message || "Unable to create audio call request.");
        setCompanion(resolved);
        setLoading(false);
        return;
      }
      if (created.data.id !== routeId) {
        router.replace(`/call/audio/${created.data.id}?companionId=${encodeURIComponent(resolved.id)}`);
        return;
      }
      setSession(created.data);
      setCompanion(resolved);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [currentPath, preferredCompanionId, routeId, router, searchParams]);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;
    const syncSession = async () => {
      const latest = await getSessionById(session.id);
      if (cancelled || !latest.data) return;
      setSession(latest.data);
      if (isTerminalStatus(latest.data.status)) {
        await cleanupAgora();
      }
    };
    const timer = window.setInterval(() => {
      void syncSession();
    }, 2000);
    void syncSession();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [cleanupAgora, session?.id]);

  useEffect(() => {
    if (session?.status !== "LIVE" && session?.status !== "ACCEPTED") return;
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.status]);

  useEffect(() => {
    if (!isTerminalStatus(session?.status)) return;
    const timer = window.setTimeout(() => {
      router.push("/connect-now");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [router, session?.status]);

  useEffect(() => {
    if (!isTerminalStatus(session?.status)) return;
    const timer = window.setTimeout(() => {
      void cleanupAgora();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [cleanupAgora, session?.status]);

  useEffect(() => {
    if (!localAudioTrackRef.current) return;
    void localAudioTrackRef.current.setEnabled(!isMuted);
  }, [isMuted]);

  const replayRemoteAudio = useCallback(async (reason: "auto" | "gesture") => {
    const remoteTrack = remoteAudioTrackRef.current;
    if (!remoteTrack) {
      setSpeakerMessage("Remote audio is not available yet.");
      setAudioPlaybackReady(false);
      setAudioPlaybackError("Remote audio track missing.");
      return false;
    }
    setAudioPlaybackAttempted(true);
    setAudioPlaybackError("");

    try {
      const audioElement = remoteAudioElementRef.current;
      if (audioElement) {
        const supportsSetSinkId = typeof (audioElement as HTMLAudioElement & { setSinkId?: unknown }).setSinkId === "function";
        setSetSinkIdSupported(supportsSetSinkId);
        const mediaTrack = remoteTrack.getMediaStreamTrack?.();
        if (mediaTrack) {
          audioElement.srcObject = new MediaStream([mediaTrack]);
          await audioElement.play();
        } else {
          remoteTrack.play();
        }
        const sinkElement = audioElement as HTMLAudioElement & { setSinkId?: (sinkId: string) => Promise<void> };
        if (typeof sinkElement.setSinkId === "function") {
          try {
            await sinkElement.setSinkId("default");
            if (!speakerEnabled && reason === "gesture") {
              setSpeakerMessage("Speaker control depends on your browser. Use phone volume/output controls if needed.");
            } else {
              setSpeakerMessage("");
            }
          } catch {
            setSpeakerMessage("Speaker control depends on your browser. Use phone volume/output controls if needed.");
          }
        } else {
          setSpeakerMessage("Speaker control depends on your browser. Use phone volume/output controls if needed.");
        }
      } else {
        remoteTrack.play();
      }
      setAudioPlaybackReady(true);
      setAudioPlaybackError("");
      return true;
    } catch {
      setAudioPlaybackError("Playback blocked until user interaction.");
      setSpeakerMessage("Speaker control depends on your browser. Use phone volume/output controls if needed.");
      setAudioPlaybackReady(false);
      return false;
    }
  }, [speakerEnabled]);

  const toggleMute = useCallback(async () => {
    const track = localAudioTrackRef.current;
    if (!track) {
      setError("Microphone is not ready yet.");
      return;
    }
    const nextMuted = !isMuted;
    try {
      await track.setEnabled(!nextMuted);
      setIsMuted(nextMuted);
    } catch {
      setError("Unable to update microphone state right now.");
    }
  }, [isMuted]);

  const joinAgoraAudio = useCallback(async () => {
    if (!session || !companion || joining || joined) return;
    setJoining(true);
    setError("");
    try {
      await requestAudioPermission();
      setNeedsPermissionAction(false);

      const client = await createAgoraClient();
      clientRef.current = client;

      const syncRemoteAudioUser = async (user: {
        hasAudio?: boolean;
        audioTrack?: IRemoteAudioTrack | null;
      }) => {
        if (!user.hasAudio && !user.audioTrack) return;
        setRemoteAudioPublished(true);
        await client.subscribe(user as Parameters<typeof client.subscribe>[0], "audio");
        remoteAudioTrackRef.current = user.audioTrack ?? null;
        setRemoteAudioTrackExists(Boolean(user.audioTrack));
        setRemoteAudioReady(Boolean(user.audioTrack));
        await notifyMediaReady();
        if (user.audioTrack) {
          await replayRemoteAudio("auto");
        }
      };

      client.on("user-joined", (user) => {
        setRemoteUserCount(client.remoteUsers.length);
        void syncRemoteAudioUser(user);
      });
      client.on("user-published", async (user, mediaType) => {
        setRemoteUserCount(client.remoteUsers.length);
        if (mediaType === "audio") {
          await syncRemoteAudioUser(user);
        }
      });

      client.on("user-unpublished", (_user, mediaType) => {
        setRemoteUserCount(client.remoteUsers.length);
        if (mediaType === "audio") {
          setRemoteAudioPublished(false);
          setRemoteAudioReady(false);
          setRemoteAudioTrackExists(false);
          setAudioPlaybackReady(false);
          remoteAudioTrackRef.current = null;
          setAudioPlaybackError("Remote user unpublished audio.");
        }
      });

      client.on("user-left", () => {
        setRemoteUserCount(client.remoteUsers.length);
        setRemoteAudioPublished(false);
        setRemoteAudioReady(false);
        setRemoteAudioTrackExists(false);
        setAudioPlaybackReady(false);
        remoteAudioTrackRef.current = null;
      });

      const tokenResponse = await getSessionAgoraToken(session.id);
      if (tokenResponse.error || !tokenResponse.data?.token) {
        setError(tokenResponse.error?.message || "Could not prepare secure call token. Please retry.");
        await cleanupAgora();
        return;
      }

      const appId = tokenResponse.data.appId || AGORA_APP_ID;
      if (!appId) {
        setError("Calling is not configured. Missing Agora App ID.");
        await cleanupAgora();
        return;
      }
      const channelName = normalizeChannelName(session.id, tokenResponse.data?.channelName ?? session.channelName);
      const uid = tokenResponse.data?.uid ?? buildAgoraUid(session.id, session.userId ?? "user");

      await client.join(appId, channelName, tokenResponse.data.token, uid);

      const AgoraRTC = await import("agora-rtc-sdk-ng");
      const localAudioTrack = await AgoraRTC.default.createMicrophoneAudioTrack();
      localAudioTrackRef.current = localAudioTrack;
      setLocalAudioReady(true);
      await client.publish([localAudioTrack]);
      setLocalAudioPublished(true);
      await notifyMediaReady();
      setRemoteUserCount(client.remoteUsers.length);
      await Promise.all(
        client.remoteUsers.map(async (remoteUser) => {
          if (!remoteUser.hasAudio && !remoteUser.audioTrack) return;
          await client.subscribe(remoteUser, "audio");
          remoteAudioTrackRef.current = remoteUser.audioTrack ?? null;
          setRemoteAudioTrackExists(Boolean(remoteUser.audioTrack));
          setRemoteAudioPublished(true);
          setRemoteAudioReady(Boolean(remoteUser.audioTrack));
          await notifyMediaReady();
          if (remoteUser.audioTrack) {
            await replayRemoteAudio("auto");
          }
        }),
      );
      setJoined(true);
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : "Unable to connect audio call.";
      if (/permission|denied|notallowed/i.test(message)) {
        setNeedsPermissionAction(true);
        setError("Microphone permission is required for audio calls.");
      } else {
        setError(message);
      }
      await cleanupAgora();
    } finally {
      setJoining(false);
    }
  }, [cleanupAgora, companion, joined, joining, notifyMediaReady, replayRemoteAudio, session]);

  useEffect(() => {
    if ((session?.status !== "LIVE" && session?.status !== "ACCEPTED") || joined || joining) return;
    const timer = window.setTimeout(() => {
      void joinAgoraAudio();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [joinAgoraAudio, joined, joining, session?.status]);

  const handleCancel = async () => {
    if (!session?.id || isCancelling) return;
    setIsCancelling(true);
    let response;
    if (session.status === "PENDING") {
      response = await cancelSession(session.id);
    } else {
      const nowIso = new Date().toISOString();
      const endPromise = endSession(session.id);
      await cleanupAgora();
      setSession((current) => (current ? { ...current, status: "ENDED", endedAt: current.endedAt ?? nowIso } : current));
      response = await endPromise;
    }
    setIsCancelling(false);
    if (response.data) {
      setSession(response.data);
      return;
    }
    setError(response.error?.message || "Unable to cancel request.");
  };

  const handleConfirmEndSession = useCallback(async () => {
    if (!session?.id) return;
    if (isCancelling) throw new Error("Session is already ending.");
    setIsCancelling(true);
    try {
      const responsePromise = endSession(session.id);
      await cleanupAgora();
      const response = await responsePromise;
      if (!response.data) {
        const message = response.error?.message || "Unable to end this session. Please try again.";
        setError(message);
        throw new Error(message);
      }
      setSession(response.data);
    } finally {
      setIsCancelling(false);
    }
  }, [cleanupAgora, isCancelling, session?.id]);

  const navigateAfterExit = useCallback(() => {
    router.push("/connect-now");
  }, [router]);

  const exitGuard = useSessionExitGuard({
    active: isActiveSessionStatus(session?.status),
    onEndSession: handleConfirmEndSession,
    onNavigateAway: navigateAfterExit,
  });

  const exitConfirmModal = (
    <EndSessionConfirmModal
      open={exitGuard.confirmOpen}
      loading={exitGuard.confirmLoading}
      error={exitGuard.confirmError}
      onStay={exitGuard.stay}
      onEndSession={() => {
        void exitGuard.endAndExit();
      }}
    />
  );

  const handleSpeakerToggle = () => {
    const nextSpeakerState = !speakerEnabled;
    setSpeakerEnabled(nextSpeakerState);
    if (nextSpeakerState || !audioPlaybackReady) {
      void replayRemoteAudio("gesture");
      return;
    }
    setSpeakerMessage("Speaker off on this device.");
  };

  if (loading) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0f1d4d] p-4 text-white">Opening audio call...</main>
    );
  }

  if (!session || !companion) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0f1d4d] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">{error || "Audio call request is not available."}</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  if (session.status === "PENDING") {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0f1d4d] p-4 text-white">
        {exitConfirmModal}
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">Calling partner...</p>
          <p className="mt-2 text-sm text-cyan-100">Waiting for partner to accept your audio request.</p>
          <button
            type="button"
            disabled={isCancelling}
            onClick={() => {
              void handleCancel();
            }}
            className="mt-4 rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isCancelling ? "Cancelling..." : "Cancel call"}
          </button>
        </div>
      </main>
    );
  }

  if (isTerminalStatus(session.status)) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0f1d4d] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This call has ended.</p>
          <p className="mt-2 text-xs text-cyan-100">Session ended. Redirecting to Connect Now...</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  if (session.status !== "LIVE" && session.status !== "ACCEPTED") {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0f1d4d] p-4 text-white">
        {exitConfirmModal}
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This audio call is not active right now.</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  return (
    <section
      className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-gradient-to-b from-[#f3fbf9] via-[#e8f6f3] to-[#d9efea] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-[#0f172a] sm:px-6"
      onClick={() => {
        if (remoteAudioPublished && !audioPlaybackReady) {
          void replayRemoteAudio("gesture");
        }
      }}
    >
      {exitConfirmModal}
      <div className="mx-auto flex h-full w-full max-w-xl flex-col">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Go back"
            onClick={exitGuard.requestExit}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#cde8e2] bg-white/70 text-[#0f172a] transition hover:bg-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="rounded-full border border-[#b7dfd7] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#0f766e]">
            YoPartner Secure Call
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#d6f3ed] px-2.5 py-1 text-[11px] font-semibold text-[#0f766e]">
            <Lock size={12} />
            Secure
          </span>
        </div>
        {needsPermissionAction ? (
          <button
            type="button"
            onClick={() => {
              void joinAgoraAudio();
            }}
            disabled={joining}
            className="mt-4 rounded-xl border border-[#b7dfd7] bg-white/80 px-3 py-2 text-xs text-[#0f766e] disabled:opacity-70"
          >
            {joining ? "Enabling microphone..." : "Enable microphone"}
          </button>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {error}
          </p>
        ) : null}
        {speakerMessage ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
            {speakerMessage}
          </p>
        ) : null}
        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">Audio Call</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[#0f172a]">{companion.name}</h1>
          <p className="mt-2 text-base text-[#334155]">
            {remoteAudioPublished
              ? audioPlaybackReady
                ? "Audio connected"
                : "Tap speaker or screen to enable audio"
              : "Connecting audio..."}
          </p>
          <p className="mt-1 text-[30px] font-semibold tabular-nums text-[#0f172a]">
            {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:{String(elapsedSeconds % 60).padStart(2, "0")}
          </p>
        </div>
        <div className="relative mt-6 flex flex-1 items-center justify-center">
          <span className="absolute h-[280px] w-[280px] rounded-full bg-[#0f766e]/8" />
          <span className="absolute h-[240px] w-[240px] rounded-full border border-[#b7dfd7]" />
          {remoteAudioReady ? <span className="absolute h-[220px] w-[220px] animate-pulse rounded-full border border-[#7dcfbe]/60" /> : null}
          {companion.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companion.image} alt={companion.name} className="relative h-48 w-48 rounded-full border-4 border-white object-cover shadow-[0_22px_45px_rgba(15,23,42,0.18)]" />
          ) : (
            <span className="relative inline-flex h-48 w-48 items-center justify-center rounded-full border-4 border-white bg-[#d6f3ed] text-4xl font-semibold text-[#0f766e] shadow-[0_22px_45px_rgba(15,23,42,0.18)]">
              {companion.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        {remoteAudioPublished && !audioPlaybackReady ? (
          <p className="mt-2 text-center text-xs text-[#334155]">Tap speaker or screen to enable audio</p>
        ) : null}
        <div className="pb-2 pt-4">
          <div className="rounded-[28px] border border-[#cde8e2] bg-white/80 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              disabled={!localAudioReady}
              onClick={() => {
                void toggleMute();
              }}
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full border ${
                isMuted ? "border-[#0d9488] bg-[#d6f3ed] text-[#0f766e]" : "border-[#cfe7e2] bg-white text-[#334155]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Mic size={20} />
            </button>
            <button
              type="button"
              onClick={handleSpeakerToggle}
              className={`inline-flex h-14 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold ${
                speakerEnabled ? "border-[#0d9488] bg-[#d6f3ed] text-[#0f766e]" : "border-[#cfe7e2] bg-white text-[#334155]"
              }`}
            >
              <Volume2 size={20} />
              <span>{speakerEnabled ? "Speaker On" : "Speaker Off"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                void handleCancel();
              }}
              className="inline-flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#dc2626] text-white shadow-lg shadow-red-700/25 transition hover:bg-red-500"
            >
              <PhoneOff size={24} />
            </button>
            </div>
          </div>
        </div>
        {debugCallEnabled ? (
          <div className="mt-2 rounded-xl border border-slate-300 bg-white/80 p-3 text-xs text-slate-700">
            <p>joined: {String(joined)}</p>
            <p>local mic published: {String(localAudioPublished)}</p>
            <p>remote user count: {remoteUserCount}</p>
            <p>remote audio ready: {String(remoteAudioReady)}</p>
            <p>remote audio track exists: {String(remoteAudioTrackExists)}</p>
            <p>audio playback attempted: {String(audioPlaybackAttempted)}</p>
            <p>audio playback error: {audioPlaybackError || "-"}</p>
            <p>speakerEnabled: {String(speakerEnabled)}</p>
            <p>setSinkId supported: {setSinkIdSupported == null ? "unknown" : String(setSinkIdSupported)}</p>
          </div>
        ) : null}
      </div>
      <audio
        ref={remoteAudioElementRef}
        className="hidden"
        autoPlay
        playsInline
        onPlay={() => {
          setAudioPlaybackReady(true);
          setAudioPlaybackError("");
        }}
        onError={() => {
          setAudioPlaybackReady(false);
          setAudioPlaybackError("Audio element playback failed.");
        }}
      />
    </section>
  );
}
