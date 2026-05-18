"use client";

import { BadgeCheck, HeartHandshake, MessageCircle, Phone, ShieldCheck, Star, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { USER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";
import { createSession } from "@/lib/api/sessions";
import type { ConnectCompanion } from "@/lib/data";
import { formatINRPrice } from "@/lib/priceFormat";

type ConnectCompanionCardProps = {
  companion: ConnectCompanion;
};

function Initials({ name }: { name: string }) {
  const text = (name || "Verified Companion")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#eef8f5] text-lg font-semibold text-[#0f766e] sm:h-[72px] sm:w-[72px]">
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

function SupportAction({
  href,
  label,
  price,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  price?: number;
  icon: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[52px] items-center justify-between gap-2 rounded-2xl border border-[#dceae5] bg-white px-3 text-left text-sm font-semibold leading-tight text-slate-800 hover:border-[#0f766e]/40 hover:bg-[#eef8f5]"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        {typeof price === "number" ? (
          <span className="shrink-0 text-xs font-semibold text-[#0f766e]">{formatINRPrice(price, "/min")}</span>
        ) : null}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="flex min-h-[52px] items-center justify-between gap-2 rounded-2xl border border-[#dceae5] bg-white px-3 text-left text-sm font-semibold leading-tight text-slate-800 hover:border-[#0f766e]/40 hover:bg-[#eef8f5]"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      {typeof price === "number" ? (
        <span className="shrink-0 text-xs font-semibold text-[#0f766e]">{formatINRPrice(price, "/min")}</span>
      ) : null}
    </Link>
  );
}

export function ConnectCompanionCard({ companion }: ConnectCompanionCardProps) {
  const router = useRouter();
  const name = companion.name || "Verified Companion";
  const tagline = companion.tagline || "Calm, respectful conversations";
  const rating = safeNumber(companion.rating) ?? 0;
  const languages = safeStringArray(companion.languages);
  const languageLabel = languages.length > 0 ? languages.slice(0, 2).join(" & ") : "Hindi & English";
  const chatPrice = safeNumber(companion.chatPrice);
  const voicePrice = safeNumber(companion.voicePrice);
  const videoPrice = safeNumber(companion.videoPrice);
  const visitPrice = safeNumber(companion.visitPrice);
  const hasVideo = typeof videoPrice === "number";
  const hasHomeVisit = typeof visitPrice === "number" && visitPrice > 0;
  const profileUrl = `/connect-now/${companion.id}`;

  const createSessionAndRoute = async (
    event: React.MouseEvent<HTMLButtonElement>,
    serviceType: "chat" | "audio" | "video",
  ) => {
    event.stopPropagation();
    const returnUrl =
      serviceType === "chat"
        ? `/chat/${companion.id}`
        : serviceType === "audio"
          ? `/call/audio/${companion.id}`
          : `/call/video/${companion.id}`;
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(USER_FIREBASE_TOKEN_KEY)?.trim() || ""
        : "";

    if (!token) {
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    const sessionResponse = await createSession({
      companionId: companion.id,
      serviceType,
    });

    if (sessionResponse.error?.status === 401) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(USER_FIREBASE_TOKEN_KEY);
      }
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
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

    router.push(returnUrl);
  };

  return (
    <article
      className="flex h-full cursor-pointer flex-col rounded-[28px] border border-[#dceae5] bg-white p-4 shadow-sm shadow-teal-900/5 transition hover:-translate-y-0.5 hover:border-[#0f766e]/35"
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
      <div className="flex items-start gap-3">
        {companion.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={companion.image}
            alt={name}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm sm:h-[72px] sm:w-[72px]"
          />
        ) : (
          <Initials name={name} />
        )}

        <div className="min-w-0 grow">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight text-slate-950">{name}</h3>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                companion.online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${companion.online ? "bg-emerald-500" : "bg-slate-400"}`} />
              {companion.online ? "Available" : "Away"}
            </span>
          </div>

          <p className="mt-1 line-clamp-1 text-sm leading-5 text-slate-600">{tagline}</p>

          <div className="mt-2 flex items-center gap-1 text-amber-500">
            <Star size={15} fill="currentColor" />
            <span className="text-sm font-semibold text-slate-900">{rating.toFixed(1)}</span>
            <span className="text-xs text-slate-500">rating</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#dceae5] bg-[#eef8f5] px-2.5 py-1 text-xs font-semibold text-[#0f766e]">
          <BadgeCheck size={13} />
          Verified
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#dceae5] bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
          <ShieldCheck size={13} />
          Strictly platonic
        </span>
        <span className="rounded-full border border-[#dceae5] bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
          {languageLabel}
        </span>
      </div>

      <div className="mt-3 rounded-2xl bg-[#f7fbf8] p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">Good for</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Calm listening", "Overthinking", "Daily support"].map((item) => (
            <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <button
          type="button"
          onClick={(event) => {
            void createSessionAndRoute(event, "chat");
          }}
          className="flex min-h-[52px] items-center justify-between gap-2 rounded-2xl border border-[#dceae5] bg-white px-3 text-left text-sm font-semibold leading-tight text-slate-800 hover:border-[#0f766e]/40 hover:bg-[#eef8f5]"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <MessageCircle size={15} />
            <span className="truncate">Start chat</span>
          </span>
          {typeof chatPrice === "number" ? (
            <span className="shrink-0 text-xs font-semibold text-[#0f766e]">{formatINRPrice(chatPrice, "/min")}</span>
          ) : null}
        </button>
        <SupportAction
          href={`/call/audio/${companion.id}`}
          label="Audio call"
          price={voicePrice}
          icon={<Phone size={15} />}
          onClick={(event) => {
            void createSessionAndRoute(event, "audio");
          }}
        />
        {hasVideo ? (
          <SupportAction
            href={`/call/video/${companion.id}`}
            label="Video call"
            price={videoPrice}
            icon={<Video size={15} />}
            onClick={(event) => {
              void createSessionAndRoute(event, "video");
            }}
          />
        ) : null}
        {hasHomeVisit ? (
          <Link
            href={`/home-visit/${companion.id}?booking=1`}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-[#fff7ed] px-3 text-center text-sm font-semibold leading-tight text-orange-700 hover:bg-[#ffedd5]"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <HeartHandshake size={15} />
            Safe visit
          </Link>
        ) : null}
      </div>
    </article>
  );
}
