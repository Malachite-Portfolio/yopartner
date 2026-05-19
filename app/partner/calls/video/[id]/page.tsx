"use client";

import { Camera, CameraOff, MessageCircle, Mic, PhoneOff, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteAudioTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { PartnerGuard } from "@/components/partner/PartnerGuard";
import { endSession, getSessionAgoraToken, getSessionById, type SessionRecord } from "@/lib/api/sessions";
import { buildAgoraUid, createAgoraClient, normalizeChannelName, requestVideoPermission } from "@/lib/agora";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() ?? "";

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
  const [elapsed, setElapsed] = useState(0);
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
    const timer = window.setInterval(async () => {
      const latest = await getSessionById(session.id);
      if (latest.data) setSession(latest.data);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [session?.id]);

  useEffect(() => {
    if (session?.status !== "LIVE" || !joined) return;
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [joined, session?.status]);

  useEffect(() => {
    if (!session?.status || session.status === "LIVE" || !joined) return;
    const timer = window.setTimeout(() => {
      void cleanupAgora();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [cleanupAgora, joined, session?.status]);

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
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          if (remoteVideoContainerRef.current) user.videoTrack?.play(remoteVideoContainerRef.current);
          remoteVideoTrackRef.current = user.videoTrack ?? null;
          setRemoteVideoReady(Boolean(user.videoTrack));
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
          remoteAudioTrackRef.current = user.audioTrack ?? null;
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

  const maskedPhone = useMemo(() => maskPhone(String(session?.user?.phoneNumber ?? "")), [session?.user]);

  return (
    <PartnerGuard requireOnboarding>
      <section className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#050814] text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1224] via-[#0a132a] to-[#03060f]" />

        <div className="relative z-10 flex h-full flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          {needsPermissionAction ? (
            <button
              type="button"
              onClick={() => {
                void joinAgoraVideo();
              }}
              disabled={joining}
              className="mb-3 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-center text-xs text-cyan-100 disabled:opacity-70"
            >
              {joining ? "Enabling camera & microphone..." : "Enable camera & microphone"}
            </button>
          ) : null}
          {error ? (
            <p className="mb-3 rounded-xl border border-rose-200/70 bg-rose-100/10 px-3 py-2 text-center text-xs text-rose-100">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-2.5">
            <div>
              <p className="text-sm font-semibold">{maskedPhone}</p>
              <p className="text-xs text-cyan-100/85">{joined ? "Connected" : "Waiting for connection..."}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums">{formatTimer(elapsed)}</p>
          </div>

          <div className="relative mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div ref={remoteVideoContainerRef} className="absolute inset-0" />
            {!remoteVideoReady ? (
              <div className="relative z-10 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Video</p>
                <p className="mt-2 text-2xl font-semibold">Waiting for member video...</p>
              </div>
            ) : null}

            <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-white/20 bg-slate-900/80 sm:h-36 sm:w-52">
              {!cameraOn ? (
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
              onClick={() => setMute((current) => !current)}
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full border ${
                mute ? "border-cyan-300 bg-cyan-400/30" : "border-white/25 bg-white/10"
              }`}
            >
              <Mic size={20} />
            </button>
            <button
              type="button"
              onClick={() => setCameraOn((current) => !current)}
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full border ${
                cameraOn ? "border-cyan-300 bg-cyan-400/30" : "border-white/25 bg-white/10"
              }`}
            >
              {cameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>
            <button
              type="button"
              onClick={() => setFrontCamera((current) => !current)}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10"
              aria-label="Switch camera"
              title={frontCamera ? "Front camera selected" : "Rear camera selected"}
            >
              <RefreshCcw size={20} />
            </button>
            <button
              type="button"
              onClick={() => router.push(`/partner/chats/${sessionId}`)}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10"
            >
              <MessageCircle size={20} />
            </button>
            <button
              type="button"
              onClick={async () => {
                await endSession(sessionId);
                await cleanupAgora();
                router.push("/partner/dashboard");
              }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </section>
    </PartnerGuard>
  );
}
