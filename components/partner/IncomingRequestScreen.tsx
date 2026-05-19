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
  const initials = memberLabel.slice(-2).toUpperCase();

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

  return (
    <div className={`fixed inset-0 z-[70] flex min-h-screen items-center justify-center px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white ${
      isChat
        ? "bg-gradient-to-b from-[#0b3f44] via-[#0d666d] to-[#0a5358]"
        : "bg-gradient-to-b from-[#041a1d] via-[#06393d] to-[#021114]"
    }`}>
      <div className="mx-auto w-full max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100/85">{title}</p>
        <p className="mt-2 text-sm text-teal-100/80">
          {isChat ? "A member would like to start a conversation." : "A member wants to talk with you"}
        </p>

        <div className="relative mx-auto mt-8 h-[126px] w-[126px]">
          <span className={`absolute inset-0 rounded-full ${isChat ? "bg-cyan-200/20" : "bg-emerald-400/20 animate-ping"}`} />
          <span className="absolute inset-[10px] rounded-full border border-emerald-200/60" />
          <span className="absolute inset-[20px] inline-flex items-center justify-center rounded-full bg-white/15 text-2xl font-semibold">
            {isChat ? <MessageCircle size={34} /> : initials}
          </span>
        </div>

        <p className="mt-6 text-lg font-semibold">{memberLabel}</p>
        <p className="mt-1 text-sm text-teal-100/80">
          {serviceLabel} - {formatINR(Math.max(request.expectedRate, 0))}
        </p>

        {message ? (
          <p className="mt-4 rounded-xl border border-white/20 bg-black/15 px-3 py-2 text-xs text-teal-100">{message}</p>
        ) : null}

        <div className="mt-9 flex items-start justify-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onDecline}
              disabled={accepting || declining}
              className="inline-flex h-[76px] w-[76px] items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-900/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PhoneOff size={30} />
            </button>
            <span className="text-sm font-medium text-red-100">{declining ? "Declining..." : "Decline"}</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting || declining}
              className="inline-flex h-[76px] w-[76px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-900/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChat ? <MessageCircle size={30} /> : <PhoneCall size={30} />}
            </button>
            <span className="text-sm font-medium text-emerald-100">
              {accepting ? "Connecting..." : isChat ? "Accept chat" : "Accept call"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
