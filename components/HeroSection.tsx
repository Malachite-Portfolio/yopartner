import { ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";

const trustHighlights = [
  "5,000+ happy connections",
  "100% verified companions",
  "4.9 average rating",
];

export function HeroSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
            <BadgeCheck size={14} />
            Safe • Verified • Judgment-free
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            You deserve a real connection
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Book verified companions for private chat, calls, in-person activities, and emotional support in a calm,
            respectful, strictly platonic space.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/connect-now"
              className="yp-btn-pop rounded-full bg-gradient-to-r from-brand to-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Browse Companions
            </Link>
            <Link
              href="/how-it-works"
              className="yp-btn-pop inline-flex items-center gap-2 rounded-full border border-brand/35 px-6 py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft"
            >
              How it works
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-8 grid gap-2 text-sm text-muted sm:grid-cols-3 sm:gap-4">
            {trustHighlights.map((item) => (
              <div key={item} className="yp-hover-soft rounded-xl border border-line bg-surface px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid h-full grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="yp-hover-soft h-44 rounded-3xl bg-gradient-to-br from-brand-secondary/65 to-brand-purple/70 p-4 shadow-sm sm:h-52">
              <div className="h-full rounded-2xl border border-white/45 bg-white/30" />
            </div>
            <div className="yp-hover-soft h-36 rounded-3xl border border-line bg-surface p-4 shadow-sm sm:h-40">
              <div className="h-4 w-20 rounded-full bg-brand/20" />
              <div className="mt-3 h-3 w-full rounded-full bg-brand/10" />
              <div className="mt-2 h-3 w-4/5 rounded-full bg-brand/10" />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-brand/10" />
            </div>
          </div>
          <div className="space-y-4 pt-6 sm:pt-10">
            <div className="yp-hover-soft h-36 rounded-3xl border border-line bg-surface p-4 shadow-sm sm:h-40">
              <div className="h-20 rounded-2xl bg-brand-purple-soft" />
              <div className="mt-3 h-3 w-1/2 rounded-full bg-brand-purple/20" />
            </div>
            <div className="yp-hover-soft h-44 rounded-3xl bg-gradient-to-tr from-brand to-brand-purple p-4 shadow-sm sm:h-52">
              <div className="h-full rounded-2xl border border-white/35 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

