"use client";

import { MessageCircle, PhoneCall, PhoneOff } from "lucide-react";
import { useEffect, useMemo } from "react";
import type { PartnerIncomingRequest } from "@/lib/api/partner";

type IncomingRequestScreenProps = {
  request: PartnerIncomingRequest | null;
  accepting: boolean;
  declining: boolean;
  message?: string;
  onAccept: () => void;
  onDecline: () => void;
};

function toRequestTitle(type: PartnerIncomingRequest["type"]) {
  if (type === "AUDIO") return "Incoming audio call";
  if (type === "VIDEO") return "Incoming video call";
  return "New chat request";
}

function toServiceLabel(type: PartnerIncomingRequest["type"]) {
  if (type === "AUDIO") return "Audio Call";
  if (type === "VIDEO") return "Video Call";
  return "Chat";
}

function maskMemberLabel(value: string) {
  if (!value) return "Member";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  return `+91******${digits.slice(-4)}`;
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function IncomingRequestScreen({
  request,
  accepting,
  declining,
  message,
  onAccept,
  onDecline,
}: IncomingRequestScreenProps) {
  const open = Boolean(request);
  const memberLabel = useMemo(() => maskMemberLabel(request?.memberLabel ?? ""), [request?.memberLabel]);
  const serviceLabel = request ? toServiceLabel(request.type) : "";
  const title = request ? toRequestTitle(request.type) : "";
  const isChat = request?.type === "CHAT";
  const initials = memberLabel.slice(-2).toUpperCase() || "MB";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (request?.type === "CHAT") return;
    const audio = new Audio("/sounds/incoming-request.mp3");
    audio.loop = true;
    audio.preload = "none";
    void audio.play().catch(() => undefined);
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [open, request?.type]);

  if (!open || !request) return null;

  if (isChat) {
    return (
      <div className="fixed inset-0 z-[9999] flex h-[100dvh] min-h-[100dvh] items-end justify-center overflow-hidden bg-[#0f172a]/45 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[env(safe-area-inset-top)] backdrop-blur-[1.5px]">
        <div className="w-full max-w-md rounded-[24px] border border-[#d5eee8] bg-[#f8fffd] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9f5ef] text-[#0f766e]">
              <MessageCircle size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0d9488]">{title}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#0f172a]">{memberLabel}</h3>
              <p className="mt-1 text-sm text-[#475569]">A member would like to start a conversation.</p>
              <p className="mt-1 text-xs font-medium text-[#64748b]">
                {serviceLabel} - {formatINR(Math.max(request.expectedRate, 0))}
              </p>
            </div>
          </div>

          {message ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{message}</p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onDecline}
              disabled={accepting || declining}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 disabled:opacity-60"
            >
              {declining ? "Declining..." : "Decline"}
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting || declining}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0d9488] text-sm font-semibold text-white disabled:opacity-60"
            >
              {accepting ? "Connecting..." : "Accept chat"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] h-[100dvh] min-h-[100dvh] overflow-hidden bg-gradient-to-b from-[#213842] via-[#88a4ad] to-[#d9e2e6] px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[calc(env(safe-area-inset-bottom)+16px)] text-[#0f172a]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col pb-[132px]">
        <div className="pt-1 text-center">
          <p className="mx-auto inline-flex rounded-full bg-white/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#334155]">
            {title}
          </p>
          <h2 className="mt-3 text-[clamp(20px,6vw,24px)] font-semibold leading-tight text-[#0f172a]">{memberLabel}</h2>
          <p className="mt-2 text-sm text-[#334155]">Private session request</p>
          <p className="mt-1 text-sm text-[#475569]">
            {serviceLabel} - {formatINR(Math.max(request.expectedRate, 0))}
          </p>
        </div>

        <div className="relative mx-auto mt-4 h-[clamp(96px,30vw,150px)] w-[clamp(96px,30vw,150px)] shrink-0">
          <span className="absolute inset-0 rounded-full bg-white/35 blur-[1px]" />
          <span className="absolute inset-[6px] rounded-full border-[3px] border-white/90" />
          <span className="absolute inset-[16px] inline-flex items-center justify-center rounded-full bg-[#0f766e] text-4xl font-bold text-white">
            {initials}
          </span>
        </div>

        {message ? (
          <p className="mx-auto mt-3 w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
            {message}
          </p>
        ) : null}

        <div className="absolute inset-x-5 bottom-[calc(env(safe-area-inset-bottom)+16px)] mx-auto max-w-md rounded-[28px] border border-white/70 bg-white/75 p-3 shadow-[0_22px_50px_rgba(15,23,42,0.22)] backdrop-blur">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={onDecline}
              disabled={accepting || declining}
              className="flex h-[92px] flex-col items-center justify-center rounded-2xl bg-red-600 text-white disabled:opacity-60"
            >
              <PhoneOff size={31} />
              <span className="mt-2 text-sm font-semibold uppercase tracking-[0.14em]">
                {declining ? "Declining..." : "Decline"}
              </span>
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting || declining}
              className="flex h-[92px] flex-col items-center justify-center rounded-2xl bg-[#0f766e] text-white disabled:opacity-60"
            >
              <PhoneCall size={31} />
              <span className="mt-2 text-sm font-semibold uppercase tracking-[0.14em]">
                {accepting ? "Connecting..." : request.type === "VIDEO" ? "Accept video" : "Accept audio"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
