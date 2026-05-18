import { ArrowRight, BadgeCheck, MessageCircle, PhoneCall, ShieldCheck, Star, Video } from "lucide-react";
import Link from "next/link";

const trustHighlights = [
  "Verified profiles",
  "Secure payments",
  "Respectful conversations",
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
            Safe, respectful, strictly platonic support with verified companions across chat, audio, video, and
            safety-reviewed Home Visit.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/connect-now"
              className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              Find a Companion
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

        <div className="relative mx-auto w-full max-w-[460px] py-2 sm:py-4">
          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.5)] sm:p-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Companion Preview</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-lg font-semibold text-white">
                    IT
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-900">Ira T</p>
                    <p className="text-xs text-slate-600">Calm conversations • Mood uplift</p>
                    <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <Star size={13} fill="currentColor" />
                      5.0
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <span className="inline-flex items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2 py-2 text-xs font-semibold text-amber-700">
                    <MessageCircle size={13} />
                    Chat
                  </span>
                  <span className="inline-flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-700">
                    <PhoneCall size={13} />
                    Audio
                  </span>
                  <span className="inline-flex items-center justify-center gap-1 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-2 py-2 text-xs font-semibold text-fuchsia-700">
                    <Video size={13} />
                    Video
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Recent reply:</span> I am here, take your time. Let us
                  talk calmly.
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -left-3 top-8 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:-left-8">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={13} className="text-[#2563eb]" />
              Verified profile
            </span>
          </div>

          <div className="pointer-events-none absolute -right-3 top-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:-right-8">
            Secure session
          </div>

          <div className="pointer-events-none absolute -bottom-1 right-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm sm:right-10">
            Available now • ₹10/min
          </div>
        </div>
      </div>
    </section>
  );
}
