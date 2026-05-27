"use client";

import { Globe, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/dev-tools") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/call") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/otp")
  ) {
    return null;
  }

  const homeColumns = [
    {
      title: "Platform",
      links: [
        { label: "How it Works", href: "/how-it-works" },
        { label: "About Us", href: "/faqs" },
        { label: "Safety Guidelines", href: "/trust-safety" },
        { label: "Help Center", href: "/faqs" },
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

