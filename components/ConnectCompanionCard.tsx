"use client";

import { MessageSquareText, Mic, Star, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSession } from "@/lib/api/sessions";
import { getWallet } from "@/lib/api/wallet";
import type { ConnectCompanion } from "@/lib/data";
import { requestAudioPermission, requestVideoPermission } from "@/lib/agora";
import { formatINRPrice } from "@/lib/priceFormat";
import { getUserAuthTokenWithRestore } from "@/lib/auth/userAuth";
import { AUDIO_RATE_PER_MIN, CHAT_RATE_PER_MIN, VIDEO_RATE_PER_MIN } from "@/lib/platformPricing";
import { VerifiedPartnerBadge } from "@/components/VerifiedPartnerBadge";

type ConnectCompanionCardProps = {
  companion: ConnectCompanion;
};

const MIN_CHAT_WALLET_BALANCE = 50;

function Initials({ name }: { name: string }) {
  const text = (name || "Verified Partner")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="inline-flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-full bg-[#dce5ea] text-[20px] font-semibold text-[#204454]">
      {text}
    </span>
  );
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function safeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function ActionPriceButton({
  icon,
  price,
  onClick,
  disabled,
  tone,
}: {
  icon: "chat" | "voice" | "video";
  price?: number;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled: boolean;
  tone: "mint" | "lavender" | "cream";
}) {
  const toneClasses =
    tone === "mint"
      ? "bg-[#dff1ef] text-[#0b6b66]"
      : tone === "lavender"
        ? "bg-[#e8e6f6] text-[#5834d2]"
        : "bg-[#f3eadf] text-[#8f5718]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 items-center justify-center gap-1 rounded-lg px-1.5 text-[13px] font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${toneClasses}`}
    >
      {icon === "chat" ? <MessageSquareText size={14} /> : null}
      {icon === "voice" ? <Mic size={14} /> : null}
      {icon === "video" ? <Video size={14} /> : null}
      <span>{formatINRPrice(price)}</span>
    </button>
  );
}

