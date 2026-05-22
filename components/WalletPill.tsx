"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getWallet } from "@/lib/api/wallet";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getUserAuthState, subscribeUserAuthState } from "@/lib/auth/userAuth";
import { formatINR, getWalletBalance, subscribeWalletUpdates } from "@/lib/wallet";

type WalletPillProps = {
  className: string;
  iconSize?: number;
  iconClassName?: string;
  onClick?: () => void;
};

export function WalletPill({ className, iconSize = 15, iconClassName, onClick }: WalletPillProps) {
  const [balance, setBalance] = useState(() =>
    IS_PRODUCTION_READY_MODE ? 0 : typeof window !== "undefined" ? getWalletBalance() : 0,
  );
  const [loggedIn, setLoggedIn] = useState(() => (typeof window !== "undefined" ? getUserAuthState().loggedIn : false));

  useEffect(() => {
    if (IS_PRODUCTION_READY_MODE) {
      return subscribeUserAuthState((state) => {
        setLoggedIn(state.loggedIn);
        if (!state.loggedIn) {
          setBalance(0);
          return;
        }
        void (async () => {
          const response = await getWallet();
          if (response.data) {
            setBalance(response.data.balance);
          }
        })();
      });
    }

    const sync = () => {
      setBalance(getWalletBalance());
    };

    sync();
    return subscribeWalletUpdates(sync);
  }, []);

  return (
    <Link href="/wallet" className={className} onClick={onClick}>
      <Wallet size={iconSize} className={iconClassName} />
      <span className="min-w-0 truncate">{loggedIn ? formatINR(balance) : formatINR(0)}</span>
    </Link>
  );
}
