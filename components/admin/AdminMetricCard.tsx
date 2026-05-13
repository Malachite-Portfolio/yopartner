import type { LucideIcon } from "lucide-react";

type AdminMetricCardProps = {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
  tone?: "blue" | "teal" | "purple" | "amber" | "slate";
};

const toneStyles = {
  blue: "from-[#dbeafe] to-[#eff6ff] text-[#1d4ed8]",
  teal: "from-[#ccfbf1] to-[#f0fdfa] text-[#0f766e]",
  purple: "from-[#ede9fe] to-[#f5f3ff] text-[#6d28d9]",
  amber: "from-[#fef3c7] to-[#fffbeb] text-[#b45309]",
  slate: "from-[#e2e8f0] to-[#f8fafc] text-[#334155]",
};

export function AdminMetricCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "blue",
}: AdminMetricCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {delta ? <p className="mt-1 text-xs font-medium text-slate-500">{delta}</p> : null}
        </div>
        {Icon ? (
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${toneStyles[tone]}`}
          >
            <Icon size={18} />
          </span>
        ) : null}
      </div>
    </article>
  );
}
