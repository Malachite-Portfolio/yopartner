export type HomeVisitCategoryGroup = {
  title: string;
  items: string[];
};

export const homeVisitCategoryGroups: HomeVisitCategoryGroup[] = [
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
    title: "Lifestyle & Practical Help",
    items: [
      "Baby sitting (3+ years kids)",
      "Storytelling for kids",
      "Pet companion",
      "Cooking simple Indian meals",
      "Shopping assistance",
      "Elderly companionship",
    ],
  },
  {
    title: "Social & Outdoor",
    items: ["Coffee companion", "Walk companion", "Event companion", "Travel companion", "Movie partner"],
  },
];

const mobileHomeVisitChips = [
  "Active listening",
  "Elderly companionship",
  "Shopping assistance",
  "Walk companion",
  "Event companion",
];

type HomeVisitFiltersProps = {
  mobile?: boolean;
  selectedCategory: string | null;
  onCategoryChange: (value: string) => void;
  onClearAll: () => void;
};

function FilterCircle({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
        active ? "border-[#0f766e] bg-[#0f766e]/10" : "border-slate-400"
      }`}
    >
      {active && <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />}
    </span>
  );
}

export function HomeVisitFilters({ mobile = false, selectedCategory, onCategoryChange, onClearAll }: HomeVisitFiltersProps) {
  if (mobile) {
    return (
      <div className="rounded-3xl border border-[#dceae5] bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
          <button type="button" className="text-sm font-semibold text-[#0f766e]" onClick={onClearAll}>
            Clear
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {mobileHomeVisitChips.map((item) => {
            const active = selectedCategory === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onCategoryChange(item)}
                className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${
                  active
                    ? "border-[#0f766e] bg-[#eef8f5] text-[#0f766e]"
                    : "border-[#dceae5] bg-white text-slate-700"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const wrapperClasses = mobile
    ? "rounded-xl border border-slate-200 bg-white p-4"
    : "h-full overflow-y-auto bg-[#fffdf8] px-4 py-5";

  return (
    <div className={wrapperClasses}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold leading-none text-slate-900">Filters</h2>
        <button type="button" className="text-[15px] font-semibold text-[#0f766e]" onClick={onClearAll}>
          Clear All
        </button>
      </div>

      <div className="mt-5">
        <h3 className="text-[14px] font-semibold text-slate-600">Categories:</h3>

        <div className="mt-2.5 flex items-center justify-between text-[15px]">
          <span className="font-medium text-slate-400">Expand All</span>
          <span className="font-semibold text-[#0f766e]">Collapse All</span>
        </div>

        <div className="mt-2.5 space-y-3">
          {homeVisitCategoryGroups.map((category) => (
            <section key={category.title} className="overflow-hidden rounded-2xl border border-[#dceae5] bg-white">
              <div className="border-b border-[#dceae5] bg-[#eef8f5] px-4 py-3">
                <h4 className="text-[16px] font-semibold leading-6 text-slate-900">{category.title}</h4>
              </div>
              <ul className="space-y-0.5 px-4 py-2">
                {category.items.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => onCategoryChange(item)}
                      className="flex min-h-[40px] w-full items-center gap-3 text-left text-[14px] text-slate-900"
                    >
                      <FilterCircle active={selectedCategory === item} />
                      <span>{item}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
