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
  getAdminSessions,
  getAdminTransactions,
  getAdminUsers,
  setAdminTransactions,
  setAdminUsers,
} from "@/lib/adminStore";
import type { AdminSession, AdminTransaction, AdminUser } from "@/lib/adminData";

type UserFilter = "All" | AdminUser["status"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(() => getAdminUsers());
  const [sessions] = useState<AdminSession[]>(() => getAdminSessions());
  const [transactions, setTransactions] = useState<AdminTransaction[]>(() => getAdminTransactions());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("All");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [creditTarget, setCreditTarget] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState("500");
  const [creditReason, setCreditReason] = useState("Admin goodwill credit");

  const persistUsers = (next: AdminUser[]) => {
    setUsers(next);
    setAdminUsers(next);
  };

  const persistTransactions = (next: AdminTransaction[]) => {
    setTransactions(next);
    setAdminTransactions(next);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((item) => {
      if (filter !== "All" && item.status !== filter) return false;
      if (!term) return true;
      return `${item.name} ${item.phone}`.toLowerCase().includes(term);
    });
  }, [users, search, filter]);

  const addCredit = () => {
    if (!creditTarget) return;
    const amount = Number(creditAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid credit amount.");
      return;
    }
    const nextUsers = users.map((item) =>
      item.id === creditTarget.id
        ? { ...item, walletBalance: item.walletBalance + amount }
        : item,
    );
    persistUsers(nextUsers);

    const newTx: AdminTransaction = {
      id: generateId("txn"),
      transactionId: generateId("TRX"),
      user: creditTarget.phone,
      type: "Admin Credit",
      amount,
      status: "Success",
      gateway: "Demo",
      date: new Date().toISOString(),
      reason: creditReason,
    };
    persistTransactions([newTx, ...transactions]);
    setCreditTarget(null);
    alert("Demo wallet credit added successfully.");
  };

  const selectedSessions = useMemo(
    () => (selected ? sessions.filter((item) => item.user === selected.phone).slice(0, 5) : []),
    [selected, sessions],
  );
  const selectedTransactions = useMemo(
    () => (selected ? transactions.filter((item) => item.user === selected.phone).slice(0, 8) : []),
    [selected, transactions],
  );

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Members</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or phone..."
          filterValue={filter}
          onFilterChange={(value) => setFilter(value as UserFilter)}
          filterOptions={["All", "Active", "Blocked", "New", "High Value"]}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Wallet Balance</th>
                <th className="px-2 py-2">Total Bookings</th>
                <th className="px-2 py-2">Total Spent</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Joined Date</th>
                <th className="px-2 py-2">Last Login</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-800">{item.name}</td>
                  <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.walletBalance)}</td>
                  <td className="px-2 py-2 text-slate-700">{item.totalBookings}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.totalSpent)}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.joinedDate)}</td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.lastLogin)}</td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "View", onClick: () => setSelected(item) },
                        {
                          label: item.status === "Blocked" ? "Unblock" : "Block",
                          tone: item.status === "Blocked" ? "success" : "danger",
                          onClick: () => {
                            const next = users.map((entry) => {
                              if (entry.id !== item.id) return entry;
                              const status: AdminUser["status"] =
                                entry.status === "Blocked" ? "Active" : "Blocked";
                              return { ...entry, status };
                            });
                            persistUsers(next);
                          },
                        },
                        {
                          label: "Add Wallet Credit",
                          tone: "warning",
                          onClick: () => {
                            setCreditTarget(item);
                            setCreditAmount("500");
                            setCreditReason("Admin goodwill credit");
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

      <AdminDetailDrawer open={Boolean(selected)} title={selected ? `${selected.name} Details` : "Member Details"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-5 text-sm text-slate-700">
            <div className="space-y-2">
              <p><span className="font-semibold text-slate-900">Phone:</span> {selected.phone}</p>
              <p><span className="font-semibold text-slate-900">Wallet balance:</span> {formatINR(selected.walletBalance)}</p>
              <p><span className="font-semibold text-slate-900">Total bookings:</span> {selected.totalBookings}</p>
              <p><span className="font-semibold text-slate-900">Total spent:</span> {formatINR(selected.totalSpent)}</p>
              <p><span className="font-semibold text-slate-900">Last login:</span> {formatDateTime(selected.lastLogin)}</p>
              <p><span className="font-semibold text-slate-900">Joined date:</span> {formatDateTime(selected.joinedDate)}</p>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-900">Recent Sessions</h4>
              <div className="space-y-2">
                {selectedSessions.length > 0 ? (
                  selectedSessions.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-slate-200 p-2">
                      {entry.type} with {entry.companion} ({entry.duration})
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No recent sessions.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-900">Wallet Transactions</h4>
              <div className="space-y-2">
                {selectedTransactions.length > 0 ? (
                  selectedTransactions.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-slate-200 p-2">
                      {entry.type}: {formatINR(entry.amount)} ({entry.status})
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No wallet transactions.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>

      {creditTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">Add Wallet Credit</h3>
            <p className="mt-1 text-sm text-slate-600">{creditTarget.name} ({creditTarget.phone})</p>
            <div className="mt-4 space-y-3">
              <input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Amount" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={creditReason} onChange={(e) => setCreditReason(e.target.value)} placeholder="Reason" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setCreditTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={addCredit} className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white">Add Credit</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
