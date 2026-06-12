import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { IS_DEMO_MODE } from "@/lib/config/runtime";

const benefits = ["Flexible work", "Meaningful conversations", "Safe platform", "Verified community"];

const requirements = [
  "Age 18+",
  "ID verification",
  "Respectful communication",
  "Background/profile review",
  "Platonic-only service understanding",
];

export default function BecomeCompanionPage() {
  return (
    <>
      <PageHero
        title="Become a Verified Companion on YoPartner"
        subtitle="Help people feel heard, supported, and less alone."
      />

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_20px_rgba(24,86,115,0.08)]">
          <h2 className="text-2xl font-semibold text-foreground">Benefits</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {benefits.map((item) => (
              <li key={item} className="inline-flex w-full items-center gap-2 rounded-xl border border-line bg-background px-3 py-2">
                <CheckCircle2 size={16} className="text-brand" />
                {item}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-xl font-semibold text-foreground">Requirements</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {requirements.map((item) => (
              <li key={item} className="inline-flex w-full items-center gap-2 rounded-xl border border-line bg-background px-3 py-2">
                <CheckCircle2 size={16} className="text-brand" />
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_20px_rgba(24,86,115,0.08)]">
          <h2 className="text-2xl font-semibold text-foreground">Application form</h2>
          <p className="mt-2 text-sm text-muted">
            {IS_DEMO_MODE ? "Application form is frontend-only demo for now." : "Application form is currently unavailable."}
          </p>

          <form className="mt-6 space-y-4" action="#">
            <div>
              <label htmlFor="full-name" className="mb-1 block text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="city" className="mb-1 block text-sm font-medium text-foreground">
                City
              </label>
              <input
                id="city"
                type="text"
                className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="Your city"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-foreground">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="Your phone number"
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
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="services" className="mb-1 block text-sm font-medium text-foreground">
                Services interested in
              </label>
              <input
                id="services"
                type="text"
                className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="Chat, calls, activities, emotional support"
              />
            </div>

            <div>
              <label htmlFor="intro" className="mb-1 block text-sm font-medium text-foreground">
                Short intro
              </label>
              <textarea
                id="intro"
                rows={4}
                className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="Share your communication style and strengths"
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
      </section>
    </>
  );
}
