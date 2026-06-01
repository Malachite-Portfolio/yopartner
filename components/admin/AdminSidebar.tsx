"use client";

import {
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CircleHelp,
  CreditCard,
  FileText,
  Image,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MonitorPlay,
  Receipt,
  Settings,
  UserSquare2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminAuthSession } from "@/lib/adminAuth";

type AdminSidebarProps = {
  onNavigate?: () => void;
  onClose?: () => void;
};

const links = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Partner Reviews", href: "/admin/applications", icon: FileText },
  { label: "Active Partners", href: "/admin/companions", icon: UserSquare2 },
  { label: "Members", href: "/admin/users", icon: Users },
  { label: "Conversations", href: "/admin/sessions", icon: MonitorPlay },
  { label: "Bookings", href: "/admin/bookings", icon: BookOpenCheck },
  { label: "Wallet Ops", href: "/admin/wallet", icon: CreditCard },
  { label: "Payouts", href: "/admin/payouts", icon: Receipt },
  { label: "Reviews", href: "/admin/reviews", icon: BadgeCheck },
  { label: "Home Visit Verification", href: "/admin/home-visit-verification", icon: CircleHelp },
  { label: "Support Inbox", href: "/admin/support", icon: CircleHelp },
  { label: "Media", href: "/admin/media", icon: Image },
  { label: "Client Diaries", href: "/admin/client-diaries", icon: BriefcaseBusiness },
  { label: "Reports", href: "/admin/reports", icon: LifeBuoy },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ onNavigate, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAdminAuthSession();
    router.replace("/admin/login");
  };

  return (
    <aside className="flex h-full w-[286px] flex-col border-r border-[#dceae5] bg-[#fffdf8]">
      <div className="flex h-[72px] items-center justify-between border-b border-[#dceae5] px-5">
        <Link href="/admin" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-10 w-[120px] object-contain" />
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-[#0f766e] font-semibold text-white shadow-sm shadow-teal-900/10"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#dceae5] p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
