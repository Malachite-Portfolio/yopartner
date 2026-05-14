import { ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";

const trustHighlights = [
  "Verified companion profiles",
  "Transparent pricing",
  "Private and secure sessions",
];

export function HeroSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
            <BadgeCheck size={14} className="text-[#2563eb]" />
            Safe • Verified • Respectful
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Talk to a verified companion when you need someone to listen.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            YoPartner helps you connect with trusted companions for thoughtful conversations in a calm, strictly platonic environment.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/connect-now"
              className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              Browse Companions
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Get Support
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-8 grid gap-2 text-sm text-slate-600 sm:grid-cols-3 sm:gap-4">
            {trustHighlights.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid h-full grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="h-44 rounded-3xl border border-slate-200 bg-white p-4 sm:h-52">
              <div className="h-4 w-24 rounded-full bg-slate-200" />
              <div className="mt-4 h-3 w-full rounded-full bg-slate-100" />
              <div className="mt-2 h-3 w-11/12 rounded-full bg-slate-100" />
              <div className="mt-2 h-3 w-9/12 rounded-full bg-slate-100" />
            </div>
            <div className="h-36 rounded-3xl border border-slate-200 bg-white p-4 sm:h-40">
              <div className="h-4 w-20 rounded-full bg-slate-200" />
              <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
              <div className="mt-2 h-3 w-4/5 rounded-full bg-slate-100" />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="space-y-4 pt-6 sm:pt-10">
            <div className="h-36 rounded-3xl border border-slate-200 bg-white p-4 sm:h-40">
              <div className="h-16 rounded-2xl bg-slate-100" />
              <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-200" />
            </div>
            <div className="h-44 rounded-3xl border border-slate-200 bg-white p-4 sm:h-52">
              <div className="h-4 w-24 rounded-full bg-slate-200" />
              <div className="mt-4 h-3 w-full rounded-full bg-slate-100" />
              <div className="mt-2 h-3 w-11/12 rounded-full bg-slate-100" />
              <div className="mt-2 h-3 w-9/12 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

