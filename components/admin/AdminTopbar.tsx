"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

type AdminTopbarProps = {
  onMenuOpen: () => void;
};

const titleByPath: Record<string, string> = {
  "/admin": "Operations overview",
  "/admin/applications": "Partner review queue",
  "/admin/companions": "Active partners",
  "/admin/users": "Members",
  "/admin/sessions": "Conversations",
  "/admin/bookings": "Bookings",
  "/admin/wallet": "Wallet Ops",
  "/admin/payouts": "Payouts",
  "/admin/reviews": "Reviews",
  "/admin/verification": "KYC Review",
  "/admin/support": "Support inbox",
  "/admin/media": "Media",
  "/admin/client-diaries": "Client Diaries",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
};

function getTitle(pathname: string) {
  return titleByPath[pathname] ?? "Admin Console";
}

export function AdminTopbar({ onMenuOpen }: AdminTopbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#dceae5] bg-[#fffdf8]/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
          onClick={onMenuOpen}
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{getTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative hidden md:block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search operations..."
            className="h-10 w-[220px] rounded-full border border-[#dceae5] bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#0f766e]"
          />
        </label>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dceae5] bg-white text-slate-700"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dceae5] bg-white px-2.5 text-sm font-semibold text-slate-700"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0f766e] text-xs font-bold text-white">
            A
          </span>
          <span className="hidden sm:inline">Admin</span>
        </button>
      </div>
    </header>
  );
}
