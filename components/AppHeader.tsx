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
  { label: "How it Works", href: "/how-it-works" },
  { label: "Safety", href: "/trust-safety" },
  { label: "Become a Companion", href: "/partner" },
  { label: "Support", href: "/support" },
];

const homeNavItems = [
  { label: "Talk Now", href: "/connect-now" },
  { label: "Home Visit", href: "/home-visit" },
  { label: "Safety", href: "/trust-safety" },
  { label: "Become a Companion", href: "/partner" },
  { label: "Support", href: "/support" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const activeNavItems = isHome ? homeNavItems : navItems;
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

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/dev-tools") ||
    pathname.startsWith("/connect-now") ||
    pathname.startsWith("/home-visit") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/call") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/otp")
  ) {
    return null;
  }

  return (
    <header
      className={
        isHome
          ? "fixed inset-x-3 top-3 z-50 h-[74px] rounded-full border border-white/70 bg-white/58 shadow-[0_16px_42px_rgba(45,74,62,0.12)] backdrop-blur-xl sm:inset-x-6 lg:inset-x-8 lg:h-20"
          : "sticky top-0 z-50 h-[72px] border-b border-[#dceae5] bg-[#fffdf8]/95 backdrop-blur"
      }
    >
      <div className={`mx-auto flex h-full w-full items-center justify-between px-4 lg:px-8 ${isHome ? "max-w-7xl" : "max-w-[1600px]"}`}>
        <Link href="/" className="inline-flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className={isHome ? "h-auto max-h-10 w-[104px] object-contain sm:w-[118px]" : "h-auto max-h-12 w-[130px] object-contain"} />
          {isHome ? <span className="hidden text-base font-semibold text-[#123f30] sm:inline">YoPartner</span> : null}
        </Link>

        <nav className={`hidden items-center text-[15px] lg:flex ${isHome ? "gap-5 text-[#365d4b]" : "gap-7 text-slate-600"}`}>
          {activeNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`transition hover:text-[#0f766e] ${active ? `font-semibold ${isHome ? "text-[#123f30]" : "text-slate-900"}` : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
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
                triggerClassName="inline-flex h-10 items-center gap-2 rounded-full border border-[#dceae5] bg-white px-2.5 text-[14px] font-semibold text-slate-700 transition hover:border-[#0f766e]/40 hover:bg-[#eef8f5]"
              />
            </>
          ) : (
            <Link
              href="/login"
                className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white shadow-sm ${
                  isHome ? "bg-[#123f30] hover:bg-[#0d3226]" : "bg-[#0f766e] hover:bg-[#115e59]"
                }`}
            >
              <LogIn size={15} />
              {isHome ? "Get Started" : "Talk to someone"}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {!authReady ? (
            <div className="h-9 w-[98px] rounded-full border border-slate-200 bg-white/70" />
          ) : loggedIn ? (
            <WalletPill
              className="inline-flex h-9 max-w-[120px] min-w-0 items-center gap-1 overflow-hidden rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
              iconSize={14}
              iconClassName="text-[#2563EB]"
            />
          ) : (
            <Link
              href="/login"
              className={`inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold text-white ${
                isHome ? "bg-[#123f30]" : "bg-gradient-to-r from-[#2563EB] to-[#00A6B2]"
              }`}
            >
              <LogIn size={13} />
              {isHome ? "Get Started" : "Login"}
            </Link>
          )}

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e7dd] bg-white/80 text-slate-700"
            aria-label="Toggle menu"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className={`border-t px-4 py-4 lg:hidden ${isHome ? "mt-2 rounded-3xl border-white/70 bg-white/90 shadow-xl backdrop-blur" : "border-slate-200 bg-white"}`}>
          <nav className="space-y-2 text-sm">
            {activeNavItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 transition ${
                    active ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
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
                  href="/bookings"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                My Conversations
                </Link>
                <Link
                  href="/wallet"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Balance
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
                className="col-span-2 inline-flex items-center justify-center rounded-xl bg-[#0f766e] px-3 py-2 text-center text-sm font-medium text-white"
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

