"use client";

import { useEffect, useMemo, useState } from "react";
import { isClientDemoEnabled, isClientDemoPartnerSessionActive } from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import {
  fetchPartnerApprovalState,
  getLocalPartnerApprovalState,
  isPartnerApproved,
  type PartnerApprovalState,
} from "@/lib/partnerApproval";
import { getPartnerBookings } from "@/lib/partnerData";

type BookingFilter = "All" | "Upcoming" | "Completed" | "Cancelled";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

export default function PartnerBookingsPage() {
  const [filter, setFilter] = useState<BookingFilter>("All");
  const bookings = getPartnerBookings();
  const demoEnabled = isClientDemoEnabled();
  const isDemoSession = demoEnabled && isClientDemoPartnerSessionActive();
  const [approvalState, setApprovalState] = useState<PartnerApprovalState>(() => getLocalPartnerApprovalState());
  const isApproved = isPartnerApproved(approvalState);

  const filteredBookings = useMemo(() => {
    if (filter === "All") return bookings;
    return bookings.filter((item) => item.status === filter);
  }, [bookings, filter]);

  useEffect(() => {
    void (async () => {
      const state = await fetchPartnerApprovalState();
      setApprovalState(state);
    })();
  }, []);

  if (IS_PRODUCTION_READY_MODE && !isDemoSession) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-semibold text-amber-800">Partner bookings are unavailable</h2>
        <p className="mt-2 text-sm text-amber-700">Partner booking service is not connected yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Bookings</h2>
        {demoEnabled && isDemoSession ? (
          <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            Client Demo • Preview Mode
          </p>
        ) : null}
      </div>

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
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
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
                    <div className="flex gap-1.5">
                      <button
                        disabled={!isApproved}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        Join
                      </button>
                      <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                        View
                      </button>
                    </div>
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
