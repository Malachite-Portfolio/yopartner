"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR, getWalletBalance, subscribeWalletUpdates } from "@/lib/wallet";

type WalletPillProps = {
  className: string;
  iconSize?: number;
  iconClassName?: string;
  onClick?: () => void;
};

export function WalletPill({ className, iconSize = 15, iconClassName, onClick }: WalletPillProps) {
  const [balance, setBalance] = useState(() =>
    typeof window !== "undefined" ? getWalletBalance() : 0,
  );

  useEffect(() => {
    const sync = () => {
      setBalance(getWalletBalance());
    };

    sync();
    return subscribeWalletUpdates(sync);
  }, []);

  return (
    <Link href="/wallet" className={className} onClick={onClick}>
      <Wallet size={iconSize} className={iconClassName} />
      <span className="min-w-0 truncate">{formatINR(balance)}</span>
    </Link>
  );
}
