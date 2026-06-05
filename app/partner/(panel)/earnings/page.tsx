"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPartnerEarnings as getPartnerEarningsApi } from "@/lib/api/partner";

type EarningRow = {
  id: string;
  date: string;
  source: string;
  user: string;
  myEarnings: number;
  status: "PENDING" | "AVAILABLE" | "PAID" | "CANCELLED";
};

type EarningsSummary = {
  totalEarnings: number;
  sessionEarnings: number;
  giftEarnings: number;
  availableBalance: number;
  pendingAmount: number;
  paidAmount: number;
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIsoDate(input: unknown) {
  const raw = String(input ?? "").trim();
  if (!raw) return new Date().toISOString();
  return raw;
}

function normalizeStatus(value: unknown): EarningRow["status"] {
  const normalized = String(value ?? "AVAILABLE").toUpperCase();
  if (normalized === "PENDING" || normalized === "PAID" || normalized === "CANCELLED") return normalized;
  return "AVAILABLE";
}

function sourceLabel(rawSourceType: unknown, rawSource: unknown) {
  const sourceType = String(rawSourceType ?? "").toUpperCase();
  if (sourceType === "GIFT") return "Gift";
  const source = String(rawSource ?? "").toUpperCase();
  if (source.includes("AUDIO")) return "Audio Session";
  if (source.includes("VIDEO")) return "Video Session";
  if (source.includes("CHAT")) return "Chat Session";
  if (sourceType === "SESSION") return "Session";
  return "Session";
}

function toEarningRows(data: Record<string, unknown>[] | null): EarningRow[] {
  if (!data) return [];
  return data.map((row, index) => ({
    id: String(row.id ?? `earning-${index + 1}`),
    date: toIsoDate(row.date ?? row.createdAt),
    source: sourceLabel(row.sourceType, row.source),
    user: String(row.user ?? row.userMaskedPhone ?? row.userPhone ?? "Member"),
    myEarnings: toNumber(row.myEarnings ?? row.partnerAmount ?? row.netEarning),
    status: normalizeStatus(row.status),
  }));
}

export default function PartnerEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    sessionEarnings: 0,
    giftEarnings: 0,
    availableBalance: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const response = await getPartnerEarningsApi();
      const payload = response.data;
      const nextRows = toEarningRows(payload?.earnings ?? null);
      setEarnings(nextRows);

      const safeSummary = payload?.summary ?? {};
      const sessionEarnings = toNumber(safeSummary.sessionEarnings);
      const giftEarnings = toNumber(safeSummary.giftEarnings);
      setSummary({
        totalEarnings: toNumber(safeSummary.totalEarnings, sessionEarnings + giftEarnings),
        sessionEarnings,
        giftEarnings,
        availableBalance: toNumber(safeSummary.availableBalance ?? safeSummary.availableAmount),
        pendingAmount: toNumber(safeSummary.pendingPayoutAmount ?? safeSummary.pendingAmount),
        paidAmount: toNumber(safeSummary.totalPaidAmount ?? safeSummary.paidAmount),
      });
      setLoading(false);
    })();
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Earnings</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Earnings</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.totalEarnings)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Session Earnings</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.sessionEarnings)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Gift Earnings</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.giftEarnings)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Available to Withdraw</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.availableBalance)}</p>
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
          <Link
            href="/partner/payouts"
            className="rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white"
          >
            Request Payout
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">My Earnings</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-sm text-slate-500">
                    Loading earnings...
                  </td>
                </tr>
              ) : earnings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-sm text-slate-500">
                    No earnings yet.
                  </td>
                </tr>
              ) : (
                earnings.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{new Date(row.date).toLocaleString("en-IN")}</td>
                    <td className="px-2 py-2 text-slate-700">{row.source}</td>
                    <td className="px-2 py-2 text-slate-700">{row.user}</td>
                    <td className="px-2 py-2 font-medium text-slate-900">{formatINR(row.myEarnings)}</td>
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
