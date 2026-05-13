"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { generateId, getAdminClientDiaries, setAdminClientDiaries } from "@/lib/adminStore";
import type { AdminDiaryItem, AdminMediaStatus } from "@/lib/adminData";

const defaultDraft = {
  id: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  videoUrl: "",
  status: "Draft" as AdminMediaStatus,
};

export default function AdminClientDiariesPage() {
  const [stories, setStories] = useState<AdminDiaryItem[]>(() => getAdminClientDiaries());
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminDiaryItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(defaultDraft);

  const persist = (next: AdminDiaryItem[]) => {
    setStories(next);
    setAdminClientDiaries(next);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stories;
    return stories.filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(term));
  }, [stories, search]);

  const openAdd = () => {
    setDraft(defaultDraft);
    setModalOpen(true);
  };

  const openEdit = (item: AdminDiaryItem) => {
    setDraft({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      status: item.status,
    });
    setModalOpen(true);
  };

  const saveStory = () => {
    if (!draft.title.trim()) {
      alert("Title is required.");
      return;
    }

    const payload: AdminDiaryItem = {
      id: draft.id || generateId("cd"),
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      imageUrl: draft.imageUrl.trim() || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
      videoUrl: draft.videoUrl.trim(),
      status: draft.status,
    };

    if (draft.id) {
      persist(stories.map((item) => (item.id === draft.id ? payload : item)));
    } else {
      persist([payload, ...stories]);
    }

    setModalOpen(false);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Client Diaries</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search stories by title or subtitle..."
          primaryLabel="Add Story"
          onPrimaryClick={openAdd}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.title} className="h-40 w-full rounded-lg object-cover" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
              <div className="mt-3 flex items-center justify-between">
                <AdminStatusBadge status={item.status} />
              </div>
              <div className="mt-3">
                <AdminActionMenu
                  actions={[
                    { label: "Add", onClick: openAdd },
                    { label: "Edit", onClick: () => openEdit(item) },
                    { label: "Publish", tone: "success", onClick: () => persist(stories.map((entry) => (entry.id === item.id ? { ...entry, status: "Published" } : entry))) },
                    { label: "Hide", tone: "warning", onClick: () => persist(stories.map((entry) => (entry.id === item.id ? { ...entry, status: "Hidden" } : entry))) },
                    { label: "Delete Demo", tone: "danger", onClick: () => persist(stories.filter((entry) => entry.id !== item.id)) },
                    { label: "View", onClick: () => setSelected(item) },
                  ]}
                />
              </div>
            </article>
          ))}
        </div>
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title={selected?.title ?? "Story Details"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.imageUrl} alt={selected.title} className="h-52 w-full rounded-xl object-cover" />
            <p><span className="font-semibold text-slate-900">Subtitle:</span> {selected.subtitle}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> <AdminStatusBadge status={selected.status} /></p>
            <p><span className="font-semibold text-slate-900">Video URL:</span> {selected.videoUrl || "-"}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">{draft.id ? "Edit Story" : "Add Story"}</h3>
            <div className="mt-4 grid gap-3">
              <input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Title" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.subtitle} onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))} placeholder="Subtitle" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.imageUrl} onChange={(e) => setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))} placeholder="Image URL" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.videoUrl} onChange={(e) => setDraft((prev) => ({ ...prev, videoUrl: e.target.value }))} placeholder="Video URL" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <select value={draft.status} onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as AdminMediaStatus }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={saveStory} className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
