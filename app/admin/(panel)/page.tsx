"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  CreditCard,
  MessageCircle,
  Phone,
  Users,
  Wallet,
} from "lucide-react";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { formatDateTime, formatINR, getAdminApplications, getAdminBookings, getAdminCompanions, getAdminSessions, getAdminSupportTickets, getAdminTransactions, getAdminUsers } from "@/lib/adminStore";
import type { AdminApplication, AdminBooking, AdminCompanion, AdminSession, AdminTicket, AdminTransaction, AdminUser } from "@/lib/adminData";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function AdminDashboardPage() {
  const [users] = useState<AdminUser[]>(() => getAdminUsers());
  const [companions] = useState<AdminCompanion[]>(() => getAdminCompanions());
  const [applications] = useState<AdminApplication[]>(() => getAdminApplications());
  const [bookings] = useState<AdminBooking[]>(() => getAdminBookings());
  const [sessions] = useState<AdminSession[]>(() => getAdminSessions());
  const [transactions] = useState<AdminTransaction[]>(() => getAdminTransactions());
  const [tickets] = useState<AdminTicket[]>(() => getAdminSupportTickets());

  const stats = useMemo(() => {
    const activeCompanions = companions.filter((item) => item.status === "Active").length;
    const pendingApplications = applications.filter((item) => item.status === "Under Review" || item.status === "Needs Info").length;
    const liveSessions = sessions.filter((item) => item.status === "Live").length;
    const totalBookings = bookings.length;
    const walletRecharge = transactions
      .filter((item) => item.type === "Recharge" && item.status === "Success")
      .reduce((acc, item) => acc + Math.max(item.amount, 0), 0);
    const pendingPayouts = transactions.filter((item) => item.type === "Admin Credit" && item.status === "Pending").length;
    const openSupportTickets = tickets.filter((item) => item.status !== "Resolved").length;
    const ratings = companions.map((item) => item.rating).filter((item) => item > 0);
    const averageRating = ratings.length ? (ratings.reduce((acc, item) => acc + item, 0) / ratings.length).toFixed(1) : "0.0";
    const verificationPending = companions.filter((item) => item.verificationStatus !== "Verified").length;

    return {
      activeCompanions,
      pendingApplications,
      liveSessions,
      totalBookings,
      walletRecharge,
      pendingPayouts,
      openSupportTickets,
      averageRating,
      verificationPending,
    };
  }, [applications, bookings, companions, sessions, tickets, transactions]);

  const todayActivity = useMemo(() => {
    const todaysUsers = users.filter((item) => isToday(item.joinedDate)).length;
    const todaysChatSessions = sessions.filter((item) => item.type === "Chat" && isToday(item.startedAt)).length;
    const todaysAudioCalls = sessions.filter((item) => item.type === "Audio" && isToday(item.startedAt)).length;
    const todaysVideoCalls = sessions.filter((item) => item.type === "Video" && isToday(item.startedAt)).length;
    const todaysHomeVisits = bookings.filter((item) => item.serviceType === "visit" && isToday(item.createdAt)).length;
    const todaysRecharges = transactions.filter((item) => item.type === "Recharge" && isToday(item.date)).length;

    return {
      todaysUsers,
      todaysChatSessions,
      todaysAudioCalls,
      todaysVideoCalls,
      todaysHomeVisits,
      todaysRecharges,
    };
  }, [bookings, sessions, transactions, users]);

  const liveSessions = useMemo(() => sessions.filter((item) => item.status === "Live"), [sessions]);
  const pendingApplications = useMemo(
    () => applications.filter((item) => item.status === "Under Review" || item.status === "Needs Info"),
    [applications],
  );
  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6),
    [transactions],
  );
  const supportQueue = useMemo(
    () => tickets.filter((item) => item.status === "Open" || item.status === "In Progress").slice(0, 6),
    [tickets],
  );

  const metricCards = [
    { label: "Total Users", value: users.length.toLocaleString("en-IN"), icon: Users, tone: "blue" as const },
    { label: "Active Companions", value: String(stats.activeCompanions), icon: BadgeCheck, tone: "teal" as const },
    { label: "Pending Applications", value: String(stats.pendingApplications), icon: Activity, tone: "amber" as const },
    { label: "Live Sessions", value: String(stats.liveSessions), icon: MessageCircle, tone: "purple" as const },
    { label: "Total Bookings", value: String(stats.totalBookings), icon: Phone, tone: "slate" as const },
    { label: "Wallet Recharge", value: formatINR(stats.walletRecharge), icon: Wallet, tone: "teal" as const },
    { label: "Pending Payouts", value: String(stats.pendingPayouts), icon: CreditCard, tone: "amber" as const },
    { label: "Open Support Tickets", value: String(stats.openSupportTickets), icon: Activity, tone: "blue" as const },
    { label: "Average Rating", value: stats.averageRating, icon: BadgeCheck, tone: "purple" as const },
    { label: "Verification Pending", value: String(stats.verificationPending), icon: Users, tone: "amber" as const },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <AdminMetricCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
        ))}
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Today&apos;s Activity</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs text-slate-500">New Users</p>
            <p className="mt-1 text-lg font-semibold">{todayActivity.todaysUsers}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Chat Sessions</p>
            <p className="mt-1 text-lg font-semibold">{todayActivity.todaysChatSessions}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Audio Calls</p>
            <p className="mt-1 text-lg font-semibold">{todayActivity.todaysAudioCalls}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Video Calls</p>
            <p className="mt-1 text-lg font-semibold">{todayActivity.todaysVideoCalls}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Home Visits</p>
            <p className="mt-1 text-lg font-semibold">{todayActivity.todaysHomeVisits}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Wallet Recharges</p>
            <p className="mt-1 text-lg font-semibold">{todayActivity.todaysRecharges}</p>
          </div>
        </div>
      </article>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Live Sessions Monitor</h2>
            <button type="button" className="text-xs font-semibold text-[#2563eb]" onClick={() => alert("Open Sessions page for full monitor.")}>View All</button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Session ID</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Companion</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Duration</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {liveSessions.slice(0, 6).map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-800">{item.sessionId}</td>
                    <td className="px-2 py-2 text-slate-700">{item.user}</td>
                    <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                    <td className="px-2 py-2 text-slate-700">{item.type}</td>
                    <td className="px-2 py-2 text-slate-700">{item.duration}</td>
                    <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                    <td className="px-2 py-2">
                      <button type="button" onClick={() => alert(`Open session ${item.sessionId} details.`)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Pending Partner Applications</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Phone</th>
                  <th className="px-2 py-2">City</th>
                  <th className="px-2 py-2">Services</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingApplications.slice(0, 6).map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-800">{item.partnerName}</td>
                    <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                    <td className="px-2 py-2 text-slate-700">{item.bornCity || "-"}</td>
                    <td className="px-2 py-2 text-slate-700">{item.servicesOffered.join(", ")}</td>
                    <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                    <td className="px-2 py-2">
                      <button type="button" onClick={() => alert("Open Applications page to review.")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Transaction ID</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-800">{item.transactionId}</td>
                    <td className="px-2 py-2 text-slate-700">{item.user}</td>
                    <td className="px-2 py-2 text-slate-700">{item.type}</td>
                    <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                    <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                    <td className="px-2 py-2 text-slate-700">{formatDateTime(item.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Support Queue</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Ticket ID</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Priority</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {supportQueue.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-800">{item.ticketId}</td>
                    <td className="px-2 py-2 text-slate-700">{item.type}</td>
                    <td className="px-2 py-2 text-slate-700">{item.priority}</td>
                    <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                    <td className="px-2 py-2">
                      <button type="button" onClick={() => alert(`Open support ticket ${item.ticketId}.`)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
