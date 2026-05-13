"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { formatDateTime, generateId, getAdminMedia, setAdminMedia } from "@/lib/adminStore";
import type { AdminMediaItem, AdminMediaStatus } from "@/lib/adminData";

const defaultDraft = {
  id: "",
  type: "Article" as "Article" | "Podcast",
  title: "",
  publisher: "",
  date: "",
  imageUrl: "",
  label: "Read More",
  href: "",
  status: "Draft" as AdminMediaStatus,
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<AdminMediaItem[]>(() => getAdminMedia());
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminMediaItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(defaultDraft);

  const persist = (next: AdminMediaItem[]) => {
    setItems(next);
    setAdminMedia(next);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => `${item.title} ${item.publisher} ${item.type}`.toLowerCase().includes(term));
  }, [items, search]);

  const openAdd = () => {
    setDraft(defaultDraft);
    setModalOpen(true);
  };

  const openEdit = (item: AdminMediaItem) => {
    setDraft({
      id: item.id,
      type: item.type,
      title: item.title,
      publisher: item.publisher,
      date: item.date,
      imageUrl: item.imageUrl,
      label: item.label,
      href: item.href,
      status: item.status,
    });
    setModalOpen(true);
  };

  const saveItem = () => {
    if (!draft.title.trim() || !draft.publisher.trim() || !draft.date.trim()) {
      alert("Title, publisher and date are required.");
      return;
    }

    const payload: AdminMediaItem = {
      id: draft.id || generateId("md"),
      type: draft.type,
      title: draft.title.trim(),
      publisher: draft.publisher.trim(),
      date: draft.date,
      imageUrl: draft.imageUrl.trim() || "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=900&q=80",
      label: draft.label.trim() || (draft.type === "Podcast" ? "Watch Podcast" : "Read Article"),
      href: draft.href.trim() || "#",
      status: draft.status,
    };

    if (draft.id) {
      persist(items.map((item) => (item.id === draft.id ? payload : item)));
    } else {
      persist([payload, ...items]);
    }

    setModalOpen(false);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Media</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search article/podcast by title or publisher..."
          primaryLabel="Add Media"
          onPrimaryClick={openAdd}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Publisher/Platform</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Label</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-2 py-2 text-slate-700">{item.type}</td>
                  <td className="px-2 py-2 font-medium text-slate-800">{item.title}</td>
                  <td className="px-2 py-2 text-slate-700">{item.publisher}</td>
                  <td className="px-2 py-2 text-slate-700">{formatDateTime(item.date)}</td>
                  <td className="px-2 py-2 text-slate-700">{item.label}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "Add", onClick: openAdd },
                        { label: "Edit", onClick: () => openEdit(item) },
                        { label: "Publish", tone: "success", onClick: () => persist(items.map((entry) => (entry.id === item.id ? { ...entry, status: "Published" } : entry))) },
                        { label: "Hide", tone: "warning", onClick: () => persist(items.map((entry) => (entry.id === item.id ? { ...entry, status: "Hidden" } : entry))) },
                        { label: "Delete Demo", tone: "danger", onClick: () => persist(items.filter((entry) => entry.id !== item.id)) },
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

      <AdminDetailDrawer open={Boolean(selected)} title={selected?.title ?? "Media Item"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.imageUrl} alt={selected.title} className="h-44 w-full rounded-xl object-cover" />
            <p><span className="font-semibold text-slate-900">Type:</span> {selected.type}</p>
            <p><span className="font-semibold text-slate-900">Publisher:</span> {selected.publisher}</p>
            <p><span className="font-semibold text-slate-900">Date:</span> {formatDateTime(selected.date)}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Link:</span> {selected.href}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">{draft.id ? "Edit Media" : "Add Media"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select value={draft.type} onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as "Article" | "Podcast" }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                <option value="Article">Article</option>
                <option value="Podcast">Podcast</option>
              </select>
              <select value={draft.status} onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as AdminMediaStatus }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Hidden">Hidden</option>
              </select>
              <input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Title" className="h-10 rounded-xl border border-slate-200 px-3 text-sm sm:col-span-2" />
              <input value={draft.publisher} onChange={(e) => setDraft((prev) => ({ ...prev, publisher: e.target.value }))} placeholder="Publisher / Platform" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.date} onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))} type="date" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.imageUrl} onChange={(e) => setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))} placeholder="Image URL" className="h-10 rounded-xl border border-slate-200 px-3 text-sm sm:col-span-2" />
              <input value={draft.label} onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))} placeholder="Read/Watch Label" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.href} onChange={(e) => setDraft((prev) => ({ ...prev, href: e.target.value }))} placeholder="Link URL" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={saveItem} className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
