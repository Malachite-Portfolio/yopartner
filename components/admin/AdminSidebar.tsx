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
  UserCheck,
  UserSquare2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_LOGIN_KEY } from "@/lib/adminData";
import { clearClientDemoAdminSession } from "@/lib/clientDemoData";

type AdminSidebarProps = {
  onNavigate?: () => void;
  onClose?: () => void;
};

const links = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Applications", href: "/admin/applications", icon: FileText },
  { label: "Companions", href: "/admin/companions", icon: UserSquare2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Sessions", href: "/admin/sessions", icon: MonitorPlay },
  { label: "Bookings", href: "/admin/bookings", icon: BookOpenCheck },
  { label: "Wallet", href: "/admin/wallet", icon: CreditCard },
  { label: "Payouts", href: "/admin/payouts", icon: Receipt },
  { label: "Reviews", href: "/admin/reviews", icon: BadgeCheck },
  { label: "Verification", href: "/admin/verification", icon: UserCheck },
  { label: "Support", href: "/admin/support", icon: CircleHelp },
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
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_LOGIN_KEY, "false");
    }
    clearClientDemoAdminSession();
    router.replace("/admin/login");
  };

  return (
    <aside className="flex h-full w-[286px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-[72px] items-center justify-between border-b border-slate-200 px-5">
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
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-gradient-to-r from-[#2563eb] to-[#0891b2] font-semibold text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
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
