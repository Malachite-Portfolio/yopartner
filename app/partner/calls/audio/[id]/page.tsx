"use client";

import { MessageCircle, Mic, PhoneOff, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { IAgoraRTCClient, IMicrophoneAudioTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng";
import { PartnerGuard } from "@/components/partner/PartnerGuard";
import { endSession, getSessionAgoraToken, getSessionById, type SessionRecord, type SessionStatus } from "@/lib/api/sessions";
import { buildAgoraUid, createAgoraClient, normalizeChannelName, requestAudioPermission } from "@/lib/agora";

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

export default function PartnerAudioCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? "";
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [mute, setMute] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const [needsPermissionAction, setNeedsPermissionAction] = useState(false);
  const [joining, setJoining] = useState(false);
  const [remoteAudioReady, setRemoteAudioReady] = useState(false);
  const [speakerHintVisible, setSpeakerHintVisible] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const elapsed = session?.status === "LIVE" ? getElapsedSeconds(session, clockNow) : 0;

  const cleanupAgora = useCallback(async () => {
    try {
      remoteAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
    } catch {
      // no-op
    }
    remoteAudioTrackRef.current = null;
    localAudioTrackRef.current = null;
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
    setRemoteAudioReady(false);
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
        setError(response.error?.message || "Unable to open audio call.");
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

  const joinAgoraAudio = useCallback(async () => {
    if (!session || joining || joined) return;
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
        if (!user.hasAudio) return;
        await client.subscribe(user as Parameters<typeof client.subscribe>[0], "audio");
        user.audioTrack?.play();
        remoteAudioTrackRef.current = user.audioTrack ?? null;
        setRemoteAudioReady(Boolean(user.audioTrack));
        setSpeakerHintVisible(false);
      };
      client.on("user-joined", (user) => {
        void syncRemoteAudioUser(user);
      });
      client.on("user-published", async (user, mediaType) => {
        if (mediaType === "audio") {
          await syncRemoteAudioUser(user);
        }
      });
      client.on("user-unpublished", (_user, mediaType) => {
        if (mediaType === "audio") {
          remoteAudioTrackRef.current = null;
          setRemoteAudioReady(false);
          setSpeakerHintVisible(true);
        }
      });
      client.on("user-left", () => {
        remoteAudioTrackRef.current = null;
        setRemoteAudioReady(false);
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
      const localTrack = await AgoraRTC.default.createMicrophoneAudioTrack();
      localAudioTrackRef.current = localTrack;
      await client.publish([localTrack]);
      await Promise.all(
        client.remoteUsers.map(async (remoteUser) => {
          if (!remoteUser.hasAudio) return;
          await client.subscribe(remoteUser, "audio");
          remoteUser.audioTrack?.play();
          remoteAudioTrackRef.current = remoteUser.audioTrack ?? null;
          setRemoteAudioReady(Boolean(remoteUser.audioTrack));
          setSpeakerHintVisible(false);
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
  }, [cleanupAgora, joined, joining, session]);

  useEffect(() => {
    if (session?.status !== "LIVE" || joined || joining) return;
    const timer = window.setTimeout(() => {
      void joinAgoraAudio();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [joinAgoraAudio, joined, joining, session?.status]);

  const handleEnableSpeaker = () => {
    if (!remoteAudioTrackRef.current) return;
    remoteAudioTrackRef.current.play();
    setSpeakerHintVisible(false);
  };

  const maskedPhone = useMemo(
    () => String(session?.user?.phoneMasked ?? maskPhone(String(session?.user?.phoneNumber ?? ""))),
    [session?.user],
  );

  if (session && isTerminalStatus(session.status)) {
    return (
      <PartnerGuard requireOnboarding>
        <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#0f1f4d] via-[#1f3a8a] to-[#0ea5a6] p-4 text-white">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
            <p className="text-base font-semibold">This call has ended.</p>
            <button
              type="button"
              onClick={() => router.push("/partner/dashboard")}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Back
            </button>
          </div>
        </main>
      </PartnerGuard>
    );
  }

  if (session && session.status !== "LIVE") {
    return (
      <PartnerGuard requireOnboarding>
        <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#0f1f4d] via-[#1f3a8a] to-[#0ea5a6] p-4 text-white">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
            <p className="text-base font-semibold">This audio call is not active right now.</p>
            <button
              type="button"
              onClick={() => router.push("/partner/dashboard")}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Back
            </button>
          </div>
        </main>
      </PartnerGuard>
    );
  }

  return (
    <PartnerGuard requireOnboarding>
      <section className="relative flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[#0f1f4d] via-[#1f3a8a] to-[#0ea5a6] px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white">
        <div className="mx-auto flex h-full w-full max-w-xl flex-col items-center justify-between">
          {needsPermissionAction ? (
            <button
              type="button"
              onClick={() => {
                void joinAgoraAudio();
              }}
              disabled={joining}
              className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-center text-xs text-cyan-100 disabled:opacity-70"
            >
              {joining ? "Enabling microphone..." : "Enable microphone"}
            </button>
          ) : null}
          {error ? (
            <p className="mt-2 w-full rounded-xl border border-rose-200/70 bg-rose-100/10 px-3 py-2 text-center text-xs text-rose-100">
              {error}
            </p>
          ) : null}
          <div className="pt-6 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-100/90">
              {remoteAudioReady ? "Connected" : "Waiting for member audio..."}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{maskedPhone}</h1>
            <p className="mt-2 text-xl font-semibold tabular-nums">{formatTimer(elapsed)}</p>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            <span className="absolute h-48 w-48 rounded-full border border-white/35" />
            <span className="absolute h-40 w-40 rounded-full border border-white/25" />
            <span className="relative inline-flex h-36 w-36 items-center justify-center rounded-full bg-white/20 text-4xl font-bold">
              {maskedPhone.slice(-2)}
            </span>
          </div>

          {session?.status === "LIVE" && !remoteAudioReady ? (
            <p className="text-xs text-cyan-100/85">Waiting for member audio...</p>
          ) : null}
          {speakerHintVisible ? (
            <button
              type="button"
              onClick={handleEnableSpeaker}
              className="mt-2 rounded-full border border-white/30 px-3 py-1 text-xs"
            >
              Tap to enable speaker
            </button>
          ) : null}

          <div className="w-full pb-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setMute((current) => !current)}
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full border ${
                  mute ? "border-cyan-200 bg-cyan-400/35" : "border-white/25 bg-white/10"
                }`}
              >
                <Mic size={20} />
              </button>
              <button
                type="button"
                onClick={handleEnableSpeaker}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10"
              >
                <Volume2 size={20} />
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
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </PartnerGuard>
  );
}
