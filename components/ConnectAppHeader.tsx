"use client";

import { LogIn, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileMenu } from "@/components/ProfileMenu";
import { WalletPill } from "@/components/WalletPill";
import { logoutUserAuthSession } from "@/lib/auth/logout";
import { getUserAuthState, restoreUserAuthSessionFromFirebase, subscribeUserAuthState } from "@/lib/auth/userAuth";

const navItems = [
  { label: "Talk Now", href: "/connect-now" },
  { label: "Home Visit", href: "/home-visit" },
  { label: "Safety", href: "/trust-safety" },
  { label: "Stories", href: "/client-diaries" },
  { label: "Support", href: "/support" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ConnectAppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(() => (typeof window !== "undefined" ? getUserAuthState().loggedIn : false));
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (!active) return;
      setLoggedIn(getUserAuthState().loggedIn);
      setAuthReady(true);
    };
    const unsubscribe = subscribeUserAuthState(sync);
    void restoreUserAuthSessionFromFirebase(false).then(sync);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[#dceae5] bg-[#fffdf8]/95 backdrop-blur sm:h-[72px]">
      <div className="mx-auto flex h-full w-full max-w-[1500px] items-center justify-between px-4 lg:px-8">
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-10 w-[112px] object-contain sm:max-h-12 sm:w-[130px]" />
        </Link>

        <nav className="hidden items-center gap-7 text-[15px] text-slate-600 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`transition hover:text-[#0f766e] ${isActive(pathname, item.href) ? "font-semibold text-slate-900" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {!authReady ? (
            <div className="h-10 w-[170px] rounded-full border border-[#dceae5] bg-white/70" />
          ) : loggedIn ? (
            <>
              <WalletPill
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#dceae5] bg-white px-3 text-[14px] font-semibold text-slate-700 transition hover:border-[#0f766e]/35 hover:bg-[#eef8f5]"
                iconSize={15}
                iconClassName="text-[#0f766e]"
              />
              <ProfileMenu
                triggerClassName="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 text-[14px] font-semibold text-slate-700 transition hover:border-[#9B5DE5]/40 hover:bg-[#f5f3ff]"
              />
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#115e59]"
            >
              <LogIn size={15} />
              Talk to someone
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          {!authReady ? (
            <div className="h-9 w-[98px] rounded-full border border-slate-200 bg-white/70" />
          ) : loggedIn ? (
            <WalletPill
              className="inline-flex h-9 max-w-[120px] min-w-0 items-center gap-1 overflow-hidden rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
              iconSize={14}
              iconClassName="text-[#0f766e]"
            />
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-1 rounded-full bg-[#0f766e] px-3 text-xs font-semibold text-white transition hover:bg-[#115e59]"
            >
              <LogIn size={13} />
              Talk
            </Link>
          )}

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            aria-label="Toggle menu"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 xl:hidden">
          <nav className="space-y-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-xl px-3 py-2 transition ${
                  isActive(pathname, item.href) ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {!authReady ? (
              <div className="col-span-2 h-10 rounded-xl border border-slate-200 bg-slate-50" />
            ) : loggedIn ? (
              <>
                <Link
                  href="/my-profile"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  href="/wallet"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Balance
                </Link>
                <Link
                  href="/bookings"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  My Conversations
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-center text-sm font-medium text-red-600"
                  onClick={async () => {
                    await logoutUserAuthSession();
                    setOpen(false);
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="col-span-2 inline-flex items-center justify-center rounded-xl bg-[#0f766e] px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-[#115e59]"
                onClick={() => setOpen(false)}
              >
                Talk to someone
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
