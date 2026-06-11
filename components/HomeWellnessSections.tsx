import {
  Ban,
  CheckCircle2,
  HeartHandshake,
  MessageCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  SunMedium,
} from "lucide-react";
import Link from "next/link";
import { connectCompanions } from "@/lib/data";
import { VerifiedPartnerBadge } from "@/components/VerifiedPartnerBadge";

const painCards = [
  { title: "Feeling overwhelmed", text: "Slow down with someone calm and present.", icon: Sparkles },
  { title: "Feeling lonely", text: "A real voice can make the day feel less heavy.", icon: HeartHandshake },
  { title: "Overthinking at night", text: "Talk through the loop without judgment.", icon: Moon },
  { title: "Need a calm conversation", text: "Choose a listener who matches your comfort.", icon: MessageCircle },
  { title: "A difficult day", text: "Gentle support for moments that feel too much.", icon: SunMedium },
  { title: "Everyday support", text: "Respectful company for check-ins and routines.", icon: ShieldCheck },
];

const howItWorks = [
  "Choose a verified companion",
  "Start chat, audio, or video",
  "Feel heard in a safe space",
];

const safetyCards = [
  "KYC-reviewed companions",
  "Strictly platonic policy",
  "Platform-protected payments",
  "Report and support tools",
];

const notYoPartner = [
  "Not a dating app",
  "No romantic or sexual services",
  "No escorting",
  "No outside payments",
];

export function HomeWellnessSections() {
  const featured = connectCompanions.slice(0, 4);

  return (
    <>
      <section className="bg-[#f7fbf8] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-[#0f766e]">A softer kind of support</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              When you just need someone to hear you
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {painCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef8f5] text-[#0f766e]">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf8] py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-[#0f766e]">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Talk, breathe, feel lighter.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Not therapy. Not dating. Just human support with clear boundaries and platform rules.
            </p>
          </div>
          <div className="space-y-3">
            {howItWorks.map((step, index) => (
              <article key={step} className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f766e] text-sm font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{step}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      No outside payments. No personal contact sharing. Respectful conversations only.
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef8f5] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-[#0f766e]">Verified listeners</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">Find a voice that feels safe</h2>
            </div>
            <Link href="/connect-now" className="text-sm font-semibold text-[#0f766e]">
              See all companions
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featured.map((companion) => (
              <article key={companion.id} className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companion.image ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"}
                  alt={companion.name}
                  className="h-44 w-full rounded-3xl object-cover"
                />
                <h3 className="mt-4 flex min-w-0 items-center gap-1.5 text-xl font-semibold text-slate-950">
                  <span className="min-w-0 truncate">{companion.name}</span>
                  {companion.verification.some((item) =>
                    ["verified", "approved", "cleared", "trained"].includes(item.status.toLowerCase()),
                  ) ? (
                    <VerifiedPartnerBadge />
                  ) : null}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{companion.tagline}</p>
                <p className="mt-3 text-xs font-semibold text-[#0f766e]">
                  {companion.languages.slice(0, 2).join(" & ")} | {companion.rating.toFixed(1)} rated
                </p>
                <Link
                  href={`/connect-now/${companion.id}`}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-[#0f766e] text-sm font-semibold text-white"
                >
                  Talk to {companion.name.split(" ")[0]}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf8] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
            <div>
              <p className="text-sm font-semibold uppercase text-[#0f766e]">Safety first</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
                Built around safety, privacy, and respect
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {safetyCards.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#dceae5] bg-white p-4 shadow-sm">
                    <CheckCircle2 size={18} className="shrink-0 text-[#0f766e]" />
                    <span className="text-sm font-semibold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-orange-200 bg-[#fff7ed] p-6">
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-orange-700">
                <Ban size={16} />
                What YoPartner is not
              </p>
              <div className="mt-4 space-y-3">
                {notYoPartner.map((item) => (
                  <p key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7fbf8] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <article className="mx-auto max-w-2xl rounded-3xl border border-[#dceae5] bg-[#102a2a] p-7 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase text-[#a7f3d0]">Become a companion</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">
              Use your empathy to support people through meaningful conversations.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#d7f3ef]">
              Apply to become a verified YoPartner companion and help people feel heard in a safe, respectful space.
            </p>
            <Link href="/partner" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0f766e]">
              Apply as a companion
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
