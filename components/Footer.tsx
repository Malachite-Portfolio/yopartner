"use client";

import { Globe, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const companyLinks = [
  { label: "Talk Now", href: "/connect-now" },
  { label: "About Us", href: "/about" },
  { label: "Become a Companion", href: "/partner" },
];

const serviceLinks = [
  { label: "Find Support", href: "/connect-now" },
  { label: "Home Visit", href: "/home-visit" },
  { label: "Media", href: "/media" },
  { label: "Client Diaries", href: "/client-diaries" },
];

const supportLinks = [
  { label: "Support", href: "/support" },
  { label: "Balance", href: "/wallet" },
  { label: "My Conversations", href: "/bookings" },
  { label: "Login", href: "/login" },
];

export function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/dev-tools") ||
    pathname.startsWith("/connect-now") ||
    pathname.startsWith("/faqs") ||
    pathname.startsWith("/home-visit") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/call") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/otp") ||
    pathname.startsWith("/bookings")
  ) {
    return null;
  }

  if (isHome) {
    const homeColumns = [
      {
        title: "Platform",
        links: [
          { label: "How it Works", href: "/how-it-works" },
          { label: "Safety Guidelines", href: "/trust-safety" },
          { label: "Help Center", href: "/support" },
        ],
      },
      {
        title: "Connect",
        links: [
          { label: "Support", href: "/support" },
          { label: "Media", href: "/media" },
          { label: "Client Diaries", href: "/client-diaries" },
        ],
      },
    ];

    return (
      <footer className="border-t border-[#d9e8e1] bg-[#eaf5f3] text-[#1b3c37]">
        <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_1.65fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo.png" alt="YoPartner" className="h-6 w-6 object-contain" />
                <span className="text-[22px] font-semibold text-[#0f2f2c]">YoPartner</span>
              </Link>
              <p className="mt-4 max-w-[300px] text-[13px] leading-6 text-[#58706a]">
                Your safe space for emotional connection and authentic platonic support.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#244b45]">{homeColumns[0].title}</p>
                <ul className="mt-3 space-y-2 text-[13px] text-[#4c6460]">
                  {homeColumns[0].links.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="transition hover:text-[#00433d]">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#244b45]">Legal</p>
                <ul className="mt-3 space-y-2 text-[13px] text-[#4c6460]">
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#244b45]">{homeColumns[1].title}</p>
                <ul className="mt-3 space-y-2 text-[13px] text-[#4c6460]">
                  {homeColumns[1].links.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="transition hover:text-[#00433d]">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-[#c8ddd3] pt-6 text-[11px] text-[#5a7069] sm:flex-row sm:items-center sm:justify-between">
            <p>(c) {new Date().getFullYear()} YoPartner. Your safe space for connection.</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe4d7] bg-white/70">
                <Globe size={15} />
              </span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe4d7] bg-white/70">
                <MessageCircle size={15} />
              </span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe4d7] bg-white/70">
                <ShieldCheck size={15} />
              </span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[var(--footer-bg)] text-[#e7f6f8]">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 sm:p-8">
          <p className="text-sm uppercase text-[#9ee9e1]">Join our network</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-2xl font-semibold">Use your empathy to help people feel heard</h3>
            <Link
              href="/partner"
              className="yp-light-pill-on-dark rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0f766e] transition hover:bg-[#eef8f5]"
            >
              Apply as a companion
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex h-[56px] w-[150px] items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-14 w-auto object-contain" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-7 text-[#b7d8de]">
              Safe, verified, strictly platonic companionship for calm conversations and everyday emotional support.
            </p>
            <p className="mt-3 text-sm text-[#b7d8de]">yopartner.com | yopartner.in</p>
          </div>

          <div>
            <p className="font-semibold text-white">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-[#b7d8de]">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-[#b7d8de]">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white">Support</p>
            <ul className="mt-3 space-y-2 text-sm text-[#b7d8de]">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6">
          <p className="text-sm text-[#b7d8de]">Copyright (c) {new Date().getFullYear()} YoPartner. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10">
              <Globe size={15} />
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10">
              <MessageCircle size={15} />
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10">
              <ShieldCheck size={15} />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

