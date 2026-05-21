"use client";

import { Camera, CameraOff, MessageCircle, Mic, PhoneOff, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteAudioTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
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
const TERMINAL_SESSION_STATUSES: SessionStatus[] = ["DECLINED", "CANCELLED", "ENDED", "EXPIRED"];

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

      const syncRemoteMediaUser = async (user: {
        hasAudio?: boolean;
        hasVideo?: boolean;
        audioTrack?: IRemoteAudioTrack | null;
        videoTrack?: IRemoteVideoTrack | null;
      }) => {
        if (user.hasVideo) {
          await client.subscribe(user as Parameters<typeof client.subscribe>[0], "video");
          if (remoteVideoContainerRef.current) {
            user.videoTrack?.play(remoteVideoContainerRef.current);
          }
          remoteVideoTrackRef.current = user.videoTrack ?? null;
          setRemoteVideoReady(Boolean(user.videoTrack));
        }
        if (user.hasAudio) {
          await client.subscribe(user as Parameters<typeof client.subscribe>[0], "audio");
          user.audioTrack?.play();
          remoteAudioTrackRef.current = user.audioTrack ?? null;
        }
      };

      client.on("user-joined", (user) => {
        void syncRemoteMediaUser(user);
      });
      client.on("user-published", async (user, mediaType) => {
        if (mediaType === "video") {
          await syncRemoteMediaUser(user);
        }
        if (mediaType === "audio") {
          await syncRemoteMediaUser(user);
        }
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
      await Promise.all(
        client.remoteUsers.map(async (remoteUser) => {
          if (remoteUser.hasVideo) {
            await client.subscribe(remoteUser, "video");
            if (remoteVideoContainerRef.current) {
              remoteUser.videoTrack?.play(remoteVideoContainerRef.current);
            }
            remoteVideoTrackRef.current = remoteUser.videoTrack ?? null;
            setRemoteVideoReady(Boolean(remoteUser.videoTrack));
          }
          if (remoteUser.hasAudio) {
            await client.subscribe(remoteUser, "audio");
            remoteUser.audioTrack?.play();
            remoteAudioTrackRef.current = remoteUser.audioTrack ?? null;
          }
        }),
      );
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
    return <main className="flex h-screen items-center justify-center bg-[#0b1224] p-4 text-white">Opening video call...</main>;
  }

  if (!session || !companion) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0b1224] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">{error || "Video call request is not available."}</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to companions
          </button>
        </div>
      </main>
    );
  }

  if (session.status === "PENDING") {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0b1224] p-4 text-white">
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
      <main className="flex h-screen items-center justify-center bg-[#0b1224] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This call has ended.</p>
          <button
            type="button"
            onClick={() => router.push(`/connect-now/${companion.id}`)}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to profile
          </button>
        </div>
      </main>
    );
  }

  if (session.status !== "LIVE") {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0b1224] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This video call is not active right now.</p>
          <button
            type="button"
            onClick={() => router.push(`/connect-now/${companion.id}`)}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to profile
          </button>
        </div>
      </main>
    );
  }

  return (
    <section className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#0b1224] text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1224] via-[#0a132a] to-[#03060f]" />
      <div className="relative z-10 flex h-full flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
        {needsPermissionAction ? (
          <button
            type="button"
            onClick={() => {
              void joinAgoraVideo();
            }}
            disabled={joining}
            className="mb-3 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-70"
          >
            {joining ? "Enabling camera & microphone..." : "Enable camera & microphone"}
          </button>
        ) : null}
        {error ? (
          <p className="mb-3 rounded-xl border border-amber-200/80 bg-amber-100/15 px-3 py-2 text-xs text-amber-100">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-2.5">
          <div>
            <p className="text-sm font-semibold">{companion.name}</p>
            <p className="text-xs text-cyan-100/85">{remoteVideoReady ? "Connected" : "Waiting for partner video..."}</p>
          </div>
          <p className="text-sm font-semibold tabular-nums">{formatTimer(elapsedSeconds)}</p>
        </div>
        <div className="relative mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <div ref={remoteVideoContainerRef} className="absolute inset-0" />
          {!remoteVideoReady ? (
            <div className="relative z-10 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Video</p>
              <p className="mt-2 text-2xl font-semibold">Waiting for partner video...</p>
            </div>
          ) : null}
          <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-white/20 bg-slate-900/80 sm:h-36 sm:w-52">
            {!isCameraOn ? (
              <div className="flex h-full w-full items-center justify-center bg-slate-950/90 text-center">
                <div>
                  <CameraOff size={20} className="mx-auto text-slate-100" />
                  <p className="mt-1 text-xs text-slate-100">Camera Off</p>
                </div>
              </div>
            ) : (
              <div ref={localVideoContainerRef} className="h-full w-full" />
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsMuted((value) => !value)}
            className={`inline-flex h-14 w-14 items-center justify-center rounded-full border ${
              isMuted ? "border-cyan-300 bg-cyan-400/30" : "border-white/25 bg-white/10"
            }`}
          >
            <Mic size={20} />
          </button>
          <button
            type="button"
            onClick={() => setIsCameraOn((value) => !value)}
            className={`inline-flex h-14 w-14 items-center justify-center rounded-full border ${
              isCameraOn ? "border-cyan-300 bg-cyan-400/30" : "border-white/25 bg-white/10"
            }`}
          >
            {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
          </button>
          <button
            type="button"
            onClick={() => setIsFrontCamera((value) => !value)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10"
            aria-label="Switch camera"
            title={isFrontCamera ? "Front camera selected" : "Rear camera selected"}
          >
            <RefreshCcw size={20} />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/chat/${session.id}?companionId=${encodeURIComponent(companion.id)}`)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10"
          >
            <MessageCircle size={20} />
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCancel();
            }}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}
