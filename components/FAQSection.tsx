"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { faqs } from "@/lib/data";

type FAQSectionProps = {
  showHeading?: boolean;
};

export function FAQSection({ showHeading = true }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {showHeading && (
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">FAQs</h2>
      )}

      <div className={`${showHeading ? "mt-8" : ""} space-y-3`}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <article key={faq.question} className="yp-hover-soft rounded-2xl border border-line bg-surface px-5 py-4">
              <button
                className="flex w-full items-center justify-between gap-4 text-left"
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="text-base font-semibold text-foreground">{faq.question}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-brand transition ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && <p className="mt-3 text-sm leading-7 text-muted">{faq.answer}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}




