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
    title: "Real Human Connection",
    description: "Meaningful one-to-one companionship with people who listen with care and presence.",
    icon: HeartHandshake,
  },
  {
    title: "Safety First",
    description: "Verified profiles, platform standards, and clear conduct expectations for every interaction.",
    icon: Shield,
  },
  {
    title: "Respectful Companionship",
    description: "A judgment-free experience built on empathy, dignity, and clearly defined boundaries.",
    icon: Users,
  },
];

const offerings = [
  {
    title: "Private Chat",
    description: "Thoughtful text conversations for everyday connection.",
    icon: MessageCircle,
  },
  {
    title: "Audio Calls",
    description: "Voice-based support when hearing someone helps most.",
    icon: PhoneCall,
  },
  {
    title: "Video Calls",
    description: "Face-to-face conversations in a safe, guided format.",
    icon: Video,
  },
  {
    title: "Activity Companions",
    description: "Shared time for walks, errands, and simple activities.",
    icon: Activity,
  },
  {
    title: "Emotional Support",
    description: "Compassionate, non-clinical support through difficult moments.",
    icon: Smile,
  },
];

const whyItems = [
  {
    title: "Verified companions",
    description: "Profiles are reviewed to keep experiences consistent and trustworthy.",
    icon: BadgeCheck,
  },
  {
    title: "Clear boundaries",
    description: "Service guidelines keep every session respectful and platonic.",
    icon: Shield,
  },
  {
    title: "Privacy focused",
    description: "Personal details and sensitive context are handled with care.",
    icon: Lock,
  },
  {
    title: "Flexible support",
    description: "Choose chat, calls, or activities based on your comfort.",
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
            We&apos;re building a safer way to feel connected.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            YoPartner helps people find verified human companionship for conversations, emotional support, and
            everyday activities.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/connect-now"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00A6B2] to-[#9B5DE5] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Connect Now
            </Link>
            <Link
              href="/partner/login"
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
              <p className="text-sm font-semibold text-[#111827]">Calm, human-first support</p>
              <p className="mt-1 text-sm text-slate-600">Designed for people who need presence, not pressure.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-[#111827]">Verified and respectful</p>
              <p className="mt-1 text-sm text-slate-600">Built on trust, dignity, and clearly defined boundaries.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-[#111827]">Flexible companionship formats</p>
              <p className="mt-1 text-sm text-slate-600">From quick chats to calls and activities, based on comfort.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-[#111827]">Our Mission</h2>
        <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
          To make real human companionship accessible, safe, and judgment-free for people who need someone to talk to,
          walk with, or simply share time with.
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
            YoPartner is not a dating, romantic, or sexual service. Every experience is designed around respect,
            emotional comfort, safety, and clear boundaries.
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
            YoPartner started with a simple belief: many people do not need advice, judgment, or pressure — they just
            need someone safe to be present with them. We are creating a platform where companionship feels simple,
            respectful, and human again.
          </p>
        </article>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm sm:px-10 sm:py-10">
          <h2 className="text-3xl font-semibold text-[#111827]">You don&apos;t have to go through it alone.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Find a verified YoPartner companion for chat, calls, and activities.
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
