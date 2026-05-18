"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { formatDateTime, getAdminReviews, setAdminReviews } from "@/lib/adminStore";
import type { AdminReview, AdminReviewStatus } from "@/lib/adminData";

type ReviewFilter = "All" | AdminReviewStatus;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>(() => getAdminReviews());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ReviewFilter>("All");
  const [selected, setSelected] = useState<AdminReview | null>(null);

  const persist = (next: AdminReview[]) => {
    setReviews(next);
    setAdminReviews(next);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reviews.filter((item) => {
      if (filter !== "All" && item.status !== filter) return false;
      if (!term) return true;
      return `${item.user} ${item.companion} ${item.text}`.toLowerCase().includes(term);
    });
  }, [reviews, search, filter]);

  const updateStatus = (target: AdminReview, status: AdminReviewStatus) => {
    const next = reviews.map((item) => (item.id === target.id ? { ...item, status } : item));
    persist(next);
    setSelected((current) => (current?.id === target.id ? { ...current, status } : current));
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Reviews</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by user, companion or review text..."
          filterValue={filter}
          onFilterChange={(value) => setFilter(value as ReviewFilter)}
          filterOptions={["All", "Pending", "Approved", "Hidden", "Flagged"]}
        />

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
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-2 py-2 text-slate-700">{item.user}</td>
                  <td className="px-2 py-2 text-slate-700">{item.companion}</td>
                  <td className="px-2 py-2 text-slate-700">{item.rating}/5</td>
                  <td className="px-2 py-2 text-slate-700">{item.text}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.date)}</td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "Approve", tone: "success", onClick: () => updateStatus(item, "Approved") },
                        { label: "Hide", tone: "warning", onClick: () => updateStatus(item, "Hidden") },
                        { label: "Flag", tone: "warning", onClick: () => updateStatus(item, "Flagged") },
                        { label: "Delete", tone: "danger", onClick: () => persist(reviews.filter((entry) => entry.id !== item.id)) },
                        { label: "View", onClick: () => setSelected(item) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
