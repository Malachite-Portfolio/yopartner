"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import {
  formatDateTime,
  formatINR,
  generateId,
  getAdminTransactions,
  getAdminUsers,
  setAdminTransactions,
  setAdminUsers,
} from "@/lib/adminStore";
import type { AdminTransaction, AdminUser } from "@/lib/adminData";

type TypeFilter = "All" | AdminTransaction["type"];
type StatusFilter = "All" | AdminTransaction["status"];

export default function AdminWalletPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>(() => getAdminTransactions());
  const [users, setUsers] = useState<AdminUser[]>(() => getAdminUsers());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [selected, setSelected] = useState<AdminTransaction | null>(null);
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditPhone, setCreditPhone] = useState("");
  const [creditAmount, setCreditAmount] = useState("500");
  const [creditReason, setCreditReason] = useState("Manual admin credit");

  const persistTransactions = (next: AdminTransaction[]) => {
    setTransactions(next);
    setAdminTransactions(next);
  };

  const persistUsers = (next: AdminUser[]) => {
    setUsers(next);
    setAdminUsers(next);
  };

  const stats = useMemo(() => {
    const recharged = transactions
      .filter((item) => item.type === "Recharge")
      .reduce((acc, item) => acc + Math.max(item.amount, 0), 0);
    const spent = transactions
      .filter((item) => item.type === "Booking")
      .reduce((acc, item) => acc + Math.abs(item.amount), 0);
    const refunds = transactions
      .filter((item) => item.type === "Refund")
      .reduce((acc, item) => acc + Math.max(item.amount, 0), 0);
    const rechargeCount = Math.max(transactions.filter((item) => item.type === "Recharge").length, 1);
    return {
      recharged,
      spent,
      refunds,
      total: transactions.length,
      averageRecharge: recharged / rechargeCount,
    };
  }, [transactions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions.filter((item) => {
      if (typeFilter !== "All" && item.type !== typeFilter) return false;
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (!term) return true;
      return `${item.transactionId} ${item.user} ${item.type}`.toLowerCase().includes(term);
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const refundTransaction = (item: AdminTransaction) => {
    const refund: AdminTransaction = {
      id: generateId("txn"),
      transactionId: generateId("TRX"),
      user: item.user,
      type: "Refund",
      amount: Math.abs(item.amount),
      status: "Success",
      gateway: "Wallet",
      date: new Date().toISOString(),
      reason: `Refund against ${item.transactionId}`,
    };
    persistTransactions([refund, ...transactions]);
    alert(`Refund transaction created for ${item.transactionId}.`);
  };

  const addManualCredit = () => {
    const amount = Number(creditAmount);
    if (!creditPhone.trim() || !amount || amount <= 0) {
      alert("Phone and valid amount are required.");
      return;
    }

    const tx: AdminTransaction = {
      id: generateId("txn"),
      transactionId: generateId("TRX"),
      user: creditPhone.trim(),
      type: "Admin Credit",
      amount,
      status: "Success",
      gateway: "Wallet",
      date: new Date().toISOString(),
      reason: creditReason,
    };
    persistTransactions([tx, ...transactions]);

    const nextUsers = users.map((user) =>
      user.phone === creditPhone.trim() ? { ...user, walletBalance: user.walletBalance + amount } : user,
    );
    persistUsers(nextUsers);

    setCreditOpen(false);
    alert("Manual credit added.");
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Wallet</h2>
        <button type="button" onClick={() => setCreditOpen(true)} className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white">
          Manual Credit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Recharged</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.recharged)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Spent</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.spent)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Refunds</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.refunds)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Transactions</p><p className="mt-2 text-2xl font-semibold text-slate-900">{stats.total}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Average Recharge</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.averageRecharge)}</p></article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by transaction ID or phone..." />
        <div className="mb-3 flex flex-wrap gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="All">All Types</option>
            <option value="Recharge">Recharge</option>
            <option value="Booking">Booking</option>
            <option value="Refund">Refund</option>
            <option value="Admin Credit">Admin Credit</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="All">All Status</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

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
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-800">{item.transactionId}</td>
                  <td className="px-2 py-2 text-slate-700">{item.user}</td>
                  <td className="px-2 py-2 text-slate-700">{item.type}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2 text-slate-700">{item.gateway}</td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.date)}</td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "View", onClick: () => setSelected(item) },
                        { label: "Refund", tone: "warning", onClick: () => refundTransaction(item) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title={selected ? selected.transactionId : "Transaction"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">User:</span> {selected.user}</p>
            <p><span className="font-semibold text-slate-900">Type:</span> {selected.type}</p>
            <p><span className="font-semibold text-slate-900">Amount:</span> {formatINR(selected.amount)}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Gateway:</span> {selected.gateway}</p>
            <p><span className="font-semibold text-slate-900">Date:</span> {formatDateTime(selected.date)}</p>
            <p><span className="font-semibold text-slate-900">Reason:</span> {selected.reason ?? "-"}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>

      {creditOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">Add Manual Wallet Credit</h3>
            <div className="mt-4 space-y-3">
              <input value={creditPhone} onChange={(e) => setCreditPhone(e.target.value)} placeholder="User Phone" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Amount" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={creditReason} onChange={(e) => setCreditReason(e.target.value)} placeholder="Reason" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setCreditOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={addManualCredit} className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white">Add Credit</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
