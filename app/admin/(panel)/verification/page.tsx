"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { getAdminVerifications, setAdminVerifications } from "@/lib/adminStore";
import type { AdminVerification, AdminOverallVerificationStatus } from "@/lib/adminData";

type VerificationTab = "Pending" | "Verified" | "Failed" | "Needs Review";

export default function AdminVerificationPage() {
  const [records, setRecords] = useState<AdminVerification[]>(() => getAdminVerifications());
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<VerificationTab>("Pending");

  const persist = (next: AdminVerification[]) => {
    setRecords(next);
    setAdminVerifications(next);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((item) => {
      if (item.overallStatus !== tab) return false;
      if (!term) return true;
      return `${item.partner} ${item.phone}`.toLowerCase().includes(term);
    });
  }, [records, search, tab]);

  const updateStep = (target: AdminVerification, key: keyof Omit<AdminVerification, "id" | "partner" | "phone" | "overallStatus">, value: AdminVerification["idVerification"]) => {
    const next = records.map((item) =>
      item.id === target.id
        ? {
            ...item,
            [key]: value,
          }
        : item,
    );
    persist(next);
  };

  const updateOverall = (target: AdminVerification, status: AdminOverallVerificationStatus) => {
    const next = records.map((item) => (item.id === target.id ? { ...item, overallStatus: status } : item));
    persist(next);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Verification</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by partner or phone..." />

        <div className="mb-3 flex flex-wrap gap-2">
          {(["Pending", "Verified", "Failed", "Needs Review"] as VerificationTab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                tab === item ? "bg-[#2563eb] text-white" : "border border-slate-200 bg-white text-slate-700"
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
                <th className="px-2 py-2">Partner</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">ID Verification</th>
                <th className="px-2 py-2">Police Verification</th>
                <th className="px-2 py-2">Psychometric Test</th>
                <th className="px-2 py-2">Behavioural Interview</th>
                <th className="px-2 py-2">Training</th>
                <th className="px-2 py-2">Overall Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-2 py-2 font-medium text-slate-800">{item.partner}</td>
                  <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.idVerification} /></td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.policeVerification} /></td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.psychometricTest} /></td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.behaviouralInterview} /></td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.training} /></td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.overallStatus} /></td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "Mark ID Verified", onClick: () => updateStep(item, "idVerification", "Verified") },
                        { label: "Mark Police Verified", onClick: () => updateStep(item, "policeVerification", "Verified") },
                        { label: "Psychometric Cleared", onClick: () => updateStep(item, "psychometricTest", "Cleared") },
                        { label: "Interview Cleared", onClick: () => updateStep(item, "behaviouralInterview", "Cleared") },
                        { label: "Training Completed", onClick: () => updateStep(item, "training", "Trained") },
                        { label: "Approve Overall", tone: "success", onClick: () => updateOverall(item, "Verified") },
                        { label: "Request Recheck", tone: "warning", onClick: () => updateOverall(item, "Needs Review") },
                      ]}
                    />
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
