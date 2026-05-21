"use client";

import { ArrowLeft, Camera, CameraOff, MessageCircle, Mic, PhoneOff, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteAudioTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { PartnerGuard } from "@/components/partner/PartnerGuard";
import { endSession, getSessionAgoraToken, getSessionById, type SessionRecord, type SessionStatus } from "@/lib/api/sessions";
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

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value || "Member";
  return `+91******${digits.slice(-4)}`;
}

export default function PartnerVideoCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? "";
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [mute, setMute] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [frontCamera, setFrontCamera] = useState(true);
  const [error, setError] = useState("");
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
  const elapsed = session?.status === "LIVE" ? getElapsedSeconds(session, clockNow) : 0;

  const cleanupAgora = useCallback(async () => {
    try {
      remoteAudioTrackRef.current?.stop();
      remoteVideoTrackRef.current?.stop();
      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.stop();
      localVideoTrackRef.current?.close();
    } catch {
      // no-op
    }
    remoteAudioTrackRef.current = null;
    remoteVideoTrackRef.current = null;
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
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
    if (!sessionId) return;
    void (async () => {
      const response = await getSessionById(sessionId);
      if (response.error || !response.data) {
        setError(response.error?.message || "Unable to open video call.");
        return;
      }
      setSession(response.data);
    })();
  }, [sessionId]);

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
    void localAudioTrackRef.current.setEnabled(!mute);
  }, [mute]);

  useEffect(() => {
    if (!localVideoTrackRef.current) return;
    void localVideoTrackRef.current.setEnabled(cameraOn);
  }, [cameraOn]);

  const joinAgoraVideo = useCallback(async () => {
    if (!session || joining || joined) return;
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
          if (remoteVideoContainerRef.current) user.videoTrack?.play(remoteVideoContainerRef.current);
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
          remoteVideoTrackRef.current = null;
          setRemoteVideoReady(false);
        }
        if (mediaType === "audio") {
          remoteAudioTrackRef.current = null;
        }
      });
      client.on("user-left", () => {
        remoteVideoTrackRef.current = null;
        remoteAudioTrackRef.current = null;
        setRemoteVideoReady(false);
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
      const uid = tokenResponse.data?.uid ?? buildAgoraUid(session.id, String(session.companion?.userId ?? "partner"));
      await client.join(appId, channelName, tokenResponse.data.token, uid);

      const AgoraRTC = await import("agora-rtc-sdk-ng");
      const [localAudioTrack, localVideoTrack] = await AgoraRTC.default.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = localAudioTrack;
      localVideoTrackRef.current = localVideoTrack;
      await client.publish([localAudioTrack, localVideoTrack]);
      if (localVideoContainerRef.current) localVideoTrack.play(localVideoContainerRef.current);
      await Promise.all(
        client.remoteUsers.map(async (remoteUser) => {
          if (remoteUser.hasVideo) {
            await client.subscribe(remoteUser, "video");
            if (remoteVideoContainerRef.current) remoteUser.videoTrack?.play(remoteVideoContainerRef.current);
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
  }, [cleanupAgora, joined, joining, session]);

  useEffect(() => {
    if (session?.status !== "LIVE" || joined || joining) return;
    const timer = window.setTimeout(() => {
      void joinAgoraVideo();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [joinAgoraVideo, joined, joining, session?.status]);

  const maskedPhone = useMemo(
    () => String(session?.user?.phoneMasked ?? maskPhone(String(session?.user?.phoneNumber ?? ""))),
    [session?.user],
  );

  if (session && isTerminalStatus(session.status)) {
    return (
      <PartnerGuard requireOnboarding>
        <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#020617] p-4 text-white">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
            <p className="text-base font-semibold">This call has ended.</p>
            <button
              type="button"
              onClick={() => router.push("/partner/dashboard")}
              className="mt-4 rounded-xl bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </PartnerGuard>
    );
  }

  if (session && session.status !== "LIVE") {
    return (
      <PartnerGuard requireOnboarding>
        <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#020617] p-4 text-white">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
            <p className="text-base font-semibold">This video call is not active right now.</p>
            <button
              type="button"
              onClick={() => router.push("/partner/dashboard")}
              className="mt-4 rounded-xl bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </PartnerGuard>
    );
  }

  return (
    <PartnerGuard requireOnboarding>
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
              className="mb-3 rounded-xl border border-white/25 bg-black/35 px-3 py-2 text-center text-xs text-cyan-100 disabled:opacity-70"
            >
              {joining ? "Enabling camera & microphone..." : "Enable camera & microphone"}
            </button>
          ) : null}
          {error ? (
            <p className="mb-3 rounded-xl border border-rose-300/70 bg-rose-100/10 px-3 py-2 text-center text-xs text-rose-100">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/partner/dashboard")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1 px-3">
              <p className="truncate text-sm font-semibold">{maskedPhone}</p>
              <p className="text-xs text-white/75">{formatTimer(elapsed)}</p>
            </div>
            <span className="rounded-full border border-cyan-300/40 bg-cyan-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
              {remoteVideoReady ? "Secure HD" : "Secure"}
            </span>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            {!remoteVideoReady ? (
              <div className="relative z-10 text-center">
                <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl font-semibold">
                  {maskedPhone.slice(-2)}
                </span>
                <p className="mt-3 text-xl font-semibold">{maskedPhone}</p>
                <p className="mt-1 text-sm text-white/80">Waiting for video...</p>
              </div>
            ) : null}

            <div className="absolute right-0 top-5 h-32 w-[120px] overflow-hidden rounded-[20px] border-2 border-white/85 bg-slate-900 shadow-2xl shadow-black/40 sm:w-[138px]">
              {!cameraOn ? (
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
                onClick={() => setCameraOn((current) => !current)}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${
                  cameraOn ? "border-white/25 bg-white/10 text-white" : "border-red-300/30 bg-red-500/25 text-red-100"
                }`}
              >
                {cameraOn ? <Camera size={18} /> : <CameraOff size={18} />}
              </button>
              <button
                type="button"
                onClick={() => setMute((current) => !current)}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${
                  mute ? "border-amber-300/40 bg-amber-400/25 text-amber-100" : "border-white/25 bg-white/10 text-white"
                }`}
              >
                <Mic size={18} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  const nowIso = new Date().toISOString();
                  const endPromise = endSession(sessionId);
                  await cleanupAgora();
                  setSession((current) => (current ? { ...current, status: "ENDED", endedAt: current.endedAt ?? nowIso } : current));
                  const response = await endPromise;
                  if (response.data) {
                    setSession(response.data);
                    return;
                  }
                  setError(response.error?.message || "Unable to end call right now.");
                }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#dc2626] text-white shadow-lg shadow-red-950/35"
              >
                <PhoneOff size={22} />
              </button>
              <button
                type="button"
                onClick={() => setFrontCamera((current) => !current)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
                aria-label="Switch camera"
                title={frontCamera ? "Front camera selected" : "Rear camera selected"}
              >
                <RefreshCcw size={18} />
              </button>
              <button
                type="button"
                onClick={() => router.push(`/partner/chat/${sessionId}`)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </PartnerGuard>
  );
}
