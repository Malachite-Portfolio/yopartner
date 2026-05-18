"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BadgeCheck, CreditCard, MessageCircle, Phone, Users, Wallet } from "lucide-react";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  getAdminDashboard,
  listApplications,
  listBookings,
  listCompanions,
  listSessions,
  listSupportTickets,
  listUsers,
  listWalletTransactions,
} from "@/lib/api/admin";
import { isClientDemoAdminSessionActive, isClientDemoEnabled } from "@/lib/clientDemoData";
import {
  formatDateTime,
  formatINR,
  getAdminApplications,
  getAdminBookings,
  getAdminCompanions,
  getAdminSessions,
  getAdminSupportTickets,
  getAdminTransactions,
  getAdminUsers,
} from "@/lib/adminStore";

type DashboardStats = {
  totalUsers: number;
  activeCompanions: number;
  pendingApplications: number;
  liveSessions: number;
  totalBookings: number;
  walletVolume: number;
  pendingPayouts: number;
  openSupportTickets: number;
};

type UiApplication = {
  id: string;
  name: string;
  phone: string;
  services: string;
  kycStatus: string;
  status: string;
  submittedAt: string;
};

type UiSession = {
  id: string;
  sessionId: string;
  user: string;
  companion: string;
  type: string;
  status: string;
  startedAt: string;
};

