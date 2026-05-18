"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getPartnerInbox } from "@/lib/partnerData";

export default function PartnerChatsPage() {
  const [search, setSearch] = useState("");
  const chats = getPartnerInbox();

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter((chat) => `${chat.userMaskedPhone} ${chat.lastMessage}`.toLowerCase().includes(term));
  }, [chats, search]);

  if (IS_PRODUCTION_READY_MODE) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-semibold text-amber-800">Partner chats are unavailable</h2>
        <p className="mt-2 text-sm text-amber-700">We couldn&apos;t load partner conversations right now. Please retry.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Conversations</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by member or latest message..."
            className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#2563eb]"
          />
        </label>

        <div className="mt-4 space-y-2">
          {filteredChats.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              No conversations found for your current search.
            </div>
          ) : null}
          {filteredChats.map((chat) => (
            <Link
              key={chat.id}
              href={`/partner/chats/${chat.id}`}
              className="block rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{chat.userMaskedPhone}</p>
                  <p className="text-xs text-slate-500">{chat.sessionType} - {chat.lastMessageTime}</p>
                  <p className="mt-1 text-sm text-slate-700">{chat.lastMessage}</p>
                </div>
                {chat.unreadCount > 0 ? (
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1d4ed8] px-1.5 text-xs font-semibold text-white">
                    {chat.unreadCount}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}
