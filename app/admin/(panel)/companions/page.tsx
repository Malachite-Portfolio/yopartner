"use client";

import { useMemo, useState } from "react";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminDetailDrawer } from "@/components/admin/AdminDetailDrawer";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { formatINR, generateId, getAdminCompanions, setAdminCompanions } from "@/lib/adminStore";
import type { AdminCompanion, AdminCompanionStatus } from "@/lib/adminData";

const emptyDraft = {
  id: "",
  name: "",
  phone: "",
  city: "",
  category: "",
  status: "Pending" as AdminCompanionStatus,
  chatPrice: "10",
  audioPrice: "15",
  videoPrice: "20",
  visitPrice: "1800",
  services: "Chat,Audio Call,Video Call",
  languages: "Hindi,English",
  tagline: "",
};

export default function AdminCompanionsPage() {
  const [companions, setCompanions] = useState<AdminCompanion[]>(() => getAdminCompanions());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | AdminCompanionStatus>("All");
  const [selected, setSelected] = useState<AdminCompanion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const persist = (next: AdminCompanion[]) => {
    setCompanions(next);
    setAdminCompanions(next);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return companions.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (!term) return true;
      const text = `${item.name} ${item.phone} ${item.city} ${item.category}`.toLowerCase();
      return text.includes(term);
    });
  }, [companions, search, statusFilter]);

  const openAdd = () => {
    setDraft(emptyDraft);
    setModalOpen(true);
  };

  const openEdit = (item: AdminCompanion) => {
    setDraft({
      id: item.id,
      name: item.name,
      phone: item.phone,
      city: item.city,
      category: item.category,
      status: item.status,
      chatPrice: String(item.chatPrice),
      audioPrice: String(item.audioPrice),
      videoPrice: String(item.videoPrice),
      visitPrice: String(item.visitPrice),
      services: item.services.join(","),
      languages: item.languages.join(","),
      tagline: item.tagline ?? "",
    });
    setModalOpen(true);
  };

  const saveDraft = () => {
    if (!draft.name.trim() || !draft.phone.trim() || !draft.city.trim()) {
      alert("Name, phone and city are required.");
      return;
    }
    const parsedServices = draft.services
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const parsedLanguages = draft.languages
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (draft.id) {
      const next = companions.map((item) =>
        item.id === draft.id
          ? {
              ...item,
              name: draft.name.trim(),
              phone: draft.phone.trim(),
              city: draft.city.trim(),
              category: draft.category.trim() || "Communication & Emotional Support",
              status: draft.status,
              chatPrice: Number(draft.chatPrice) || 0,
              audioPrice: Number(draft.audioPrice) || 0,
              videoPrice: Number(draft.videoPrice) || 0,
              visitPrice: Number(draft.visitPrice) || 0,
              services: parsedServices,
              languages: parsedLanguages,
              tagline: draft.tagline.trim(),
            }
          : item,
      );
      persist(next);
      setModalOpen(false);
      return;
    }

    const newCompanion: AdminCompanion = {
      id: generateId("AC"),
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      city: draft.city.trim(),
      category: draft.category.trim() || "Communication & Emotional Support",
      status: draft.status,
      chatPrice: Number(draft.chatPrice) || 0,
      audioPrice: Number(draft.audioPrice) || 0,
      videoPrice: Number(draft.videoPrice) || 0,
      visitPrice: Number(draft.visitPrice) || 0,
      services: parsedServices,
      languages: parsedLanguages,
      rating: 0,
      sessions: 0,
      earnings: 0,
      verificationStatus: "Pending",
      availability: "Offline",
      tagline: draft.tagline.trim(),
    };

    persist([newCompanion, ...companions]);
    setModalOpen(false);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Partners</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, phone, city or category..."
          filterValue={statusFilter}
          onFilterChange={(value) => setStatusFilter(value as "All" | AdminCompanionStatus)}
          filterOptions={["All", "Active", "Pending", "Suspended", "Under Review"]}
          primaryLabel="Add Companion"
          onPrimaryClick={openAdd}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Photo</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">City</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Languages</th>
                <th className="px-2 py-2">Services</th>
                <th className="px-2 py-2">Chat</th>
                <th className="px-2 py-2">Audio</th>
                <th className="px-2 py-2">Video</th>
                <th className="px-2 py-2">Visit</th>
                <th className="px-2 py-2">Rating</th>
                <th className="px-2 py-2">Sessions</th>
                <th className="px-2 py-2">Earnings</th>
                <th className="px-2 py-2">Verification</th>
                <th className="px-2 py-2">Availability</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-2 py-2">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 font-medium text-slate-800">{item.name}</td>
                  <td className="px-2 py-2 text-slate-700">{item.phone}</td>
                  <td className="px-2 py-2 text-slate-700">{item.city}</td>
                  <td className="px-2 py-2 text-slate-700">{item.category}</td>
                  <td className="px-2 py-2 text-slate-700">{item.languages.join(", ")}</td>
                  <td className="px-2 py-2 text-slate-700">{item.services.join(", ")}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.chatPrice)}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.audioPrice)}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.videoPrice)}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.visitPrice)}</td>
                  <td className="px-2 py-2 text-slate-700">{item.rating.toFixed(1)}</td>
                  <td className="px-2 py-2 text-slate-700">{item.sessions}</td>
                  <td className="px-2 py-2 text-slate-700">{formatINR(item.earnings)}</td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.verificationStatus} /></td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.availability} /></td>
                  <td className="px-2 py-2"><AdminStatusBadge status={item.status} /></td>
                  <td className="px-2 py-2">
                    <AdminActionMenu
                      actions={[
                        { label: "View", onClick: () => setSelected(item) },
                        { label: "Edit", onClick: () => openEdit(item) },
                        {
                          label: item.status === "Suspended" ? "Activate" : "Suspend",
                          tone: item.status === "Suspended" ? "success" : "danger",
                          onClick: () => {
                            const next = companions.map((entry) => {
                              if (entry.id !== item.id) return entry;
                              const status: AdminCompanionStatus =
                                entry.status === "Suspended" ? "Active" : "Suspended";
                              return { ...entry, status };
                            });
                            persist(next);
                          },
                        },
                        {
                          label: "Mark Verified",
                          tone: "success",
                          onClick: () => {
                            const next = companions.map((entry) => {
                              if (entry.id !== item.id) return entry;
                              return { ...entry, verificationStatus: "Verified" as const };
                            });
                            persist(next);
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <AdminDetailDrawer open={Boolean(selected)} title={selected?.name ?? "Companion Details"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Phone:</span> {selected.phone}</p>
            <p><span className="font-semibold text-slate-900">City:</span> {selected.city}</p>
            <p><span className="font-semibold text-slate-900">Category:</span> {selected.category}</p>
            <p><span className="font-semibold text-slate-900">Languages:</span> {selected.languages.join(", ")}</p>
            <p><span className="font-semibold text-slate-900">Services:</span> {selected.services.join(", ")}</p>
            <p><span className="font-semibold text-slate-900">Tagline:</span> {selected.tagline || "-"}</p>
            <p><span className="font-semibold text-slate-900">Pricing:</span> Chat {formatINR(selected.chatPrice)}, Audio {formatINR(selected.audioPrice)}, Video {formatINR(selected.videoPrice)}, Visit {formatINR(selected.visitPrice)}</p>
            <p><span className="font-semibold text-slate-900">Earnings:</span> {formatINR(selected.earnings)}</p>
            <p><span className="font-semibold text-slate-900">Sessions:</span> {selected.sessions}</p>
          </div>
        ) : null}
      </AdminDetailDrawer>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">{draft.id ? "Edit Companion" : "Add Companion"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.phone} onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.city} onChange={(e) => setDraft((prev) => ({ ...prev, city: e.target.value }))} placeholder="City" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.category} onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))} placeholder="Category" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <select value={draft.status} onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as AdminCompanionStatus }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
                <option value="Under Review">Under Review</option>
              </select>
              <input value={draft.tagline} onChange={(e) => setDraft((prev) => ({ ...prev, tagline: e.target.value }))} placeholder="Tagline" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.chatPrice} onChange={(e) => setDraft((prev) => ({ ...prev, chatPrice: e.target.value }))} placeholder="Chat Price" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.audioPrice} onChange={(e) => setDraft((prev) => ({ ...prev, audioPrice: e.target.value }))} placeholder="Audio Price" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.videoPrice} onChange={(e) => setDraft((prev) => ({ ...prev, videoPrice: e.target.value }))} placeholder="Video Price" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.visitPrice} onChange={(e) => setDraft((prev) => ({ ...prev, visitPrice: e.target.value }))} placeholder="Visit Price" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={draft.services} onChange={(e) => setDraft((prev) => ({ ...prev, services: e.target.value }))} placeholder="Services comma separated" className="h-10 rounded-xl border border-slate-200 px-3 text-sm sm:col-span-2" />
              <input value={draft.languages} onChange={(e) => setDraft((prev) => ({ ...prev, languages: e.target.value }))} placeholder="Languages comma separated" className="h-10 rounded-xl border border-slate-200 px-3 text-sm sm:col-span-2" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={saveDraft} className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
