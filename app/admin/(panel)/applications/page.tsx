"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { listApplications, updateApplicationStatus } from "@/lib/api/admin";
import { type AdminApplication, type AdminApplicationStatus } from "@/lib/adminData";
import { formatDateTime, getAdminApplications, getAdminCompanions, setAdminApplications, setAdminCompanions } from "@/lib/adminStore";
import { isClientDemoAdminSessionActive, isClientDemoEnabled } from "@/lib/clientDemoData";

type ApplicationRow = {
  id: string;
  applicationId: string;
  partnerName: string;
  phone: string;
  age: string;
  gender: string;
  bornCity: string;
  languagesKnown: string[];
  servicesOffered: string[];
  submittedDate: string;
  status: AdminApplicationStatus;
  kycStatus: string;
  verificationStatus: string;
  profileTagline: string;
  aboutYourself: string;
};

const statusFilterOptions: Array<"All" | AdminApplicationStatus> = [
  "All",
  "Draft",
  "Under Review",
  "Approved",
  "Rejected",
  "Needs Info",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toUiStatus(value: unknown): AdminApplicationStatus {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "REJECTED") return "Rejected";
  if (normalized === "NEEDS_INFO" || normalized === "NEEDS-INFO") return "Needs Info";
  if (normalized === "DRAFT") return "Draft";
  return "Under Review";
}

function toApplicationRows(data: unknown): ApplicationRow[] {
  const root = asRecord(data);
  const applicationsRaw = Array.isArray(root.applications)
    ? root.applications
    : Array.isArray(root.data)
      ? root.data
      : [];

  return applicationsRaw.map((item, index) => {
    const record = asRecord(item);
    const payload = asRecord(record.payload);
    const languages = Array.isArray(record.languagesKnown)
      ? record.languagesKnown
      : Array.isArray(payload.languagesKnown)
        ? payload.languagesKnown
        : [];
    const services = Array.isArray(record.servicesOffered)
      ? record.servicesOffered
      : Array.isArray(payload.servicesOffered)
        ? payload.servicesOffered
        : [];

    return {
      id: String(record.id ?? `application-${index + 1}`),
      applicationId: String(record.applicationId ?? record.id ?? `APP-${index + 1}`),
      partnerName: String(record.fullName ?? record.partnerName ?? payload.fullName ?? "-"),
      phone: String(record.phoneNumber ?? record.phone ?? payload.phoneNumber ?? "-"),
      age: String(record.age ?? payload.age ?? "-"),
      gender: String(record.gender ?? payload.gender ?? "-"),
      bornCity: String(record.bornCity ?? record.city ?? payload.bornCity ?? "-"),
      languagesKnown: languages.map((value) => String(value)),
      servicesOffered: services.map((value) => String(value)),
      submittedDate: String(record.submittedAt ?? record.createdAt ?? record.updatedAt ?? new Date().toISOString()),
      status: toUiStatus(record.status),
      kycStatus: titleCase(String(record.kycStatus ?? payload.kycStatus ?? "PENDING")),
      verificationStatus: titleCase(String(record.verificationStatus ?? payload.verificationStatus ?? "PENDING")),
      profileTagline: String(record.profileTagline ?? payload.profileTagline ?? "-"),
      aboutYourself: String(record.aboutYourself ?? payload.aboutYourself ?? "-"),
    };
  });
}

function toApiStatus(status: AdminApplicationStatus) {
  if (status === "Needs Info") return "needs_info";
  if (status === "Under Review") return "under_review";
  return status.toLowerCase();
}

