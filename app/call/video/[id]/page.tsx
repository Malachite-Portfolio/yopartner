"use client";

import { ArrowLeft, Camera, CameraOff, MessageCircle, Mic, PhoneOff, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import {
  cancelSession,
  createSession,
  endSession,
  getSessionAgoraToken,
  getSessionById,
  type SessionRecord,
  type SessionStatus,
} from "@/lib/api/sessions";
import { USER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";
import {
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";
import { buildAgoraUid, createAgoraClient, normalizeChannelName, requestVideoPermission } from "@/lib/agora";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() ?? "";
const TERMINAL_SESSION_STATUSES: SessionStatus[] = ["DECLINED", "CANCELLED", "ENDED", "EXPIRED", "COMPLETED", "FAILED", "FLAGGED"];

function isTerminalStatus(status?: SessionStatus) {
  return Boolean(status && TERMINAL_SESSION_STATUSES.includes(status));
}

function getElapsedSeconds(session: SessionRecord | null, nowMs = Date.now()) {
  const baseTime = session?.startedAt ?? session?.acceptedAt;
  if (!baseTime) return 0;
  const timestamp = new Date(baseTime).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.floor((nowMs - timestamp) / 1000));
}

function getUserToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(USER_FIREBASE_TOKEN_KEY);
  return token && token.trim().length > 0 ? token.trim() : null;
}

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const preferredCompanionId = searchParams.get("companionId") ?? "";
  const currentPath = `/call/video/${routeId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [companion, setCompanion] = useState<CompanionRouteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [joined, setJoined] = useState(false);
  const [needsPermissionAction, setNeedsPermissionAction] = useState(false);
  const [joining, setJoining] = useState(false);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const remoteVideoTrackRef = useRef<IRemoteVideoTrack | null>(null);
  const localVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const elapsedSeconds = session?.status === "LIVE" ? getElapsedSeconds(session, clockNow) : 0;

  const cleanupAgora = useCallback(async () => {
    try {
      remoteAudioTrackRef.current?.stop();
      remoteVideoTrackRef.current?.stop();
    } catch {
      // no-op
    }
    try {
      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.stop();
      localVideoTrackRef.current?.close();
    } catch {
      // no-op
    }
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    remoteAudioTrackRef.current = null;
    remoteVideoTrackRef.current = null;
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
    setRemoteVideoReady(false);
    setRemoteUserJoined(false);
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

      const token = getUserToken();
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      const fetched = await getSessionById(routeId);
      if (!active) return;
      if (fetched.error?.status === 401) {
        window.localStorage.removeItem(USER_FIREBASE_TOKEN_KEY);
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
        setError("Unable to start video call. Please open the companion profile and try again.");
        setLoading(false);
        return;
      }

      const created = await createSession({ companionId: resolved.id, serviceType: "video" });
      if (!active) return;
      if (created.error?.status === 401) {
        window.localStorage.removeItem(USER_FIREBASE_TOKEN_KEY);
        router.replace(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }
      if (created.error || !created.data?.id) {
        setError(created.error?.message || "Unable to create video call request.");
        setCompanion(resolved);
        setLoading(false);
        return;
      }
      if (created.data.id !== routeId) {
        router.replace(`/call/video/${created.data.id}?companionId=${encodeURIComponent(resolved.id)}`);
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
    if (session?.status !== "LIVE") return;
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.status]);

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

  useEffect(() => {
    if (!localVideoTrackRef.current) return;
    void localVideoTrackRef.current.setEnabled(isCameraOn);
  }, [isCameraOn]);

  const joinAgoraVideo = useCallback(async () => {
    if (!session || !companion || joining || joined) return;
    setJoining(true);
    setError("");
    try {
      await requestVideoPermission();
      setNeedsPermissionAction(false);

      const client = await createAgoraClient();
      clientRef.current = client;

      const subscribeRemoteUser = async (user: IAgoraRTCRemoteUser, mediaType?: "audio" | "video") => {
        setRemoteUserJoined(true);
        const shouldSubscribeVideo = (!mediaType || mediaType === "video") && user.hasVideo;
        const shouldSubscribeAudio = (!mediaType || mediaType === "audio") && user.hasAudio;

        if (shouldSubscribeVideo) {
          try {
            await client.subscribe(user, "video");
          } catch {
            // Agora can throw if a repeated sweep hits an already-subscribed track.
          }
          if (user.videoTrack && remoteVideoContainerRef.current) {
            try {
              user.videoTrack.play(remoteVideoContainerRef.current);
              remoteVideoTrackRef.current = user.videoTrack;
              setRemoteVideoReady(true);
            } catch {
              setRemoteVideoReady(false);
            }
          }
        }

        if (shouldSubscribeAudio) {
          try {
            await client.subscribe(user, "audio");
          } catch {
            // Safe to ignore duplicate subscriptions from delayed remote-user sweeps.
          }
          if (user.audioTrack) {
            user.audioTrack.play();
            remoteAudioTrackRef.current = user.audioTrack;
          }
        }
      };

      const sweepRemoteUsers = async () => {
        if (client.remoteUsers.length > 0) setRemoteUserJoined(true);
        await Promise.all(client.remoteUsers.map((remoteUser) => subscribeRemoteUser(remoteUser)));
      };

      client.on("user-joined", (user) => {
        setRemoteUserJoined(true);
        void subscribeRemoteUser(user);
      });
      client.on("user-published", async (user, mediaType) => {
        if (mediaType !== "audio" && mediaType !== "video") return;
        await subscribeRemoteUser(user, mediaType);
      });

      client.on("user-unpublished", (_user, mediaType) => {
        if (mediaType === "video") {
          setRemoteVideoReady(false);
          remoteVideoTrackRef.current = null;
        }
        if (mediaType === "audio") {
          remoteAudioTrackRef.current = null;
        }
      });

      client.on("user-left", () => {
        setRemoteUserJoined(client.remoteUsers.length > 0);
        setRemoteVideoReady(false);
        remoteVideoTrackRef.current = null;
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
      const [localAudioTrack, localVideoTrack] = await AgoraRTC.default.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = localAudioTrack;
      localVideoTrackRef.current = localVideoTrack;
      await client.publish([localAudioTrack, localVideoTrack]);
      if (localVideoContainerRef.current) {
        localVideoTrack.play(localVideoContainerRef.current);
      }
      await sweepRemoteUsers();
      window.setTimeout(() => {
        void sweepRemoteUsers();
      }, 500);
      window.setTimeout(() => {
        void sweepRemoteUsers();
      }, 1500);
      setJoined(true);
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : "Unable to connect video call.";
      if (/permission|denied|notallowed/i.test(message)) {
        setNeedsPermissionAction(true);
        setError("Camera and microphone permission are required for video calls.");
      } else {
        setError(message);
      }
      await cleanupAgora();
    } finally {
      setJoining(false);
    }
  }, [cleanupAgora, companion, joined, joining, session]);

  useEffect(() => {
    if (session?.status !== "LIVE" || joined || joining) return;
    const timer = window.setTimeout(() => {
      void joinAgoraVideo();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [joinAgoraVideo, joined, joining, session?.status]);

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

  if (loading) {
    return <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0b1224] p-4 text-white">Opening video call...</main>;
  }

  if (!session || !companion) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0b1224] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">{error || "Video call request is not available."}</p>
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
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0b1224] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">Calling partner...</p>
          <p className="mt-2 text-sm text-cyan-100">Waiting for partner to accept your video request.</p>
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
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0b1224] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This call has ended.</p>
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

  if (session.status !== "LIVE") {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0b1224] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This video call is not active right now.</p>
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
    <section className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#020617] text-white">
      <div ref={remoteVideoContainerRef} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black/75" />
      <div className="relative z-10 flex h-full flex-col px-3.5 pt-[max(0.8rem,env(safe-area-inset-top))] pb-[max(0.95rem,env(safe-area-inset-bottom))] sm:px-5">
        {needsPermissionAction ? (
          <button
            type="button"
            onClick={() => {
              void joinAgoraVideo();
            }}
            disabled={joining}
            className="mb-3 rounded-xl border border-white/25 bg-black/35 px-3 py-2 text-xs text-cyan-100 disabled:opacity-70"
          >
            {joining ? "Enabling camera & microphone..." : "Enable camera & microphone"}
          </button>
        ) : null}
        {error ? (
          <p className="mb-3 rounded-xl border border-amber-300/80 bg-amber-100/15 px-3 py-2 text-xs text-amber-100">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Back to Connect"
            onClick={() => router.push("/connect-now")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 px-3">
            <p className="truncate text-sm font-semibold">{companion.name}</p>
            <p className="text-xs text-white/75">{formatTimer(elapsedSeconds)}</p>
          </div>
          <span className="rounded-full border border-cyan-300/40 bg-cyan-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
            {remoteVideoReady ? "Secure HD" : "Secure"}
          </span>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          {!remoteVideoReady ? (
            <div className="relative z-10 text-center">
              <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl font-semibold">
                {companion.name.slice(0, 1).toUpperCase()}
              </span>
              <p className="mt-3 text-xl font-semibold">{companion.name}</p>
              <p className="mt-1 text-sm text-white/80">
                {remoteUserJoined ? "Connected. Waiting for video..." : "Waiting for video..."}
              </p>
            </div>
          ) : null}

          <div className="absolute right-0 top-5 h-32 w-[120px] overflow-hidden rounded-[20px] border-2 border-white/85 bg-slate-900 shadow-2xl shadow-black/40 sm:w-[138px]">
            {!isCameraOn ? (
              <div className="flex h-full w-full items-center justify-center bg-slate-950/95 text-center">
                <div>
                  <CameraOff size={20} className="mx-auto text-slate-100" />
                  <p className="mt-1 text-[11px] text-slate-100">Camera Off</p>
                </div>
              </div>
            ) : (
              <div ref={localVideoContainerRef} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
            )}
            <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
              You
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex w-full max-w-[540px] items-center justify-center gap-2.5 rounded-full border border-white/15 bg-black/45 px-3 py-2.5 shadow-2xl backdrop-blur">
          <button
            type="button"
            onClick={() => setIsCameraOn((value) => !value)}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${
              isCameraOn ? "border-white/25 bg-white/10 text-white" : "border-red-300/30 bg-red-500/25 text-red-100"
            }`}
          >
            {isCameraOn ? <Camera size={18} /> : <CameraOff size={18} />}
          </button>
          <button
            type="button"
            onClick={() => setIsMuted((value) => !value)}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${
              isMuted ? "border-amber-300/40 bg-amber-400/25 text-amber-100" : "border-white/25 bg-white/10 text-white"
            }`}
          >
            <Mic size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCancel();
            }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#dc2626] text-white shadow-lg shadow-red-950/35"
          >
            <PhoneOff size={22} />
          </button>
          <button
            type="button"
            onClick={() => setIsFrontCamera((value) => !value)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
            aria-label="Switch camera"
            title={isFrontCamera ? "Front camera selected" : "Rear camera selected"}
          >
            <RefreshCcw size={18} />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/chat/${session.id}?companionId=${encodeURIComponent(companion.id)}`)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
          >
            <MessageCircle size={18} />
          </button>
          </div>
        </div>
      </div>
    </section>
  );
}
