"use client";

import { useEffect, useState } from "react";
import { getCompanionStats } from "@/lib/api/companions";

type CountState =
  | { status: "loading"; value: null }
  | { status: "ready"; value: number }
  | { status: "error"; value: null };

export function ActiveCompanionsCount() {
  const [count, setCount] = useState<CountState>({ status: "loading", value: null });

  useEffect(() => {
    let active = true;

    const load = async () => {
      const response = await getCompanionStats();
      if (!active) return;

      if (response.error || !response.data) {
        setCount({ status: "error", value: null });
        return;
      }

      setCount({ status: "ready", value: Math.max(0, Math.floor(response.data.totalActiveCompanions)) });
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (count.status === "loading") {
    return <p className="text-[15px] font-semibold text-[#003e38]">Loading companions...</p>;
  }

  if (count.status === "error") {
    return <p className="text-[15px] font-semibold text-[#003e38]">Verified companions</p>;
  }

  return (
    <p className="text-[15px] font-semibold text-[#003e38]">
      {count.value.toLocaleString("en-IN")} Active Companions
    </p>
  );
}
