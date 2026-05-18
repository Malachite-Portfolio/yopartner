"use client";

import { MessageCircle, Phone, Star, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ConnectCompanion } from "@/lib/data";
import { formatINRPrice } from "@/lib/priceFormat";

type ConnectCompanionCardProps = {
  companion: ConnectCompanion;
};

function PricePill({
  label,
  price,
  variant,
}: {
  label: "Start chat" | "Audio call" | "Video call";
  price?: number;
  variant: "chat" | "voice" | "video";
}) {
  const base =
    "inline-flex h-[42px] w-full flex-nowrap items-center justify-center gap-1.5 rounded-xl border px-2 text-[12px] font-semibold text-slate-900 sm:h-[45px] sm:gap-2 sm:px-3 sm:text-[15px]";
  const style =
    variant === "chat"
      ? "border-[#FACC15] bg-[#FFFBEA]"
      : variant === "voice"
        ? "border-[#93C5FD] bg-[#F5F9FF]"
        : "border-[#F9A8D4] bg-[#FFF4FB]";

  return (
    <span className={`${base} ${style}`}>
      <span
        className={`inline-flex h-[24px] w-[24px] items-center justify-center rounded-full text-white sm:h-[30px] sm:w-[30px] ${
          variant === "chat" ? "bg-[#FACC15]" : variant === "voice" ? "bg-[#2563EB]" : "bg-[#F472B6]"
        }`}
      >
        {variant === "chat" && <MessageCircle size={13} className="sm:h-4 sm:w-4" />}
        {variant === "voice" && <Phone size={13} className="sm:h-4 sm:w-4" />}
        {variant === "video" && <Video size={13} className="sm:h-4 sm:w-4" />}
      </span>
      <span className="text-sm font-semibold leading-none text-slate-900 sm:text-[15px]">
        {label} • {formatINRPrice(price, "/min")}
      </span>
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const text = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="inline-flex h-[90px] w-[90px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100/85 to-violet-100/85 text-xl font-semibold text-slate-700">
      {text}
    </span>
  );
}

export function ConnectCompanionCard({ companion }: ConnectCompanionCardProps) {
  const router = useRouter();
  const hasVideo = typeof companion.videoPrice === "number";
  const profileUrl = `/connect-now/${companion.id}`;

  return (
    <article
      className="yp-hover-lift flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white px-5 pb-3 pt-5 shadow-sm transition hover:border-[#59b0f8] hover:shadow-md"
      onClick={() => router.push(profileUrl)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(profileUrl);
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open ${companion.name} profile`}
    >
      <div className="flex items-start gap-3">
        {companion.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={companion.image}
            alt={companion.name}
            className="h-[90px] w-[90px] shrink-0 rounded-full border border-white object-cover shadow-sm"
          />
        ) : (
          <Initials name={companion.name} />
        )}

        <div className="min-w-0 grow">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[20px] font-semibold leading-tight text-slate-900">{companion.name}</h3>
            {companion.online && (
              <span className="inline-flex h-6 items-center gap-1 rounded-lg bg-green-50 px-2.5 text-[12px] font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Online
              </span>
            )}
          </div>

          <p className="mt-1 text-[15px] leading-6 text-slate-600">{companion.tagline}</p>

          <div className="mt-2 flex items-center gap-0.5 text-[#F5BF1B]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={`${companion.id}-${index}`} size={15} fill="currentColor" />
            ))}
            <span className="ml-1 text-[13px] font-semibold text-slate-900">{companion.rating.toFixed(1)}/5</span>
            <span className="text-[13px] text-slate-500">| {companion.experience}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
              Calm listener
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
              {companion.languages.slice(0, 2).join(" & ")}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              {companion.online ? "Available now" : "Available soon"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto grid min-h-[104px] grid-cols-1 gap-2 pt-3 sm:grid-cols-2">
        <Link
          href={`/chat/${companion.id}`}
          className="block min-w-[112px]"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={`Chat with ${companion.name}`}
        >
          <PricePill label="Start chat" price={companion.chatPrice} variant="chat" />
        </Link>
        <Link
          href={`/call/audio/${companion.id}`}
          className="block min-w-[112px]"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={`Voice call ${companion.name}`}
        >
          <PricePill label="Audio call" price={companion.voicePrice} variant="voice" />
        </Link>
        {hasVideo && (
          <Link
            href={`/call/video/${companion.id}`}
            className="block min-w-[112px] sm:col-span-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={`Video call ${companion.name}`}
          >
            <PricePill label="Video call" price={companion.videoPrice as number} variant="video" />
          </Link>
        )}
      </div>
    </article>
  );
}

