"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import {
  creditUserWallet,
  listSessions,
  listUsers,
  listWalletTransactions,
  type AdminUserModerationStatus,
  updateAdminUserStatus,
} from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime, formatINR } from "@/lib/adminFormat";

type MemberRow = {
  id: string;
  name: string;
  phone: string;
  walletBalance: number;
  totalBookings: number;
  totalSessions: number;
  totalSpent: number;
  moderationStatus: AdminUserModerationStatus;
  moderationReason: string;
  moderationExpiresAt: string;
  joinedDate: string;
  lastLogin: string;
};

type SessionSnippet = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  companionName: string;
};

type TxSnippet = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

type StatusTarget = {
  user: MemberRow;
  status: AdminUserModerationStatus;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => asRecord(item)) : [];
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function normalizeModerationStatus(value: unknown, isBlocked: boolean): AdminUserModerationStatus {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "ACTIVE" || raw === "RESTRICTED" || raw === "TEMP_BANNED" || raw === "BANNED") {
    return raw;
  }
  return isBlocked ? "BANNED" : "ACTIVE";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | AdminUserModerationStatus>("All");
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [sessionsByUser, setSessionsByUser] = useState<Record<string, SessionSnippet[]>>({});
  const [transactionsByUser, setTransactionsByUser] = useState<Record<string, TxSnippet[]>>({});
  const [selected, setSelected] = useState<MemberRow | null>(null);
  const [creditTarget, setCreditTarget] = useState<MemberRow | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusExpiresAt, setStatusExpiresAt] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState("");

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const [usersResponse, sessionsResponse, walletResponse] = await Promise.all([
      listUsers(),
      listSessions(),
      listWalletTransactions(),
    ]);

    const responses = [usersResponse, sessionsResponse, walletResponse];
    if (responses.some((response) => response.error?.status === 401)) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (!usersResponse.data) {
      setRows([]);
      setErrorMessage(usersResponse.error?.message || "Unable to load members right now.");
      setLoading(false);
      return;
    }

    const usersRoot = asRecord(usersResponse.data);
    const userRows = asArray(usersRoot.users);
    const sessionRows = asArray(asRecord(sessionsResponse.data).sessions);
    const txRows = asArray(asRecord(walletResponse.data).transactions);

    const sessionMap: Record<string, SessionSnippet[]> = {};
    for (const row of sessionRows) {
      const userId = asString(row.userId);
      if (!userId) continue;
      const companion = asRecord(row.companion);
      const entry: SessionSnippet = {
        id: asString(row.id, "-"),
        type: asString(row.serviceType, "-"),
        status: asString(row.status, "-"),
        createdAt: asString(row.createdAt),
        companionName: asString(companion.displayName ?? companion.name, "-"),
      };
      sessionMap[userId] = [...(sessionMap[userId] ?? []), entry].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }

    const txMap: Record<string, TxSnippet[]> = {};
    const spentMap: Record<string, number> = {};
    for (const row of txRows) {
      const wallet = asRecord(row.walletAccount);
      const user = asRecord(wallet.user);
      const userId = asString(user.id);
      if (!userId) continue;
      const type = asString(row.type);
      const amount = asNumber(row.amount);
      const status = asString(row.status);
      const entry: TxSnippet = {
        id: asString(row.id, "-"),
        type,
        amount,
        status,
        createdAt: asString(row.createdAt),
      };
      txMap[userId] = [...(txMap[userId] ?? []), entry].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      if ((type === "BOOKING" || type === "GIFT") && status === "SUCCESS") {
        spentMap[userId] = (spentMap[userId] ?? 0) + Math.abs(amount);
      }
    }

    const mapped = userRows.map((row) => {
      const userId = asString(row.id);
      const wallet = asRecord(row.walletAccount);
      const bookings = asArray(row.bookings);
      const createdAt = asString(row.createdAt, new Date().toISOString());
      const totalSpent = spentMap[userId] ?? 0;
      const isBlocked = Boolean(row.isBlocked);
      return {
        id: userId,
        name: asString(row.name, "Member"),
        phone: asString(row.phoneNumber, "-"),
        walletBalance: asNumber(wallet.balance),
        totalBookings: bookings.length,
        totalSessions: (sessionMap[userId] ?? []).length,
        totalSpent,
        moderationStatus: normalizeModerationStatus(row.moderationStatus, isBlocked),
        moderationReason: asString(row.moderationReason),
        moderationExpiresAt: asString(row.moderationExpiresAt),
        joinedDate: createdAt,
        lastLogin: asString(row.updatedAt, createdAt),
      } satisfies MemberRow;
    });

    setSessionsByUser(sessionMap);
    setTransactionsByUser(txMap);
    setRows(mapped.sort((a, b) => +new Date(b.joinedDate) - +new Date(a.joinedDate)));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMembers();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadMembers]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (filter !== "All" && item.moderationStatus !== filter) return false;
      if (!term) return true;
      return `${item.name} ${item.phone}`.toLowerCase().includes(term);
    });
  }, [rows, search, filter]);

  const selectedSessions = selected ? (sessionsByUser[selected.id] ?? []).slice(0, 5) : [];
  const selectedTransactions = selected ? (transactionsByUser[selected.id] ?? []).slice(0, 8) : [];

  async function handleSubmitWalletCredit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creditTarget || creditSubmitting) return;

    const parsedAmount = Number(creditAmount);
    if (!Number.isFinite(parsedAmount) || !Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setCreditError("Enter a valid amount greater than zero in whole rupees.");
      return;
    }
    if (parsedAmount > 10000) {
      setCreditError("Amount cannot exceed INR 10,000 per manual credit.");
      return;
    }

    setCreditSubmitting(true);
    setCreditError("");

    const response = await creditUserWallet(creditTarget.id, {
      amount: parsedAmount,
      ...(creditReason.trim() ? { reason: creditReason.trim() } : {}),
    });

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setCreditSubmitting(false);
      setCreditError(response.error?.message ?? "Could not add wallet credit. Please try again.");
      return;
    }

    setCreditSubmitting(false);
    setCreditTarget(null);
    setCreditAmount("");
    setCreditReason("");
    setInfoMessage(`${formatINR(parsedAmount)} added to user wallet.`);
    await loadMembers();
  }

  async function handleSubmitStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!statusTarget || statusSubmitting) return;

    const reason = statusReason.trim();
    if (!reason) {
      setStatusError("Reason is required.");
      return;
    }

    const requiresExpiry = statusTarget.status === "RESTRICTED" || statusTarget.status === "TEMP_BANNED";
    if (requiresExpiry && !statusExpiresAt) {
      setStatusError("Expiry is required for temporary actions.");
      return;
    }

    setStatusSubmitting(true);
    setStatusError("");

    const response = await updateAdminUserStatus(statusTarget.user.id, {
      status: statusTarget.status,
      reason,
      ...(requiresExpiry && statusExpiresAt ? { expiresAt: new Date(statusExpiresAt).toISOString() } : {}),
    });

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setStatusSubmitting(false);
      setStatusError(response.error?.message ?? "Unable to update user status.");
      return;
    }

    setStatusSubmitting(false);
    setStatusTarget(null);
    setStatusReason("");
    setStatusExpiresAt("");
    setInfoMessage(`Updated ${statusTarget.user.name} to ${statusTarget.status}.`);
    await loadMembers();
  }

  function openStatusModal(user: MemberRow, status: AdminUserModerationStatus) {
    setStatusTarget({ user, status });
    setStatusReason("");
    setStatusExpiresAt("");
    setStatusError("");
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Members</h2>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>
      ) : null}
      {infoMessage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{infoMessage}</p>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or phone..."
          filterValue={filter}
          onFilterChange={(value) => setFilter(value as "All" | AdminUserModerationStatus)}
          filterOptions={["All", "ACTIVE", "RESTRICTED", "TEMP_BANNED", "BANNED"]}
        />

        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading members...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Phone</th>
                  <th className="px-2 py-2">Wallet</th>
                  <th className="px-2 py-2">Sessions</th>
                  <th className="px-2 py-2">Spent</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Status Note</th>
                  <th className="px-2 py-2">Joined</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-3 text-slate-500">No members found.</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.name}</td>
                      <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                      <td className="px-2 py-2 text-slate-700">{formatINR(item.walletBalance)}</td>
                      <td className="px-2 py-2 text-slate-700">{item.totalSessions}</td>
                      <td className="px-2 py-2 text-slate-700">{formatINR(item.totalSpent)}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.moderationStatus} /></td>
                      <td className="px-2 py-2 text-xs text-slate-600">
                        {item.moderationReason || "-"}
                        {item.moderationExpiresAt ? <div>Until: {formatDateTime(item.moderationExpiresAt)}</div> : null}
                      </td>
                      <td className="px-2 py-2 text-slate-700">{formatDateTime(item.joinedDate)}</td>
                      <td className="px-2 py-2">
                        <AdminActionMenu
                          actions={[
                            { label: "View", onClick: () => setSelected(item) },
                            { label: "Restrict", tone: "warning", onClick: () => openStatusModal(item, "RESTRICTED") },
                            { label: "Temp Ban", tone: "danger", onClick: () => openStatusModal(item, "TEMP_BANNED") },
                            { label: "Ban", tone: "danger", onClick: () => openStatusModal(item, "BANNED") },
                            { label: "Activate", tone: "success", onClick: () => openStatusModal(item, "ACTIVE") },
                            {
                              label: "Add Wallet Credit",
                              tone: "warning",
                              onClick: () => {
                                setCreditTarget(item);
                                setCreditAmount("");
                                setCreditReason("");
                                setCreditError("");
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title={selected ? `${selected.name} Details` : "Member Details"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-5 text-sm text-slate-700">
            <div className="space-y-2">
              <p><span className="font-semibold text-slate-900">Phone:</span> {selected.phone}</p>
              <p><span className="font-semibold text-slate-900">Wallet balance:</span> {formatINR(selected.walletBalance)}</p>
              <p><span className="font-semibold text-slate-900">Total bookings:</span> {selected.totalBookings}</p>
              <p><span className="font-semibold text-slate-900">Total sessions:</span> {selected.totalSessions}</p>
              <p><span className="font-semibold text-slate-900">Total spent:</span> {formatINR(selected.totalSpent)}</p>
              <p><span className="font-semibold text-slate-900">Status:</span> {selected.moderationStatus}</p>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-900">Recent Sessions</h4>
              <div className="space-y-2">
                {selectedSessions.length > 0 ? (
                  selectedSessions.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-slate-200 p-2">
                      {entry.type} with {entry.companionName} ({entry.status})
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

      <AdminDetailDrawer
        open={Boolean(statusTarget)}
        title={statusTarget ? `Set ${statusTarget.status}` : "Set User Status"}
        onClose={() => {
          if (statusSubmitting) return;
          setStatusTarget(null);
          setStatusReason("");
          setStatusExpiresAt("");
          setStatusError("");
        }}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                setStatusTarget(null);
                setStatusReason("");
                setStatusExpiresAt("");
                setStatusError("");
              }}
              disabled={statusSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="status-update-form"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={statusSubmitting}
            >
              {statusSubmitting ? "Updating..." : "Update Status"}
            </button>
          </div>
        )}
      >
        {statusTarget ? (
          <form id="status-update-form" className="space-y-4" onSubmit={handleSubmitStatus}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Member:</span> {statusTarget.user.name}</p>
              <p><span className="font-semibold text-slate-900">Phone:</span> {statusTarget.user.phone}</p>
              <p><span className="font-semibold text-slate-900">New Status:</span> {statusTarget.status}</p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-800">Reason</span>
              <textarea
                value={statusReason}
                onChange={(event) => setStatusReason(event.target.value)}
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
                placeholder="Required reason for audit trail"
                maxLength={500}
                required
                disabled={statusSubmitting}
              />
            </label>

            {statusTarget.status === "RESTRICTED" || statusTarget.status === "TEMP_BANNED" ? (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-800">Expiry</span>
                <input
                  type="datetime-local"
                  value={statusExpiresAt}
                  onChange={(event) => setStatusExpiresAt(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
                  required
                  disabled={statusSubmitting}
                />
              </label>
            ) : null}

            {statusError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{statusError}</p>
            ) : null}
          </form>
        ) : null}
      </AdminDetailDrawer>

      <AdminDetailDrawer
        open={Boolean(creditTarget)}
        title="Add Wallet Credit"
        onClose={() => {
          if (creditSubmitting) return;
          setCreditTarget(null);
          setCreditAmount("");
          setCreditReason("");
          setCreditError("");
        }}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                setCreditTarget(null);
                setCreditAmount("");
                setCreditReason("");
                setCreditError("");
              }}
              disabled={creditSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="wallet-credit-form"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={creditSubmitting}
            >
              {creditSubmitting ? "Adding..." : "Add Credit"}
            </button>
          </div>
        )}
      >
        {creditTarget ? (
          <form id="wallet-credit-form" className="space-y-4" onSubmit={handleSubmitWalletCredit}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Member:</span> {creditTarget.name}</p>
              <p><span className="font-semibold text-slate-900">Phone:</span> {creditTarget.phone}</p>
              <p><span className="font-semibold text-slate-900">Current Wallet Balance:</span> {formatINR(creditTarget.walletBalance)}</p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-800">Amount</span>
              <input
                type="number"
                min={1}
                max={10000}
                step={1}
                required
                value={creditAmount}
                onChange={(event) => setCreditAmount(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
                placeholder="Enter amount in INR"
                disabled={creditSubmitting}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-800">Reason / Note (optional)</span>
              <textarea
                value={creditReason}
                onChange={(event) => setCreditReason(event.target.value)}
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
                placeholder="e.g. goodwill credit, support resolution"
                maxLength={240}
                disabled={creditSubmitting}
              />
            </label>

            {creditError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {creditError}
              </p>
            ) : null}
          </form>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
