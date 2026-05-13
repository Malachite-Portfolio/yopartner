"use client";

import { useMemo, useState } from "react";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getPartnerEarnings } from "@/lib/partnerData";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

export default function PartnerEarningsPage() {
  const earnings = getPartnerEarnings();
  const [message, setMessage] = useState("");

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

  if (IS_PRODUCTION_READY_MODE) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-semibold text-amber-800">Partner earnings are unavailable</h2>
        <p className="mt-2 text-sm text-amber-700">Partner earnings service is not connected yet.</p>
      </section>
    );
  }

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
          <p className="text-sm text-slate-500">Completed Sessions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.completedSessions}</p>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Earnings History</h3>
          <button
            type="button"
            onClick={() => setMessage("Payout request will be available after backend integration.")}
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
              {earnings.map((row) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
