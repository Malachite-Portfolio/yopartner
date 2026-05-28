"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { listReviews } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime } from "@/lib/adminFormat";

type ReviewRow = {
  id: string;
  user: string;
  companion: string;
  rating: number;
  text: string;
  status: "Pending" | "Approved" | "Hidden" | "Flagged";
  date: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => asRecord(item)) : [];
}

function asString(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStatus(row: Record<string, unknown>): ReviewRow["status"] {
  if (Boolean(row.isFlagged)) return "Flagged";
  if (Boolean(row.isHidden)) return "Hidden";
  if (Boolean(row.isApproved)) return "Approved";
  return "Pending";
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | ReviewRow["status"]>("All");
  const [selected, setSelected] = useState<ReviewRow | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const response = await listReviews();

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setRows([]);
      setErrorMessage(response.error?.message || "Unable to load reviews.");
      setLoading(false);
      return;
    }

    const reviews = asArray(asRecord(response.data).reviews).map((row) => {
      const user = asRecord(row.user);
      const companion = asRecord(row.companion);
      return {
        id: asString(row.id),
        user: asString(user.name ?? user.phoneNumber),
        companion: asString(companion.displayName ?? companion.name),
        rating: asNumber(row.rating),
        text: asString(row.comment),
        status: toStatus(row),
        date: asString(row.createdAt, new Date().toISOString()),
      } satisfies ReviewRow;
    });

    setRows(reviews.sort((a, b) => +new Date(b.date) - +new Date(a.date)));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReviews();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (filter !== "All" && item.status !== filter) return false;
      if (!term) return true;
      return `${item.user} ${item.companion} ${item.text}`.toLowerCase().includes(term);
    });
  }, [rows, search, filter]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Reviews</h2>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by user, companion or review text..."
          filterValue={filter}
          onFilterChange={(value) => setFilter(value as "All" | ReviewRow["status"])}
          filterOptions={["All", "Pending", "Approved", "Hidden", "Flagged"]}
        />

        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading reviews...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Companion</th>
                  <th className="px-2 py-2">Rating</th>
                  <th className="px-2 py-2">Review</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-3 text-slate-500">No reviews found.</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="px-2 py-2 text-slate-700">{item.user}</td>
                      <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                      <td className="px-2 py-2 text-slate-700">{item.rating}/5</td>
                      <td className="px-2 py-2 text-slate-700">{item.text}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                      <td className="px-2 py-2 text-slate-700">{formatDateTime(item.date)}</td>
                      <td className="px-2 py-2">
                        <AdminActionMenu actions={[{ label: "View", onClick: () => setSelected(item) }]} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title="Review Details" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">User:</span> {selected.user}</p>
            <p><span className="font-semibold text-slate-900">Companion:</span> {selected.companion}</p>
            <p><span className="font-semibold text-slate-900">Rating:</span> {selected.rating}/5</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Date:</span> {formatDateTime(selected.date)}</p>
            <p><span className="font-semibold text-slate-900">Review:</span> {selected.text}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
