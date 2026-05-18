import { ArrowRight, BadgeCheck, HeartHandshake, MessageCircle, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";

const trustHighlights = [
  "Private conversations",
  "Verified companions",
  "Platform-protected payments",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#fffdf8]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-20 lg:pt-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dceae5] bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-700 shadow-sm">
            <BadgeCheck size={14} className="text-[#0f766e]" />
            Safe | Verified | Strictly Platonic
          </div>
          <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[1.04] text-slate-950 sm:text-6xl">
            Talk to someone who truly listens.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            YoPartner connects you with verified companions for calm conversations, emotional support, and everyday
            moments when you do not want to feel alone.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/connect-now"
              className="rounded-full bg-[#0f766e] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115e59]"
            >
              Talk Now
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-[#dceae5] bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f7fbf8]"
            >
              See how it works
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-8 grid gap-2 text-sm text-slate-600 sm:grid-cols-3 sm:gap-4">
            {trustHighlights.map((item) => (
              <div key={item} className="rounded-2xl border border-[#dceae5] bg-white px-4 py-3 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[470px]">
          <div className="rounded-[34px] border border-[#dceae5] bg-[#102a2a] p-3 shadow-[0_28px_70px_-34px_rgba(15,23,42,0.65)]">
            <div className="rounded-[28px] bg-[#f7fbf8] p-4">
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Talk now</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Available now
                </span>
              </div>

              <div className="mt-4 rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=180&q=80"
                    alt="Ira T"
                    className="h-20 w-20 rounded-3xl object-cover"
                  />
                  <div>
                    <p className="text-xl font-semibold text-slate-950">Ira T</p>
                    <p className="mt-1 text-sm text-slate-600">Calm listener | Hindi & English</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                      <Star size={15} fill="currentColor" />
                      5.0 rated support
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl bg-[#eef8f5] px-4 py-3 text-sm leading-6 text-slate-700">
                  &quot;You can talk at your own pace. I am here to listen.&quot;
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                  <span className="rounded-full border border-[#dceae5] bg-white px-3 py-2">No judgment</span>
                  <span className="rounded-full border border-[#dceae5] bg-white px-3 py-2">Private chat</span>
                  <span className="rounded-full border border-[#dceae5] bg-white px-3 py-2">Verified</span>
                  <span className="rounded-full border border-[#dceae5] bg-white px-3 py-2">₹10/min</span>
                </div>

                <button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0f766e] text-sm font-semibold text-white">
                  <MessageCircle size={16} />
                  Start a calm chat
                </button>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -left-3 top-10 rounded-2xl border border-[#dceae5] bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:-left-8">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={13} className="text-[#0f766e]" />
              Verified
            </span>
          </div>

          <div className="pointer-events-none absolute -right-3 top-28 rounded-2xl border border-[#dceae5] bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:-right-8">
            No judgment
          </div>

          <div className="pointer-events-none absolute -bottom-4 right-6 rounded-2xl border border-orange-200 bg-[#fff7ed] px-3 py-2 text-xs font-semibold text-orange-700 shadow-sm sm:right-10">
            <span className="inline-flex items-center gap-1">
              <HeartHandshake size={13} />
              Talk, breathe, feel lighter
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
