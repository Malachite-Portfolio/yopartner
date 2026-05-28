"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { listSessions } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime, formatINR } from "@/lib/adminFormat";

type SessionRow = {
  id: string;
  sessionCode: string;
  user: string;
  companion: string;
  type: string;
  startedAt: string;
  durationSeconds: number;
  amount: number;
  status: string;
  safetyFlag: boolean;
  safetyNote: string;
  platformFee: number;
  companionEarning: number;
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

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function AdminSessionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"All" | "LIVE" | "ENDED" | "FLAGGED">("All");
  const [selected, setSelected] = useState<SessionRow | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const response = await listSessions();

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setRows([]);
      setErrorMessage(response.error?.message || "Unable to load conversations.");
      setLoading(false);
      return;
    }

    const sessions = asArray(asRecord(response.data).sessions).map((row) => {
      const user = asRecord(row.user);
      const companion = asRecord(row.companion);
      return {
        id: asString(row.id),
        sessionCode: asString(row.sessionCode, asString(row.id)),
        user: asString(user.phoneNumber ?? user.name),
        companion: asString(companion.displayName ?? companion.name),
        type: asString(row.serviceType),
        startedAt: asString(row.startedAt ?? row.liveStartedAt ?? row.acceptedAt ?? row.createdAt, new Date().toISOString()),
        durationSeconds: asNumber(row.durationSeconds),
        amount: asNumber(row.amount),
        status: asString(row.status),
        safetyFlag: Boolean(row.safetyFlag),
        safetyNote: asString(row.safetyNote, ""),
        platformFee: asNumber(row.platformFee),
        companionEarning: asNumber(row.companionEarning),
      } satisfies SessionRow;
    });

    setRows(sessions.sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSessions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSessions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (tab === "LIVE" && item.status !== "LIVE") return false;
      if (tab === "ENDED" && item.status !== "ENDED") return false;
      if (tab === "FLAGGED" && !item.safetyFlag) return false;
      if (!term) return true;
      return `${item.sessionCode} ${item.user} ${item.companion} ${item.type}`.toLowerCase().includes(term);
    });
  }, [rows, search, tab]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Conversations Monitor</h2>
      </div>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by session code, user, partner or type..."
        />

        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "LIVE", "ENDED", "FLAGGED"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                tab === item ? "bg-[#2563eb] text-white" : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading conversations...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Session</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Partner</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Started At</th>
                  <th className="px-2 py-2">Duration</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Safety</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-2 py-3 text-slate-500">No conversations found.</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.sessionCode}</td>
                      <td className="px-2 py-2 text-slate-700">{item.user}</td>
                      <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                      <td className="px-2 py-2 text-slate-700">{item.type}</td>
                      <td className="px-2 py-2 text-slate-700">{formatDateTime(item.startedAt)}</td>
                      <td className="px-2 py-2 text-slate-700">{formatDuration(item.durationSeconds)}</td>
                      <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.safetyFlag ? "Flagged" : "Clear"} /></td>
                      <td className="px-2 py-2">
                        <AdminActionMenu actions={[{ label: "View Details", onClick: () => setSelected(item) }]} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <AdminDetailDrawer
        open={Boolean(selected)}
        title={selected ? `Session ${selected.sessionCode}` : "Session Details"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Participants:</span> {selected.user} and {selected.companion}</p>
            <p><span className="font-semibold text-slate-900">Service Type:</span> {selected.type}</p>
            <p><span className="font-semibold text-slate-900">Started At:</span> {formatDateTime(selected.startedAt)}</p>
            <p><span className="font-semibold text-slate-900">Duration:</span> {formatDuration(selected.durationSeconds)}</p>
            <p><span className="font-semibold text-slate-900">Wallet Amount:</span> {formatINR(selected.amount)}</p>
            <p><span className="font-semibold text-slate-900">Platform Fee:</span> {formatINR(selected.platformFee)}</p>
            <p><span className="font-semibold text-slate-900">Partner Earning:</span> {formatINR(selected.companionEarning)}</p>
            <p><span className="font-semibold text-slate-900">Safety Notes:</span> {selected.safetyNote || "No notes."}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
