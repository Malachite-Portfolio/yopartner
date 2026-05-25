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
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-4">
      <div className="inline-flex w-full max-w-[410px] items-center rounded-[26px] border border-[#a8b8c2] bg-[#edf1f4] p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`h-8 flex-1 rounded-full text-[12px] font-medium transition ${
              selectedTab === tab ? "bg-[#076e68] text-white" : "text-[#1a2a36]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <label className="relative block w-full lg:w-[360px]">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8a97]" />
        <input
          type="text"
          placeholder="Search listeners..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="h-10 w-full rounded-2xl border border-[#a8b8c2] bg-[#edf1f4] pl-9 pr-3 text-[13px] text-[#1b2a36] outline-none transition placeholder:text-[12px] placeholder:text-[#8a96a1] focus:border-[#0b736d]"
        />
      </label>
    </div>
  );
}
