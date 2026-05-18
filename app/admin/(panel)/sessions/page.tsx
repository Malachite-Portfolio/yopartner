"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { formatDateTime, formatINR, getAdminSessions, setAdminSessions } from "@/lib/adminStore";
import type { AdminSession } from "@/lib/adminData";

type SessionTab = "All" | "Live" | "Completed" | "Failed" | "Flagged";

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>(() => getAdminSessions());
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<SessionTab>("All");
  const [selected, setSelected] = useState<AdminSession | null>(null);

  const persist = (next: AdminSession[]) => {
    setSessions(next);
    setAdminSessions(next);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sessions.filter((item) => {
      if (tab !== "All" && item.status !== tab) return false;
      if (!term) return true;
      return `${item.sessionId} ${item.user} ${item.companion} ${item.type}`.toLowerCase().includes(term);
    });
  }, [sessions, search, tab]);

  const markFlagged = (item: AdminSession) => {
    const next = sessions.map((entry) => {
      if (entry.id !== item.id) return entry;
      return { ...entry, safetyFlag: true, status: "Flagged" as const };
    });
    persist(next);
  };

  const endSession = (item: AdminSession) => {
    const next = sessions.map((entry) => {
      if (entry.id !== item.id) return entry;
      return {
        ...entry,
        status: "Completed" as const,
        endedAt: new Date().toISOString(),
        duration: entry.duration || "00:20:00",
      };
    });
    persist(next);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Conversations Monitor</h2>
        <button
          type="button"
          onClick={() => alert("CSV export is not available yet.")}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Export CSV
        </button>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by session ID, user, companion or type..."
        />

        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "Live", "Completed", "Failed", "Flagged"] as SessionTab[]).map((item) => (
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

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Session ID</th>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Companion</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Started At</th>
                <th className="px-2 py-2">Duration</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Safety Flag</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-800">{item.sessionId}</td>
                  <td className="px-2 py-2 text-slate-700">{item.user}</td>
                  <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                  <td className="px-2 py-2 text-slate-700">{item.type}</td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.startedAt)}</td>
                  <td className="px-2 py-2 text-slate-700">{item.duration}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.safetyFlag ? "Flagged" : "Clear"} /></td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "View Details", onClick: () => setSelected(item) },
                        { label: "Mark Flagged", tone: "warning", onClick: () => markFlagged(item) },
                        { label: "End Session", tone: "danger", onClick: () => endSession(item) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <AdminDetailDrawer
        open={Boolean(selected)}
        title={selected ? `Session ${selected.sessionId}` : "Session Details"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Participants:</span> {selected.user} and {selected.companion}</p>
            <p><span className="font-semibold text-slate-900">Service Type:</span> {selected.type}</p>
            <p><span className="font-semibold text-slate-900">Started At:</span> {formatDateTime(selected.startedAt)}</p>
            <p><span className="font-semibold text-slate-900">Duration:</span> {selected.duration}</p>
            <p><span className="font-semibold text-slate-900">Wallet Amount:</span> {formatINR(selected.amount)}</p>
            <p><span className="font-semibold text-slate-900">Platform Fee:</span> {formatINR(selected.platformFee)}</p>
            <p><span className="font-semibold text-slate-900">Companion Earning:</span> {formatINR(selected.companionEarning)}</p>
            <p><span className="font-semibold text-slate-900">Safety Notes:</span> {selected.safetyNotes || "No notes."}</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              {selected.type === "Chat" ? "Chat transcript unavailable." : "Call metadata placeholder for audio/video session monitoring."}
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
