import { BadgeCheck, MapPin, Star } from "lucide-react";
import Link from "next/link";
import type { Companion } from "@/lib/data";
import { VerifiedPartnerBadge } from "@/components/VerifiedPartnerBadge";

type CompanionCardProps = {
  companion: Companion;
};

export function CompanionCard({ companion }: CompanionCardProps) {
  return (
    <article className="yp-hover-lift overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_20px_rgba(24,86,115,0.12)]">
      <div className="relative h-44 bg-gradient-to-br from-brand-secondary/70 via-brand/80 to-brand-purple/80">
        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand">
          <BadgeCheck size={14} />
          Verified
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex min-w-0 items-center gap-1.5 text-lg font-semibold text-foreground">
              <span className="min-w-0 truncate">{companion.name}</span>
              {companion.verification.length > 0 ? <VerifiedPartnerBadge /> : null}
            </h3>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
              <MapPin size={14} />
              {companion.city}
            </p>
          </div>
          <p className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-sm font-semibold text-brand">
            <Star size={14} className="fill-current" />
            {companion.rating.toFixed(1)}
          </p>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted">{companion.bio}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {companion.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-brand/20 bg-brand-soft/60 px-2.5 py-1 text-xs font-medium text-brand"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Chat ₹5/min | Audio ₹18/min | Video ₹24/min</p>
          <Link
            href={`/companions/${companion.id}`}
            className="yp-btn-pop rounded-full bg-gradient-to-r from-brand to-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View Profile
          </Link>
        </div>
      </div>
    </article>
  );
}




