"use client";

import { MessageCircle, Mic, PhoneOff, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PartnerGuard } from "@/components/partner/PartnerGuard";
import { getSessionById, type SessionRecord } from "@/lib/api/sessions";

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

export default function PartnerAudioCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? "";
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mute, setMute] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [error, setError] = useState("");

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
    if (session?.status !== "LIVE") return;
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [session?.status]);

  const maskedPhone = useMemo(() => maskPhone(String(session?.user?.phoneNumber ?? "")), [session?.user]);

  return (
    <PartnerGuard requireOnboarding>
      <section className="relative flex h-screen min-h-screen flex-col overflow-hidden bg-gradient-to-b from-[#0f1f4d] via-[#1f3a8a] to-[#0ea5a6] px-4 py-6 text-white">
        <div className="mx-auto flex h-full w-full max-w-xl flex-col items-center justify-between">
          {!AGORA_APP_ID ? (
            <p className="w-full rounded-xl border border-amber-200/70 bg-amber-100/10 px-3 py-2 text-center text-xs text-amber-100">
              Calling is not configured. Missing Agora App ID.
            </p>
          ) : null}
          {error ? (
            <p className="w-full rounded-xl border border-rose-200/70 bg-rose-100/10 px-3 py-2 text-center text-xs text-rose-100">
              {error}
            </p>
          ) : null}
          <div className="pt-6 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-100/90">
              {session?.status === "LIVE" ? "Connected" : "Awaiting status"}
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
