"use client";

import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  CreditCard,
  HeartHandshake,
  HelpCircle,
  Home,
  LockKeyhole,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Talk Now", href: "/connect-now" },
  { label: "Home Visit", href: "/home-visit" },
  { label: "Safety", href: "/trust-safety" },
  { label: "Become a Partner", href: "/partner" },
];

const faqCategories = [
  {
    title: "General",
    icon: HelpCircle,
    tint: "bg-[#e6f4f2] text-[#00433d]",
    questions: [
      {
        question: "What is YoPartner?",
        answer:
          "YoPartner is a safety-first human connection platform where verified partners offer meaningful conversations, emotional support, and trusted interactions through chat, audio, video, and approved in-person formats.",
      },
      {
        question: "Is YoPartner a dating platform?",
        answer:
          "No. YoPartner is built for respectful, platonic human connection. Every interaction is guided by clear safety standards, consent, privacy, and platform rules.",
      },
      {
        question: "Who can use YoPartner?",
        answer:
          "Adults who want safe, verified, human support can use YoPartner. The platform is designed for people who value privacy, respectful boundaries, and calm communication.",
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
          "Create an account, choose a verified partner, select chat, audio, or video, and confirm your wallet balance. Once the request is accepted, your session opens securely inside YoPartner.",
      },
      {
        question: "Can I choose the type of support I need?",
        answer:
          "Yes. You can browse by services, availability, language, and session mode so the experience feels comfortable and relevant to you.",
      },
      {
        question: "Do I need to install an app?",
        answer:
          "YoPartner works in the browser on supported devices. For the best video-call experience, use an updated browser and allow camera and microphone permissions.",
      },
    ],
  },
  {
    title: "Safety & Privacy",
    icon: ShieldCheck,
    tint: "bg-[#e9f8ef] text-[#047857]",
    questions: [
      {
        question: "How does YoPartner keep interactions safe?",
        answer:
          "YoPartner uses partner verification, platform guidelines, session controls, wallet-based payments, reporting tools, and manual review processes to keep interactions respectful and safety-led.",
      },
      {
        question: "Is my personal information private?",
        answer:
          "Yes. YoPartner limits what is shared publicly, protects account information, and does not expose private verification documents to users or partners.",
      },
      {
        question: "Can I end a session if I feel uncomfortable?",
        answer:
          "Yes. You can end a session at any time. Safety and personal comfort come first, and support options are available if you need help.",
      },
      {
        question: "Are video calls recorded?",
        answer:
          "YoPartner live video calls are designed for real-time interaction. Frames are not stored by the beauty/enhance filter or processed on a server.",
      },
    ],
  },
  {
    title: "For Partners",
    icon: UserCheck,
    tint: "bg-[#e8f3ff] text-[#2563eb]",
    questions: [
      {
        question: "How can I become a verified partner?",
        answer:
          "Apply through the partner onboarding flow, complete the required details, submit verification information, and wait for the YoPartner review team to approve your profile.",
      },
      {
        question: "What does verification include?",
        answer:
          "Verification may include identity review, profile review, safety guideline acknowledgement, and additional checks before a partner can offer sessions.",
      },
      {
        question: "Can partners choose services they offer?",
        answer:
          "Partners can select eligible services during onboarding. Some formats, such as Home Visit, require extra review and platform approval.",
      },
    ],
  },
  {
    title: "Payments & Billing",
    icon: CreditCard,
    tint: "bg-[#fff4df] text-[#a45413]",
    questions: [
      {
        question: "How are sessions priced?",
        answer:
          "Session prices are shown before you start. Chat, audio, and video are usually priced per minute, while approved Home Visit sessions may use a separate booking format.",
      },
      {
        question: "How do wallet payments work?",
        answer:
          "Add money to your YoPartner wallet, choose a session, and the platform checks your balance before the session starts. If your balance is low, you will be guided to recharge.",
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "Available payment methods may include supported online payment options shown during recharge. Payment availability can vary by device, bank, and provider.",
      },
    ],
  },
  {
    title: "Video Calls",
    icon: Video,
    tint: "bg-[#eef2ff] text-[#4f46e5]",
    questions: [
      {
        question: "How do video calls work?",
        answer:
          "Video calls run inside YoPartner using secure live-call technology. Allow camera and microphone access, keep your browser updated, and remain inside the call screen until the session ends.",
      },
      {
        question: "Can I mute or turn off my camera?",
        answer:
          "Yes. Video calls include controls for microphone, camera, speaker, camera switching, and ending the session.",
      },
      {
        question: "What happens if my connection is unstable?",
        answer:
          "YoPartner keeps the call experience lightweight and will continue to prioritize call stability. If the connection drops, rejoin from the active session when available.",
      },
    ],
  },
  {
    title: "Home Visits",
    icon: Home,
    tint: "bg-[#f3eeff] text-[#6d28d9]",
    questions: [
      {
        question: "Are Home Visits available to everyone?",
        answer:
          "Home Visit availability depends on location, partner approval, safety review, and platform rules. It is only enabled for verified partners approved for this format.",
      },
      {
        question: "How is Home Visit safety handled?",
        answer:
          "Home Visits require additional checks, clear boundaries, platform approval, and support oversight. YoPartner may limit or decline requests that do not meet safety standards.",
      },
      {
        question: "Can I book a Home Visit instantly?",
        answer:
          "Some Home Visit requests may require manual review. If instant booking is not available, the platform will guide you to support or the approved request flow.",
      },
    ],
  },
];

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
      <header className="sticky top-0 z-40 border-b border-[#dce8e5]/80 bg-white/78 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="YoPartner home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="YoPartner" className="h-9 w-auto object-contain" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-[#52615f] lg:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-[#00433d]">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#00433d] px-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,67,61,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0f766e]"
          >
            Get Started
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#fbf8ff_0%,#eef9f7_48%,#edf8ff_100%)]">
        <div className="absolute left-1/2 top-8 -z-10 h-56 w-56 -translate-x-1/2 rounded-full bg-[#8b5cf6]/18 blur-3xl" />
        <div className="absolute right-[12%] top-24 -z-10 h-48 w-48 rounded-full bg-[#0f766e]/12 blur-3xl" />
        <div className="mx-auto flex min-h-[430px] max-w-4xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#b7dfdc] bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#0f766e] shadow-sm backdrop-blur">
            <BadgeCheck size={14} />
            Help Center
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
            How can we <span className="text-[#007065]">help you</span> today?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#5d6b68] sm:text-lg">
            Find answers about safety, sessions, payments, privacy, and how YoPartner works.
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
              <p className="mt-2 text-sm text-[#667572]">Try searching for safety, payments, video calls, or verification.</p>
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
                              <p className="px-5 pb-5 text-sm leading-7 text-[#5f6d6a] sm:px-6">{item.answer}</p>
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
            <h2 className="mt-5 text-3xl font-bold tracking-tight">Still have questions?</h2>
            <p className="mt-3 text-sm leading-7 text-white/86 sm:text-base">Our support team is here to help you 24/7.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/support"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#00433d] shadow-lg transition hover:-translate-y-0.5 sm:w-auto"
              >
                <HeartHandshake size={17} />
                Contact Support
              </Link>
              <Link
                href="/connect-now"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/45 bg-white/8 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/14 sm:w-auto"
              >
                <MessageCircle size={17} />
                Talk Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dde7e5] bg-[#eef2ff]/55">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.25fr_2fr] lg:px-8">
          <div>
            <Link href="/" className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="YoPartner" className="h-9 w-auto object-contain" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-[#61706d]">
              Verified partners for meaningful human connection.
            </p>
            <div className="mt-5 flex gap-2">
              {[LockKeyhole, MessageCircle, ShieldCheck].map((Icon, index) => (
                <span
                  key={index}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5e1df] bg-white text-[#0f766e]"
                >
                  <Icon size={15} />
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-sm font-bold text-[#14201e]">Platform</p>
              <ul className="mt-3 space-y-2 text-sm text-[#61706d]">
                <li><Link href="/how-it-works" className="hover:text-[#00433d]">How it Works</Link></li>
                <li><Link href="/trust-safety" className="hover:text-[#00433d]">Safety Guidelines</Link></li>
                <li><Link href="/faqs" className="hover:text-[#00433d]">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-[#14201e]">Legal</p>
              <ul className="mt-3 space-y-2 text-sm text-[#61706d]">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li><Link href="/support" className="hover:text-[#00433d]">Support</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-[#14201e]">Connect</p>
              <ul className="mt-3 space-y-2 text-sm text-[#61706d]">
                <li><Link href="/connect-now" className="hover:text-[#00433d]">Talk Now</Link></li>
                <li><Link href="/home-visit" className="hover:text-[#00433d]">Home Visit</Link></li>
                <li><Link href="/partner" className="hover:text-[#00433d]">Become a Partner</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-[#dce5e3]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-[#61706d] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>Copyright (c) {new Date().getFullYear()} YoPartner. All rights reserved.</p>
            <div className="flex gap-5">
              <span>Safety</span>
              <span>Privacy</span>
              <span>Trust</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
