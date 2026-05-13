"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { formatDateTime, formatINR, getAdminPayouts, setAdminPayouts } from "@/lib/adminStore";
import type { AdminPayout } from "@/lib/adminData";

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<AdminPayout[]>(() => getAdminPayouts());
  const [selected, setSelected] = useState<AdminPayout | null>(null);

  const persist = (next: AdminPayout[]) => {
    setPayouts(next);
    setAdminPayouts(next);
  };

  const stats = useMemo(() => {
    const totalEarnings = payouts.reduce((acc, item) => acc + item.amount, 0);
    const pendingPayouts = payouts.filter((item) => item.status === "Requested" || item.status === "Approved").reduce((acc, item) => acc + item.amount, 0);
    const paidThisMonth = payouts.filter((item) => item.status === "Paid").reduce((acc, item) => acc + item.amount, 0);
    const commission = Math.round(totalEarnings * 0.2);
    return { totalEarnings, pendingPayouts, paidThisMonth, commission };
  }, [payouts]);

  const updateStatus = (target: AdminPayout, status: AdminPayout["status"], reason?: string) => {
    const next = payouts.map((item) =>
      item.id === target.id
        ? {
            ...item,
            status,
            processedAt: status === "Paid" ? new Date().toISOString() : item.processedAt,
            reason: reason ?? item.reason,
          }
        : item,
    );
    persist(next);
    setSelected((current) =>
      current?.id === target.id
        ? {
            ...current,
            status,
            processedAt: status === "Paid" ? new Date().toISOString() : current.processedAt,
            reason: reason ?? current.reason,
          }
        : current,
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Payouts</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Partner Earnings</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.totalEarnings)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Pending Payouts</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.pendingPayouts)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Paid This Month</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.paidThisMonth)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Platform Commission</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.commission)}</p></article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Payout ID</th>
                <th className="px-2 py-2">Companion</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Bank/UPI</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Requested Date</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-800">{item.payoutId}</td>
                  <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                  <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                  <td className="px-2 py-2 text-slate-700">{item.bankOrUpi}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.requestedDate)}</td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "View Earnings", onClick: () => setSelected(item) },
                        { label: "Approve", tone: "success", onClick: () => updateStatus(item, "Approved") },
                        { label: "Mark Paid", tone: "success", onClick: () => updateStatus(item, "Paid") },
                        {
                          label: "Reject",
                          tone: "danger",
                          onClick: () => {
                            const reason = window.prompt("Optional rejection reason", item.reason ?? "");
                            if (reason === null) return;
                            updateStatus(item, "Rejected", reason);
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title={selected ? `Payout ${selected.payoutId}` : "Payout Details"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Companion:</span> {selected.companion}</p>
            <p><span className="font-semibold text-slate-900">Phone:</span> {selected.phone}</p>
            <p><span className="font-semibold text-slate-900">Amount:</span> {formatINR(selected.amount)}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Requested:</span> {formatDateTime(selected.requestedDate)}</p>
            <p><span className="font-semibold text-slate-900">Processed At:</span> {selected.processedAt ? formatDateTime(selected.processedAt) : "-"}</p>
            <p><span className="font-semibold text-slate-900">Reason:</span> {selected.reason ?? "-"}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