export function ConnectCompanionCard({ companion }: ConnectCompanionCardProps) {
  const router = useRouter();
  const [actionError, setActionError] = useState("");
  const [showAddMoneyPrompt, setShowAddMoneyPrompt] = useState(false);
  const name = companion.name || "Verified Partner";
  const tagline = companion.tagline || "Calm, respectful conversations";
  const rating = safeNumber(companion.rating) ?? 0;
  const experienceLabel = companion.experience || "1 yrs+";
  const services = safeStringArray(companion.servicesOffered).map((service) => service.toLowerCase());
  const hasExplicitServices = services.length > 0;
  const hasChat = hasExplicitServices
    ? services.some((service) => service.includes("chat"))
    : (safeNumber(companion.chatPrice) ?? 0) > 0;
  const hasAudio = hasExplicitServices
    ? services.some((service) => service.includes("audio") || service.includes("voice"))
    : (safeNumber(companion.voicePrice) ?? 0) > 0;
  const hasVideo = hasExplicitServices
    ? services.some((service) => service.includes("video"))
    : typeof safeNumber(companion.videoPrice) === "number";
  const chatPrice = hasChat ? CHAT_RATE_PER_MIN : undefined;
  const voicePrice = hasAudio ? AUDIO_RATE_PER_MIN : undefined;
  const videoPrice = hasVideo ? VIDEO_RATE_PER_MIN : undefined;
  const status = companion.effectiveStatus ?? (companion.isBusy ? "BUSY" : companion.online ? "ONLINE" : "OFFLINE");
  const isBusy = status === "BUSY";
  const profileUrl = `/connect-now/${companion.id}`;
  const rawMetaChips = [
    services.some((service) => service.includes("active listening") || service.includes("empathetic")) ? "Good listener" : null,
    services.some((service) => service.includes("motivational") || service.includes("conversation")) ? "Friendly" : null,
    services.some((service) => service.includes("stress") || service.includes("break-up")) ? "Non-judgmental" : null,
    "Verified",
  ].filter((chip): chip is string => Boolean(chip));
  const metaChips = Array.from(new Set(rawMetaChips)).slice(0, 2);
  const isVerifiedPartner =
    companion.isVerifiedPartner ??
    companion.verification.some((item) =>
      ["verified", "approved", "cleared", "trained"].includes(item.status.toLowerCase()),
    );

  const createSessionAndRoute = async (
    event: React.MouseEvent<HTMLButtonElement>,
    serviceType: "chat" | "audio" | "video",
  ) => {
    event.stopPropagation();
    if (isBusy) {
      setActionError("Partner is currently busy. Please try again shortly.");
      setShowAddMoneyPrompt(false);
      return;
    }
    setActionError("");
    setShowAddMoneyPrompt(false);

    const returnUrl = `/connect-now/${companion.id}?type=${serviceType}`;

    const token = await getUserAuthTokenWithRestore();
    if (!token) {
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (serviceType === "chat") {
      const walletResponse = await getWallet();
      if (walletResponse.error) {
        setActionError(walletResponse.error.message || "Unable to verify wallet balance right now.");
        return;
      }
      const walletBalance = walletResponse.data?.balance ?? 0;
      if (walletBalance < MIN_CHAT_WALLET_BALANCE) {
        setActionError("Minimum ₹50 wallet balance is required to start a chat.");
        setShowAddMoneyPrompt(true);
        return;
      }
    }

    if (serviceType === "audio") {
      try {
        await requestAudioPermission();
      } catch {
        setActionError("Microphone permission is required for voice calls.");
        return;
      }
    }

    if (serviceType === "video") {
      try {
        await requestVideoPermission();
      } catch {
        setActionError("Camera and microphone permission are required for video calls.");
        return;
      }
    }

    const sessionResponse = await createSession({
      companionId: companion.id,
      serviceType,
    });

    if (sessionResponse.error?.status === 401) {
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (sessionResponse.error?.code === "INSUFFICIENT_WALLET_BALANCE") {
      setActionError("Minimum ₹50 wallet balance is required to start a chat.");
      setShowAddMoneyPrompt(true);
      return;
    }

    const sessionId = sessionResponse.data?.id;
    if (sessionId) {
      if (serviceType === "chat") {
        router.push(`/chat/${sessionId}?companionId=${encodeURIComponent(companion.id)}`);
        return;
      }
      if (serviceType === "audio") {
        router.push(`/call/audio/${sessionId}?companionId=${encodeURIComponent(companion.id)}`);
        return;
      }
      router.push(`/call/video/${sessionId}?companionId=${encodeURIComponent(companion.id)}`);
      return;
    }

    setActionError(sessionResponse.error?.message || "Unable to start this session right now.");
  };

  return (
    <article
      className="flex h-full min-h-[206px] cursor-pointer flex-col rounded-[20px] border border-[#e4e8ed] bg-[#f5f7fa] p-3 shadow-[0_1px_0_rgba(5,32,57,0.03)] transition hover:-translate-y-0.5"
      onClick={() => router.push(profileUrl)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(profileUrl);
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open ${name} profile`}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          {companion.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companion.image} alt={name} className="h-[78px] w-[78px] rounded-full object-cover" />
          ) : (
            <Initials name={name} />
          )}
          <span
            className={`absolute -bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[#f5f7fa] ${
              status === "ONLINE" ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" : "bg-[#96a2b1]"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="flex min-w-0 items-center gap-1.5 text-[19px] font-medium leading-tight text-[#172533] md:text-[21px]">
                <span className="min-w-0 truncate">{name}</span>
                {isVerifiedPartner ? <VerifiedPartnerBadge /> : null}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-[13px] leading-4 text-[#637382]">{tagline}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e6e9ee] px-2 py-0.5 text-[11px] font-medium text-[#4f5c69]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#9ba8b6]" />
              {status === "ONLINE" ? "Online" : status === "BUSY" ? "Busy" : "Offline"}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1 text-[#b56a00]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={11} fill="currentColor" strokeWidth={0} />
            ))}
            <span className="ml-0.5 text-[13px] font-semibold text-[#1f2e3b]">{rating.toFixed(1)}/5</span>
            <span className="text-[#9aa7b4]">|</span>
            <span className="text-[12px] text-[#61707f]">{experienceLabel}</span>
          </div>

          <div className="mt-1 flex items-center gap-1">
            {metaChips.map((chip) => (
              <span key={chip} className="rounded-full bg-[#e9eef5] px-1.5 py-0.5 text-[10px] font-medium text-[#5d6b79]">
                {chip}
              </span>
            ))}
            <span className="text-[10px] text-[#7b8a96]">Replies ~2 min</span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-1.5" onClick={(event) => event.stopPropagation()}>
        <ActionPriceButton
          icon="chat"
          price={chatPrice}
          tone="mint"
          disabled={isBusy || !hasChat}
          onClick={(event) => {
            void createSessionAndRoute(event, "chat");
          }}
        />
        <ActionPriceButton
          icon="voice"
          price={voicePrice}
          tone="lavender"
          disabled={isBusy || !hasAudio}
          onClick={(event) => {
            void createSessionAndRoute(event, "audio");
          }}
        />
        <ActionPriceButton
          icon="video"
          price={videoPrice}
          tone="cream"
          disabled={isBusy || !hasVideo}
          onClick={(event) => {
            if (!hasVideo) return;
            void createSessionAndRoute(event, "video");
          }}
        />
      </div>

      {isBusy ? <p className="mt-2 text-xs font-medium text-amber-700">Currently busy in another session.</p> : null}
      {actionError ? <p className="mt-2 text-xs font-medium text-rose-600">{actionError}</p> : null}
      {showAddMoneyPrompt ? (
        <button
          type="button"
          className="mt-2 inline-flex h-9 items-center justify-center rounded-lg bg-[#c8191e] px-3 text-xs font-semibold text-white"
          onClick={(event) => {
            event.stopPropagation();
            router.push("/wallet?addMoney=1");
          }}
        >
          Add Money
        </button>
      ) : null}
    </article>
  );
}
