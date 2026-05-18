"use client";

import { Camera, CameraOff, MessageCircle, Mic, PhoneOff, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  cancelSession,
  createSession,
  getSessionById,
  type SessionRecord,
} from "@/lib/api/sessions";
import { USER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";
import {
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() ?? "";

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

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
    if (!session?.id || session.status !== "PENDING") return;
    const timer = window.setInterval(async () => {
      const latest = await getSessionById(session.id);
      if (latest.data) setSession(latest.data);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.status]);

  useEffect(() => {
    if (session?.status !== "LIVE") return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.status]);

  const handleCancel = async () => {
    if (!session?.id || isCancelling) return;
    setIsCancelling(true);
    const response = await cancelSession(session.id);
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

  if (session.status !== "LIVE") {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0b1224] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">
            {session.status === "FAILED"
              ? "Your video request was declined."
              : session.status === "COMPLETED"
                ? "This video call has ended."
                : "This video call is not active right now."}
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
    <section className="relative h-screen min-h-screen overflow-hidden bg-[#0b1224] text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1224] via-[#0a132a] to-[#03060f]" />
      <div className="relative z-10 flex h-full flex-col p-4 sm:p-5">
        {!AGORA_APP_ID ? (
          <p className="mb-4 rounded-xl border border-amber-200/80 bg-amber-100/15 px-3 py-2 text-xs text-amber-100">
            Calling is not configured. Missing Agora App ID.
          </p>
        ) : (
          <p className="mb-4 rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-xs text-cyan-100">
            Session is accepted. Video streaming connection is being prepared.
          </p>
        )}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-2.5">
          <div>
            <p className="text-sm font-semibold">{companion.name}</p>
            <p className="text-xs text-cyan-100/85">Connected</p>
          </div>
          <p className="text-sm font-semibold tabular-nums">{formatTimer(elapsedSeconds)}</p>
        </div>
        <div className="relative mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Remote User</p>
            <p className="mt-2 text-2xl font-semibold">{companion.name}</p>
          </div>
          <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-white/20 bg-slate-900/80 sm:h-36 sm:w-52">
            {isCameraOn ? (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1d4ed8] to-[#0ea5a6]">
                <div className="text-center">
                  <Camera size={22} className="mx-auto" />
                  <p className="mt-1 text-xs">You</p>
                  <p className="text-[11px] text-white/80">{isFrontCamera ? "Front Camera" : "Rear Camera"}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-950/90 text-center">
                <div>
                  <CameraOff size={20} className="mx-auto text-slate-100" />
                  <p className="mt-1 text-xs text-slate-100">Camera Off</p>
                </div>
              </div>
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
