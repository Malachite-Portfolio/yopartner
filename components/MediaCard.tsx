"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { MediaArticle, MediaPodcast } from "@/lib/data";

type MediaCardProps = {
  variant: "article";
  item: MediaArticle;
} | {
  variant: "podcast";
  item: MediaPodcast;
};

export function MediaCard({ item, variant }: MediaCardProps) {
  const isArticle = variant === "article";

  return (
    <article
      className={`yp-hover-lift group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm ${
        isArticle ? "h-[445px]" : "h-[220px]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image}
        alt={item.title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4 text-xs font-semibold text-white/95">
        <span>{isArticle ? item.date : item.label}</span>
        <span className="rounded-full border border-white/40 bg-black/25 px-2.5 py-1">
          {isArticle ? item.publisher : item.platform}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className={`font-semibold leading-tight ${isArticle ? "line-clamp-3 text-lg" : "line-clamp-2 text-base sm:text-lg"}`}>
          {item.title}
        </h3>
        <Link
          href={item.href}
          onClick={(event) => {
            if (item.href === "#") {
              event.preventDefault();
              window.alert(isArticle ? "Article link will be added later." : "Podcast link will be added later.");
            }
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
        >
          {isArticle ? item.readLabel : item.watchLabel}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
