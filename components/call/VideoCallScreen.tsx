"use client";

import { Camera, CameraOff, MessageCircle, Mic, PhoneOff, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import type { CompanionRouteProfile } from "@/lib/companionRoutes";

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function ToggleControl({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition sm:h-14 sm:w-14 ${
        active
          ? "border-cyan-300/70 bg-cyan-400/25 text-white"
          : "border-white/25 bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

export function VideoCallScreen({ companion }: { companion: CompanionRouteProfile }) {
  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (IS_PRODUCTION_READY_MODE) {
    return (
      <section className="relative h-screen min-h-screen overflow-hidden bg-[#0b1224] text-white">
        <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl items-center justify-center px-4 py-4 sm:px-6 sm:py-5">
          <div className="w-full max-w-md rounded-2xl border border-amber-200/60 bg-amber-100/10 p-6 text-center">
            <p className="text-xl font-semibold text-amber-100">Video calling is temporarily unavailable. Please retry shortly.</p>
            <button
              type="button"
              onClick={() => router.push(`/connect-now/${companion.id}`)}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-screen min-h-screen overflow-hidden bg-[#0b1224] text-white">
      <div className="absolute inset-0">
        {companion.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={companion.image} alt={companion.name} className="h-full w-full object-cover opacity-35 blur-[2px]" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1227]/70 via-[#111c3a]/75 to-[#050914]/90" />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{companion.name}</p>
            <p className="text-xs text-cyan-100/85">{elapsedSeconds === 0 ? "Calling..." : "Connected"}</p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-cyan-100">{formatTimer(elapsedSeconds)}</p>
        </div>

        <div className="relative mt-4 flex flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/25 backdrop-blur">
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">Live Demo</p>
              <h1 className="mt-3 text-2xl font-semibold sm:text-4xl">Video Call with {companion.name}</h1>
              <p className="mt-3 text-sm text-cyan-50/85 sm:text-base">
                Frontend preview only. No real camera or streaming is active.
              </p>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-white/20 bg-slate-900/80 shadow-xl sm:h-36 sm:w-52">
            {isCameraOn ? (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1e3a8a] to-[#0891b2]">
                <div className="text-center">
                  <Camera size={22} className="mx-auto text-white/90" />
                  <p className="mt-1 text-xs font-medium text-white/90">You</p>
                  <p className="text-[11px] text-white/70">{isFrontCamera ? "Front Camera" : "Rear Camera"}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-950/90 text-center">
                <div>
                  <CameraOff size={20} className="mx-auto text-slate-200" />
                  <p className="mt-1 text-xs font-medium text-slate-100">Camera Off</p>
                  <p className="text-[11px] text-slate-400">You</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 shrink-0 flex flex-wrap items-center justify-center gap-3 pb-2">
          <ToggleControl active={isMuted} label="Toggle mute" onClick={() => setIsMuted((value) => !value)}>
            <Mic size={19} />
          </ToggleControl>
          <ToggleControl active={isCameraOn} label="Toggle camera" onClick={() => setIsCameraOn((value) => !value)}>
            {isCameraOn ? <Camera size={19} /> : <CameraOff size={19} />}
          </ToggleControl>
          <ToggleControl
            active={isFrontCamera}
            label="Switch camera"
            onClick={() => setIsFrontCamera((value) => !value)}
          >
            <RefreshCcw size={19} />
          </ToggleControl>
          <ToggleControl active={false} label="Open chat" onClick={() => router.push(`/chat/${companion.id}`)}>
            <MessageCircle size={19} />
          </ToggleControl>
          <button
            type="button"
            aria-label="End call"
            onClick={() => router.push(`/connect-now/${companion.id}`)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-950/35 transition hover:bg-red-500"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    </section>
  );
}
