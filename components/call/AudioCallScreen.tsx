"use client";

import { ArrowLeft, MessageCircle, Mic, PhoneOff, Volume2 } from "lucide-react";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ControlButton({
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
      className={`inline-flex h-14 w-14 items-center justify-center rounded-full border text-white transition ${
        active
          ? "border-cyan-200/60 bg-cyan-400/30"
          : "border-white/25 bg-white/10 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

export function AudioCallScreen({ companion }: { companion: CompanionRouteProfile }) {
  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (IS_PRODUCTION_READY_MODE) {
    return (
      <section className="relative h-screen min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1d4d] via-[#2b235e] to-[#4d2a68] px-4 py-6 text-white sm:px-6">
        <div className="mx-auto flex h-full w-full max-w-xl flex-col items-center justify-center">
          <div className="w-full rounded-2xl border border-amber-200/60 bg-amber-100/10 p-6 text-center">
            <p className="text-xl font-semibold text-amber-100">Calling service is not connected yet.</p>
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
    <section className="relative h-screen min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1d4d] via-[#2b235e] to-[#4d2a68] px-4 py-6 text-white sm:px-6">
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

        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/90">Audio Call</p>
          <h1 className="mt-3 text-3xl font-semibold">{companion.name}</h1>
          <p className="mt-2 text-base text-cyan-100/90">{elapsedSeconds === 0 ? "Calling..." : "Connected"}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-white/95">{formatTimer(elapsedSeconds)}</p>
        </div>

        <div className="relative mt-8 flex flex-1 items-center justify-center">
          <span className="absolute h-48 w-48 rounded-full bg-cyan-300/20 blur-md" />
          <span className="absolute h-44 w-44 animate-ping rounded-full border border-cyan-200/40" />
          {companion.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={companion.image}
              alt={companion.name}
              className="relative h-40 w-40 rounded-full border-4 border-white/30 object-cover shadow-2xl"
            />
          ) : (
            <span className="relative inline-flex h-40 w-40 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 text-4xl font-semibold shadow-2xl">
              {getInitials(companion.name)}
            </span>
          )}
        </div>

        <div className="pb-3 pt-4">
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
          <ControlButton active={isMuted} label="Toggle mute" onClick={() => setIsMuted((value) => !value)}>
            <Mic size={20} />
          </ControlButton>
          <ControlButton active={isSpeakerOn} label="Toggle speaker" onClick={() => setIsSpeakerOn((value) => !value)}>
            <Volume2 size={20} />
          </ControlButton>
          <ControlButton active={false} label="Open chat" onClick={() => router.push(`/chat/${companion.id}`)}>
            <MessageCircle size={20} />
          </ControlButton>
          <button
            type="button"
            aria-label="End call"
            onClick={() => router.push(`/connect-now/${companion.id}`)}
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
