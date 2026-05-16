type AdminAction = {
  label: string;
  onClick: () => void;
  tone?: "default" | "success" | "danger" | "warning";
  disabled?: boolean;
  title?: string;
};

type AdminActionMenuProps = {
  actions: AdminAction[];
};

const toneStyles: Record<NonNullable<AdminAction["tone"]>, string> = {
  default: "border-slate-200 text-slate-700 hover:bg-slate-50",
  success: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  danger: "border-rose-200 text-rose-700 hover:bg-rose-50",
  warning: "border-amber-200 text-amber-700 hover:bg-amber-50",
};

export function AdminActionMenu({ actions }: AdminActionMenuProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action) => {
        const tone = action.tone ?? "default";
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.title}
            className={`rounded-lg border px-2 py-1 text-xs font-medium transition ${toneStyles[tone]} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
