type AdminTableToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  filterOptions?: string[];
  onFilterChange?: (value: string) => void;
  primaryLabel?: string;
  onPrimaryClick?: () => void;
};

export function AdminTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterValue,
  filterOptions,
  onFilterChange,
  primaryLabel,
  onPrimaryClick,
}: AdminTableToolbarProps) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
      />
      {filterOptions && onFilterChange ? (
        <select
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
        >
          {filterOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      {primaryLabel && onPrimaryClick ? (
        <button
          type="button"
          onClick={onPrimaryClick}
          className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white"
        >
          {primaryLabel}
        </button>
      ) : null}
    </div>
  );
}
