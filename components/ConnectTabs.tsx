import { Search } from "lucide-react";

export type ConnectServiceTab = "Chat" | "Voice Call" | "Video Call";

const tabs: ConnectServiceTab[] = ["Chat", "Voice Call", "Video Call"];

type ConnectTabsProps = {
  selectedTab: ConnectServiceTab;
  onTabChange: (tab: ConnectServiceTab) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
};

export function ConnectTabs({ selectedTab, onTabChange, searchTerm, onSearchTermChange }: ConnectTabsProps) {
  return (
    <div className="flex min-h-[78px] flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-0">
      <div className="flex flex-wrap items-center gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`h-11 rounded-full px-6 text-[15px] font-semibold transition ${
              selectedTab === tab
                ? "bg-[#2563EB] text-white"
                : "border border-[#dfe5ec] bg-white text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <label className="relative block w-full lg:w-[312px]">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search companions, styles, or categories"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="h-12 w-full rounded-[10px] border border-[#dfe5ec] bg-white pl-10 pr-3 text-[15px] outline-none transition focus:border-[#2563EB]"
        />
      </label>
    </div>
  );
}
