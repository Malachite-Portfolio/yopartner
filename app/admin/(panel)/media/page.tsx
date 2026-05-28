"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { listMedia } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime } from "@/lib/adminFormat";

type MediaRow = {
  id: string;
  type: string;
  title: string;
  publisher: string;
  date: string;
  imageUrl: string;
  href: string;
  status: string;
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

export default function AdminMediaPage() {
  const router = useRouter();
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaRow | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const response = await listMedia();

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setRows([]);
      setErrorMessage(response.error?.message || "Unable to load media.");
      setLoading(false);
      return;
    }

    const items = asArray(asRecord(response.data).media).map((row) => ({
      id: asString(row.id),
      type: asString(row.type),
      title: asString(row.title),
      publisher: asString(row.publisher),
      date: asString(row.publishedAt ?? row.createdAt, new Date().toISOString()),
      imageUrl: asString(row.imageUrl, ""),
      href: asString(row.linkUrl, ""),
      status: asString(row.status, "DRAFT"),
    }));
    setRows(items.sort((a, b) => +new Date(b.date) - +new Date(a.date)));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadItems]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((item) => `${item.title} ${item.publisher} ${item.type}`.toLowerCase().includes(term));
  }, [rows, search]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Media</h2>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by title or publisher..."
        />

        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading media...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Publisher</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-3 text-slate-500">No media items found.</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 text-slate-700">{item.type}</td>
                      <td className="px-2 py-2 font-medium text-slate-800">{item.title}</td>
                      <td className="px-2 py-2 text-slate-700">{item.publisher}</td>
                      <td className="px-2 py-2 text-slate-700">{formatDateTime(item.date)}</td>
                      <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
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

      <AdminDetailDrawer open={Boolean(selected)} title={selected?.title ?? "Media"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            {selected.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt={selected.title} className="h-44 w-full rounded-xl object-cover" />
            ) : null}
            <p><span className="font-semibold text-slate-900">Type:</span> {selected.type}</p>
            <p><span className="font-semibold text-slate-900">Publisher:</span> {selected.publisher}</p>
            <p><span className="font-semibold text-slate-900">Date:</span> {formatDateTime(selected.date)}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Link:</span> {selected.href || "-"}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
