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
  getAdminBookings,
  getAdminTransactions,
  setAdminBookings,
  setAdminTransactions,
} from "@/lib/adminStore";
import type { AdminBooking, AdminBookingStatus, AdminTransaction } from "@/lib/adminData";

type BookingFilter = "All" | AdminBookingStatus;

function mapExternalBookings(raw: Array<Record<string, unknown>>): AdminBooking[] {
  return raw.map((item, index) => ({
    id: String(item.id ?? `ext-${index}`),
    bookingId: String(item.bookingId ?? generateId("YP")),
    user: String(item.user ?? item.phone ?? "+919900000000"),
    companion: String(item.companionName ?? item.companion ?? "Unassigned"),
    serviceType:
      item.serviceType === "audio" || item.serviceType === "video" || item.serviceType === "visit" || item.serviceType === "chat"
        ? item.serviceType
        : "chat",
    amount: Number(item.amount ?? item.price ?? 0),
    status:
      item.status === "Confirmed" || item.status === "Pending" || item.status === "Completed" || item.status === "Cancelled"
        ? item.status
        : "Pending",
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    scheduledAt: String(item.scheduledAt ?? item.createdAt ?? new Date().toISOString()),
  }));
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>(() => {
    const base = getAdminBookings();
    let merged = [...base];

    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("yopartner_bookings_cache");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const external = mapExternalBookings(parsed);
            const existingIds = new Set(base.map((item) => item.bookingId));
            merged = [...base, ...external.filter((item) => !existingIds.has(item.bookingId))];
          }
        } catch {
          // Ignore malformed local booking data.
        }
      }
    }
    return merged;
  });
  const [transactions, setTransactions] = useState<AdminTransaction[]>(() => getAdminTransactions());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BookingFilter>("All");
  const [selected, setSelected] = useState<AdminBooking | null>(null);

  const persistBookings = (next: AdminBooking[]) => {
    setBookings(next);
    setAdminBookings(next);
  };

  const persistTransactions = (next: AdminTransaction[]) => {
    setTransactions(next);
    setAdminTransactions(next);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((item) => {
      if (filter !== "All" && item.status !== filter) return false;
      if (!term) return true;
      return `${item.bookingId} ${item.user} ${item.companion}`.toLowerCase().includes(term);
    });
  }, [bookings, search, filter]);

  const updateBookingStatus = (target: AdminBooking, status: AdminBookingStatus) => {
    const next = bookings.map((item) => (item.id === target.id ? { ...item, status } : item));
    persistBookings(next);
    setSelected((item) => (item?.id === target.id ? { ...item, status } : item));
  };

  const refundBooking = (target: AdminBooking) => {
    const tx: AdminTransaction = {
      id: generateId("txn"),
      transactionId: generateId("TRX"),
      user: target.user,
      type: "Refund",
      amount: target.amount,
      status: "Success",
      gateway: "Wallet",
      date: new Date().toISOString(),
      reason: `Refund for ${target.bookingId}`,
    };
    persistTransactions([tx, ...transactions]);
    alert(`Refund transaction created for ${target.bookingId}.`);
  };

  const assignCompanion = (target: AdminBooking) => {
    const companion = window.prompt("Assign companion name:", target.companion);
    if (!companion) return;
    const next = bookings.map((item) => (item.id === target.id ? { ...item, companion } : item));
    persistBookings(next);
    setSelected((item) => (item?.id === target.id ? { ...item, companion } : item));
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Bookings</h2>
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by booking ID, user or companion..."
          filterValue={filter}
          onFilterChange={(value) => setFilter(value as BookingFilter)}
          filterOptions={["All", "Confirmed", "Pending", "Completed", "Cancelled"]}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Booking ID</th>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Companion</th>
                <th className="px-2 py-2">Service Type</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Created At</th>
                <th className="px-2 py-2">Scheduled At</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-800">{item.bookingId}</td>
                  <td className="px-2 py-2 text-slate-700">{item.user}</td>
                  <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                  <td className="px-2 py-2 text-slate-700">{item.serviceType}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.createdAt)}</td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.scheduledAt)}</td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "View Details", onClick: () => setSelected(item) },
                        { label: "Mark Completed", tone: "success", onClick: () => updateBookingStatus(item, "Completed") },
                        { label: "Cancel", tone: "danger", onClick: () => updateBookingStatus(item, "Cancelled") },
                        { label: "Refund", tone: "warning", onClick: () => refundBooking(item) },
                        { label: "Assign Companion", onClick: () => assignCompanion(item) },
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
        title={selected ? `Booking ${selected.bookingId}` : "Booking Details"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">User:</span> {selected.user}</p>
            <p><span className="font-semibold text-slate-900">Companion:</span> {selected.companion}</p>
            <p><span className="font-semibold text-slate-900">Service:</span> {selected.serviceType}</p>
            <p><span className="font-semibold text-slate-900">Amount:</span> {formatINR(selected.amount)}</p>
            <p><span className="font-semibold text-slate-900">Created At:</span> {formatDateTime(selected.createdAt)}</p>
            <p><span className="font-semibold text-slate-900">Scheduled At:</span> {formatDateTime(selected.scheduledAt)}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
