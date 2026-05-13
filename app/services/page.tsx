import Link from "next/link";
import { CTASection } from "@/components/CTASection";
import { PageHero } from "@/components/PageHero";
import { ServiceIcon } from "@/components/ServiceIcon";
import { SectionHeader } from "@/components/SectionHeader";
import { ServicesSection } from "@/components/ServicesSection";
import { serviceDetails, services } from "@/lib/data";

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Services Built Around Real Human Connection"
        subtitle="Choose the kind of support that fits your moment."
        actions={
          <Link
            href="/companions"
            className="rounded-full bg-gradient-to-r from-brand to-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Find a Companion
          </Link>
        }
      />

      <ServicesSection showHeader={false} />

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Service Details" title="What each service includes" />
        <div className="mt-8 space-y-4">
          {serviceDetails.map((detail) => {
            const service = services.find((item) => item.title === detail.title);

            return (
              <article
                key={detail.title}
                className="rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_20px_rgba(24,86,115,0.08)]"
              >
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    {service ? <ServiceIcon icon={service.icon} /> : null}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{detail.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-muted">{detail.description}</p>
                    <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                      {detail.highlights.map((highlight) => (
                        <li key={highlight} className="rounded-xl border border-line bg-background px-3 py-2">
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <CTASection
        title="Find support on your terms"
        subtitle="Choose from verified companions who offer chat, calls, activities, and safe in-person support."
        primaryLabel="Find a Companion"
        primaryHref="/companions"
      />
    </>
  );
}



