import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import Link from "next/link";
import type { HomeVisitCompanion } from "@/lib/data";

type HomeVisitCompanionCardProps = {
  companion: HomeVisitCompanion;
};

export function HomeVisitCompanionCard({ companion }: HomeVisitCompanionCardProps) {
  const href = `/home-visit/${companion.id}`;

  return (
    <Link href={href} className="group block">
      <article className="yp-hover-lift rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition group-hover:border-[#59b0f8] group-hover:shadow-md">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={companion.image}
            alt={companion.name}
            className="h-[88px] w-[88px] shrink-0 rounded-full border border-white object-cover shadow-sm"
          />

          <div className="min-w-0 grow">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[20px] font-semibold leading-tight text-slate-900">{companion.name}</h3>
              {companion.verified && (
                <span className="inline-flex h-6 items-center gap-1 rounded-lg bg-sky-50 px-2.5 text-[12px] font-semibold text-sky-700">
                  <BadgeCheck size={13} />
                  Verified
                </span>
              )}
            </div>

            <p className="mt-1 truncate text-[15px] text-slate-600">{companion.tagline}</p>

            <div className="mt-2 flex items-center gap-0.5 text-[#F5BF1B]">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} size={15} fill="currentColor" />
              ))}
              <span className="ml-1 text-[13px] font-semibold text-slate-900">{companion.rating.toFixed(1)}/5</span>
              <span className="text-[13px] text-slate-500">| {companion.experience}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-slate-900">₹{companion.price}/-</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Per Session</p>
          </div>

          <span className="inline-flex h-11 items-center gap-1 rounded-xl border border-slate-700 px-4 text-[15px] font-semibold text-slate-900 transition group-hover:bg-slate-50">
            Book Now
            <ArrowRight size={16} />
          </span>
        </div>
      </article>
    </Link>
  );
}

