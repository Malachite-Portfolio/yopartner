import { Mail, ShieldAlert, UserRound } from "lucide-react";
import { PageHero } from "@/components/PageHero";

const supportCards = [
  {
    title: "Customer Support",
    description: "General help with sessions, platform guidance, and account questions.",
    icon: UserRound,
  },
  {
    title: "Companion Applications",
    description: "Application and onboarding queries for future YoPartner companions.",
    icon: Mail,
  },
  {
    title: "Safety & Reports",
    description: "Urgent concerns, policy reports, and trust-related assistance.",
    icon: ShieldAlert,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact YoPartner"
        subtitle="Questions, support, or partnership ideas? We are here to help."
      />

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <article className="rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_24px_rgba(24,86,115,0.12)]">
          <h2 className="text-2xl font-semibold text-foreground">Send a message</h2>
          <p className="mt-2 text-sm text-muted">Form is frontend-only demo for now.</p>

          <form className="mt-6 space-y-4" action="#">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-medium text-foreground">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="How can we help?"
              />
            </div>

            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-brand to-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Submit
            </button>
          </form>
        </article>

        <div className="space-y-4">
          {supportCards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_20px_rgba(24,86,115,0.08)]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <card.icon size={18} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">{card.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{card.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}



