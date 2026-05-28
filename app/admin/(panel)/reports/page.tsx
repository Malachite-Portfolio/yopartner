"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminDashboard, getAdminWalletSummary, listApplications, listCompanions, listSessions, listUsers } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatINR } from "@/lib/adminFormat";

type ReportState = {
  totalRecharge: number;
  bookingRevenue: number;
  commission: number;
  refunds: number;
  chatSessions: number;
  audioSessions: number;
  videoSessions: number;
  visitSessions: number;
  activeCompanions: number;
  suspendedCompanions: number;
  pendingApplications: number;
  averageRating: string;
  activeUsers: number;
  blockedUsers: number;
  highValueUsers: number;
  newUsers: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => asRecord(item)) : [];
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

const emptyStats: ReportState = {
  totalRecharge: 0,
  bookingRevenue: 0,
  commission: 0,
  refunds: 0,
  chatSessions: 0,
  audioSessions: 0,
  videoSessions: 0,
  visitSessions: 0,
  activeCompanions: 0,
  suspendedCompanions: 0,
  pendingApplications: 0,
  averageRating: "0.0",
  activeUsers: 0,
  blockedUsers: 0,
  highValueUsers: 0,
  newUsers: 0,
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState<ReportState>(emptyStats);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const [dashboardResponse, walletResponse, sessionsResponse, companionsResponse, applicationsResponse, usersResponse] = await Promise.all([
      getAdminDashboard(),
      getAdminWalletSummary(),
      listSessions(),
      listCompanions(),
      listApplications(),
      listUsers(),
    ]);

    const responses = [dashboardResponse, walletResponse, sessionsResponse, companionsResponse, applicationsResponse, usersResponse];
    if (responses.some((response) => response.error?.status === 401)) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    const hasData = responses.some((response) => Boolean(response.data));
    if (!hasData) {
      setStats(emptyStats);
      setErrorMessage("No report data available right now.");
      setLoading(false);
      return;
    }

    const dashboardStats = asRecord(asRecord(dashboardResponse.data).stats);
    const wallet = walletResponse.data;
    const sessions = asArray(asRecord(sessionsResponse.data).sessions);
    const companions = asArray(asRecord(companionsResponse.data).companions);
    const applications = asArray(asRecord(applicationsResponse.data).applications);
    const users = asArray(asRecord(usersResponse.data).users);

    const chatSessions = sessions.filter((row) => asString(row.serviceType).toUpperCase() === "CHAT").length;
    const audioSessions = sessions.filter((row) => asString(row.serviceType).toUpperCase() === "AUDIO").length;
    const videoSessions = sessions.filter((row) => asString(row.serviceType).toUpperCase() === "VIDEO").length;
    const visitSessions = sessions.filter((row) => asString(row.serviceType).toUpperCase() === "VISIT").length;

    const activeCompanions = companions.filter((row) => asString(row.status).toUpperCase() === "ACTIVE").length;
    const suspendedCompanions = companions.filter((row) => asString(row.status).toUpperCase() === "SUSPENDED").length;
    const ratings = companions.map((row) => asNumber(row.rating)).filter((item) => item > 0);
    const averageRating = ratings.length ? (ratings.reduce((sum, item) => sum + item, 0) / ratings.length).toFixed(1) : "0.0";

    const pendingApplications = applications.filter((row) => {
      const status = asString(row.status).toUpperCase();
      return status === "UNDER_REVIEW" || status === "NEEDS_INFO";
    }).length;

    const activeUsers = users.filter((row) => !Boolean(row.isBlocked)).length;
    const blockedUsers = users.filter((row) => Boolean(row.isBlocked)).length;
    const newUsers = users.filter((row) => {
      const createdAt = new Date(asString(row.createdAt, new Date().toISOString())).getTime();
      return Number.isFinite(createdAt) && Date.now() - createdAt <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    setStats({
      totalRecharge: wallet?.totalRecharged ?? asNumber(dashboardStats.rechargeTotal),
      bookingRevenue: wallet?.totalSpent ?? 0,
      commission: Math.round((wallet?.totalSpent ?? 0) * 0.2),
      refunds: wallet?.totalRefunds ?? 0,
      chatSessions,
      audioSessions,
      videoSessions,
      visitSessions,
      activeCompanions: asNumber(dashboardStats.companionsCount) || activeCompanions,
      suspendedCompanions,
      pendingApplications: asNumber(dashboardStats.pendingApplicationsCount) || pendingApplications,
      averageRating,
      activeUsers: asNumber(dashboardStats.usersCount) || activeUsers,
      blockedUsers,
      highValueUsers: 0,
      newUsers,
    });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReports]);

  const sessionMax = useMemo(
    () => Math.max(stats.chatSessions, stats.audioSessions, stats.videoSessions, stats.visitSessions, 1),
    [stats.audioSessions, stats.chatSessions, stats.videoSessions, stats.visitSessions],
  );

  const exportMessage = (name: string) => alert(`${name} export is coming soon.`);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Reports</h2>

      {errorMessage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{errorMessage}</p>
      ) : null}

      {loading ? (
        <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading reports...
        </article>
      ) : (
        <>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Revenue Report</h3>
              <button type="button" onClick={() => exportMessage("Revenue CSV")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Export Revenue CSV</button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Total Recharge</p><p className="mt-1 font-semibold text-slate-900">{formatINR(stats.totalRecharge)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Booking Revenue</p><p className="mt-1 font-semibold text-slate-900">{formatINR(stats.bookingRevenue)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Platform Commission</p><p className="mt-1 font-semibold text-slate-900">{formatINR(stats.commission)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Refunds</p><p className="mt-1 font-semibold text-slate-900">{formatINR(stats.refunds)}</p></div>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Session Report</h3>
              <button type="button" onClick={() => exportMessage("Sessions CSV")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Export Sessions CSV</button>
            </div>
            <div className="space-y-3">
              {([
                { label: "Chat", value: stats.chatSessions },
                { label: "Audio", value: stats.audioSessions },
                { label: "Video", value: stats.videoSessions },
                { label: "Visit", value: stats.visitSessions },
              ] as const).map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm"><span>{item.label}</span><span className="font-semibold">{item.value}</span></div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#0ea5a6]" style={{ width: `${(item.value / sessionMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Companion Report</h3>
                <button type="button" onClick={() => exportMessage("Companions CSV")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Export Companions CSV</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Active Companions</p><p className="mt-1 font-semibold text-slate-900">{stats.activeCompanions}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Suspended Companions</p><p className="mt-1 font-semibold text-slate-900">{stats.suspendedCompanions}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Pending Applications</p><p className="mt-1 font-semibold text-slate-900">{stats.pendingApplications}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Average Rating</p><p className="mt-1 font-semibold text-slate-900">{stats.averageRating}</p></div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">User Report</h3>
                <button type="button" onClick={() => exportMessage("Users CSV")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Export Users CSV</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Active Users</p><p className="mt-1 font-semibold text-slate-900">{stats.activeUsers}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">New Users</p><p className="mt-1 font-semibold text-slate-900">{stats.newUsers}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Blocked Users</p><p className="mt-1 font-semibold text-slate-900">{stats.blockedUsers}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">High-value Users</p><p className="mt-1 font-semibold text-slate-900">{stats.highValueUsers}</p></div>
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
