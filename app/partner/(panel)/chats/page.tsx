"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPartnerDashboard, type PartnerActiveSession, type PartnerIncomingRequest } from "@/lib/api/partner";

type ChatRow = {
  id: string;
  memberLabel: string;
  sessionType: "CHAT" | "AUDIO" | "VIDEO";
  status: string;
  timeLabel: string;
};

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value || "Member";
  return `+91******${digits.slice(-4)}`;
}

export default function PartnerChatsPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<ChatRow[]>([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const response = await getPartnerDashboard();
      if (response.error || !response.data) {
        setRows([]);
        setError("Unable to load partner conversations. Please retry.");
        setLoading(false);
        return;
      }
      const pending = Array.isArray(response.data.pendingRequests) ? response.data.pendingRequests : [];
      const active = Array.isArray(response.data.activeSessions) ? response.data.activeSessions : [];
      const pendingRows = pending.map((item: PartnerIncomingRequest) => ({
        id: item.id,
        memberLabel: maskPhone(item.memberLabel),
        sessionType: item.type,
        status: "PENDING",
        timeLabel: new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }));
      const activeRows = active.map((item: PartnerActiveSession) => ({
        id: item.id,
        memberLabel: maskPhone(item.memberLabel),
        sessionType: item.type,
        status: item.status,
        timeLabel: item.startedAt
          ? new Date(item.startedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          : "-",
      }));
      setRows([...pendingRows, ...activeRows]);
      setError("");
      setLoading(false);
    })();
  }, []);

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((chat) => `${chat.memberLabel} ${chat.sessionType} ${chat.status}`.toLowerCase().includes(term));
  }, [rows, search]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Conversations</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by member or status..."
            className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#2563eb]"
          />
        </label>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              Loading conversations...
            </div>
          ) : null}
          {!loading && error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}
          {!loading && !error && filteredChats.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              No ongoing conversations.
            </div>
          ) : null}
          {!loading &&
            !error &&
            filteredChats.map((chat) => (
              <Link key={chat.id} href={`/partner/chats/${chat.id}`} className="block rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{chat.memberLabel}</p>
                    <p className="text-xs text-slate-500">
                      {chat.sessionType} - {chat.status} - {chat.timeLabel}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </article>
    </section>
  );
}
