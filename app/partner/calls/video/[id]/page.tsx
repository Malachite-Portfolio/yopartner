"use client";

import { Camera, CameraOff, MessageCircle, Mic, PhoneOff, RefreshCcw } from "lucide-react";
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

export default function PartnerVideoCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? "demo-user-1";
  const maskedPhone = useMemo(() => getMaskedPhone(sessionId), [sessionId]);
  const [elapsed, setElapsed] = useState(0);
  const [mute, setMute] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [frontCamera, setFrontCamera] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (IS_PRODUCTION_READY_MODE) {
    return (
      <PartnerGuard requireOnboarding>
        <section className="flex h-screen min-h-screen items-center justify-center bg-[#050814] px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-amber-200/50 bg-amber-100/10 p-6 text-center text-white">
            <p className="text-lg font-semibold">Calling service is not configured.</p>
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
      <section className="relative h-screen min-h-screen overflow-hidden bg-[#050814] text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1224] via-[#0a132a] to-[#03060f]" />

        <div className="relative z-10 flex h-full flex-col p-4 sm:p-5">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-2.5">
            <div>
              <p className="text-sm font-semibold">{maskedPhone}</p>
              <p className="text-xs text-cyan-100/85">Connected</p>
            </div>
            <p className="text-sm font-semibold tabular-nums">{formatTimer(elapsed)}</p>
          </div>

          <div className="relative mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Remote User</p>
              <p className="mt-2 text-2xl font-semibold">{maskedPhone}</p>
            </div>

            <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-white/20 bg-slate-900/80 sm:h-36 sm:w-52">
              {cameraOn ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1d4ed8] to-[#0ea5a6]">
                  <div className="text-center">
                    <Camera size={22} className="mx-auto" />
                    <p className="mt-1 text-xs">You</p>
                    <p className="text-[11px] text-white/80">{frontCamera ? "Front Camera" : "Rear Camera"}</p>
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
              onClick={() => router.push("/partner/dashboard")}
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
