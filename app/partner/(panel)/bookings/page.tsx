"use client";

import { useEffect, useMemo, useState } from "react";
import { getPartnerBookings as getPartnerBookingsApi } from "@/lib/api/partner";
import {
  fetchPartnerApprovalState,
  getLocalPartnerApprovalState,
  isPartnerApproved,
  type PartnerApprovalState,
} from "@/lib/partnerApproval";

type BookingFilter = "All" | "Upcoming" | "Completed" | "Cancelled";

type BookingRow = {
  id: string;
  bookingId: string;
  userMaskedPhone: string;
  type: string;
  date: string;
  price: number;
  status: "Upcoming" | "Completed" | "Cancelled";
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

function mapStatus(value: unknown): BookingRow["status"] {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "COMPLETED") return "Completed";
  if (normalized === "CANCELLED") return "Cancelled";
  return "Upcoming";
}

function toBookingRows(data: Record<string, unknown>[] | null) {
  if (!data) return [];
  return data.map((booking, index) => ({
    id: String(booking.id ?? `booking-${index + 1}`),
    bookingId: String(booking.bookingCode ?? booking.bookingId ?? booking.id ?? `BOOK-${index + 1}`),
    userMaskedPhone: String(
      (booking.user as Record<string, unknown> | undefined)?.phoneNumber ??
        booking.userPhone ??
        booking.userMaskedPhone ??
        "Member",
    ),
    type: String(booking.serviceType ?? booking.type ?? "Chat"),
    date: String(booking.scheduledAt ?? booking.createdAt ?? booking.date ?? new Date().toISOString()),
    price: Number(booking.amount ?? booking.price ?? 0),
    status: mapStatus(booking.status),
  }));
}

export default function PartnerBookingsPage() {
  const [filter, setFilter] = useState<BookingFilter>("All");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalState, setApprovalState] = useState<PartnerApprovalState>(() => getLocalPartnerApprovalState());
  const isApproved = isPartnerApproved(approvalState);

  useEffect(() => {
    void (async () => {
      const [approval, bookingsResponse] = await Promise.all([
        fetchPartnerApprovalState(),
        getPartnerBookingsApi(),
      ]);
      setApprovalState(approval);
      setBookings(toBookingRows(bookingsResponse.data ?? []));
      setLoading(false);
    })();
  }, []);

  const filteredBookings = useMemo(() => {
    if (filter === "All") return bookings;
    return bookings.filter((item) => item.status === filter);
  }, [bookings, filter]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Conversations</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "Upcoming", "Completed", "Cancelled"] as BookingFilter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                filter === item ? "bg-[#1d4ed8] text-white" : "border border-slate-200 bg-white text-slate-700"
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
                <th className="px-2 py-2">Booking ID</th>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Conversation</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-sm text-slate-500">
                    No bookings yet.
                  </td>
                </tr>
              ) : null}
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-800">{booking.bookingId}</td>
                  <td className="px-2 py-2 text-slate-700">{booking.userMaskedPhone}</td>
                  <td className="px-2 py-2 text-slate-700">{booking.type}</td>
                  <td className="px-2 py-2 text-slate-700">{new Date(booking.date).toLocaleString("en-IN")}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(booking.price)}</td>
                  <td className="px-2 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <button
                      disabled={!isApproved}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      Join
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
