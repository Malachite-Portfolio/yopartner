import { CalendarClock, Heart, Search } from "lucide-react";
import { processSteps } from "@/lib/data";

function getStepIcon(icon: string) {
  if (icon === "calendar") return CalendarClock;
  if (icon === "heart") return Heart;
  return Search;
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Simple Process</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        How it works
      </h2>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {processSteps.map((step, index) => {
          const Icon = getStepIcon(step.icon);
          return (
            <article
              key={step.title}
              className="yp-hover-lift rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_20px_rgba(24,86,115,0.08)]"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon size={18} />
              </div>
              <p className="text-xs font-semibold text-muted">STEP {index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}




