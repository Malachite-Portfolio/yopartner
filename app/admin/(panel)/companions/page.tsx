"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { listCompanions } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime } from "@/lib/adminFormat";

type ActivePartnerRow = {
  id: string;
  name: string;
  loginPhone: string;
  services: string[];
  chatPrice: number;
  audioPrice: number;
  videoPrice: number;
  online: boolean;
  homeVisitApprovalStatus: string;
  createdAt: string;
  updatedAt: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function toActivePartnerRows(data: unknown): ActivePartnerRow[] {
  const root = asRecord(data);
  const companionsRaw = Array.isArray(root.companions) ? root.companions : [];

  return companionsRaw
    .map((item) => {
      const record = asRecord(item);
      const user = asRecord(record.user);
      const status = String(record.status ?? "").toUpperCase();
      const verificationStatus = String(record.verificationStatus ?? "").toUpperCase();
      if (status !== "ACTIVE" || verificationStatus !== "VERIFIED") return null;

      const services = asStringArray(record.servicesOffered).map(formatService);
      return {
        id: String(record.id ?? ""),
        name: String(record.displayName ?? user.name ?? "-"),
        loginPhone: String(user.phoneNumber ?? "-"),
        services,
        chatPrice: asNumber(record.chatPrice),
        audioPrice: asNumber(record.audioPrice),
        videoPrice: asNumber(record.videoPrice),
        online: Boolean(record.isOnline),
        homeVisitApprovalStatus: services.includes("Home Visit") ? "Approved" : "Not requested",
        createdAt: String(record.createdAt ?? ""),
        updatedAt: String(record.updatedAt ?? record.createdAt ?? ""),
      };
    })
    .filter((item): item is ActivePartnerRow => Boolean(item))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export default function AdminCompanionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ActivePartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [search, setSearch] = useState("");

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
      setApiError("Unable to load active partners. Please retry.");
      setLoading(false);
      return;
    }
    setRows(toActivePartnerRows(response.data));
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
    if (!term) return rows;
    return rows.filter((row) => {
      const text = `${row.name} ${row.loginPhone} ${row.services.join(" ")}`.toLowerCase();
      return text.includes(term);
    });
  }, [rows, search]);

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Active Partners</h2>
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading active partners...
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm shadow-teal-900/5">
        <p className="text-sm font-semibold text-[#0f766e]">Active Partners</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Active Partners</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Approved partners with active and verified profiles.
        </p>
      </div>

      {apiError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{apiError}</p>
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
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Login phone</th>
                <th className="px-2 py-2">Services</th>
                <th className="px-2 py-2">Pricing</th>
                <th className="px-2 py-2">Availability</th>
                <th className="px-2 py-2">Home Visit</th>
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">Approved</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-3 text-slate-500">No active partners yet.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 align-top">
                    <td className="px-2 py-2 text-slate-800">{item.name}</td>
                    <td className="px-2 py-2 text-slate-700">{item.loginPhone}</td>
                    <td className="px-2 py-2 text-slate-700">{item.services.join(", ") || "-"}</td>
                    <td className="px-2 py-2 text-slate-700">
                      Chat {formatINR(item.chatPrice)} | Audio {formatINR(item.audioPrice)} | Video {formatINR(item.videoPrice)}
                    </td>
                    <td className="px-2 py-2">
                      <AdminStatusBadge status={item.online ? "Online" : "Offline"} />
                    </td>
                    <td className="px-2 py-2 text-slate-700">{item.homeVisitApprovalStatus}</td>
                    <td className="px-2 py-2 text-slate-700">{item.createdAt ? formatDateTime(item.createdAt) : "-"}</td>
                    <td className="px-2 py-2 text-slate-700">{item.updatedAt ? formatDateTime(item.updatedAt) : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
