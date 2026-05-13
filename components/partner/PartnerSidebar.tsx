"use client";

import {
  CalendarCheck2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutPartnerAuthSession } from "@/lib/auth/logout";

type PartnerSidebarProps = {
  onNavigate?: () => void;
  onClose?: () => void;
};

const links = [
  { label: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
  { label: "Chats", href: "/partner/chats", icon: MessageCircle },
  { label: "Bookings", href: "/partner/bookings", icon: CalendarCheck2 },
  { label: "Earnings", href: "/partner/earnings", icon: CreditCard },
  { label: "Profile", href: "/partner/profile", icon: User },
  { label: "Settings", href: "/partner/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PartnerSidebar({ onNavigate, onClose }: PartnerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutPartnerAuthSession();
    router.replace("/partner/login");
  };

  return (
    <aside className="flex h-full w-[272px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-[72px] items-center justify-between border-b border-slate-200 px-4">
        <Link href="/partner/dashboard" className="inline-flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-10 w-[118px] object-contain" />
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Close partner sidebar"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        YoPartner Companion
      </p>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#0ea5a6] font-semibold text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon size={17} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
