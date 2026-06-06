"use client";

import { MessageCircle, PhoneCall, PhoneOff } from "lucide-react";
import { useEffect, useMemo } from "react";
import type { PartnerIncomingRequest } from "@/lib/api/partner";
import { useLoopingRingtone } from "@/hooks/useLoopingRingtone";

type IncomingRequestScreenProps = {
  request: PartnerIncomingRequest | null;
  accepting: boolean;
  declining: boolean;
  ringtoneEnabled: boolean;
  message?: string;
  onEnableRingtone: () => void;
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
  ringtoneEnabled,
  message,
  onEnableRingtone,
  onAccept,
  onDecline,
}: IncomingRequestScreenProps) {
  const open = Boolean(request);
  const memberLabel = useMemo(() => maskMemberLabel(request?.memberLabel ?? ""), [request?.memberLabel]);
  const serviceLabel = request ? toServiceLabel(request.type) : "";
  const title = request ? toRequestTitle(request.type) : "";
  const isChat = request?.type === "CHAT";
  const initials = memberLabel.slice(-2).toUpperCase() || "MB";
  useLoopingRingtone({ enabled: open && ringtoneEnabled && !accepting && !declining, kind: "incoming", volume: 0.08 });

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !request) return null;

  if (isChat) {
    return (
      <div className="full-mobile-screen fixed inset-0 z-[9999] overflow-hidden bg-[#0f172a]/45 backdrop-blur-[1.5px]">
        <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] z-[10000] mx-auto max-h-[42svh] max-w-md overflow-hidden rounded-[24px] border border-[#d5eee8] bg-[#f8fffd] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9f5ef] text-[#0f766e]">
              <MessageCircle size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0d9488]">{title}</p>
              <h3 className="mt-1 truncate text-base font-semibold text-[#0f172a]">{memberLabel}</h3>
              <p className="mt-1 text-sm text-[#475569]">A member would like to start a conversation.</p>
              <p className="mt-1 text-xs font-medium text-[#64748b]">
                {serviceLabel} - {formatINR(Math.max(request.expectedRate, 0))}
              </p>
            </div>
          </div>

          {message ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{message}</p>
          ) : null}
          {!ringtoneEnabled ? (
            <button
              type="button"
              onClick={onEnableRingtone}
              className="mt-3 min-h-11 w-full rounded-xl border border-[#99d8cf] bg-white px-3 py-2 text-sm font-semibold text-[#0f766e]"
            >
              Tap to enable ringtone
            </button>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onDecline}
              disabled={accepting || declining}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 disabled:opacity-60"
            >
              {declining ? "Declining..." : "Decline"}
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting || declining}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0d9488] text-sm font-semibold text-white disabled:opacity-60"
            >
              {accepting ? "Connecting..." : "Accept chat"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="full-mobile-screen fixed inset-0 z-[9999] overflow-hidden bg-gradient-to-b from-[#213842] via-[#88a4ad] to-[#d9e2e6] text-[#0f172a]">
      <div className="mobile-bottom-safe mx-auto flex h-full w-full max-w-md flex-col px-4 pt-[calc(env(safe-area-inset-top,0px)+10px)]">
        <div className="shrink-0 text-center">
          <p className="mx-auto inline-flex rounded-full bg-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#334155]">
            {title}
          </p>
          <h2 className="mt-2 truncate text-[clamp(20px,6vw,24px)] font-semibold leading-tight text-[#0f172a]">{memberLabel}</h2>
          <p className="mt-1 text-sm text-[#334155]">Private session request</p>
          <p className="mt-0.5 text-xs text-[#475569]">
            {serviceLabel} - {formatINR(Math.max(request.expectedRate, 0))}
          </p>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center py-3">
          <div className="relative h-[clamp(84px,26vw,128px)] w-[clamp(84px,26vw,128px)] shrink-0">
            <span className="absolute inset-0 rounded-full bg-white/35 blur-[1px]" />
            <span className="absolute inset-[5px] rounded-full border-[3px] border-white/90" />
            <span className="absolute inset-[13px] inline-flex items-center justify-center rounded-full bg-[#0f766e] text-3xl font-bold text-white">
              {initials}
            </span>
          </div>
        </div>

        {message ? (
          <p className="mb-3 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
            {message}
          </p>
        ) : null}
        {!ringtoneEnabled ? (
          <button
            type="button"
            onClick={onEnableRingtone}
            className="mb-3 min-h-11 w-full rounded-xl border border-[#99d8cf] bg-white/90 px-3 py-2 text-sm font-semibold text-[#0f766e]"
          >
            Tap to enable ringtone
          </button>
        ) : null}

        <div className="shrink-0 rounded-[24px] border border-white/70 bg-white/80 p-3 shadow-[0_18px_42px_rgba(15,23,42,0.2)] backdrop-blur">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onDecline}
              disabled={accepting || declining}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 text-white disabled:opacity-60"
            >
              <PhoneOff size={22} />
              <span className="text-sm font-semibold uppercase tracking-[0.12em]">
                {declining ? "Declining..." : "Decline"}
              </span>
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting || declining}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0f766e] text-white disabled:opacity-60"
            >
              <PhoneCall size={22} />
              <span className="text-sm font-semibold uppercase tracking-[0.12em]">
                {accepting ? "Connecting..." : request.type === "VIDEO" ? "Accept video" : "Accept audio"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