export default function AdminApplicationsPage() {
  const isDemoPreview = isClientDemoEnabled() && isClientDemoAdminSessionActive();
  const demoRows = useMemo<ApplicationRow[]>(
    () =>
      isDemoPreview
        ? getAdminApplications().map((item) => ({
            id: item.id,
            applicationId: item.applicationId,
            partnerName: item.partnerName,
            phone: item.phone,
            age: item.age,
            gender: item.gender,
            bornCity: item.bornCity,
            languagesKnown: item.languagesKnown,
            servicesOffered: item.servicesOffered,
            submittedDate: item.submittedDate,
            status: item.status,
            kycStatus: "Pending",
            verificationStatus: "Pending",
            profileTagline: item.profileTagline,
            aboutYourself: item.aboutYourself,
          }))
        : [],
    [isDemoPreview],
  );

  const [applications, setApplications] = useState<ApplicationRow[]>(() => demoRows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | AdminApplicationStatus>("All");
  const [selected, setSelected] = useState<ApplicationRow | null>(null);
  const [loading, setLoading] = useState(!isDemoPreview);
  const [apiError, setApiError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionApiAvailable, setActionApiAvailable] = useState(isDemoPreview);

  useEffect(() => {
    if (isDemoPreview) return;

    let active = true;
    const loadApplications = async () => {
      setLoading(true);
      setApiError("");
      setActionError("");

      const response = await listApplications();
      if (!active) return;

      if (response.error) {
        setApiError("Admin data could not be loaded. Please try again.");
        setApplications([]);
        setActionApiAvailable(false);
        setLoading(false);
        return;
      }

      setApplications(toApplicationRows(response.data));

      // Probe action endpoint safely: empty payload should return 400 when endpoint exists.
      const probe = await updateApplicationStatus({});
      if (!active) return;
      setActionApiAvailable(probe.error?.status === 400 || probe.data !== null);

      setLoading(false);
    };

    void loadApplications();
    return () => {
      active = false;
    };
  }, [isDemoPreview]);

  const persistDemo = (next: ApplicationRow[]) => {
    setApplications(next);
    if (!isDemoPreview) return;

    const existing = getAdminApplications();
    const merged: AdminApplication[] = next.flatMap((row) => {
      const found = existing.find((item) => item.id === row.id);
      if (!found) return [];
      return [{
        ...found,
        partnerName: row.partnerName,
        phone: row.phone,
        age: row.age,
        gender: row.gender,
        bornCity: row.bornCity,
        languagesKnown: row.languagesKnown,
        servicesOffered: row.servicesOffered,
        submittedDate: row.submittedDate,
        status: row.status,
      }];
    });

    setAdminApplications(merged);
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

  const setStatus = async (target: ApplicationRow, status: AdminApplicationStatus) => {
    setActionError("");
    if (isDemoPreview) {
      const next = applications.map((item) => (item.id === target.id ? { ...item, status } : item));
      persistDemo(next);
      setSelected((current) => (current?.id === target.id ? { ...current, status } : current));
      if (status === "Approved") {
        const companions = getAdminCompanions();
        const exists = companions.some((item) => item.phone === target.phone);
        if (!exists) {
          setAdminCompanions([
            {
              id: `ac-${target.id}`,
              name: target.partnerName,
              phone: target.phone,
              city: target.bornCity || "-",
              category: "Communication & Emotional Support",
              languages: target.languagesKnown,
              services: target.servicesOffered,
              chatPrice: 0,
              audioPrice: 0,
              videoPrice: 0,
              visitPrice: 0,
              rating: 0,
              sessions: 0,
              earnings: 0,
              verificationStatus: "Pending",
              availability: "Offline",
              status: "Active",
              tagline: target.profileTagline,
            },
            ...companions,
          ]);
        }
      }
      return;
    }

    if (!actionApiAvailable) {
      setActionError("Approval action API is not connected yet.");
      return;
    }

    const response = await updateApplicationStatus({
      id: target.id,
      status: toApiStatus(status),
    });
    if (response.error) {
      setActionError(
        response.error.status === 404 || response.error.status === 501
          ? "Approval action API is not connected yet."
          : response.error.message || "Failed to update application status.",
      );
      return;
    }

    const next = applications.map((item) => (item.id === target.id ? { ...item, status } : item));
    setApplications(next);
    setSelected((current) => (current?.id === target.id ? { ...current, status } : current));
  };

  const rejectApplication = async (application: ApplicationRow) => {
    await setStatus(application, "Rejected");
  };

  const needsInfoApplication = async (application: ApplicationRow) => {
    await setStatus(application, "Needs Info");
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Partner Applications</h2>
        <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading applications...
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Partner Applications</h2>
      {apiError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{apiError}</p>
      ) : null}
      {actionError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{actionError}</p>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by application ID, name, phone or city..."
          filterValue={statusFilter}
          onFilterChange={(value) => setStatusFilter(value as "All" | AdminApplicationStatus)}
          filterOptions={statusFilterOptions}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Application ID</th>
                <th className="px-2 py-2">Partner Name</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Services</th>
                <th className="px-2 py-2">KYC</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Submitted</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-3 text-slate-500">No applications found.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 align-top">
                    <td className="px-2 py-2 font-medium text-slate-800">{item.applicationId}</td>
                    <td className="px-2 py-2 text-slate-700">{item.partnerName}</td>
                    <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                    <td className="px-2 py-2 text-slate-700">{item.servicesOffered.join(", ") || "-"}</td>
                    <td className="px-2 py-2 text-slate-700">{item.kycStatus}</td>
                    <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                    <td className="px-2 py-2 text-slate-700">{formatDateTime(item.submittedDate)}</td>
                    <td className="px-2 py-2">
                      <AdminActionMenu
                        actions={[
                          { label: "View", onClick: () => setSelected(item) },
                          {
                            label: "Approve",
                            onClick: () => {
                              void setStatus(item, "Approved");
                            },
                            tone: "success",
                            disabled: !isDemoPreview && !actionApiAvailable,
                            title: !isDemoPreview && !actionApiAvailable ? "Approval action API is not connected yet." : undefined,
                          },
                          {
                            label: "Reject",
                            onClick: () => {
                              void rejectApplication(item);
                            },
                            tone: "danger",
                            disabled: !isDemoPreview && !actionApiAvailable,
                            title: !isDemoPreview && !actionApiAvailable ? "Approval action API is not connected yet." : undefined,
                          },
                          {
                            label: "Needs Info",
                            onClick: () => {
                              void needsInfoApplication(item);
                            },
                            tone: "warning",
                            disabled: !isDemoPreview && !actionApiAvailable,
                            title: !isDemoPreview && !actionApiAvailable ? "Approval action API is not connected yet." : undefined,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
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
              <p><span className="font-semibold text-slate-900">Born City:</span> {selected.bornCity}</p>
              <p><span className="font-semibold text-slate-900">KYC Status:</span> {selected.kycStatus}</p>
            </div>
            <p><span className="font-semibold text-slate-900">Languages Known:</span> {selected.languagesKnown.join(", ") || "-"}</p>
            <p><span className="font-semibold text-slate-900">Services Offered:</span> {selected.servicesOffered.join(", ") || "-"}</p>
            <p><span className="font-semibold text-slate-900">Tagline:</span> {selected.profileTagline}</p>
            <p><span className="font-semibold text-slate-900">About Yourself:</span> {selected.aboutYourself}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
