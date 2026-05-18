"use client";

import { CalendarDays, ChevronDown, LogOut, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { USER_FIREBASE_PHONE_KEY } from "@/lib/auth/firebasePhoneAuth";
import { logoutUserAuthSession } from "@/lib/auth/logout";
import { getWallet } from "@/lib/api/wallet";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getDemoPhone, subscribeDemoAuthUpdates } from "@/lib/demoAuth";
import { formatINR, getWalletBalance, subscribeWalletUpdates } from "@/lib/wallet";

type ProfileMenuProps = {
  triggerClassName: string;
  avatarClassName?: string;
};

export function ProfileMenu({ triggerClassName, avatarClassName }: ProfileMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(() => (typeof window !== "undefined" ? getWalletBalance() : 0));
  const [phone, setPhone] = useState(() => {
    if (typeof window === "undefined") return "+919958719363";
    if (IS_PRODUCTION_READY_MODE) {
      return window.localStorage.getItem(USER_FIREBASE_PHONE_KEY) || "+91**********";
    }
    return getDemoPhone();
  });
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (IS_PRODUCTION_READY_MODE) {
      void (async () => {
        const response = await getWallet();
        if (response.data) {
          setBalance(response.data.balance);
        }
      })();
      return () => undefined;
    }
    return subscribeWalletUpdates(() => setBalance(getWalletBalance()));
  }, []);

  useEffect(() => {
    if (IS_PRODUCTION_READY_MODE) {
      return () => undefined;
    }
    return subscribeDemoAuthUpdates(() => setPhone(getDemoPhone()));
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", onPointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button type="button" className={triggerClassName} onClick={() => setOpen((prev) => !prev)}>
        <span
          className={
            avatarClassName ??
            "inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-purple text-[11px] font-bold text-white"
          }
        >
          *
        </span>
        <span>***363</span>
        <ChevronDown size={14} className="text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">***363</p>
            <p className="text-xs text-slate-500">{phone}</p>
          </div>

          <div className="p-2">
            <Link
              href="/my-profile"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <UserRound size={16} className="text-slate-500" />
              My Profile
            </Link>

            <Link
              href="/wallet"
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <span className="inline-flex items-center gap-2">
                <Wallet size={16} className="text-slate-500" />
                Balance
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {formatINR(balance)}
              </span>
            </Link>

            <Link
              href="/bookings"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <CalendarDays size={16} className="text-slate-500" />
              My Conversations
            </Link>
          </div>

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              onClick={async () => {
                await logoutUserAuthSession();
                setOpen(false);
                if (pathname !== "/") {
                  router.push("/");
                }
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
