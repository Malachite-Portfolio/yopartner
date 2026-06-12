"use client";

import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  HeartHandshake,
  HelpCircle,
  Home,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const faqCategories = [
  {
    title: "General",
    icon: HelpCircle,
    tint: "bg-[#e6f4f2] text-[#00433d]",
    questions: [
      {
        question: "What is YoPartner?",
        answer:
          "YoPartner is India's premium companionship platform for adults. Connect with verified companions through chat, voice calls, video companionship, and approved home visit companionship.",
      },
      {
        question: "Is YoPartner a dating platform?",
        answer:
          "No. YoPartner is strictly platonic and focused on social companionship, quality conversation, and trusted human connection.",
      },
      {
        question: "Is YoPartner therapy or counseling?",
        answer:
          "No. YoPartner is not a therapy or counseling service. It provides non-clinical companionship and conversation.",
      },
    ],
  },
  {
    title: "Getting Started",
    icon: Sparkles,
    tint: "bg-[#f3eeff] text-[#7c3aed]",
    questions: [
      {
        question: "How do I start a session?",
        answer:
          "Choose a verified companion, select your format, and start now or schedule for later. Sessions run securely in-app.",
      },
      {
        question: "Which formats can I choose?",
        answer:
          "You can choose chat companionship, voice call companionship, video companionship, and approved home visit companionship.",
      },
      {
        question: "Can I filter by language and availability?",
        answer:
          "Yes. Profiles show language, service formats, and availability so you can choose the best fit quickly.",
      },
    ],
  },
  {
    title: "Safety & Privacy",
    icon: ShieldCheck,
    tint: "bg-[#e9f8ef] text-[#047857]",
    questions: [
      {
        question: "How does YoPartner keep sessions safe?",
        answer:
          "YoPartner combines profile verification, policy enforcement, reporting workflows, and support review to protect users and companions.",
      },
      {
        question: "Is my personal information private?",
        answer:
          "Yes. We use privacy-first practices and limit data exposure across user and companion experiences.",
      },
      {
        question: "Can I exit a session anytime?",
        answer:
          "Yes. You can end a session whenever you want and contact support if anything feels off.",
      },
    ],
  },
  {
    title: "Payments",
    icon: CreditCard,
    tint: "bg-[#fff4df] text-[#a45413]",
    questions: [
      {
        question: "How is pricing shown?",
        answer:
          "Pricing is shown clearly on each companion profile before you start a session.",
      },
      {
        question: "How do wallet payments work?",
        answer:
          "Recharge your wallet and pay in-app. Session payments are handled through secure platform flows.",
      },
      {
        question: "Are payment options fixed?",
        answer:
          "Available recharge options may vary by payment provider, bank, and device.",
      },
    ],
  },
  {
    title: "Home Visits",
    icon: Home,
    tint: "bg-[#f3eeff] text-[#6d28d9]",
    questions: [
      {
        question: "Are home visits available everywhere?",
        answer:
          "Home visit companionship is enabled only in approved locations and for companions with additional verification.",
      },
      {
        question: "How is home visit companionship reviewed?",
        answer:
          "Home visit sessions follow stricter safety checks, platform protocols, and support oversight.",
      },
      {
        question: "Can every request be instant?",
        answer:
          "Some requests are instant, while others may require a short manual review before confirmation.",
      },
    ],
  },
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqCategories.flatMap((category) =>
    category.questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  ),
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export default function FAQsPage() {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState("General-0");

  const filteredCategories = useMemo(() => {
    const term = normalize(query);
    if (!term) return faqCategories;

    return faqCategories
      .map((category) => ({
        ...category,
        questions: category.questions.filter((item) =>
          normalize(`${category.title} ${item.question} ${item.answer}`).includes(term),
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-[#101828]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#fbf8ff_0%,#eef9f7_48%,#edf8ff_100%)]">
        <div className="absolute left-1/2 top-8 -z-10 h-56 w-56 -translate-x-1/2 rounded-full bg-[#8b5cf6]/18 blur-3xl" />
        <div className="absolute right-[12%] top-24 -z-10 h-48 w-48 rounded-full bg-[#0f766e]/12 blur-3xl" />
        <div className="mx-auto flex min-h-[430px] max-w-4xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#b7dfdc] bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#0f766e] shadow-sm backdrop-blur">
            <BadgeCheck size={14} />
            Help Center
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
            YoPartner FAQ: <span className="text-[#007065]">Verified Companionship Answers</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#5d6b68] sm:text-lg">
            Everything you need to know about verified companions, safety, privacy, and sessions.
          </p>

          <label className="mt-9 flex h-14 w-full max-w-xl items-center gap-3 rounded-full border border-white/80 bg-white/88 px-5 text-left shadow-[0_24px_80px_rgba(31,41,55,0.08)] backdrop-blur-xl transition focus-within:border-[#0f766e]/40 focus-within:ring-4 focus-within:ring-[#0f766e]/10">
            <Search size={19} className="shrink-0 text-[#6c7a78]" />
            <span className="sr-only">Search FAQ answers</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for answers..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#8b9895]"
            />
          </label>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
        <div className="space-y-10">
          {filteredCategories.length === 0 ? (
            <div className="rounded-[28px] border border-[#e1e8e6] bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <p className="text-lg font-semibold text-[#10201e]">No answers found</p>
              <p className="mt-2 text-sm text-[#667572]">Try searching for verification, privacy, payments, or home visits.</p>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <section key={category.title} className="scroll-mt-24">
                  <div className="mb-5 flex items-center gap-3">
                    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${category.tint}`}>
                      <Icon size={20} />
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-[#121a18]">{category.title}</h2>
                  </div>

                  <div className="space-y-3">
                    {category.questions.map((item, index) => {
                      const itemKey = `${category.title}-${index}`;
                      const isOpen = openKey === itemKey;
                      return (
                        <article
                          key={item.question}
                          className={`rounded-[22px] border bg-white shadow-[0_14px_45px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(15,23,42,0.08)] ${
                            isOpen ? "border-[#b7ddd9] ring-4 ring-[#0f766e]/8" : "border-[#e3e9e7]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenKey(isOpen ? "" : itemKey)}
                            className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                          >
                            <span className="text-[15px] font-semibold leading-6 text-[#202927] sm:text-base">{item.question}</span>
                            <ChevronDown
                              size={20}
                              className={`shrink-0 text-[#0f766e] transition duration-300 ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          <div
                            className={`grid transition-all duration-300 ease-out ${
                              isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <p className="whitespace-pre-line px-5 pb-5 text-sm leading-7 text-[#5f6d6a] sm:px-6">{item.answer}</p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <section className="mt-20 overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#058477_0%,#176e8a_54%,#2d5f9f_100%)] px-6 py-14 text-center text-white shadow-[0_30px_90px_rgba(0,67,61,0.22)] sm:px-10">
          <div className="mx-auto max-w-2xl">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <MessageCircle size={23} />
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight">Need help choosing the right format?</h2>
            <p className="mt-3 text-sm leading-7 text-white/86 sm:text-base">Our support team can guide you quickly and securely.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/support"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold !text-[#00433d] shadow-lg transition hover:-translate-y-0.5 sm:w-auto"
              >
                <HeartHandshake size={17} className="text-[#00433d]" />
                Contact Support
              </Link>
              <Link
                href="/connect-now"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/45 bg-white/8 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/14 sm:w-auto"
              >
                <MessageCircle size={17} />
                Explore Companions
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
