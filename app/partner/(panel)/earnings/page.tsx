"use client";

import { useMemo, useState, useEffect } from "react";
import { getPartnerEarnings as getPartnerEarningsApi } from "@/lib/api/partner";

type EarningRow = {
  id: string;
  date: string;
  session: string;
  userMaskedPhone: string;
  amount: number;
  platformFee: number;
  netEarning: number;
  status: "Credited" | "Pending";
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

function toEarningRows(data: Record<string, unknown>[] | null): EarningRow[] {
  if (!data) return [];
  return data.map((row, index) => ({
    id: String(row.id ?? `earning-${index + 1}`),
    date: String(row.date ?? row.createdAt ?? new Date().toISOString()),
    session: String(row.session ?? row.type ?? "Session"),
    userMaskedPhone: String(row.userMaskedPhone ?? row.userPhone ?? "Member"),
    amount: Number(row.amount ?? 0),
    platformFee: Number(row.platformFee ?? 0),
    netEarning: Number(row.netEarning ?? 0),
    status: String(row.status ?? "Credited").toUpperCase() === "PENDING" ? "Pending" : "Credited",
  }));
}

export default function PartnerEarningsPage() {
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await getPartnerEarningsApi();
      setEarnings(toEarningRows(response.data));
    })();
  }, []);

  const stats = useMemo(() => {
    const totalEarnings = earnings.reduce((sum, row) => sum + row.netEarning, 0);
    const availableBalance = earnings
      .filter((row) => row.status === "Credited")
      .reduce((sum, row) => sum + row.netEarning, 0);
    const pendingPayout = earnings
      .filter((row) => row.status === "Pending")
      .reduce((sum, row) => sum + row.netEarning, 0);
    const completedSessions = earnings.length;
    return { totalEarnings, availableBalance, pendingPayout, completedSessions };
  }, [earnings]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Earnings</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Earnings</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.totalEarnings)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Available Balance</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.availableBalance)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pending Payout</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.pendingPayout)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Completed Conversations</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.completedSessions}</p>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Earnings History</h3>
          <button
            type="button"
            onClick={() => setMessage("Payout requests will be available soon. Please try again later.")}
            className="rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white"
          >
            Request Payout
          </button>
        </div>
        {message ? <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Session</th>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Platform Fee</th>
                <th className="px-2 py-2">Net Earning</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-sm text-slate-500">
                    No earnings yet.
                  </td>
                </tr>
              ) : (
                earnings.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{row.date}</td>
                    <td className="px-2 py-2 text-slate-700">{row.session}</td>
                    <td className="px-2 py-2 text-slate-700">{row.userMaskedPhone}</td>
                    <td className="px-2 py-2 text-slate-700">{formatINR(row.amount)}</td>
                    <td className="px-2 py-2 text-slate-700">{formatINR(row.platformFee)}</td>
                    <td className="px-2 py-2 font-medium text-slate-900">{formatINR(row.netEarning)}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
