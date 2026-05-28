"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { listClientDiaries } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";

type DiaryRow = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  videoUrl: string;
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

export default function AdminClientDiariesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<DiaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DiaryRow | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const response = await listClientDiaries();

    if (response.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (response.error || !response.data) {
      setRows([]);
      setErrorMessage(response.error?.message || "Unable to load client diaries.");
      setLoading(false);
      return;
    }

    const items = asArray(asRecord(response.data).diaries).map((row) => ({
      id: asString(row.id),
      title: asString(row.title),
      subtitle: asString(row.subtitle, ""),
      imageUrl: asString(row.imageUrl, ""),
      videoUrl: asString(row.videoUrl, ""),
      status: asString(row.status, "DRAFT"),
    }));
    setRows(items);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(term));
  }, [rows, search]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Client Diaries</h2>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search stories by title or subtitle..."
        />

        {loading ? (
          <p className="py-4 text-sm text-slate-600">Loading client diaries...</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">No client diaries found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.title} className="h-40 w-full rounded-lg object-cover" />
                ) : null}
                <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
                <div className="mt-3 flex items-center justify-between">
                  <AdminStatusBadge status={item.status} />
                </div>
                <div className="mt-3">
                  <AdminActionMenu actions={[{ label: "View", onClick: () => setSelected(item) }]} />
                </div>
              </article>
            ))}
          </div>
        )}
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title={selected?.title ?? "Story Details"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            {selected.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt={selected.title} className="h-52 w-full rounded-xl object-cover" />
            ) : null}
            <p><span className="font-semibold text-slate-900">Subtitle:</span> {selected.subtitle || "-"}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Video URL:</span> {selected.videoUrl || "-"}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </section>
  );
}
