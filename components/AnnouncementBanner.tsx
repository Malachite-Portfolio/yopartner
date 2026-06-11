"use client";

import { Gift, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "yopartner_first_conversation_banner_dismissed";

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(window.localStorage.getItem(DISMISSED_KEY) !== "true");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="relative z-[60] bg-gradient-to-r from-[#ff3f9a] via-[#bb42ff] to-[#6d32ff] px-4 py-2.5 text-white shadow-sm">
      <div className="mx-auto flex min-h-10 w-full max-w-[1180px] items-center justify-center gap-3 pr-10 text-center sm:gap-4">
        <p className="flex min-w-0 items-center justify-center gap-2 text-sm font-semibold leading-5 sm:text-[15px]">
          <Gift size={17} className="shrink-0" />
          <span>GET FIRST CONVERSATION FREE when you sign up today!</span>
        </p>
        <Link
          href="/login?returnUrl=%2Fonboarding%2Fprofile"
          className="hidden h-8 shrink-0 items-center rounded-full bg-white px-3.5 text-xs font-semibold text-[#8a21d6] shadow-sm transition hover:bg-white/90 sm:inline-flex"
        >
          Register Now -&gt;
        </Link>
      </div>
      <Link
        href="/login?returnUrl=%2Fonboarding%2Fprofile"
        className="mx-auto mt-2 flex h-8 w-fit items-center rounded-full bg-white px-3.5 text-xs font-semibold text-[#8a21d6] shadow-sm sm:hidden"
      >
        Register Now -&gt;
      </Link>
      <button
        type="button"
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-white/15"
        onClick={() => {
          window.localStorage.setItem(DISMISSED_KEY, "true");
          setVisible(false);
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
