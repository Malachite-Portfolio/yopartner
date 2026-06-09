type AdminStatusBadgeProps = {
  status: string;
};

const styleMap: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  approved: "bg-emerald-50 text-emerald-700",
  verified: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  online: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  "under review": "bg-amber-50 text-amber-700",
  requested: "bg-amber-50 text-amber-700",
  draft: "bg-slate-100 text-slate-700",
  open: "bg-rose-50 text-rose-700",
  rejected: "bg-rose-50 text-rose-700",
  failed: "bg-rose-50 text-rose-700",
  suspended: "bg-rose-50 text-rose-700",
  temp_banned: "bg-rose-50 text-rose-700",
  banned: "bg-rose-50 text-rose-700",
  blocked: "bg-rose-50 text-rose-700",
  cancelled: "bg-rose-50 text-rose-700",
  flagged: "bg-rose-50 text-rose-700",
  hidden: "bg-slate-200 text-slate-700",
  removed: "bg-rose-100 text-rose-800",
  deleted: "bg-rose-100 text-rose-800",
  restricted: "bg-amber-50 text-amber-700",
  needs_info: "bg-sky-50 text-sky-700",
  not_submitted: "bg-slate-100 text-slate-700",
  "in progress": "bg-sky-50 text-sky-700",
  "needs info": "bg-sky-50 text-sky-700",
  "needs review": "bg-sky-50 text-sky-700",
  trained: "bg-violet-50 text-violet-700",
  cleared: "bg-violet-50 text-violet-700",
  offline: "bg-slate-100 text-slate-700",
  published: "bg-emerald-50 text-emerald-700",
};

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  const key = status.trim().toLowerCase();
  const className = styleMap[key] ?? "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}
