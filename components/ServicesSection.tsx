import { services } from "@/lib/data";
import { SectionHeader } from "@/components/SectionHeader";
import { ServiceIcon } from "@/components/ServiceIcon";

type ServicesSectionProps = {
  showHeader?: boolean;
};

export function ServicesSection({ showHeader = true }: ServicesSectionProps) {
  return (
    <section id="services" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {showHeader && (
        <SectionHeader
          eyebrow="What We Offer"
          title="Companionship with trust at every step"
        />
      )}
      <div className={`${showHeader ? "mt-8" : ""} grid gap-4 md:grid-cols-2 xl:grid-cols-3`}>
        {services.map((service) => (
          <article
            key={service.title}
            className="yp-hover-lift rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_18px_rgba(24,86,115,0.08)]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <ServiceIcon icon={service.icon} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{service.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}




