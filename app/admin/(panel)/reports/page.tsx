"use client";

import { useMemo, useState } from "react";
import { formatINR, getAdminApplications, getAdminCompanions, getAdminSessions, getAdminTransactions, getAdminUsers } from "@/lib/adminStore";
import type { AdminApplication, AdminCompanion, AdminSession, AdminTransaction, AdminUser } from "@/lib/adminData";

export default function AdminReportsPage() {
  const [users] = useState<AdminUser[]>(() => getAdminUsers());
  const [companions] = useState<AdminCompanion[]>(() => getAdminCompanions());
  const [applications] = useState<AdminApplication[]>(() => getAdminApplications());
  const [sessions] = useState<AdminSession[]>(() => getAdminSessions());
  const [transactions] = useState<AdminTransaction[]>(() => getAdminTransactions());

  const revenue = useMemo(() => {
    const totalRecharge = transactions.filter((item) => item.type === "Recharge").reduce((acc, item) => acc + Math.max(item.amount, 0), 0);
    const bookingRevenue = transactions.filter((item) => item.type === "Booking").reduce((acc, item) => acc + Math.abs(item.amount), 0);
    const refunds = transactions.filter((item) => item.type === "Refund").reduce((acc, item) => acc + Math.max(item.amount, 0), 0);
    const commission = Math.round(bookingRevenue * 0.2);
    return { totalRecharge, bookingRevenue, commission, refunds };
  }, [transactions]);

  const sessionReport = useMemo(() => {
    const chat = sessions.filter((item) => item.type === "Chat").length;
    const audio = sessions.filter((item) => item.type === "Audio").length;
    const video = sessions.filter((item) => item.type === "Video").length;
    const visit = sessions.filter((item) => item.type === "Visit").length;
    const max = Math.max(chat, audio, video, visit, 1);
    return { chat, audio, video, visit, max };
  }, [sessions]);

  const companionReport = useMemo(() => {
    const active = companions.filter((item) => item.status === "Active").length;
    const suspended = companions.filter((item) => item.status === "Suspended").length;
    const pendingApplications = applications.filter((item) => item.status === "Under Review" || item.status === "Needs Info").length;
    const ratings = companions.map((item) => item.rating);
    const averageRating = ratings.length > 0 ? (ratings.reduce((acc, item) => acc + item, 0) / ratings.length).toFixed(1) : "0.0";
    return { active, suspended, pendingApplications, averageRating };
  }, [applications, companions]);

  const userReport = useMemo(() => {
    const active = users.filter((item) => item.status === "Active").length;
    const blocked = users.filter((item) => item.status === "Blocked").length;
    const highValue = users.filter((item) => item.status === "High Value").length;
    const newUsers = users.filter((item) => item.status === "New").length;
    return { active, blocked, highValue, newUsers };
  }, [users]);

  const exportMessage = (name: string) => alert(`${name} export is in demo mode. CSV download will be enabled after backend integration.`);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Reports</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Revenue Report</h3>
          <button type="button" onClick={() => exportMessage("Revenue CSV")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Export Revenue CSV</button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Total Recharge</p><p className="mt-1 font-semibold text-slate-900">{formatINR(revenue.totalRecharge)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Booking Revenue</p><p className="mt-1 font-semibold text-slate-900">{formatINR(revenue.bookingRevenue)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Platform Commission</p><p className="mt-1 font-semibold text-slate-900">{formatINR(revenue.commission)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Refunds</p><p className="mt-1 font-semibold text-slate-900">{formatINR(revenue.refunds)}</p></div>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Session Report</h3>
          <button type="button" onClick={() => exportMessage("Sessions CSV")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Export Sessions CSV</button>
        </div>
        <div className="space-y-3">
          {([
            { label: "Chat", value: sessionReport.chat },
            { label: "Audio", value: sessionReport.audio },
            { label: "Video", value: sessionReport.video },
            { label: "Visit", value: sessionReport.visit },
          ] as const).map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm"><span>{item.label}</span><span className="font-semibold">{item.value}</span></div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#0ea5a6]" style={{ width: `${(item.value / sessionReport.max) * 100}%` }} />
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
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Active Companions</p><p className="mt-1 font-semibold text-slate-900">{companionReport.active}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Suspended Companions</p><p className="mt-1 font-semibold text-slate-900">{companionReport.suspended}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Pending Applications</p><p className="mt-1 font-semibold text-slate-900">{companionReport.pendingApplications}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Average Rating</p><p className="mt-1 font-semibold text-slate-900">{companionReport.averageRating}</p></div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">User Report</h3>
            <button type="button" onClick={() => exportMessage("Users CSV")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Export Users CSV</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Active Users</p><p className="mt-1 font-semibold text-slate-900">{userReport.active}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">New Users</p><p className="mt-1 font-semibold text-slate-900">{userReport.newUsers}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Blocked Users</p><p className="mt-1 font-semibold text-slate-900">{userReport.blocked}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">High-value Users</p><p className="mt-1 font-semibold text-slate-900">{userReport.highValue}</p></div>
          </div>
        </article>
      </div>
    </section>
  );
}
