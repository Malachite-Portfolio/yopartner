"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import {
  type HomeVisitVerificationStatus,
  listHomeVisitVerifications,
  updateHomeVisitVerificationStatus,
} from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime, formatINR } from "@/lib/adminFormat";

type HomeVisitRow = {
  id: string;
  companionName: string;
  companionPhone: string;
  homeVisitStatus: HomeVisitVerificationStatus;
  moderationStatus: string;
  adminNote: string;
  homeVisitPrice: number;
  city: string;
  services: string[];
  updatedAt: string;
};

type StatusTarget = {
  row: HomeVisitRow;
  status: HomeVisitVerificationStatus;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function normalizeStatus(value: unknown): HomeVisitVerificationStatus {
  const raw = String(value ?? "").trim().toUpperCase();
  if (
    raw === "NOT_SUBMITTED" ||
    raw === "PENDING" ||
    raw === "APPROVED" ||
    raw === "REJECTED" ||
    raw === "NEEDS_INFO" ||
    raw === "SUSPENDED"
  ) {
    return raw;
  }
  return "NOT_SUBMITTED";
}

function toRows(data: unknown): HomeVisitRow[] {
  const root = asRecord(data);
  const rows = Array.isArray(root.verifications) ? root.verifications : [];

  return rows
    .map((item) => {
      const record = asRecord(item);
      const user = asRecord(record.user);
      const request = asRecord(record.request);
      return {
        id: asString(record.companionId ?? record.id),
        companionName: asString(record.companionName, "-"),
        companionPhone: asString(user.phoneNumber, "-"),
        homeVisitStatus: normalizeStatus(record.homeVisitStatus),
        moderationStatus: asString(record.moderationStatus, "-"),
        adminNote: asString(record.adminNote),
        homeVisitPrice: asNumber(request.homeVisitPrice),
        city: asString(request.city),
        services: asStringArray(request.categories),
        updatedAt: asString(record.updatedAt),
      } satisfies HomeVisitRow;
    })
    .filter((row) => Boolean(row.id))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export default function AdminHomeVisitVerificationPage() {
  const router = useRouter();
  const [rows, setRows] = useState<HomeVisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | HomeVisitVerificationStatus>("All");
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    setApiError("");
    const response = await listHomeVisitVerifications();
    if (response.error) {
      if (response.error.status === 401) {
        clearAdminAuthSession();
        router.replace("/admin/login");
        return;
      }
      setRows([]);
      setApiError(response.error.message || "Unable to load home visit verifications.");
      setLoading(false);
      return;
    }

    setRows(toRows(response.data));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "All" && row.homeVisitStatus !== filter) return false;
      if (!term) return true;
      return `${row.companionName} ${row.companionPhone} ${row.city}`.toLowerCase().includes(term);
    });
  }, [rows, search, filter]);

  async function handleSubmitStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!statusTarget || statusSubmitting) return;

    const reason = statusReason.trim();
    if (!reason) {
      setStatusError("Reason is required.");
      return;
    }

    setStatusSubmitting(true);
    setStatusError("");

    const response = await updateHomeVisitVerificationStatus(statusTarget.row.id, {
      status: statusTarget.status,
      reason,
    });

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setStatusSubmitting(false);
      setStatusError(response.error?.message ?? "Unable to update home visit status.");
      return;
    }

    setStatusSubmitting(false);
    setStatusTarget(null);
    setStatusReason("");
    setInfoMessage(`Updated ${statusTarget.row.companionName} to ${statusTarget.status}.`);
    await loadRows();
  }

  function openStatusModal(row: HomeVisitRow, status: HomeVisitVerificationStatus) {
    setStatusTarget({ row, status });
    setStatusReason("");
    setStatusError("");
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm shadow-teal-900/5">
        <p className="text-sm font-semibold text-[#0f766e]">Admin Verification</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Home Visit Verification</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Review and control home visit eligibility separately from regular online partner approval.
        </p>
      </div>

      {apiError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{apiError}</p>
      ) : null}
      {infoMessage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{infoMessage}</p>
      ) : null}

      <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              void loadRows();
            }}
            className="rounded-xl border border-[#dceae5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search companion or phone..."
          filterValue={filter}
          onFilterChange={(value) => setFilter(value as "All" | HomeVisitVerificationStatus)}
          filterOptions={["All", "NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED", "NEEDS_INFO", "SUSPENDED"]}
        />

        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading home visit verification requests...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Companion</th>
                  <th className="px-2 py-2">Phone</th>
                  <th className="px-2 py-2">Home Visit Status</th>
                  <th className="px-2 py-2">Moderation</th>
                  <th className="px-2 py-2">City / Request</th>
                  <th className="px-2 py-2">Price</th>
                  <th className="px-2 py-2">Admin Note</th>
                  <th className="px-2 py-2">Updated</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-3 text-slate-500">No home visit verification records.</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="px-2 py-2 text-slate-800">{item.companionName}</td>
                      <td className="px-2 py-2 text-slate-700">{item.companionPhone}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.homeVisitStatus} /></td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.moderationStatus} /></td>
                      <td className="px-2 py-2 text-slate-700">
                        <div>{item.city || "-"}</div>
                        <div className="text-xs text-slate-500">{item.services.join(", ") || "No categories"}</div>
                      </td>
                      <td className="px-2 py-2 text-slate-700">{item.homeVisitPrice > 0 ? formatINR(item.homeVisitPrice) : "-"}</td>
                      <td className="px-2 py-2 text-xs text-slate-700">{item.adminNote || "-"}</td>
                      <td className="px-2 py-2 text-slate-700">{item.updatedAt ? formatDateTime(item.updatedAt) : "-"}</td>
                      <td className="px-2 py-2">
                        <AdminActionMenu
                          actions={[
                            { label: "Approve", tone: "success", onClick: () => openStatusModal(item, "APPROVED") },
                            { label: "Reject", tone: "danger", onClick: () => openStatusModal(item, "REJECTED") },
                            { label: "Needs Info", tone: "warning", onClick: () => openStatusModal(item, "NEEDS_INFO") },
                            { label: "Suspend", tone: "danger", onClick: () => openStatusModal(item, "SUSPENDED") },
                            { label: "Mark Pending", onClick: () => openStatusModal(item, "PENDING") },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <AdminDetailDrawer
        open={Boolean(statusTarget)}
        title={statusTarget ? `Set ${statusTarget.status}` : "Update Home Visit Status"}
        onClose={() => {
          if (statusSubmitting) return;
          setStatusTarget(null);
          setStatusReason("");
          setStatusError("");
        }}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                setStatusTarget(null);
                setStatusReason("");
                setStatusError("");
              }}
              disabled={statusSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="home-visit-status-form"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={statusSubmitting}
            >
              {statusSubmitting ? "Updating..." : "Update"}
            </button>
          </div>
        )}
      >
        {statusTarget ? (
          <form id="home-visit-status-form" className="space-y-4" onSubmit={handleSubmitStatus}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Companion:</span> {statusTarget.row.companionName}</p>
              <p><span className="font-semibold text-slate-900">Phone:</span> {statusTarget.row.companionPhone}</p>
              <p><span className="font-semibold text-slate-900">New Status:</span> {statusTarget.status}</p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-800">Admin Note / Reason</span>
              <textarea
                value={statusReason}
                onChange={(event) => setStatusReason(event.target.value)}
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
                placeholder="Reason for audit trail"
                maxLength={500}
                required
                disabled={statusSubmitting}
              />
            </label>

            {statusError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{statusError}</p>
            ) : null}
          </form>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
