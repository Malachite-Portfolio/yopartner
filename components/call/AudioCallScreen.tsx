"use client";

import { ArrowLeft, Lock, Mic, PhoneOff, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CompanionRouteProfile } from "@/lib/companionRoutes";
import { VerifiedPartnerBadge } from "@/components/VerifiedPartnerBadge";

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
          ? "border-[#0d9488] bg-[#d6f3ed] text-[#0f766e]"
          : "border-[#cfe7e2] bg-white text-[#334155]"
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

  return (
    <section className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-gradient-to-b from-[#f3fbf9] via-[#e8f6f3] to-[#d9efea] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-[#0f172a] sm:px-6">
      <div className="mx-auto flex h-full w-full max-w-xl flex-col">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.push("/connect-now")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#cde8e2] bg-white/70 text-[#0f172a]"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="rounded-full border border-[#b7dfd7] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#0f766e]">
            YoPartner Secure Call
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#d6f3ed] px-2.5 py-1 text-[11px] font-semibold text-[#0f766e]">
            <Lock size={12} />
            Secure
          </span>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#0f766e]">Audio Call</p>
          <h1 className="mt-2 flex min-w-0 items-center justify-center gap-2 text-[28px] font-semibold leading-tight">
            <span className="min-w-0 truncate">{companion.name}</span>
            {companion.isVerifiedPartner ? <VerifiedPartnerBadge size="md" /> : null}
          </h1>
          <p className="mt-2 text-base text-[#334155]">{elapsedSeconds === 0 ? "Calling..." : "Connected"}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatTimer(elapsedSeconds)}</p>
        </div>

        <div className="relative mt-6 flex flex-1 items-center justify-center">
          <span className="absolute h-[280px] w-[280px] rounded-full bg-[#0f766e]/8" />
          <span className="absolute h-[240px] w-[240px] rounded-full border border-[#b7dfd7]" />
          <span className="absolute h-[220px] w-[220px] animate-pulse rounded-full border border-[#7dcfbe]/60" />
          {companion.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={companion.image}
              alt={companion.name}
              className="relative h-48 w-48 rounded-full border-4 border-white object-cover shadow-[0_22px_45px_rgba(15,23,42,0.18)]"
            />
          ) : (
            <span className="relative inline-flex h-48 w-48 items-center justify-center rounded-full border-4 border-white bg-[#d6f3ed] text-4xl font-semibold text-[#0f766e] shadow-[0_22px_45px_rgba(15,23,42,0.18)]">
              {getInitials(companion.name)}
            </span>
          )}
        </div>

        <div className="pb-2 pt-4">
          <div className="rounded-[28px] border border-[#cde8e2] bg-white/80 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="flex w-full flex-wrap items-center justify-center gap-4">
          <ControlButton active={isMuted} label="Toggle mute" onClick={() => setIsMuted((value) => !value)}>
            <Mic size={20} />
          </ControlButton>
          <ControlButton active={isSpeakerOn} label="Toggle speaker" onClick={() => setIsSpeakerOn((value) => !value)}>
            <Volume2 size={20} />
          </ControlButton>
          <button
            type="button"
            aria-label="End call"
            onClick={() => router.push("/connect-now")}
            className="inline-flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#dc2626] text-white shadow-lg shadow-red-700/25 transition hover:bg-red-500"
          >
            <PhoneOff size={24} />
          </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
