"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, WalletCards, X } from "lucide-react";
import {
  getPartnerPayoutSummary,
  getPartnerPayouts,
  requestPartnerPayout,
} from "@/lib/api/partner";

type PayoutSummary = {
  availableEarnings: number;
  pendingPayoutAmount: number;
  totalPaidAmount: number;
  bankDetails: {
    required: boolean;
    status: string;
    note: string;
  };
};

type PayoutRow = {
  id: string;
  payoutCode: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  adminNote: string | null;
};

const emptySummary: PayoutSummary = {
  availableEarnings: 0,
  pendingPayoutAmount: 0,
  totalPaidAmount: 0,
  bankDetails: {
    required: false,
    status: "NOT_CONFIGURED",
    note: "Bank details are not stored in the current payout model. Admin may verify payout details before processing.",
  },
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toDateLabel(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

function normalizeSummary(data: Record<string, unknown> | null | undefined): PayoutSummary {
  const bankRaw = data?.bankDetails && typeof data.bankDetails === "object"
    ? data.bankDetails as Record<string, unknown>
    : {};

  return {
    availableEarnings: toNumber(data?.availableEarnings ?? data?.availableToWithdraw),
    pendingPayoutAmount: toNumber(data?.pendingPayoutAmount),
    totalPaidAmount: toNumber(data?.totalPaidAmount),
    bankDetails: {
      required: Boolean(bankRaw.required),
      status: String(bankRaw.status ?? emptySummary.bankDetails.status),
      note: String(bankRaw.note ?? emptySummary.bankDetails.note),
    },
  };
}

function normalizePayoutRows(data: Record<string, unknown>[]): PayoutRow[] {
  return data.map((row, index) => ({
    id: String(row.id ?? `payout-${index + 1}`),
    payoutCode: String(row.payoutCode ?? row.id ?? `PO-${index + 1}`),
    amount: toNumber(row.amount),
    status: String(row.status ?? "REQUESTED").toUpperCase(),
    requestedAt: String(row.requestedAt ?? row.createdAt ?? ""),
    processedAt: toStringOrNull(row.processedAt),
    adminNote: toStringOrNull(row.adminNote ?? row.rejectionReason),
  }));
}

function statusClass(status: string) {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "bg-rose-50 text-rose-700";
  if (status === "APPROVED") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

export default function PartnerPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PayoutSummary>(emptySummary);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);

  const canSubmit = useMemo(() => {
    const parsed = Number(amount);
    return Number.isInteger(parsed) && parsed > 0 && parsed <= summary.availableEarnings;
  }, [amount, summary.availableEarnings]);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    setError("");
    const [summaryResponse, payoutsResponse] = await Promise.all([
      getPartnerPayoutSummary(),
      getPartnerPayouts(),
    ]);

    if (summaryResponse.error || payoutsResponse.error) {
      setError(summaryResponse.error?.message || payoutsResponse.error?.message || "Unable to load payouts.");
    }

    setSummary(normalizeSummary(summaryResponse.data));
    setPayouts(normalizePayoutRows(payoutsResponse.data));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPayouts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPayouts]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a payout amount greater than zero.");
      return;
    }
    if (parsedAmount > summary.availableEarnings) {
      setError("Amount cannot be more than your available earnings.");
      return;
    }

    setSubmitting(true);
    const response = await requestPartnerPayout({
      amount: parsedAmount,
      note: note.trim() || undefined,
    });
    setSubmitting(false);

    if (response.error) {
      setError(response.error.message || "Unable to request payout.");
      return;
    }

    setMessage(response.data?.message || "Payout request submitted.");
    setAmount("");
    setNote("");
    setModalOpen(false);
    await loadPayouts();
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Payouts</h2>
          <p className="mt-1 text-sm text-slate-500">Withdraw your credited partner earnings.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError("");
            setMessage("");
            setModalOpen(true);
          }}
          disabled={summary.availableEarnings <= 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b5f58] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <WalletCards size={17} />
          Request payout
        </button>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Available to withdraw</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.availableEarnings)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pending payouts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.pendingPayoutAmount)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total paid</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(summary.totalPaidAmount)}</p>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Bank details</p>
        <p className="mt-1 text-sm text-slate-600">{summary.bankDetails.note}</p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Payout history</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Requested amount</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Requested date</th>
                <th className="px-2 py-2">Processed date</th>
                <th className="px-2 py-2">Admin note</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-slate-500">
                    Loading payouts...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-slate-500">
                    No payout requests yet.
                  </td>
                </tr>
              ) : (
                payouts.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-900">{formatINR(row.amount)}</td>
                    <td className="px-2 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-700">{toDateLabel(row.requestedAt)}</td>
                    <td className="px-2 py-2 text-slate-700">{toDateLabel(row.processedAt)}</td>
                    <td className="px-2 py-2 text-slate-700">{row.adminNote || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Request payout</h3>
                <p className="mt-1 text-sm text-slate-500">Available: {formatINR(summary.availableEarnings)}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
                aria-label="Close payout request"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Amount</span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="numeric"
                  min={1}
                  step={1}
                  type="number"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15"
                  placeholder="Enter amount"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15"
                  placeholder="Optional"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b5f58] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
