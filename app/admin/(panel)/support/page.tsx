"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { listSupportTickets } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime } from "@/lib/adminFormat";

type TicketStatus = "Open" | "In Progress" | "Resolved";

type TicketRow = {
  id: string;
  ticketCode: string;
  user: string;
  type: string;
  subject: string;
  priority: string;
  status: TicketStatus;
  date: string;
  assignedTo: string;
  message: string;
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

function toTicketStatus(value: unknown): TicketStatus {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "RESOLVED") return "Resolved";
  if (normalized === "IN_PROGRESS") return "In Progress";
  return "Open";
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"All" | TicketStatus>("All");
  const [selected, setSelected] = useState<TicketRow | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const response = await listSupportTickets();

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setRows([]);
      setErrorMessage(response.error?.message || "Unable to load support tickets.");
      setLoading(false);
      return;
    }

    const tickets = asArray(asRecord(response.data).tickets).map((row) => {
      const user = asRecord(row.user);
      return {
        id: asString(row.id),
        ticketCode: asString(row.ticketCode, asString(row.id)),
        user: asString(user.phoneNumber ?? user.name),
        type: asString(row.type),
        subject: asString(row.subject),
        priority: asString(row.priority, "MEDIUM"),
        status: toTicketStatus(row.status),
        date: asString(row.createdAt, new Date().toISOString()),
        assignedTo: asString(row.assignedTo, "Unassigned"),
        message: asString(row.message, "-"),
      } satisfies TicketRow;
    });

    setRows(tickets.sort((a, b) => +new Date(b.date) - +new Date(a.date)));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTickets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTickets]);

  const stats = useMemo(() => {
    const open = rows.filter((item) => item.status === "Open").length;
    const inProgress = rows.filter((item) => item.status === "In Progress").length;
    const resolved = rows.filter((item) => item.status === "Resolved").length;
    const urgent = rows.filter((item) => item.priority.toUpperCase() === "URGENT").length;
    return { open, inProgress, resolved, urgent };
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (selectedStatus !== "All" && item.status !== selectedStatus) return false;
      if (!term) return true;
      return `${item.ticketCode} ${item.user} ${item.subject}`.toLowerCase().includes(term);
    });
  }, [rows, search, selectedStatus]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Support</h2>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Open</p><p className="mt-1 text-xl font-semibold text-slate-900">{stats.open}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">In Progress</p><p className="mt-1 text-xl font-semibold text-slate-900">{stats.inProgress}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Resolved</p><p className="mt-1 text-xl font-semibold text-slate-900">{stats.resolved}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Urgent</p><p className="mt-1 text-xl font-semibold text-slate-900">{stats.urgent}</p></article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tickets by code, user or subject..."
          filterValue={selectedStatus}
          onFilterChange={(value) => setSelectedStatus(value as "All" | TicketStatus)}
          filterOptions={["All", "Open", "In Progress", "Resolved"]}
        />

        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading support tickets...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Ticket ID</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Subject</th>
                  <th className="px-2 py-2">Priority</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Assigned To</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-3 text-slate-500">No support tickets found.</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.ticketCode}</td>
                      <td className="px-2 py-2 text-slate-700">{item.user}</td>
                      <td className="px-2 py-2 text-slate-700">{item.type}</td>
                      <td className="px-2 py-2 text-slate-700">{item.subject}</td>
                      <td className="px-2 py-2 text-slate-700">{item.priority}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                      <td className="px-2 py-2 text-slate-700">{formatDateTime(item.date)}</td>
                      <td className="px-2 py-2 text-slate-700">{item.assignedTo}</td>
                      <td className="px-2 py-2">
                        <AdminActionMenu actions={[{ label: "View", onClick: () => setSelected(item) }]} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title={selected ? selected.ticketCode : "Ticket Details"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">User:</span> {selected.user}</p>
            <p><span className="font-semibold text-slate-900">Subject:</span> {selected.subject}</p>
            <p><span className="font-semibold text-slate-900">Type:</span> {selected.type}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Assigned To:</span> {selected.assignedTo}</p>
            <p><span className="font-semibold text-slate-900">Message:</span> {selected.message}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
