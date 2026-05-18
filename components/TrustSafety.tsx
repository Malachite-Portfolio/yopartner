import { SectionHeader } from "@/components/SectionHeader";
import { SafetyIcon } from "@/components/SafetyIcon";
import { safetyItems } from "@/lib/data";

type TrustSafetyProps = {
  showHeader?: boolean;
  withBackground?: boolean;
};

export function TrustSafety({ showHeader = true, withBackground = true }: TrustSafetyProps) {
  const sectionClasses = withBackground
    ? "bg-[#eef8f5] py-16"
    : "py-16";

  return (
    <section className={sectionClasses} id="trust-safety">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {showHeader && <SectionHeader eyebrow="Safety First" title="Built around privacy and respect" />}
        <div className={`${showHeader ? "mt-8" : ""} grid gap-4 md:grid-cols-2 xl:grid-cols-3`}>
          {safetyItems.map((item) => (
            <article
              key={item.title}
              className="yp-hover-lift rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_30px_rgba(15,118,110,0.08)]"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
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




