"use client";

import { useState, useEffect } from "react";
import { getPartnerEarnings as getPartnerEarningsApi } from "@/lib/api/partner";

type EarningRow = {
  id: string;
  date: string;
  sourceType: "SESSION" | "GIFT";
  session: string;
  userMaskedPhone: string;
  amount: number;
  companyShare: number;
  partnerPercent: number;
  companyPercent: number;
  netEarning: number;
  status: "PENDING" | "AVAILABLE" | "PAID" | "CANCELLED";
};

type EarningsSummary = {
  grossTotal: number;
  partnerTotal: number;
  companyTotal: number;
  sessionEarnings: number;
  giftEarnings: number;
  pendingAmount: number;
  availableAmount: number;
  paidAmount: number;
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toEarningRows(data: Record<string, unknown>[] | null): EarningRow[] {
  if (!data) return [];
  return data.map((row, index) => ({
    id: String(row.id ?? `earning-${index + 1}`),
    date: String(row.date ?? row.createdAt ?? new Date().toISOString()),
    sourceType: String(row.sourceType ?? "SESSION").toUpperCase() === "GIFT" ? "GIFT" : "SESSION",
    session: String(row.session ?? row.type ?? "Session"),
    userMaskedPhone: String(row.userMaskedPhone ?? row.userPhone ?? "Member"),
    amount: toNumber(row.amount),
    companyShare: toNumber(row.companyShare ?? row.platformFee),
    partnerPercent: toNumber(row.partnerPercent),
    companyPercent: toNumber(row.companyPercent),
    netEarning: toNumber(row.netEarning),
    status: (() => {
      const normalized = String(row.status ?? "AVAILABLE").toUpperCase();
      if (normalized === "PENDING" || normalized === "PAID" || normalized === "CANCELLED") return normalized;
      return "AVAILABLE";
    })(),
  }));
}

export default function PartnerEarningsPage() {
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    grossTotal: 0,
    partnerTotal: 0,
    companyTotal: 0,
    sessionEarnings: 0,
    giftEarnings: 0,
    pendingAmount: 0,
    availableAmount: 0,
    paidAmount: 0,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await getPartnerEarningsApi();
      const payload = response.data;
      setEarnings(toEarningRows(payload?.earnings ?? null));
      setSummary({
        grossTotal: toNumber(payload?.summary?.grossTotal),
        partnerTotal: toNumber(payload?.summary?.partnerTotal),
        companyTotal: toNumber(payload?.summary?.companyTotal),
        sessionEarnings: toNumber(payload?.summary?.sessionEarnings),
        giftEarnings: toNumber(payload?.summary?.giftEarnings),
        pendingAmount: toNumber(payload?.summary?.pendingAmount),
        availableAmount: toNumber(payload?.summary?.availableAmount),
        paidAmount: toNumber(payload?.summary?.paidAmount),
      });
    })();
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Earnings</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Session earnings (30%)</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.sessionEarnings)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Gift earnings (40%)</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.giftEarnings)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Company share</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.companyTotal)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Available Balance</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.availableAmount)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pending / Paid</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {formatINR(summary.pendingAmount)} / {formatINR(summary.paidAmount)}
          </p>
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
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">Session</th>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Gross Amount</th>
                <th className="px-2 py-2">Company Share</th>
                <th className="px-2 py-2">Partner Share</th>
                <th className="px-2 py-2">Split</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-4 text-sm text-slate-500">
                    No earnings yet.
                  </td>
                </tr>
              ) : (
                earnings.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{row.date}</td>
                    <td className="px-2 py-2 text-slate-700">{row.sourceType === "GIFT" ? "Gift" : "Session"}</td>
                    <td className="px-2 py-2 text-slate-700">{row.session}</td>
                    <td className="px-2 py-2 text-slate-700">{row.userMaskedPhone}</td>
                    <td className="px-2 py-2 text-slate-700">{formatINR(row.amount)}</td>
                    <td className="px-2 py-2 text-slate-700">{formatINR(row.companyShare)}</td>
                    <td className="px-2 py-2 font-medium text-slate-900">{formatINR(row.netEarning)}</td>
                    <td className="px-2 py-2 text-slate-700">
                      {row.partnerPercent}% / {row.companyPercent}%
                    </td>
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
