import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { useMemo, useState } from "react";

export type ConnectCategoryGroup = {
  title: string;
  items: string[];
};

export const connectCategoryGroups: ConnectCategoryGroup[] = [
  {
    title: "Communication & Emotional Support",
    items: [
      "Active listening",
      "Empathetic conversation",
      "Motivational talk",
      "Stress counseling (non-clinical)",
      "Break-up support",
    ],
  },
  {
    title: "Arts, Music & Creative Expression",
    items: ["Poetry recitation", "Creative writing coach", "Music discussion", "Art companion"],
  },
  {
    title: "Social & Cultural Engagement",
    items: ["Cultural conversations", "Social confidence support", "Event companion"],
  },
  {
    title: "Political & Social Discussions",
    items: ["Current affairs discussion", "Policy and society conversations", "Civic awareness talks"],
  },
  {
    title: "Reading & Knowledge Sharing",
    items: ["Book discussions", "Reading partner", "General knowledge conversations"],
  },
  {
    title: "Education & Skill Development",
    items: ["Conversational English practice", "Interview communication prep", "Study motivation support"],
  },
];

type ConnectFiltersProps = {
  mobile?: boolean;
  selectedAvailability: "all" | "online";
  selectedCategory: string | null;
  onAvailabilityChange: (value: "all" | "online") => void;
  onCategoryChange: (value: string) => void;
  onClearAll: () => void;
};

function FilterCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
        checked ? "border-[#0b736d] bg-[#0b736d]/10" : "border-[#6d7a85]"
      }`}
    >
      {checked ? <Check size={12} className="text-[#0b736d]" /> : null}
    </span>
  );
}

export function ConnectFilters({
  mobile = false,
  selectedAvailability,
  selectedCategory,
  onAvailabilityChange,
  onCategoryChange,
  onClearAll,
}: ConnectFiltersProps) {
  const [expanded, setExpanded] = useState<string[]>([connectCategoryGroups[0].title]);

  const expandedLookup = useMemo(() => new Set(expanded), [expanded]);

  const toggle = (title: string) => {
    setExpanded((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  };

  const expandAll = () => {
    setExpanded(connectCategoryGroups.map((group) => group.title));
  };

  const collapseAll = () => {
    setExpanded([]);
  };

  return (
    <div className={mobile ? "rounded-[20px] border border-[#c8d2d8] bg-[#eef2f5] p-4" : "px-4 py-4.5"}>
      <div className="flex items-center justify-between">
        <h2 className={`${mobile ? "text-[22px]" : "text-3xl"} font-semibold leading-none text-[#0e2230]`}>Filters</h2>
        <button
          type="button"
          onClick={onClearAll}
          className={`${mobile ? "text-sm" : "text-sm"} font-medium text-[#0b736d] outline-none focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0b736d]/40`}
        >
          Clear All
        </button>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#1b2834]">Availability</p>
        <div className="mt-2 grid grid-cols-2 rounded-xl bg-[#e1e6f0] p-1">
          <button
            type="button"
            onClick={() => onAvailabilityChange("all")}
            className={`h-[34px] rounded-lg px-2 text-[13px] font-medium ${
              selectedAvailability === "all" ? "bg-[#076e68] text-white" : "text-[#192734]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onAvailabilityChange("online")}
            className={`h-[34px] rounded-lg px-2 text-[13px] font-medium ${
              selectedAvailability === "online" ? "bg-[#076e68] text-white" : "text-[#192734]"
            }`}
          >
            Online
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#1b2834]">Categories</p>
          <div className="flex items-center gap-2.5 text-[11px]">
            <button type="button" onClick={expandAll} className="text-[#0b736d]/75 outline-none focus-visible:underline">
              Expand All
            </button>
            <button type="button" onClick={collapseAll} className="text-[#0b736d]/75 outline-none focus-visible:underline">
              Collapse All
            </button>
          </div>
        </div>

        <div className="mt-2 space-y-1.5">
          {connectCategoryGroups.map((group) => {
            const open = expandedLookup.has(group.title);
            return (
              <section key={group.title} className="overflow-hidden rounded-xl border border-[#bac6cc] bg-[#f1f4f8]">
                <button
                  type="button"
                  onClick={() => toggle(group.title)}
                  className="flex w-full items-center justify-between px-3.5 py-2 text-left"
                >
                  <span className="pr-3 text-[13px] font-medium leading-5 text-[#152530]">{group.title}</span>
                  {open ? <ChevronUp size={17} className="text-[#5a6772]" /> : <ChevronDown size={17} className="text-[#5a6772]" />}
                </button>

                {open ? (
                  <div className="border-t border-[#d2dae1] bg-[#e6ebf5] px-3 py-2">
                    <ul className="space-y-1.5">
                      {group.items.map((item) => {
                        const checked = selectedCategory === item;
                        return (
                          <li key={item}>
                            <button
                              type="button"
                              className="flex min-h-6 items-start gap-2 text-left"
                              onClick={() => onCategoryChange(item)}
                            >
                              <FilterCheckbox checked={checked} />
                              <span className="text-[12px] leading-[1.35rem] text-[#1b2a36]">{item}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
