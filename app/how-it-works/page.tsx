import { ArrowRight, CheckCircle2, Handshake, Search } from "lucide-react";
import Link from "next/link";
import { CTASection } from "@/components/CTASection";
import { PageHero } from "@/components/PageHero";

const steps = [
  {
    title: "Step 1: Choose a verified companion",
    description: "Browse verified companions by format, language, availability, and profile fit.",
    icon: Search,
  },
  {
    title: "Step 2: Select your session format",
    description: "Pick chat companionship, audio call companionship, or video call companionship.",
    icon: Handshake,
  },
  {
    title: "Step 3: Connect instantly or schedule",
    description: "Start your session in secure in-app channels for private, high-quality social companionship.",
    icon: CheckCircle2,
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        title="How YoPartner Works"
        subtitle="A fast, trusted way to start meaningful human connection with verified companions."
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
          <h3 className="text-xl font-semibold text-foreground">Platform clarity</h3>
          <p className="mt-3 text-sm leading-7 text-muted">
            YoPartner is strictly platonic. It is not a dating platform and not a therapy or counseling service.
            The focus is quality conversation, social companionship, and trusted interaction.
          </p>
        </div>
      </section>

      <CTASection
        title="Ready to start your first session?"
        subtitle="Explore verified companions and connect in minutes."
        primaryLabel="Browse Companions"
        primaryHref="/connect-now"
      />
    </>
  );
}



