"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import {
  formatDateTime,
  generateId,
  getAdminApplications,
  getAdminCompanions,
  setAdminApplications,
  setAdminCompanions,
} from "@/lib/adminStore";
import type { AdminApplication, AdminApplicationStatus, AdminCompanion } from "@/lib/adminData";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplication[]>(() => getAdminApplications());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | AdminApplicationStatus>("All");
  const [selected, setSelected] = useState<AdminApplication | null>(null);

  const persist = (next: AdminApplication[]) => {
    setApplications(next);
    setAdminApplications(next);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (!term) return true;
      const text = `${item.applicationId} ${item.partnerName} ${item.phone} ${item.bornCity}`.toLowerCase();
      return text.includes(term);
    });
  }, [applications, search, statusFilter]);

  const setStatus = (target: AdminApplication, status: AdminApplicationStatus, extra?: Partial<AdminApplication>) => {
    const next = applications.map((item) => (item.id === target.id ? { ...item, ...extra, status } : item));
    persist(next);
    setSelected((current) => (current?.id === target.id ? { ...current, ...extra, status } : current));
  };

  const approveApplication = (application: AdminApplication) => {
    setStatus(application, "Approved");
    const companions = getAdminCompanions();
    const exists = companions.some((item) => item.phone === application.phone);
    if (!exists) {
      const newCompanion: AdminCompanion = {
        id: generateId("ac"),
        name: application.partnerName,
        phone: application.phone,
        city: application.bornCity || "-",
        category: application.categories[0] ?? "Communication & Emotional Support",
        languages: application.languagesKnown,
        services: application.servicesOffered,
        chatPrice: Number(application.chatPricePerMinute) || 0,
        audioPrice: Number(application.audioPricePerMinute) || 0,
        videoPrice: Number(application.videoPricePerMinute) || 0,
        visitPrice: Number(application.visitPricePerSession) || 0,
        rating: 0,
        sessions: 0,
        earnings: 0,
        verificationStatus: "Pending",
        availability: "Offline",
        status: "Active",
        tagline: application.profileTagline,
      };
      setAdminCompanions([newCompanion, ...companions]);
    }
    alert("Application approved and companion record activated in demo admin store.");
  };

  const rejectApplication = (application: AdminApplication) => {
    const reason = window.prompt("Reason for rejection:", application.rejectionReason ?? "");
    if (reason === null) return;
    setStatus(application, "Rejected", { rejectionReason: reason });
  };

  const needsInfoApplication = (application: AdminApplication) => {
    const note = window.prompt("Admin note for additional information:", application.adminNote ?? "Please share missing details.");
    if (note === null) return;
    setStatus(application, "Needs Info", { adminNote: note });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Partner Applications</h2>
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by application ID, name, phone or city..."
          filterValue={statusFilter}
          onFilterChange={(value) => setStatusFilter(value as "All" | AdminApplicationStatus)}
          filterOptions={["All", "Draft", "Under Review", "Approved", "Rejected", "Needs Info"]}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Application ID</th>
                <th className="px-2 py-2">Partner Name</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Age</th>
                <th className="px-2 py-2">Gender</th>
                <th className="px-2 py-2">City</th>
                <th className="px-2 py-2">Languages</th>
                <th className="px-2 py-2">Services</th>
                <th className="px-2 py-2">Submitted</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-2 py-2 font-medium text-slate-800">{item.applicationId}</td>
                  <td className="px-2 py-2 text-slate-700">{item.partnerName}</td>
                  <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                  <td className="px-2 py-2 text-slate-700">{item.age}</td>
                  <td className="px-2 py-2 text-slate-700">{item.gender}</td>
                  <td className="px-2 py-2 text-slate-700">{item.bornCity}</td>
                  <td className="px-2 py-2 text-slate-700">{item.languagesKnown.join(", ")}</td>
                  <td className="px-2 py-2 text-slate-700">{item.servicesOffered.join(", ")}</td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.submittedDate)}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "View", onClick: () => setSelected(item) },
                        { label: "Approve", onClick: () => approveApplication(item), tone: "success" },
                        { label: "Reject", onClick: () => rejectApplication(item), tone: "danger" },
                        { label: "Needs Info", onClick: () => needsInfoApplication(item), tone: "warning" },
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
        title={selected ? `Application ${selected.applicationId}` : "Application Details"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="grid gap-3 sm:grid-cols-2">
              <p><span className="font-semibold text-slate-900">Name:</span> {selected.partnerName}</p>
              <p><span className="font-semibold text-slate-900">Phone:</span> {selected.phone}</p>
              <p><span className="font-semibold text-slate-900">Age:</span> {selected.age}</p>
              <p><span className="font-semibold text-slate-900">Gender:</span> {selected.gender}</p>
              <p><span className="font-semibold text-slate-900">Religion:</span> {selected.religion}</p>
              <p><span className="font-semibold text-slate-900">Born City:</span> {selected.bornCity}</p>
              <p><span className="font-semibold text-slate-900">Nationality:</span> {selected.nationality}</p>
              <p><span className="font-semibold text-slate-900">Qualification:</span> {selected.qualification}</p>
              <p><span className="font-semibold text-slate-900">School:</span> {selected.school}</p>
              <p><span className="font-semibold text-slate-900">College:</span> {selected.college}</p>
            </div>
            <p><span className="font-semibold text-slate-900">Languages Known:</span> {selected.languagesKnown.join(", ")}</p>
            <p><span className="font-semibold text-slate-900">Communication Style:</span> {selected.communicationStyle.join(", ")}</p>
            <p><span className="font-semibold text-slate-900">Hobbies:</span> {selected.hobbies.join(", ")}</p>
            <p><span className="font-semibold text-slate-900">Tagline:</span> {selected.profileTagline}</p>
            <p><span className="font-semibold text-slate-900">About Yourself:</span> {selected.aboutYourself}</p>
            <p><span className="font-semibold text-slate-900">Services Offered:</span> {selected.servicesOffered.join(", ")}</p>
            <p>
              <span className="font-semibold text-slate-900">Pricing:</span> Chat {selected.chatPricePerMinute}/min, Audio {selected.audioPricePerMinute}/min, Video {selected.videoPricePerMinute}/min, Visit {selected.visitPricePerSession}/session
            </p>
            <p><span className="font-semibold text-slate-900">Safety Checklist:</span> Platonic-only: {String(selected.safetyChecklist.platonicOnly)}, Respectful rules: {String(selected.safetyChecklist.respectfulRules)}, No outside payments: {String(selected.safetyChecklist.noOutsidePayments)}, Review verification: {String(selected.safetyChecklist.reviewVerification)}</p>
            <p><span className="font-semibold text-slate-900">Admin Note:</span> {selected.adminNote ?? "-"}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
