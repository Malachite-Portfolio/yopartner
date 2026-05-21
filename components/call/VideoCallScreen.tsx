"use client";

import { ArrowLeft, Camera, CameraOff, MessageCircle, Mic, PhoneOff, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
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

  return (
    <section className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#020617] text-white">
      <div className="absolute inset-0">
        {companion.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={companion.image} alt={companion.name} className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/75" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-4 pt-[max(0.8rem,env(safe-area-inset-top))] pb-[max(0.95rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.push(`/connect-now/${companion.id}`)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 px-3">
            <p className="truncate text-base font-semibold">{companion.name}</p>
            <p className="text-xs text-white/75">{formatTimer(elapsedSeconds)}</p>
          </div>
          <span className="rounded-full border border-cyan-300/40 bg-cyan-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
            Secure HD
          </span>
        </div>

        <div className="relative flex flex-1 items-center justify-center text-center">
          <div>
            <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl font-semibold backdrop-blur">
              {companion.name.slice(0, 1).toUpperCase()}
            </span>
            <p className="mt-3 text-xl font-semibold">{elapsedSeconds === 0 ? "Calling..." : "Connected"}</p>
            <p className="mt-1 text-sm text-white/80">Waiting for video...</p>
          </div>

          <div className="absolute right-0 top-5 h-32 w-[120px] overflow-hidden rounded-[20px] border-2 border-white/85 bg-slate-900 shadow-2xl shadow-black/40 sm:w-[138px]">
            {isCameraOn ? (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#164e63] to-[#0f766e]">
                <div className="text-center">
                  <Camera size={22} className="mx-auto text-white/90" />
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-950/90 text-center">
                <div>
                  <CameraOff size={20} className="mx-auto text-slate-200" />
                  <p className="mt-1 text-xs font-medium text-slate-100">Camera Off</p>
                </div>
              </div>
            )}
            <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
              You
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <div className="flex w-full max-w-[540px] items-center justify-center gap-2.5 rounded-full border border-white/15 bg-black/45 px-3 py-2.5 shadow-2xl backdrop-blur">
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
      </div>
    </section>
  );
}
