"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import {
  listCompanions,
  removeAdminPartner,
  type AdminPartnerModerationStatus,
  updateAdminPartnerStatus,
} from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime } from "@/lib/adminFormat";
import { AUDIO_RATE_PER_MIN, CHAT_RATE_PER_MIN, VIDEO_RATE_PER_MIN } from "@/lib/platformPricing";

type AdminPartnerDisplayStatus = AdminPartnerModerationStatus | "REMOVED";

type PartnerRow = {
  id: string;
  name: string;
  loginPhone: string;
  moderationStatus: AdminPartnerModerationStatus;
  moderationDisplayStatus: AdminPartnerDisplayStatus;
  moderationReason: string;
  moderationExpiresAt: string;
  isRemoved: boolean;
  companionStatus: string;
  verificationStatus: string;
  services: string[];
  chatPrice: number;
  audioPrice: number;
  videoPrice: number;
  online: boolean;
  createdAt: string;
  updatedAt: string;
};

type StatusTarget = {
  partner: PartnerRow;
  status: AdminPartnerModerationStatus;
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

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  return String(value ?? "").trim().toLowerCase() === "true";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function normalizePartnerStatus(value: unknown): AdminPartnerModerationStatus {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "ACTIVE" || raw === "RESTRICTED" || raw === "TEMP_BANNED" || raw === "BANNED" || raw === "HIDDEN") {
    return raw;
  }
  return "ACTIVE";
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(value, 0));
}

function formatService(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === "CHAT") return "Chat";
  if (normalized === "AUDIO") return "Audio";
  if (normalized === "VIDEO") return "Video";
  if (normalized === "HOME_VISIT") return "Home Visit";
  return value;
}

