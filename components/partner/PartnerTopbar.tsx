"use client";

import { Bell, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logoutPartnerAuthSession } from "@/lib/auth/logout";
import { markPartnerPresenceOffline, sendPartnerOfflineBeacon } from "@/lib/api/partner";
import { getPartnerProfile } from "@/lib/partnerAuth";
import { defaultPartnerProfile, type PartnerProfile } from "@/lib/partnerData";

type PartnerTopbarProps = {
  onMenuOpen: () => void;
};

const titleMap: Record<string, string> = {
  "/partner/dashboard": "Overview",
  "/partner/chats": "Conversations",
  "/partner/bookings": "Requests",
  "/partner/earnings": "Earnings",
  "/partner/profile": "My Profile",
  "/partner/application-status": "Safety & KYC",
  "/partner/settings": "Settings",
};

function getTitle(pathname: string) {
  if (pathname.startsWith("/partner/chats/")) return "Chat Detail";
  return titleMap[pathname] ?? "YoPartner Companion";
}

export function PartnerTopbar({ onMenuOpen }: PartnerTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const profile = getPartnerProfile<PartnerProfile>(defaultPartnerProfile);
  const nameLabel = profile.fullName || "Companion";

  const handleLogout = async () => {
    sendPartnerOfflineBeacon();
    await markPartnerPresenceOffline();
    await logoutPartnerAuthSession();
    router.replace("/partner/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#dceae5] bg-[#fffdf8]/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
          aria-label="Open partner sidebar"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{getTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] text-xs font-bold text-white">
              {nameLabel.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{nameLabel}</span>
            <ChevronDown size={14} />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-[calc(100%+8px)] w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/partner/profile");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                View Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
