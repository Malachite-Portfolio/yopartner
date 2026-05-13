import { Quote } from "lucide-react";
import { testimonials } from "@/lib/data";

export function Testimonials() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Lives touched by connection
      </h2>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.name}
            className="yp-hover-lift rounded-2xl border border-line bg-surface p-6 shadow-[0_6px_18px_rgba(24,86,115,0.08)]"
          >
            <Quote size={18} className="text-brand" />
            <p className="mt-4 text-sm leading-7 text-muted">{testimonial.quote}</p>
            <div className="mt-5">
              <p className="font-semibold text-foreground">{testimonial.name}</p>
              <p className="text-sm text-muted">{testimonial.city}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}




