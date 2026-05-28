"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { listBookings } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime, formatINR } from "@/lib/adminFormat";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

type BookingRow = {
  id: string;
  bookingCode: string;
  user: string;
  companion: string;
  serviceType: string;
  amount: number;
  status: BookingStatus;
  createdAt: string;
  scheduledAt: string;
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

function asBookingStatus(value: unknown): BookingStatus {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "PENDING" || normalized === "CONFIRMED" || normalized === "COMPLETED" || normalized === "CANCELLED") {
    return normalized;
  }
  return "PENDING";
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [selected, setSelected] = useState<BookingRow | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const response = await listBookings();

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setRows([]);
      setErrorMessage(response.error?.message || "Unable to load bookings.");
      setLoading(false);
      return;
    }

    const root = asRecord(response.data);
    const bookings = asArray(root.bookings).map((row) => {
      const user = asRecord(row.user);
      const companion = asRecord(row.companion);
      return {
        id: asString(row.id),
        bookingCode: asString(row.bookingCode, asString(row.id)),
        user: asString(user.phoneNumber ?? user.name),
        companion: asString(companion.displayName ?? companion.name),
        serviceType: asString(row.serviceType),
        amount: asNumber(row.amount),
        status: asBookingStatus(row.status),
        createdAt: asString(row.createdAt, new Date().toISOString()),
        scheduledAt: asString(row.scheduledAt ?? row.createdAt, new Date().toISOString()),
      } satisfies BookingRow;
    });

    setRows(bookings.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBookings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (filter !== "ALL" && item.status !== filter) return false;
      if (!term) return true;
      return `${item.bookingCode} ${item.user} ${item.companion}`.toLowerCase().includes(term);
    });
  }, [rows, search, filter]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Bookings</h2>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by booking ID, user or companion..."
          filterValue={filter}
          onFilterChange={(value) => setFilter(value as "ALL" | BookingStatus)}
          filterOptions={["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]}
        />

        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading bookings...</p>
        ) : (
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-3 text-slate-500">No bookings found.</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.bookingCode}</td>
                      <td className="px-2 py-2 text-slate-700">{item.user}</td>
                      <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                      <td className="px-2 py-2 text-slate-700">{item.serviceType}</td>
                      <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                      <td className="px-2 py-2 text-slate-700">{formatDateTime(item.createdAt)}</td>
                      <td className="px-2 py-2 text-slate-700">{formatDateTime(item.scheduledAt)}</td>
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
        title={selected ? `Booking ${selected.bookingCode}` : "Booking Details"}
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
