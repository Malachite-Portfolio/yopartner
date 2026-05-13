import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export function PageHero({ eyebrow, title, subtitle, actions }: PageHeroProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pt-16">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
      )}
      <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-muted sm:text-lg">{subtitle}</p>
      {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
    </section>
  );
}



