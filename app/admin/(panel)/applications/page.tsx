"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import {
  listApplications,
  type AdminApplicationUpdateStatus,
  updateAdminApplicationStatus,
} from "@/lib/api/admin";
import { formatDateTime } from "@/lib/adminStore";

type AdminApplicationStatus = "Draft" | "Under Review" | "Approved" | "Rejected" | "Needs Info";

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

type RowAction = "approve" | "reject" | "needs_info";

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
    const applicantUser = asRecord(record.applicantUser);
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
      phone: String(applicantUser.phoneNumber ?? record.phoneNumber ?? record.phone ?? payload.phoneNumber ?? "-"),
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
  }).sort((a, b) => +new Date(b.submittedDate) - +new Date(a.submittedDate));
}

function toUiStatusFromApi(status: AdminApplicationUpdateStatus): AdminApplicationStatus {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  return "Needs Info";
}

export default function AdminApplicationsPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | AdminApplicationStatus>("All");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rowActionLoading, setRowActionLoading] = useState<Record<string, RowAction | undefined>>({});

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setApiError("");
    const response = await listApplications();

    if (response.error) {
      if (response.error.status === 401) {
        clearAdminAuthSession();
        setApiError("Admin session expired. Please login again.");
        router.replace("/admin/login");
        setLoading(false);
        return;
      }
      setApiError("Unable to load partner applications. Please retry.");
      setApplications([]);
      setLoading(false);
      return;
    }

    setApplications(toApplicationRows(response.data));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadApplications();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadApplications]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (!term) return true;
      const text = `${item.applicationId} ${item.partnerName} ${item.phone} ${item.bornCity}`.toLowerCase();
      return text.includes(term);
    });
  }, [applications, search, statusFilter]);

  const setRowLoading = (id: string, action?: RowAction) => {
    setRowActionLoading((current) => ({
      ...current,
      [id]: action,
    }));
  };

  const applyStatusAction = async (
    row: ApplicationRow,
    status: AdminApplicationUpdateStatus,
    action: RowAction,
    adminNote?: string,
  ) => {
    setActionError("");
    setSuccessMessage("");
    setRowLoading(row.id, action);

    const response = await updateAdminApplicationStatus(row.id, status, adminNote);
    setRowLoading(row.id, undefined);

    if (response.error) {
      if (response.error.status === 401) {
        clearAdminAuthSession();
        setActionError("Admin session expired. Please login again.");
        router.replace("/admin/login");
        return;
      }
      setActionError(response.error.message || "Failed to update application status.");
      return;
    }

    const nextStatus = toUiStatusFromApi(status);
    setApplications((current) => current.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item)));

    if (status === "APPROVED") {
      setSuccessMessage("Application approved successfully.");
    } else if (status === "REJECTED") {
      setSuccessMessage("Application rejected successfully.");
    } else {
      setSuccessMessage("Application moved to Needs Info successfully.");
    }

    void loadApplications();
  };

  const handleApprove = async (row: ApplicationRow) => {
    const confirmed = window.confirm("Approve this partner application? This will activate the companion profile.");
    if (!confirmed) return;
    await applyStatusAction(row, "APPROVED", "approve");
  };

  const handleReject = async (row: ApplicationRow) => {
    const confirmed = window.confirm("Reject this partner application?");
    if (!confirmed) return;
    const note = window.prompt("Add a rejection note (optional)", "") ?? undefined;
    await applyStatusAction(row, "REJECTED", "reject", note?.trim() ? note.trim() : undefined);
  };

  const handleNeedsInfo = async (row: ApplicationRow) => {
    const note = window.prompt("What information is needed?", "");
    if (note === null) return;
    await applyStatusAction(row, "NEEDS_INFO", "needs_info", note.trim() ? note.trim() : undefined);
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Partner review queue</h2>
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading partner reviews...
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm shadow-teal-900/5">
        <p className="text-sm font-semibold text-[#0f766e]">KYC Review</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Partner review queue</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Review companion applications, KYC status, services, and safety readiness before a partner can accept requests.
        </p>
      </div>
      {apiError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{apiError}</p>
      ) : null}
      {actionError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{actionError}</p>
      ) : null}
      {successMessage ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{successMessage}</p>
      ) : null}

      <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              void loadApplications();
            }}
            className="rounded-xl border border-[#dceae5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by application ID, name, phone, or city..."
          filterValue={statusFilter}
          onFilterChange={(value) => setStatusFilter(value as "All" | AdminApplicationStatus)}
          filterOptions={statusFilterOptions}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Application ID</th>
                <th className="px-2 py-2">Partner name</th>
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
                  <td colSpan={8} className="px-2 py-3 text-slate-500">No partner applications yet.</td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const rowAction = rowActionLoading[item.id];
                  const isApproved = item.status === "Approved";
                  const isRejected = item.status === "Rejected";
                  const isNeedsInfo = item.status === "Needs Info";
                  const rowBusy = Boolean(rowAction);

                  return (
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
                            { label: "View profile", onClick: () => router.push(`/admin/applications/${item.id}`) },
                            {
                              label: rowAction === "approve" ? "Approving..." : "Approve",
                              onClick: () => {
                                void handleApprove(item);
                              },
                              tone: "success",
                              disabled: rowBusy || isApproved,
                            },
                            {
                              label: rowAction === "reject" ? "Rejecting..." : "Reject",
                              onClick: () => {
                                void handleReject(item);
                              },
                              tone: "danger",
                              disabled: rowBusy || isRejected,
                            },
                            {
                              label: rowAction === "needs_info" ? "Saving..." : "Need Info",
                              onClick: () => {
                                void handleNeedsInfo(item);
                              },
                              tone: "warning",
                              disabled: rowBusy || isNeedsInfo,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
