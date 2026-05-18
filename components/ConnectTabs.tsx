import { Search } from "lucide-react";
import Link from "next/link";

export type ConnectServiceTab = "Chat" | "Voice Call" | "Video Call";

const tabs: ConnectServiceTab[] = ["Chat", "Voice Call", "Video Call"];
const tabLabels: Record<ConnectServiceTab, string> = {
  Chat: "Talk",
  "Voice Call": "Audio",
  "Video Call": "Video",
};

type ConnectTabsProps = {
  selectedTab: ConnectServiceTab;
  onTabChange: (tab: ConnectServiceTab) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
};

export function ConnectTabs({ selectedTab, onTabChange, searchTerm, onSearchTermChange }: ConnectTabsProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#dceae5] bg-[#fffdf8] px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <div className="-mx-4 flex overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`h-11 shrink-0 rounded-full px-5 text-[15px] font-semibold transition ${
              selectedTab === tab
                ? "bg-[#0f766e] text-white"
                : "border border-[#dceae5] bg-white text-slate-900 hover:bg-[#eef8f5]"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
        <Link
          href="/home-visit"
          className="inline-flex h-11 shrink-0 items-center rounded-full border border-orange-200 bg-[#fff7ed] px-5 text-[15px] font-semibold text-orange-700"
        >
          Home Visit
        </Link>
        </div>
      </div>

      <label className="relative block w-full lg:w-[340px]">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by language, mood, or listener style"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[#dceae5] bg-white pl-10 pr-3 text-[15px] outline-none transition focus:border-[#0f766e]"
        />
      </label>
    </div>
  );
}
