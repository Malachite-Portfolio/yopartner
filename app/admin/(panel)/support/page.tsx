"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { formatDateTime, getAdminSupportTickets, setAdminSupportTickets } from "@/lib/adminStore";
import type { AdminTicket, AdminTicketStatus } from "@/lib/adminData";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>(() => getAdminSupportTickets());
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"All" | AdminTicketStatus>("All");
  const [selected, setSelected] = useState<AdminTicket | null>(null);

  const persist = (next: AdminTicket[]) => {
    setTickets(next);
    setAdminSupportTickets(next);
  };

  const stats = useMemo(() => {
    const open = tickets.filter((item) => item.status === "Open").length;
    const inProgress = tickets.filter((item) => item.status === "In Progress").length;
    const resolved = tickets.filter((item) => item.status === "Resolved").length;
    const urgent = tickets.filter((item) => item.priority === "Urgent").length;
    return { open, inProgress, resolved, urgent };
  }, [tickets]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((item) => {
      if (selectedStatus !== "All" && item.status !== selectedStatus) return false;
      if (!term) return true;
      return `${item.ticketId} ${item.userOrPartner} ${item.subject}`.toLowerCase().includes(term);
    });
  }, [tickets, search, selectedStatus]);

  const updateTicket = (target: AdminTicket, patch: Partial<AdminTicket>) => {
    const next = tickets.map((item) => (item.id === target.id ? { ...item, ...patch } : item));
    persist(next);
    setSelected((current) => (current?.id === target.id ? { ...current, ...patch } : current));
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Support</h2>

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
          searchPlaceholder="Search tickets by ID, actor or subject..."
          filterValue={selectedStatus}
          onFilterChange={(value) => setSelectedStatus(value as "All" | AdminTicketStatus)}
          filterOptions={["All", "Open", "In Progress", "Resolved"]}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Ticket ID</th>
                <th className="px-2 py-2">User/Partner</th>
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
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-2 py-2 font-medium text-slate-800">{item.ticketId}</td>
                  <td className="px-2 py-2 text-slate-700">{item.userOrPartner}</td>
                  <td className="px-2 py-2 text-slate-700">{item.type}</td>
                  <td className="px-2 py-2 text-slate-700">{item.subject}</td>
                  <td className="px-2 py-2 text-slate-700">{item.priority}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.date)}</td>
                  <td className="px-2 py-2 text-slate-700">{item.assignedTo ?? "Unassigned"}</td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "View", onClick: () => setSelected(item) },
                        {
                          label: "Assign",
                          onClick: () => {
                            const assignee = window.prompt("Assign to:", item.assignedTo ?? "Ops Team");
                            if (!assignee) return;
                            updateTicket(item, {
                              assignedTo: assignee,
                              timeline: [...item.timeline, `Assigned to ${assignee}`],
                            });
                          },
                        },
                        {
                          label: "Mark In Progress",
                          tone: "warning",
                          onClick: () =>
                            updateTicket(item, {
                              status: "In Progress",
                              timeline: [...item.timeline, "Moved to In Progress"],
                            }),
                        },
                        {
                          label: "Mark Resolved",
                          tone: "success",
                          onClick: () =>
                            updateTicket(item, {
                              status: "Resolved",
                              timeline: [...item.timeline, "Resolved by admin"],
                            }),
                        },
                        {
                          label: "Add Internal Note",
                          onClick: () => {
                            const note = window.prompt("Internal note:", "");
                            if (!note) return;
                            updateTicket(item, { notes: [...item.notes, note] });
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

      <AdminDetailDrawer open={Boolean(selected)} title={selected ? selected.ticketId : "Ticket Details"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Actor:</span> {selected.actor}</p>
            <p><span className="font-semibold text-slate-900">Identity:</span> {selected.userOrPartner}</p>
            <p><span className="font-semibold text-slate-900">Issue:</span> {selected.subject}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Assigned To:</span> {selected.assignedTo ?? "Unassigned"}</p>
            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Notes</h4>
              {selected.notes.length > 0 ? (
                <ul className="space-y-2">
                  {selected.notes.map((note, index) => (
                    <li key={`${note}-${index}`} className="rounded-lg border border-slate-200 p-2">{note}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No internal notes.</p>
              )}
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Timeline</h4>
              <ul className="space-y-2">
                {selected.timeline.map((event, index) => (
                  <li key={`${event}-${index}`} className="rounded-lg border border-slate-200 p-2">{event}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
