import Link from "next/link";

type CTASectionProps = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function CTASection({
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CTASectionProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-line bg-gradient-to-r from-brand-soft to-brand-purple-soft p-7 shadow-[0_8px_24px_rgba(24,86,115,0.12)] sm:p-10">
        <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">{subtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={primaryHref}
            className="rounded-full bg-gradient-to-r from-brand to-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {primaryLabel}
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="rounded-full border border-brand/30 px-6 py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}



