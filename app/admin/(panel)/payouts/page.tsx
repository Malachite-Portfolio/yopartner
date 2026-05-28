"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { listPayouts } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime, formatINR } from "@/lib/adminFormat";

type PayoutRow = {
  id: string;
  payoutCode: string;
  companion: string;
  phone: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => asRecord(item)) : [];
}

function asString(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selected, setSelected] = useState<PayoutRow | null>(null);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const response = await listPayouts();

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setRows([]);
      setErrorMessage(response.error?.message || "Unable to load payouts.");
      setLoading(false);
      return;
    }

    const payouts = asArray(asRecord(response.data).payouts).map((item) => {
      const companion = asRecord(item.companion);
      const user = asRecord(companion.user);
      return {
        id: asString(item.id),
        payoutCode: asString(item.payoutCode, asString(item.id)),
        companion: asString(companion.displayName ?? user.name),
        phone: asString(user.phoneNumber),
        amount: asNumber(item.amount),
        status: asString(item.status),
        requestedAt: asString(item.requestedAt ?? item.createdAt, new Date().toISOString()),
        processedAt: asString(item.processedAt, ""),
      } satisfies PayoutRow;
    });

    setRows(payouts.sort((a, b) => +new Date(b.requestedAt) - +new Date(a.requestedAt)));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPayouts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPayouts]);

  const stats = useMemo(() => {
    const totalEarnings = rows.reduce((acc, item) => acc + item.amount, 0);
    const pendingPayouts = rows
      .filter((item) => item.status === "REQUESTED" || item.status === "APPROVED")
      .reduce((acc, item) => acc + item.amount, 0);
    const paidThisMonth = rows.filter((item) => item.status === "PAID").reduce((acc, item) => acc + item.amount, 0);
    return { totalEarnings, pendingPayouts, paidThisMonth, commission: Math.round(totalEarnings * 0.2) };
  }, [rows]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Payouts</h2>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Partner Earnings</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.totalEarnings)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Pending Payouts</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.pendingPayouts)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Paid</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.paidThisMonth)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Platform Commission</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.commission)}</p></article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading payouts...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Payout ID</th>
                  <th className="px-2 py-2">Companion</th>
                  <th className="px-2 py-2">Phone</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Requested Date</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-3 text-slate-500">No payouts found.</td>
                  </tr>
                ) : (
                  rows.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.payoutCode}</td>
                      <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                      <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                      <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                      <td className="px-2 py-2 text-slate-700">{formatDateTime(item.requestedAt)}</td>
                      <td className="px-2 py-2">
                        <AdminActionMenu actions={[{ label: "View", onClick: () => setSelected(item) }]} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title={selected ? `Payout ${selected.payoutCode}` : "Payout Details"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Companion:</span> {selected.companion}</p>
            <p><span className="font-semibold text-slate-900">Phone:</span> {selected.phone}</p>
            <p><span className="font-semibold text-slate-900">Amount:</span> {formatINR(selected.amount)}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Requested:</span> {formatDateTime(selected.requestedAt)}</p>
            <p><span className="font-semibold text-slate-900">Processed At:</span> {selected.processedAt ? formatDateTime(selected.processedAt) : "-"}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
