"use client";

import { ArrowLeft, MessageCircle, Mic, PhoneOff, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { IAgoraRTCClient, IMicrophoneAudioTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng";
import {
  cancelSession,
  createSession,
  endSession,
  getSessionAgoraToken,
  getSessionById,
  type SessionRecord,
} from "@/lib/api/sessions";
import { USER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";
import {
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";
import { buildAgoraUid, createAgoraClient, normalizeChannelName, requestAudioPermission } from "@/lib/agora";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() ?? "";

function getUserToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(USER_FIREBASE_TOKEN_KEY);
  return token && token.trim().length > 0 ? token.trim() : null;
}

export default function AudioCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const preferredCompanionId = searchParams.get("companionId") ?? "";
  const currentPath = `/call/audio/${routeId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [companion, setCompanion] = useState<CompanionRouteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [joined, setJoined] = useState(false);
  const [needsPermissionAction, setNeedsPermissionAction] = useState(false);
  const [joining, setJoining] = useState(false);
  const [remoteAudioReady, setRemoteAudioReady] = useState(false);
  const [speakerHintVisible, setSpeakerHintVisible] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);

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
    setRemoteAudioReady(false);
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
        setError("Unable to start audio call. Please open the companion profile and try again.");
        setLoading(false);
        return;
      }

      const created = await createSession({ companionId: resolved.id, serviceType: "audio" });
      if (!active) return;
      if (created.error?.status === 401) {
        window.localStorage.removeItem(USER_FIREBASE_TOKEN_KEY);
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
    const timer = window.setInterval(async () => {
      const latest = await getSessionById(session.id);
      if (latest.data) setSession(latest.data);
    }, session.status === "PENDING" ? 4000 : 5000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.status]);

  useEffect(() => {
    if (session?.status !== "LIVE" || !joined) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
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
    void localAudioTrackRef.current.setEnabled(!isMuted);
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

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack?.play();
          remoteAudioTrackRef.current = user.audioTrack ?? null;
          setRemoteAudioReady(Boolean(user.audioTrack));
          setSpeakerHintVisible(false);
        }
      });

      client.on("user-unpublished", (_user, mediaType) => {
        if (mediaType === "audio") {
          setRemoteAudioReady(false);
          remoteAudioTrackRef.current = null;
          setSpeakerHintVisible(true);
        }
      });

      client.on("user-left", () => {
        setRemoteAudioReady(false);
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
      await client.publish([localAudioTrack]);
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
  }, [cleanupAgora, companion, joined, joining, session]);

  useEffect(() => {
    if (session?.status !== "LIVE" || joined || joining) return;
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
    const response = session.status === "PENDING" ? await cancelSession(session.id) : await endSession(session.id);
    setIsCancelling(false);
    if (response.data) {
      setSession(response.data);
      await cleanupAgora();
      return;
    }
    setError(response.error?.message || "Unable to cancel request.");
  };

  const handleEnableSpeaker = () => {
    if (!remoteAudioTrackRef.current) return;
    remoteAudioTrackRef.current.play();
    setSpeakerHintVisible(false);
  };

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0f1d4d] p-4 text-white">Opening audio call...</main>
    );
  }

  if (!session || !companion) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0f1d4d] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">{error || "Audio call request is not available."}</p>
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
      <main className="flex h-screen items-center justify-center bg-[#0f1d4d] p-4 text-white">
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

  if (session.status !== "LIVE") {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0f1d4d] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">
            {session.status === "FAILED"
              ? "Partner declined this call request."
              : session.status === "COMPLETED"
                ? "This audio call has ended."
                : "This audio call is not active right now."}
          </p>
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
    <section className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-gradient-to-b from-[#0f1d4d] via-[#2b235e] to-[#4d2a68] px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white sm:px-6">
      <div className="mx-auto flex h-full w-full max-w-xl flex-col">
        <div className="flex items-center justify-start">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.push(`/connect-now/${companion.id}`)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
          >
            <ArrowLeft size={19} />
          </button>
        </div>
        {needsPermissionAction ? (
          <button
            type="button"
            onClick={() => {
              void joinAgoraAudio();
            }}
            disabled={joining}
            className="mt-4 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-70"
          >
            {joining ? "Enabling microphone..." : "Enable microphone"}
          </button>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-100/15 px-3 py-2 text-xs text-amber-100">
            {error}
          </p>
        ) : null}
        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/90">Audio Call</p>
          <h1 className="mt-3 text-3xl font-semibold">{companion.name}</h1>
          <p className="mt-2 text-base text-cyan-100/90">{joined ? "Connected" : "Waiting for connection..."}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-white/95">
            {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:{String(elapsedSeconds % 60).padStart(2, "0")}
          </p>
        </div>
        <div className="relative mt-8 flex flex-1 items-center justify-center">
          <span className="absolute h-48 w-48 rounded-full bg-cyan-300/20 blur-md" />
          <span className="absolute h-44 w-44 animate-ping rounded-full border border-cyan-200/40" />
          {companion.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companion.image} alt={companion.name} className="relative h-40 w-40 rounded-full border-4 border-white/30 object-cover shadow-2xl" />
          ) : (
            <span className="relative inline-flex h-40 w-40 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 text-4xl font-semibold shadow-2xl">
              {companion.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        {!remoteAudioReady ? (
          <p className="mt-2 text-center text-xs text-cyan-100/85">Waiting for partner audio...</p>
        ) : null}
        {speakerHintVisible ? (
          <button
            type="button"
            onClick={handleEnableSpeaker}
            className="mx-auto mt-2 rounded-full border border-white/30 px-3 py-1 text-xs"
          >
            Tap to enable speaker
          </button>
        ) : null}
        <div className="pb-3 pt-4">
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsMuted((value) => !value)}
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full border text-white ${
                isMuted ? "border-cyan-200/60 bg-cyan-400/30" : "border-white/25 bg-white/10 hover:bg-white/20"
              }`}
            >
              <Mic size={20} />
            </button>
            <button
              type="button"
              onClick={handleEnableSpeaker}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              <Volume2 size={20} />
            </button>
            <button
              type="button"
              onClick={() => router.push(`/chat/${session.id}?companionId=${encodeURIComponent(companion.id)}`)}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              <MessageCircle size={20} />
            </button>
            <button
              type="button"
              onClick={() => {
                void handleCancel();
              }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
