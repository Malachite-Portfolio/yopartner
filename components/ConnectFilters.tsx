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
    items: [
      "Poetry recitation (Hindi/Urdu/Kavita)",
      "Creative writing coach",
      "Music discussion",
      "Art companion",
    ],
  },
  {
    title: "Lifestyle & Daily Support",
    items: ["Shopping companion", "Meal companion", "Event companion", "Travel companion"],
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

function FilterCircle({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
        active ? "border-[#2563EB] bg-[#2563EB]/10" : "border-slate-400"
      }`}
    >
      {active && <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />}
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
  const wrapperClasses = mobile
    ? "rounded-xl border border-slate-200 bg-white p-4"
    : "h-full overflow-y-auto bg-white px-6 py-5";

  return (
    <div className={wrapperClasses}>
      <div className="flex items-center justify-between">
        <h2 className="text-[21px] font-semibold leading-none text-slate-900">Filter</h2>
        <button type="button" className="text-[15px] font-semibold text-[#2563EB]" onClick={onClearAll}>
          Clear All
        </button>
      </div>

      <div className="mt-5">
        <h3 className="text-[14px] font-semibold text-slate-600">Availability</h3>
        <div className="mt-2.5 grid h-10 grid-cols-2 overflow-hidden rounded-[8px] border border-slate-200">
          <button
            type="button"
            onClick={() => onAvailabilityChange("all")}
            className={selectedAvailability === "all" ? "bg-[#2563EB] text-[15px] font-semibold text-white" : "bg-white text-[15px] font-semibold text-slate-900"}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onAvailabilityChange("online")}
            className={selectedAvailability === "online" ? "bg-[#2563EB] text-[15px] font-semibold text-white" : "bg-white text-[15px] font-semibold text-slate-900"}
          >
            Online
          </button>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-[14px] font-semibold text-slate-600">Categories:</h3>

        <div className="mt-2.5 flex items-center justify-between text-[15px]">
          <span className="font-medium text-slate-400">Expand All</span>
          <span className="font-semibold text-[#2563EB]">Collapse All</span>
        </div>

        <div className="mt-2.5 space-y-3">
          {connectCategoryGroups.map((category) => (
            <section key={category.title} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
                <h4 className="text-[16px] font-semibold leading-6 text-slate-900">{category.title}</h4>
              </div>
              <ul className="space-y-0.5 px-4 py-2">
                {category.items.map((item) => {
                  const active = selectedCategory === item;
                  return (
                    <li key={item}>
                      <button
                        type="button"
                        className="flex min-h-[40px] w-full items-center gap-3 text-left text-[14px] text-slate-900"
                        onClick={() => onCategoryChange(item)}
                      >
                        <FilterCircle active={active} />
                        <span>{item}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