function toPartnerRows(data: unknown): PartnerRow[] {
  const root = asRecord(data);
  const companionsRaw = Array.isArray(root.companions) ? root.companions : [];

  return companionsRaw
    .map((item) => {
      const record = asRecord(item);
      const user = asRecord(record.user);
      const moderationStatus = normalizePartnerStatus(record.moderationStatus);
      const latestActionType = asString(record.latestModerationActionType).toUpperCase();
      const removalStatus = asString(record.removalStatus).toUpperCase();
      const isRemoved =
        moderationStatus === "HIDDEN" &&
        (asBoolean(record.isRemoved) || latestActionType === "PARTNER_REMOVED" || removalStatus === "REMOVED");
      return {
        id: asString(record.id),
        name: asString(record.displayName ?? user.name, "-"),
        loginPhone: asString(user.phoneNumber, "-"),
        moderationStatus,
        moderationDisplayStatus: isRemoved ? "REMOVED" : moderationStatus,
        moderationReason: asString(record.moderationReason),
        moderationExpiresAt: asString(record.moderationExpiresAt),
        isRemoved,
        companionStatus: asString(record.status, "-"),
        verificationStatus: asString(record.verificationStatus, "-"),
        services: asStringArray(record.servicesOffered).map(formatService),
        chatPrice: CHAT_RATE_PER_MIN,
        audioPrice: AUDIO_RATE_PER_MIN,
        videoPrice: asNumber(record.videoPrice) > 0 ? VIDEO_RATE_PER_MIN : 0,
        online: Boolean(record.isOnline),
        createdAt: asString(record.createdAt),
        updatedAt: asString(record.updatedAt),
      } satisfies PartnerRow;
    })
    .filter((item) => Boolean(item.id))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export default function AdminCompanionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | AdminPartnerDisplayStatus>("All");
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusExpiresAt, setStatusExpiresAt] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [removeTarget, setRemoveTarget] = useState<PartnerRow | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const loadCompanions = useCallback(async () => {
    setLoading(true);
    setApiError("");
    const response = await listCompanions();
    if (response.error) {
      if (response.error.status === 401) {
        clearAdminAuthSession();
        router.replace("/admin/login");
        return;
      }
      setRows([]);
      setApiError(response.error.message || "Unable to load partners. Please retry.");
      setLoading(false);
      return;
    }
    setRows(toPartnerRows(response.data));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCompanions();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCompanions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "All" && row.moderationDisplayStatus !== filter) return false;
      if (!term) return true;
      const text = `${row.name} ${row.loginPhone} ${row.services.join(" ")}`.toLowerCase();
      return text.includes(term);
    });
  }, [rows, search, filter]);

  function openStatusModal(partner: PartnerRow, status: AdminPartnerModerationStatus) {
    setStatusTarget({ partner, status });
    setStatusReason("");
    setStatusExpiresAt("");
    setStatusError("");
  }

  async function handleSubmitStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!statusTarget || statusSubmitting) return;

    const reason = statusReason.trim();
    if (!reason) {
      setStatusError("Reason is required.");
      return;
    }

    const requiresExpiry = statusTarget.status === "RESTRICTED" || statusTarget.status === "TEMP_BANNED";
    if (requiresExpiry && !statusExpiresAt) {
      setStatusError("Expiry is required for temporary actions.");
      return;
    }

    setStatusSubmitting(true);
    setStatusError("");

    const response = await updateAdminPartnerStatus(statusTarget.partner.id, {
      status: statusTarget.status,
      reason,
      ...(requiresExpiry && statusExpiresAt ? { expiresAt: new Date(statusExpiresAt).toISOString() } : {}),
    });

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setStatusSubmitting(false);
      setStatusError(response.error?.message ?? "Unable to update partner status.");
      return;
    }

    setStatusSubmitting(false);
    setStatusTarget(null);
    setStatusReason("");
    setStatusExpiresAt("");
    const actionLabel = getStatusActionLabel(statusTarget.partner, statusTarget.status);
    setInfoMessage(
      actionLabel === "Restore Host"
        ? `Restored ${statusTarget.partner.name}.`
        : `Updated ${statusTarget.partner.name} to ${statusTarget.status}.`,
    );
    await loadCompanions();
  }

  function getStatusActionLabel(partner: PartnerRow, status: AdminPartnerModerationStatus) {
    if (status === "ACTIVE" && partner.isRemoved) return "Restore Host";
    return "Update Status";
  }

  function openRemoveModal(partner: PartnerRow) {
    setRemoveTarget(partner);
    setRemoveReason("");
    setRemoveError("");
  }

  async function handleSubmitRemove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!removeTarget || removeSubmitting) return;

    const reason = removeReason.trim();
    if (!reason) {
      setRemoveError("Reason is required.");
      return;
    }

    setRemoveSubmitting(true);
    setRemoveError("");

    const response = await removeAdminPartner(removeTarget.id, { reason });

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setRemoveSubmitting(false);
      setRemoveError(response.error?.message ?? "Unable to remove host.");
      return;
    }

    setRemoveSubmitting(false);
    setRemoveTarget(null);
    setRemoveReason("");
    setInfoMessage(response.data.message || "Host removed successfully.");
    await loadCompanions();
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm shadow-teal-900/5">
        <p className="text-sm font-semibold text-[#0f766e]">Partner Moderation</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Partners</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Manage partner visibility and access without deleting records.
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
              void loadCompanions();
            }}
            className="rounded-xl border border-[#dceae5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, phone, or service..."
          filterValue={filter}
          onFilterChange={(value) => setFilter(value as "All" | AdminPartnerDisplayStatus)}
          filterOptions={["All", "ACTIVE", "RESTRICTED", "TEMP_BANNED", "BANNED", "HIDDEN", "REMOVED"]}
        />

        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading partners...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Login phone</th>
                  <th className="px-2 py-2">Partner Status</th>
                  <th className="px-2 py-2">Moderation</th>
                  <th className="px-2 py-2">Services</th>
                  <th className="px-2 py-2">Pricing</th>
                  <th className="px-2 py-2">Online</th>
                  <th className="px-2 py-2">Updated</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-3 text-slate-500">No partners found.</td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const actions = item.isRemoved
                      ? [{ label: "Restore Host", tone: "success" as const, onClick: () => openStatusModal(item, "ACTIVE") }]
                      : [
                          { label: "Restrict", tone: "warning" as const, onClick: () => openStatusModal(item, "RESTRICTED") },
                          { label: "Temp Ban", tone: "danger" as const, onClick: () => openStatusModal(item, "TEMP_BANNED") },
                          { label: "Ban", tone: "danger" as const, onClick: () => openStatusModal(item, "BANNED") },
                          { label: "Hide", tone: "warning" as const, onClick: () => openStatusModal(item, "HIDDEN") },
                          { label: "Remove Host", tone: "danger" as const, onClick: () => openRemoveModal(item) },
                          { label: "Activate", tone: "success" as const, onClick: () => openStatusModal(item, "ACTIVE") },
                        ];
                    return (
                      <tr key={item.id} className="border-t border-slate-100 align-top">
                        <td className="px-2 py-2 text-slate-800">{item.name}</td>
                        <td className="px-2 py-2 text-slate-700">{item.loginPhone}</td>
                        <td className="px-2 py-2">
                          <div className="space-y-1">
                            <AdminStatusBadge status={item.companionStatus} />
                            <AdminStatusBadge status={item.verificationStatus} />
                          </div>
                        </td>
                        <td className="px-2 py-2 text-xs text-slate-700">
                          <AdminStatusBadge status={item.moderationDisplayStatus} />
                          <div className="mt-1">{item.moderationReason || "-"}</div>
                          {item.moderationExpiresAt ? <div>Until: {formatDateTime(item.moderationExpiresAt)}</div> : null}
                        </td>
                        <td className="px-2 py-2 text-slate-700">{item.services.join(", ") || "-"}</td>
                        <td className="px-2 py-2 text-slate-700">
                          Chat {formatINR(item.chatPrice)} | Audio {formatINR(item.audioPrice)} | Video {formatINR(item.videoPrice)}
                        </td>
                        <td className="px-2 py-2">
                          <AdminStatusBadge status={item.online ? "ONLINE" : "OFFLINE"} />
                        </td>
                        <td className="px-2 py-2 text-slate-700">{item.updatedAt ? formatDateTime(item.updatedAt) : "-"}</td>
                        <td className="px-2 py-2">
                          <AdminActionMenu actions={actions} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <AdminDetailDrawer
        open={Boolean(statusTarget)}
        title={statusTarget ? getStatusActionLabel(statusTarget.partner, statusTarget.status) : "Set Partner Status"}
        onClose={() => {
          if (statusSubmitting) return;
          setStatusTarget(null);
          setStatusReason("");
          setStatusExpiresAt("");
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
                setStatusExpiresAt("");
                setStatusError("");
              }}
              disabled={statusSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="partner-status-update-form"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={statusSubmitting}
            >
              {statusSubmitting ? "Updating..." : statusTarget ? getStatusActionLabel(statusTarget.partner, statusTarget.status) : "Update Status"}
            </button>
          </div>
        )}
      >
        {statusTarget ? (
          <form id="partner-status-update-form" className="space-y-4" onSubmit={handleSubmitStatus}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Partner:</span> {statusTarget.partner.name}</p>
              <p><span className="font-semibold text-slate-900">Phone:</span> {statusTarget.partner.loginPhone}</p>
              <p>
                <span className="font-semibold text-slate-900">New Status:</span>{" "}
                {statusTarget.partner.isRemoved && statusTarget.status === "ACTIVE" ? "RESTORED (ACTIVE)" : statusTarget.status}
              </p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-800">Reason</span>
              <textarea
                value={statusReason}
                onChange={(event) => setStatusReason(event.target.value)}
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
                placeholder="Required reason for audit trail"
                maxLength={500}
                required
                disabled={statusSubmitting}
              />
            </label>

            {statusTarget.status === "RESTRICTED" || statusTarget.status === "TEMP_BANNED" ? (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-800">Expiry</span>
                <input
                  type="datetime-local"
                  value={statusExpiresAt}
                  onChange={(event) => setStatusExpiresAt(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
                  required
                  disabled={statusSubmitting}
                />
              </label>
            ) : null}

            {statusError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{statusError}</p>
            ) : null}
          </form>
        ) : null}
      </AdminDetailDrawer>

      <AdminDetailDrawer
        open={Boolean(removeTarget)}
        title="Remove Host"
        onClose={() => {
          if (removeSubmitting) return;
          setRemoveTarget(null);
          setRemoveReason("");
          setRemoveError("");
        }}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                setRemoveTarget(null);
                setRemoveReason("");
                setRemoveError("");
              }}
              disabled={removeSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="partner-remove-form"
              className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={removeSubmitting}
            >
              {removeSubmitting ? "Removing..." : "Remove Host"}
            </button>
          </div>
        )}
      >
        {removeTarget ? (
          <form id="partner-remove-form" className="space-y-4" onSubmit={handleSubmitRemove}>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <p className="font-semibold text-rose-900">Are you sure you want to remove this host?</p>
              <p className="mt-2">
                They will no longer appear publicly or receive requests. Past records will be kept for audit.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Host:</span> {removeTarget.name}</p>
              <p><span className="font-semibold text-slate-900">Phone:</span> {removeTarget.loginPhone}</p>
              <p><span className="font-semibold text-slate-900">Current moderation:</span> {removeTarget.moderationStatus}</p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-800">Reason</span>
              <textarea
                value={removeReason}
                onChange={(event) => setRemoveReason(event.target.value)}
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
                placeholder="Required reason for audit trail"
                maxLength={500}
                required
                disabled={removeSubmitting}
              />
            </label>

            {removeError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{removeError}</p>
            ) : null}
          </form>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
