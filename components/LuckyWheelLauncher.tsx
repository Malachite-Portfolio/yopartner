"use client";

import { Gift, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LuckyWheelModal } from "@/components/LuckyWheelModal";

const HIDDEN_ROUTE_PREFIXES = ["/admin", "/partner", "/chat", "/call", "/login", "/otp", "/sign-in"];

export function LuckyWheelLauncher() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const shouldHide = HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (shouldHide) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-white/80 bg-[#073f39] px-3.5 py-2.5 text-left text-white shadow-[0_18px_42px_rgba(7,63,57,0.34)] transition hover:-translate-y-0.5 hover:bg-[#0f766e] sm:bottom-6 sm:right-6 sm:px-4"
        aria-label="Open Spin and Win lucky wheel"
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#facc15] text-[#78350f] shadow-[0_0_22px_rgba(250,204,21,0.5)]">
          <Gift size={19} />
          <Sparkles size={12} className="absolute -right-1 -top-1 text-white drop-shadow" />
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#a7f3d0]">Lucky Wheel</span>
          <span className="block text-sm font-semibold">Spin & Win</span>
        </span>
      </button>

      {isOpen ? <LuckyWheelModal onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}