type UiTransaction = {
  id: string;
  transactionId: string;
  user: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

type UiTicket = {
  id: string;
  ticketId: string;
  type: string;
  priority: string;
  status: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map((item) => asRecord(item)) : [];
}

function firstArray(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const candidate = asArray(data[key]);
    if (candidate.length > 0) return candidate;
  }
  return [] as Record<string, unknown>[];
}

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringOrFallback(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getDemoDashboardSeed() {
  const demoApplications = getAdminApplications();
  const demoSessions = getAdminSessions();
  const demoTransactions = getAdminTransactions();
  const demoTickets = getAdminSupportTickets();
  const demoUsers = getAdminUsers();
  const demoCompanions = getAdminCompanions();
  const demoBookings = getAdminBookings();

  return {
    stats: {
      totalUsers: demoUsers.length,
      activeCompanions: demoCompanions.filter((item) => item.status === "Active").length,
      pendingApplications: demoApplications.filter((item) => item.status === "Under Review" || item.status === "Needs Info").length,
      liveSessions: demoSessions.filter((item) => item.status === "Live").length,
      totalBookings: demoBookings.length,
      walletVolume: demoTransactions.reduce((acc, item) => acc + Math.max(item.amount, 0), 0),
      pendingPayouts: 0,
      openSupportTickets: demoTickets.filter((item) => item.status !== "Resolved").length,
    } as DashboardStats,
    applications: demoApplications.map((item) => ({
      id: item.id,
      name: item.partnerName,
      phone: item.phone,
      services: item.servicesOffered.join(", "),
      kycStatus: "Pending",
      status: item.status,
      submittedAt: item.submittedDate,
    })) as UiApplication[],
    sessions: demoSessions.map((item) => ({
      id: item.id,
      sessionId: item.sessionId,
      user: item.user,
      companion: item.companion,
      type: item.type,
      status: item.status,
      startedAt: item.startedAt,
    })) as UiSession[],
    transactions: demoTransactions.map((item) => ({
      id: item.id,
      transactionId: item.transactionId,
      user: item.user,
      type: item.type,
      amount: item.amount,
      status: item.status,
      createdAt: item.date,
    })) as UiTransaction[],
    tickets: demoTickets.map((item) => ({
      id: item.id,
      ticketId: item.ticketId,
      type: item.type,
      priority: item.priority,
      status: item.status,
    })) as UiTicket[],
  };
}

export default function AdminDashboardPage() {
  const isDemoPreview = isClientDemoEnabled() && isClientDemoAdminSessionActive();
  const demoSeed = useMemo(() => (isDemoPreview ? getDemoDashboardSeed() : null), [isDemoPreview]);

  const [loading, setLoading] = useState(!isDemoPreview);
  const [apiError, setApiError] = useState("");

  const [stats, setStats] = useState<DashboardStats>(
    () =>
      demoSeed?.stats ?? {
        totalUsers: 0,
        activeCompanions: 0,
        pendingApplications: 0,
        liveSessions: 0,
        totalBookings: 0,
        walletVolume: 0,
        pendingPayouts: 0,
        openSupportTickets: 0,
      },
  );
  const [applications, setApplications] = useState<UiApplication[]>(() => demoSeed?.applications ?? []);
  const [sessions, setSessions] = useState<UiSession[]>(() => demoSeed?.sessions ?? []);
  const [transactions, setTransactions] = useState<UiTransaction[]>(() => demoSeed?.transactions ?? []);
  const [tickets, setTickets] = useState<UiTicket[]>(() => demoSeed?.tickets ?? []);

  useEffect(() => {
    if (isDemoPreview) return;

    let active = true;
    const load = async () => {
      setLoading(true);
      setApiError("");

      const [
        dashboardResponse,
        usersResponse,
        companionsResponse,
        applicationsResponse,
        bookingsResponse,
        sessionsResponse,
        walletResponse,
        supportResponse,
      ] = await Promise.all([
        getAdminDashboard(),
        listUsers(),
        listCompanions(),
        listApplications(),
        listBookings(),
        listSessions(),
        listWalletTransactions(),
        listSupportTickets(),
      ]);

      if (!active) return;

      const responses = [
        dashboardResponse,
        usersResponse,
        companionsResponse,
        applicationsResponse,
        bookingsResponse,
        sessionsResponse,
        walletResponse,
        supportResponse,
      ];
      const hasAnySuccess = responses.some((response) => Boolean(response.data));
      if (!hasAnySuccess) {
        setApiError("Admin data could not be loaded. Please try again.");
        setLoading(false);
        return;
      }

      const dashboardData = asRecord(dashboardResponse.data);
      const dashboardStats = asRecord(dashboardData.stats);
      const usersData = asRecord(usersResponse.data);
      const companionsData = asRecord(companionsResponse.data);
      const applicationsData = asRecord(applicationsResponse.data);
      const bookingsData = asRecord(bookingsResponse.data);
      const sessionsData = asRecord(sessionsResponse.data);
      const walletData = asRecord(walletResponse.data);
      const supportData = asRecord(supportResponse.data);

      const users = firstArray(usersData, ["users", "data"]);
      const companions = firstArray(companionsData, ["companions", "data"]);
      const bookings = firstArray(bookingsData, ["bookings", "data"]);
      const apps = firstArray(applicationsData, ["applications", "data"]);
      const sessionRows = firstArray(sessionsData, ["sessions", "data"]);
      const transactionRows = firstArray(walletData, ["transactions", "walletTransactions", "data"]);
      const supportRows = firstArray(supportData, ["tickets", "supportTickets", "data"]);

      const mappedApplications: UiApplication[] = apps.map((item, index) => {
        const payload = asRecord(item.payload);
        const services = Array.isArray(item.servicesOffered)
          ? (item.servicesOffered as unknown[])
          : Array.isArray(payload.servicesOffered)
            ? (payload.servicesOffered as unknown[])
            : [];

        return {
          id: stringOrFallback(item.id, `application-${index + 1}`),
          name: stringOrFallback(item.fullName ?? item.partnerName ?? item.displayName ?? payload.fullName),
          phone: stringOrFallback(item.phoneNumber ?? item.phone ?? payload.phoneNumber),
          services: services.length > 0 ? services.map((value) => String(value)).join(", ") : "-",
          kycStatus: titleCase(stringOrFallback(item.kycStatus ?? payload.kycStatus ?? item.verificationStatus, "Pending")),
          status: titleCase(stringOrFallback(item.status, "Under Review")),
          submittedAt: stringOrFallback(item.submittedAt ?? item.createdAt ?? item.updatedAt, new Date().toISOString()),
        };
      });

      const mappedSessions: UiSession[] = sessionRows.map((item, index) => {
        const user = asRecord(item.user);
        const companion = asRecord(item.companion);
        return {
          id: stringOrFallback(item.id, `session-${index + 1}`),
          sessionId: stringOrFallback(item.sessionId ?? item.id, `SES-${index + 1}`),
          user: stringOrFallback(user.phone ?? item.userPhone ?? item.user),
          companion: stringOrFallback(companion.displayName ?? companion.name ?? item.companion),
          type: titleCase(stringOrFallback(item.type ?? item.serviceType, "Chat")),
          status: titleCase(stringOrFallback(item.status, "Completed")),
          startedAt: stringOrFallback(item.startedAt ?? item.createdAt ?? item.updatedAt, new Date().toISOString()),
        };
      });

      const mappedTransactions: UiTransaction[] = transactionRows.map((item, index) => {
        const user = asRecord(item.user);
        return {
          id: stringOrFallback(item.id, `transaction-${index + 1}`),
          transactionId: stringOrFallback(item.transactionId ?? item.id, `TRX-${index + 1}`),
          user: stringOrFallback(user.phone ?? item.userPhone ?? item.user),
          type: titleCase(stringOrFallback(item.type, "Recharge")),
          amount: numberOrZero(item.amount),
          status: titleCase(stringOrFallback(item.status, "Success")),
          createdAt: stringOrFallback(item.createdAt ?? item.date ?? item.updatedAt, new Date().toISOString()),
        };
      });

      const mappedTickets: UiTicket[] = supportRows.map((item, index) => ({
        id: stringOrFallback(item.id, `ticket-${index + 1}`),
        ticketId: stringOrFallback(item.ticketId ?? item.id, `SUP-${index + 1}`),
        type: titleCase(stringOrFallback(item.type, "Support")),
        priority: titleCase(stringOrFallback(item.priority, "Medium")),
        status: titleCase(stringOrFallback(item.status, "Open")),
      }));

      setApplications(mappedApplications);
      setSessions(mappedSessions);
      setTransactions(mappedTransactions);
      setTickets(mappedTickets);

      setStats({
        totalUsers: numberOrZero(dashboardStats.totalUsers) || users.length,
        activeCompanions:
          numberOrZero(dashboardStats.activeCompanions) ||
          companions.filter((item) => String(item.status ?? "").toLowerCase() === "active").length,
        pendingApplications:
          numberOrZero(dashboardStats.pendingApplications) ||
          mappedApplications.filter((item) => item.status === "Under Review" || item.status === "Needs Info").length,
        liveSessions:
          numberOrZero(dashboardStats.liveSessions) ||
          mappedSessions.filter((item) => item.status.toLowerCase() === "live").length,
        totalBookings: numberOrZero(dashboardStats.totalBookings) || bookings.length,
        walletVolume:
          numberOrZero(dashboardStats.walletVolume) ||
          numberOrZero(dashboardStats.walletRecharge) ||
          mappedTransactions.reduce((acc, item) => acc + Math.max(item.amount, 0), 0),
        pendingPayouts: numberOrZero(dashboardStats.pendingPayouts),
        openSupportTickets:
          numberOrZero(dashboardStats.openSupportTickets) ||
          mappedTickets.filter((item) => item.status !== "Resolved").length,
      });

      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [isDemoPreview]);

  const metricCards = [
    { label: "Total Members", value: stats.totalUsers.toLocaleString("en-IN"), icon: Users, tone: "blue" as const },
    { label: "Active Partners", value: String(stats.activeCompanions), icon: BadgeCheck, tone: "teal" as const },
    { label: "Pending Applications", value: String(stats.pendingApplications), icon: Activity, tone: "amber" as const },
    { label: "Live Conversations", value: String(stats.liveSessions), icon: MessageCircle, tone: "purple" as const },
    { label: "Total Bookings", value: String(stats.totalBookings), icon: Phone, tone: "slate" as const },
    { label: "Wallet Volume", value: formatINR(stats.walletVolume), icon: Wallet, tone: "teal" as const },
    { label: "Pending Payouts", value: String(stats.pendingPayouts), icon: CreditCard, tone: "amber" as const },
    { label: "Open Support Tickets", value: String(stats.openSupportTickets), icon: Activity, tone: "blue" as const },
  ];

  const liveSessions = useMemo(
    () => sessions.filter((item) => item.status.toLowerCase() === "live").slice(0, 6),
    [sessions],
  );
  const pendingApplications = useMemo(
    () => applications.filter((item) => item.status === "Under Review" || item.status === "Needs Info").slice(0, 6),
    [applications],
  );
  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6),
    [transactions],
  );
  const supportQueue = useMemo(
    () => tickets.filter((item) => item.status !== "Resolved").slice(0, 6),
    [tickets],
  );

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Operations Dashboard</h2>
        <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading admin data...
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {apiError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {apiError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <AdminMetricCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Live Conversations Monitor</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Session ID</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Companion</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {liveSessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-3 text-slate-500">No live conversations right now.</td>
                  </tr>
                ) : (
                  liveSessions.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.sessionId}</td>
                      <td className="px-2 py-2 text-slate-700">{item.user}</td>
                      <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                      <td className="px-2 py-2 text-slate-700">{item.type}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                    </tr>
                  ))
                )}
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
                  <th className="px-2 py-2">Services</th>
                  <th className="px-2 py-2">KYC</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-3 text-slate-500">No partner applications yet.</td>
                  </tr>
                ) : (
                  pendingApplications.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.name}</td>
                      <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                      <td className="px-2 py-2 text-slate-700">{item.services}</td>
                      <td className="px-2 py-2 text-slate-700">{item.kycStatus}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                    </tr>
                  ))
                )}
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
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-3 text-slate-500">No recent transactions.</td>
                  </tr>
                ) : (
                  recentTransactions.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.transactionId}</td>
                      <td className="px-2 py-2 text-slate-700">{item.user}</td>
                      <td className="px-2 py-2 text-slate-700">{item.type}</td>
                      <td className="px-2 py-2 text-slate-700">{formatINR(item.amount)}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                      <td className="px-2 py-2 text-slate-700">{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))
                )}
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
                </tr>
              </thead>
              <tbody>
                {supportQueue.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-3 text-slate-500">No open support tickets.</td>
                  </tr>
                ) : (
                  supportQueue.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.ticketId}</td>
                      <td className="px-2 py-2 text-slate-700">{item.type}</td>
                      <td className="px-2 py-2 text-slate-700">{item.priority}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
