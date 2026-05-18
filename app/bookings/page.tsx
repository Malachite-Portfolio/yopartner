"use client";

import { CalendarDays, Funnel, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getMyBookings } from "@/lib/api/bookings";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getDemoBookings, subscribeBookingUpdates, type BookingStatus, type DemoBooking } from "@/lib/bookings";
import { formatINR } from "@/lib/wallet";

const filterOptions: Array<"All" | BookingStatus> = ["All", "Confirmed", "Pending", "Completed"];

function getStatusClass(status: BookingStatus) {
  if (status === "Completed") return "text-[#1e3a8a]";
  if (status === "Pending") return "text-amber-600";
  return "text-emerald-700";
}

export default function BookingsPage() {
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [apiError, setApiError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BookingStatus>("All");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (IS_PRODUCTION_READY_MODE) {
      void (async () => {
        const response = await getMyBookings();
        if (response.error) {
          setApiError("We couldn't load your bookings right now. Please retry.");
          setBookings([]);
          return;
        }

        const mapped: DemoBooking[] = response.data.map((item) => ({
          id: item.id,
          bookingId: item.bookingId,
          companionName: item.companionName,
          companionId: "",
          serviceType: item.serviceType,
          price: item.amount,
          routeSource: "connect-now",
          status:
            item.status === "Pending" || item.status === "Completed"
              ? item.status
              : "Confirmed",
          createdAt: item.createdAt,
        }));
        setApiError("");
        setBookings(mapped);
      })();
      return () => undefined;
    }

    const sync = () => setBookings(getDemoBookings());
    sync();
    return subscribeBookingUpdates(sync);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (IS_PRODUCTION_READY_MODE) {
      void (async () => {
        const response = await getMyBookings();
        if (response.error) {
          setApiError("We couldn't load your bookings right now. Please retry.");
          setBookings([]);
        } else {
          const mapped: DemoBooking[] = response.data.map((item) => ({
            id: item.id,
            bookingId: item.bookingId,
            companionName: item.companionName,
            companionId: "",
            serviceType: item.serviceType,
            price: item.amount,
            routeSource: "connect-now",
            status:
              item.status === "Pending" || item.status === "Completed"
                ? item.status
                : "Confirmed",
            createdAt: item.createdAt,
          }));
          setBookings(mapped);
          setApiError("");
        }
        window.setTimeout(() => setIsRefreshing(false), 500);
      })();
      return;
    }
    setBookings(getDemoBookings());
    window.setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (statusFilter !== "All" && booking.status !== statusFilter) return false;
      if (!term) return true;
      const haystack = `${booking.bookingId} ${booking.companionName}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [bookings, search, statusFilter]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((booking) => booking.status === "Confirmed").length;
    const pending = bookings.filter((booking) => booking.status === "Pending").length;
    const completed = bookings.filter((booking) => booking.status === "Completed").length;
    return { total, confirmed, pending, completed };
  }, [bookings]);

  return (
    <section className="min-h-screen bg-[#fffdf8]">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#dceae5] bg-white px-3 py-1 text-xs font-semibold text-[#0f766e]">
              <ShieldCheck size={14} />
              Private and platform-protected
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">My Conversations</h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Track your upcoming and completed conversations with verified companions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by companion name or conversation ID..."
                className="h-12 w-full rounded-2xl border border-[#dceae5] bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0f766e]"
              />
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((current) => !current)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Funnel size={16} />
                {statusFilter === "All" ? "Filters" : statusFilter}
              </button>
              {filterOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-10 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setStatusFilter(option);
                        setFilterOpen(false);
                      }}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                        statusFilter === option ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</p>
          </article>
          <article className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Confirmed</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.confirmed}</p>
          </article>
          <article className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Pending</p>
            <p className="mt-2 text-3xl font-semibold text-amber-500">{stats.pending}</p>
          </article>
          <article className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-[#1e3a8a]">{stats.completed}</p>
          </article>
        </div>

        {apiError ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {apiError}
          </div>
        ) : null}

        {filteredBookings.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-[#dceae5] bg-white px-4 py-16 text-center shadow-sm sm:px-6 sm:py-20">
            <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <CalendarDays size={36} />
            </span>
            <h2 className="mt-5 text-2xl font-semibold text-slate-900">No conversations yet</h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              No conversations found yet. When you talk to a companion, it will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredBookings.map((booking) => (
              <article key={booking.id} className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversation ID</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{booking.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Companion</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{booking.companionName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{booking.serviceType.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{formatINR(booking.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                    <p className={`mt-1 text-sm font-semibold ${getStatusClass(booking.status)}`}>{booking.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{new Date(booking.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
