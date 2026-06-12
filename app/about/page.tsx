import {
  BadgeCheck,
  HeartHandshake,
  Lock,
  MessageCircle,
  PhoneCall,
  Shield,
  Sparkles,
  Users,
  Video,
  Activity,
  Smile,
} from "lucide-react";
import Link from "next/link";

const missionItems = [
  {
    title: "Human Connection, Simplified",
    description: "A premium companionship platform for consistent, respectful one-to-one interactions.",
    icon: HeartHandshake,
  },
  {
    title: "Verification First",
    description: "Verified companions, platform checks, and quality controls before sessions begin.",
    icon: Shield,
  },
  {
    title: "Clear Boundaries",
    description: "Strictly platonic sessions designed for social companionship and quality time.",
    icon: Users,
  },
];

const offerings = [
  {
    title: "Chat Companionship",
    description: "Fast, private text sessions with verified companions.",
    icon: MessageCircle,
  },
  {
    title: "Voice Call Companionship",
    description: "Natural voice conversations for real-time human connection.",
    icon: PhoneCall,
  },
  {
    title: "Video Companionship",
    description: "High-quality face-to-face sessions in secure in-app channels.",
    icon: Video,
  },
  {
    title: "Home Visit Companionship",
    description: "Approved in-person companionship with extra safety checks.",
    icon: Activity,
  },
  {
    title: "Social Companionship",
    description: "Conversation, presence, and meaningful time without pressure.",
    icon: Smile,
  },
];

const whyItems = [
  {
    title: "Trusted verification",
    description: "Profiles are reviewed so users can choose with confidence.",
    icon: BadgeCheck,
  },
  {
    title: "Strictly platonic",
    description: "YoPartner is not dating, therapy, or counseling.",
    icon: Shield,
  },
  {
    title: "Privacy focused",
    description: "Secure communication and privacy-first data handling.",
    icon: Lock,
  },
  {
    title: "Flexible formats",
    description: "Choose chat, voice, video, or home visits based on comfort.",
    icon: Sparkles,
  },
];

const safetyPoints = [
  "Verified profiles",
  "Platform rules",
  "Reporting support",
  "Privacy-first experience",
];

export default function AboutPage() {
  return (
    <div className="bg-[#F8FBFC]">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-20">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#00A6B2]">ABOUT YOPARTNER</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">
            About YoPartner: Safe Platonic Companionship
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            YoPartner exists to make verified human connection easy, private, and trustworthy.
            Connect through chat, voice calls, video companionship, and home visit companionship.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/connect-now"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00A6B2] to-[#9B5DE5] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Connect Now
            </Link>
            <Link
              href="/become-companion"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-[#111827] transition hover:border-[#00A6B2]/40"
            >
              Become a Companion
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_36px_rgba(2,20,40,0.08)]">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#00A6B2]/15 blur-2xl" />
          <div className="absolute -bottom-14 -left-8 h-48 w-48 rounded-full bg-[#9B5DE5]/20 blur-2xl" />
          <div className="relative space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-[#111827]">Verified companions</p>
              <p className="mt-1 text-sm text-slate-600">Every active profile is reviewed before it goes live.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-[#111827]">Strictly platonic sessions</p>
              <p className="mt-1 text-sm text-slate-600">No dating, no therapy, no counseling.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-[#111827]">Secure communication</p>
              <p className="mt-1 text-sm text-slate-600">Private in-app chat, voice, and video sessions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-[#111827]">Our Mission</h2>
        <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
          To make social companionship more accessible and reliable for adults across India.
          We combine verified people with modern product design for better everyday human connection.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {missionItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9FAF8] text-[#00A6B2]">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#111827]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-[#111827]">What YoPartner Offers</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4EDFF] text-[#9B5DE5]">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#111827]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-[#111827]">Why people choose YoPartner</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9FAF8] text-[#00A6B2]">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-[#111827]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-semibold text-[#111827]">Strictly platonic. Always respectful.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            YoPartner is not a dating platform and not a therapy or counseling service.
            We focus on conversation, social interaction, quality time, and trusted companionship.
          </p>
        </div>

        <aside className="rounded-3xl border border-[#00A6B2]/20 bg-gradient-to-br from-[#E9FAF8] to-[#F4EDFF] p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#111827]">Safety Snapshot</p>
          <div className="mt-4 space-y-2.5">
            {safetyPoints.map((point) => (
              <div key={point} className="rounded-xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-medium text-[#111827]">
                {point}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-semibold text-[#111827]">Our Story</h2>
          <p className="mt-4 max-w-5xl text-base leading-7 text-slate-600">
            YoPartner was created for people who value meaningful conversation without complexity.
            We built a premium companionship platform where trust, privacy, and quality are non-negotiable.
          </p>
        </article>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm sm:px-10 sm:py-10">
          <h2 className="text-3xl font-semibold text-[#111827]">Start with a verified companion today.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Choose chat companionship, voice calls, video companionship, or home visit companionship.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/connect-now"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00A6B2] to-[#9B5DE5] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Connect Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
