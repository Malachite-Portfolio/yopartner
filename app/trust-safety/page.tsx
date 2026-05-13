import Link from "next/link";
import { CTASection } from "@/components/CTASection";
import { PageHero } from "@/components/PageHero";
import { TrustSafety } from "@/components/TrustSafety";

const trustSections = [
  {
    title: "Verification process",
    text: "Companions complete identity checks, profile screening, and safety onboarding before they go live.",
  },
  {
    title: "Privacy and confidentiality",
    text: "Your personal information and session context are treated with strict confidentiality standards.",
  },
  {
    title: "Strictly platonic policy",
    text: "YoPartner is a non-romantic and non-sexual companionship platform with clear behavioral boundaries.",
  },
  {
    title: "In-person safety guidelines",
    text: "In-person sessions are pre-planned in approved settings with clear protocols and respectful conduct rules.",
  },
  {
    title: "Reporting and support",
    text: "If something feels wrong, users can report concerns and receive fast assistance from the support team.",
  },
];

export default function TrustSafetyPage() {
  return (
    <>
      <PageHero
        title="Your Safety Comes First"
        subtitle="YoPartner is designed around verified people, clear boundaries, privacy, and respectful companionship."
        actions={
          <Link
            href="/companions"
            className="rounded-full bg-gradient-to-r from-brand to-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Browse Verified Companions
          </Link>
        }
      />

      <TrustSafety showHeader={false} withBackground={false} />

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {trustSections.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_20px_rgba(24,86,115,0.08)]"
            >
              <h2 className="text-xl font-semibold text-foreground">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <CTASection
        title="Safe connection starts with trust"
        subtitle="Explore profiles that follow strict verification and platonic conduct guidelines."
        primaryLabel="Browse Verified Companions"
        primaryHref="/companions"
      />
    </>
  );
}



