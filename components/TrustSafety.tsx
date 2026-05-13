import { SectionHeader } from "@/components/SectionHeader";
import { SafetyIcon } from "@/components/SafetyIcon";
import { safetyItems } from "@/lib/data";

type TrustSafetyProps = {
  showHeader?: boolean;
  withBackground?: boolean;
};

export function TrustSafety({ showHeader = true, withBackground = true }: TrustSafetyProps) {
  const sectionClasses = withBackground
    ? "bg-gradient-to-b from-brand-soft to-brand-purple-soft py-16"
    : "py-16";

  return (
    <section className={sectionClasses} id="trust-safety">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {showHeader && <SectionHeader eyebrow="Trust First" title="Trust & Safety" />}
        <div className={`${showHeader ? "mt-8" : ""} grid gap-4 md:grid-cols-2 xl:grid-cols-3`}>
          {safetyItems.map((item) => (
            <article
              key={item.title}
              className="yp-hover-lift rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_18px_rgba(24,86,115,0.08)]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <SafetyIcon icon={item.icon} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}




