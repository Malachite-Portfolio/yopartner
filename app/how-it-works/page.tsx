import { ArrowRight, CalendarDays, CheckCircle2, Handshake, Search } from "lucide-react";
import Link from "next/link";
import { CTASection } from "@/components/CTASection";
import { PageHero } from "@/components/PageHero";

const steps = [
  {
    title: "Browse verified companions",
    description: "Explore trusted profiles with clear focus areas, ratings, and city availability.",
    icon: Search,
  },
  {
    title: "Choose chat, audio, or video support",
    description: "Pick the type of companionship that fits your emotional needs and comfort level.",
    icon: Handshake,
  },
  {
    title: "Book your preferred time",
    description: "Select a convenient slot and session format for a smooth and simple experience.",
    icon: CalendarDays,
  },
  {
    title: "Connect safely with confidence",
    description: "Every interaction is guided by clear boundaries, privacy, and strict platonic policy.",
    icon: CheckCircle2,
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        title="How YoPartner Works"
        subtitle="A simple, safe way to find verified companionship when you need support, company, or a real conversation."
        actions={
          <Link
            href="/connect-now"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Browse Companions
            <ArrowRight size={16} />
          </Link>
        }
      />

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_20px_rgba(24,86,115,0.08)]"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <step.icon size={18} />
              </div>
              <p className="text-xs font-semibold text-muted">STEP {index + 1}</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-soft/55 p-6">
          <h3 className="text-xl font-semibold text-foreground">Safety note</h3>
          <p className="mt-3 text-sm leading-7 text-muted">
            YoPartner is strictly platonic and non-romantic. We verify companions, enforce respectful boundaries,
            and provide support channels for reporting concerns.
          </p>
        </div>
      </section>

      <CTASection
        title="Ready to connect with confidence?"
        subtitle="Browse verified companions and choose the format that feels right for you."
        primaryLabel="Browse Companions"
        primaryHref="/connect-now"
      />
    </>
  );
}



