"use client";

import { MessageCircle, Mic, PhoneOff, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PartnerGuard } from "@/components/partner/PartnerGuard";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function getMaskedPhone(id: string) {
  if (id === "demo-user-1") return "+91******9363";
  if (id === "demo-user-2") return "+91******7788";
  if (id === "demo-user-3") return "+91******2231";
  return "+91******0000";
}

export default function PartnerAudioCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? "demo-user-1";
  const [elapsed, setElapsed] = useState(0);
  const [mute, setMute] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const maskedPhone = useMemo(() => getMaskedPhone(sessionId), [sessionId]);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (IS_PRODUCTION_READY_MODE) {
    return (
      <PartnerGuard requireOnboarding>
        <section className="flex h-screen min-h-screen items-center justify-center bg-[#0f1f4d] px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-amber-200/50 bg-amber-100/10 p-6 text-center text-white">
            <p className="text-lg font-semibold">Calling service is not connected yet.</p>
            <button
              type="button"
              onClick={() => router.push("/partner/dashboard")}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      </PartnerGuard>
    );
  }

  return (
    <PartnerGuard requireOnboarding>
      <section className="relative flex h-screen min-h-screen flex-col overflow-hidden bg-gradient-to-b from-[#0f1f4d] via-[#1f3a8a] to-[#0ea5a6] px-4 py-6 text-white">
        <div className="mx-auto flex h-full w-full max-w-xl flex-col items-center justify-between">
          <div className="pt-6 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-100/90">Connected</p>
            <h1 className="mt-2 text-3xl font-semibold">{maskedPhone}</h1>
            <p className="mt-2 text-xl font-semibold tabular-nums">{formatTimer(elapsed)}</p>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            <span className="absolute h-48 w-48 rounded-full border border-white/35" />
            <span className="absolute h-40 w-40 rounded-full border border-white/25" />
            <span className="relative inline-flex h-36 w-36 items-center justify-center rounded-full bg-white/20 text-4xl font-bold">
              U
            </span>
          </div>

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
                onClick={() => setSpeaker((current) => !current)}
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full border ${
                  speaker ? "border-cyan-200 bg-cyan-400/35" : "border-white/25 bg-white/10"
                }`}
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
                onClick={() => router.push("/partner/dashboard")}
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
