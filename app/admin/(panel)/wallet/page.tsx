"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import {
  type AdminWalletSummaryResponse,
  type AdminWalletSummaryTransaction,
  getAdminWalletSummary,
} from "@/lib/api/admin";
import { formatDateTime, formatINR } from "@/lib/adminFormat";

type TypeFilter = "ALL" | "RECHARGE" | "BOOKING" | "GIFT" | "REFUND" | "ADMIN_CREDIT";
type StatusFilter = "ALL" | "SUCCESS" | "PENDING" | "FAILED";

function formatType(type: AdminWalletSummaryTransaction["type"]) {
  switch (type) {
    case "ADMIN_CREDIT":
      return "Admin Credit";
    case "RECHARGE":
      return "Recharge";
    case "BOOKING":
      return "Booking";
    case "GIFT":
      return "Gift";
    case "REFUND":
      return "Refund";
    default:
      return type;
  }
}

export default function AdminWalletPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState<AdminWalletSummaryResponse | null>(null);
  const [selected, setSelected] = useState<AdminWalletSummaryTransaction | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const response = await getAdminWalletSummary({
        search,
        type: typeFilter,
        status: statusFilter,
      });

      if (!active) return;
      if (response.error || !response.data) {
        setSummary(null);
        setErrorMessage(response.error?.message ?? "Unable to load wallet operations right now.");
        setLoading(false);
        return;
      }

      setSummary(response.data);
      setErrorMessage("");
      setLoading(false);
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, typeFilter, statusFilter]);

  const rows = summary?.transactions ?? [];
  const hasRows = rows.length > 0;
  const totals = useMemo(
    () => ({
      totalRecharged: summary?.totalRecharged ?? 0,
      totalSpent: summary?.totalSpent ?? 0,
      totalRefunds: summary?.totalRefunds ?? 0,
      totalTransactions: summary?.totalTransactions ?? 0,
      averageRecharge: summary?.averageRecharge ?? 0,
    }),
    [summary],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Wallet</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Recharged</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totals.totalRecharged)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Spent</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totals.totalSpent)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Refunds</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totals.totalRefunds)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Transactions</p><p className="mt-2 text-2xl font-semibold text-slate-900">{totals.totalTransactions}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Average Recharge</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totals.averageRecharge)}</p></article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by transaction ID or phone..." />
        <div className="mb-3 flex flex-wrap gap-2">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="ALL">All Types</option>
            <option value="RECHARGE">Recharge</option>
            <option value="BOOKING">Booking</option>
            <option value="GIFT">Gift</option>
            <option value="REFUND">Refund</option>
            <option value="ADMIN_CREDIT">Admin Credit</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {loading ? <p className="py-6 text-sm text-slate-600">Loading wallet operations...</p> : null}
        {!loading && errorMessage ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{errorMessage}</p>
        ) : null}
        {!loading && !errorMessage && !hasRows ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">No wallet transactions found for current filters.</p>
        ) : null}

        {!loading && !errorMessage && hasRows ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Transaction ID</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Gateway</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-800">{item.transactionId}</td>
                    <td className="px-2 py-2 text-slate-700">{item.userName ? `${item.userName} (${item.userPhone})` : item.userPhone}</td>
                    <td className="px-2 py-2 text-slate-700">{formatType(item.type)}</td>
                    <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                    <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                    <td className="px-2 py-2 text-slate-700">{item.gateway ?? "-"}</td>
                    <td className="px-2 py-2 text-slate-700">{formatDateTime(item.createdAt)}</td>
                    <td className="px-2 py-2">
                      <AdminActionMenu actions={[{ label: "View", onClick: () => setSelected(item) }]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title={selected ? selected.transactionId : "Transaction"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">User:</span> {selected.userName ? `${selected.userName} (${selected.userPhone})` : selected.userPhone}</p>
            <p><span className="font-semibold text-slate-900">Type:</span> {formatType(selected.type)}</p>
            <p><span className="font-semibold text-slate-900">Amount:</span> {formatINR(selected.amount)}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Gateway:</span> {selected.gateway ?? "-"}</p>
            <p><span className="font-semibold text-slate-900">Date:</span> {formatDateTime(selected.createdAt)}</p>
            <p><span className="font-semibold text-slate-900">Paid Amount:</span> {formatINR(selected.paidAmount)}</p>
            <p><span className="font-semibold text-slate-900">Wallet Credit:</span> {formatINR(selected.walletCredit)}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
