"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

type AdminTopbarProps = {
  onMenuOpen: () => void;
};

const titleByPath: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/applications": "Applications",
  "/admin/companions": "Companions",
  "/admin/users": "Users",
  "/admin/sessions": "Sessions",
  "/admin/bookings": "Bookings",
  "/admin/wallet": "Wallet",
  "/admin/payouts": "Payouts",
  "/admin/reviews": "Reviews",
  "/admin/verification": "Verification",
  "/admin/support": "Support",
  "/admin/media": "Media",
  "/admin/client-diaries": "Client Diaries",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
};

function getTitle(pathname: string) {
  return titleByPath[pathname] ?? "Admin Panel";
}

export function AdminTopbar({ onMenuOpen }: AdminTopbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
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
            placeholder="Search admin..."
            className="h-10 w-[220px] rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#2563eb]"
          />
        </label>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] text-xs font-bold text-white">
            A
          </span>
          <span className="hidden sm:inline">Admin</span>
        </button>
      </div>
    </header>
  );
}
