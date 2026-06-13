"use client";

import { LogIn, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { ProfileMenu } from "@/components/ProfileMenu";
import { WalletPill } from "@/components/WalletPill";
import { logoutUserAuthSession } from "@/lib/auth/logout";
import { getUserAuthState, restoreUserAuthSessionFromFirebase, subscribeUserAuthState } from "@/lib/auth/userAuth";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Talk Now", href: "/connect-now" },
  { label: "About Us", href: "/about" },
  { label: "Safety", href: "/trust-safety" },
  { label: "Become a Companion", href: "/partner/login" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
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

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/dev-tools") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/call") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/otp") ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  return (
    <>
      <AnnouncementBanner />
      <header className="sticky top-0 z-50 h-16 border-b border-white/70 bg-[rgba(244,252,249,0.88)] shadow-[0_10px_34px_rgba(15,118,110,0.10)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff4fa3] via-[#8b5cf6] to-[#11b9a3]" />
        <div className="mx-auto flex h-full w-full max-w-[1180px] items-center justify-between gap-2 px-3 sm:px-4 lg:px-8">
          <Link
            href="/"
            className="inline-flex min-w-0 shrink items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/35"
            onClick={() => setOpen(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="YoPartner"
              className="h-9 w-auto max-w-[104px] object-contain sm:h-11 sm:max-w-none lg:h-[50px]"
            />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/80 bg-white/55 p-1.5 text-[14px] text-slate-600 shadow-[0_8px_24px_rgba(71,85,105,0.07)] lg:flex">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group relative rounded-full px-3.5 py-2 font-medium transition hover:bg-white/85 hover:text-[#0f766e] ${
                    active ? "bg-white font-semibold text-[#064e48] shadow-sm" : ""
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-[#ff4fa3] via-[#8b5cf6] to-[#11b9a3] transition ${
                      active
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {!authReady ? (
              <div className="h-10 w-[170px] rounded-full border border-white/80 bg-white/65 shadow-sm" />
            ) : loggedIn ? (
              <>
                <WalletPill
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/90 bg-white/85 px-3 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8ddd5] hover:bg-white"
                  iconSize={15}
                  iconClassName="text-[#7c3aed]"
                />
                <ProfileMenu
                  triggerClassName="inline-flex h-10 items-center gap-2 rounded-full border border-white/90 bg-white/85 px-2.5 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8ddd5] hover:bg-white"
                />
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[linear-gradient(110deg,#006b61_0%,#0f766e_58%,#7c3aed_145%)] px-5 text-sm font-semibold !text-white shadow-[0_10px_24px_rgba(15,118,110,0.24),0_0_0_1px_rgba(139,92,246,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,118,110,0.30)]"
              >
                <LogIn size={15} className="text-white" />
                Get Started
              </Link>
            )}
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-1.5 lg:hidden">
            {!authReady ? (
              <div className="hidden h-9 w-[70px] rounded-full border border-white/80 bg-white/70 min-[390px]:block" />
            ) : loggedIn ? (
              <WalletPill
                className="inline-flex h-9 max-w-[84px] min-w-0 items-center gap-1 overflow-hidden rounded-full border border-white/90 bg-white/85 px-2 text-[11px] font-semibold text-slate-700 shadow-sm min-[390px]:max-w-[104px] min-[390px]:px-2.5 min-[390px]:text-xs"
                iconSize={14}
                iconClassName="shrink-0 text-[#7c3aed]"
              />
            ) : (
              <Link
                href="/login"
                aria-label="Get Started"
                className="inline-flex h-9 items-center gap-1 rounded-full border border-[#c9e8df] bg-white/85 px-2.5 text-xs font-semibold text-[#075e56] shadow-sm min-[390px]:px-3"
              >
                <LogIn size={14} className="text-[#7c3aed]" />
                <span className="hidden min-[390px]:inline">Get Started</span>
              </Link>
            )}

            <Link
              href="/connect-now"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(105deg,#ff4fa3_-35%,#8b5cf6_25%,#0f8f82_100%)] px-2.5 text-[11px] font-bold !text-white shadow-[0_8px_18px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5 min-[390px]:px-3 min-[390px]:text-xs"
              onClick={() => setOpen(false)}
            >
              Talk Now
            </Link>

            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/85 text-[#164e49] shadow-sm hover:border-[#b8ddd5] hover:bg-white"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-white/80 bg-[rgba(249,253,252,0.97)] px-3 py-4 shadow-[0_18px_38px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-4 lg:hidden">
            <nav className="space-y-1.5 text-sm">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`block rounded-xl px-3 py-2.5 transition ${
                      active
                        ? "bg-[linear-gradient(100deg,rgba(255,79,163,0.10),rgba(139,92,246,0.10),rgba(17,185,163,0.12))] font-semibold text-[#075e56]"
                        : "text-slate-600 hover:bg-white hover:text-[#0f766e]"
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
                <div className="col-span-2 h-10 rounded-xl border border-white/80 bg-white/70" />
              ) : loggedIn ? (
                <>
                  <Link
                    href="/my-profile"
                    className="inline-flex items-center justify-center rounded-xl border border-[#d6e8e2] bg-white/75 px-3 py-2 text-center text-sm font-medium text-slate-700"
                    onClick={() => setOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/bookings"
                    className="inline-flex items-center justify-center rounded-xl border border-[#d6e8e2] bg-white/75 px-3 py-2 text-center text-sm font-medium text-slate-700"
                    onClick={() => setOpen(false)}
                  >
                    My Conversations
                  </Link>
                  <Link
                    href="/wallet?addMoney=1"
                    className="inline-flex items-center justify-center rounded-xl border border-[#d6e8e2] bg-white/75 px-3 py-2 text-center text-sm font-medium text-slate-700"
                    onClick={() => setOpen(false)}
                  >
                    Balance
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white/75 px-3 py-2 text-center text-sm font-medium text-red-600"
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
                  className="col-span-2 inline-flex items-center justify-center rounded-xl bg-[linear-gradient(105deg,#006b61,#0f766e_60%,#7c3aed_145%)] px-3 py-2.5 text-center text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.20)]"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

