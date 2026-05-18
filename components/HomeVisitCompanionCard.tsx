import { ArrowRight, BadgeCheck, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import type { HomeVisitCompanion } from "@/lib/data";

type HomeVisitCompanionCardProps = {
  companion: HomeVisitCompanion;
};

export function HomeVisitCompanionCard({ companion }: HomeVisitCompanionCardProps) {
  const href = `/home-visit/${companion.id}?booking=1`;

  return (
    <Link href={href} className="group block h-full">
      <article className="flex h-full flex-col rounded-[28px] border border-[#dceae5] bg-white p-4 shadow-sm shadow-teal-900/5 transition group-hover:-translate-y-0.5 group-hover:border-[#0f766e]/35">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={companion.image}
            alt={companion.name}
            className="h-16 w-16 shrink-0 rounded-2xl border border-white object-cover shadow-sm sm:h-[76px] sm:w-[76px]"
          />

          <div className="min-w-0 grow">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-lg font-semibold leading-tight text-slate-900">{companion.name}</h3>
              {companion.verified ? (
                <span className="hidden h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
                  <BadgeCheck size={13} />
                  Safety approved
                </span>
              ) : null}
            </div>

            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{companion.tagline}</p>

            <div className="mt-2 flex flex-wrap items-center gap-0.5 text-[#F5BF1B]">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} size={14} fill="currentColor" />
              ))}
              <span className="ml-1 text-xs font-semibold text-slate-900">{companion.rating.toFixed(1)}/5</span>
              <span className="text-xs text-slate-500">| {companion.experience}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {companion.verified ? (
            <span className="inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 sm:hidden">
              <BadgeCheck size={13} />
              Safety approved
            </span>
          ) : null}
          <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[#dceae5] bg-[#eef8f5] px-2.5 text-xs font-semibold text-[#0f766e]">
            <ShieldCheck size={13} />
            Manual approval required
          </span>
        </div>

        <div className="mt-auto pt-4">
          <div className="mb-3 rounded-2xl bg-[#f7fbf8] px-3 py-2">
            <p className="text-xl font-semibold text-slate-900">₹{companion.price}/session</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Manual approval required</p>
          </div>

          <span className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0f766e] px-4 text-sm font-semibold text-white transition group-hover:bg-[#115e59]">
            Request safe visit
            <ArrowRight size={16} />
          </span>
        </div>
      </article>
    </Link>
  );
}

