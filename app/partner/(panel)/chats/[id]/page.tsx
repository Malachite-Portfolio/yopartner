"use client";

import { Phone, SendHorizontal, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getPartnerMessages, savePartnerMessages, type PartnerMessage } from "@/lib/partnerData";

export default function PartnerChatDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const chatId = params.id ?? "demo-user-1";
  const allMessages = getPartnerMessages();
  const [messages, setMessages] = useState<PartnerMessage[]>(allMessages[chatId] ?? []);
  const [input, setInput] = useState("");
  const userLabel = useMemo(() => {
    if (chatId === "demo-user-1") return "+91******9363";
    if (chatId === "demo-user-2") return "+91******7788";
    if (chatId === "demo-user-3") return "+91******2231";
    return "+91******0000";
  }, [chatId]);

  if (IS_PRODUCTION_READY_MODE) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-semibold text-amber-800">Partner chat is unavailable</h2>
        <p className="mt-2 text-sm text-amber-700">Partner chat service is not connected yet.</p>
      </section>
    );
  }

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const nextMessage: PartnerMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: "partner",
      text,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    const nextMessages = [...messages, nextMessage];
    setMessages(nextMessages);
    savePartnerMessages({ ...allMessages, [chatId]: nextMessages });
    setInput("");
  };

  return (
    <section className="flex min-h-[calc(100vh-140px)] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{userLabel}</p>
          <p className="text-xs text-slate-500">Session type: Chat • Status: Active</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/partner/calls/audio/${chatId}`)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            aria-label="Start audio call"
          >
            <Phone size={16} />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/partner/calls/video/${chatId}`)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            aria-label="Start video call"
          >
            <Video size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "partner" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                message.sender === "partner"
                  ? "rounded-br-md bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] text-white"
                  : "rounded-bl-md bg-white text-slate-800"
              }`}
            >
              <p>{message.text}</p>
              <p className={`mt-1 text-[11px] ${message.sender === "partner" ? "text-white/85" : "text-slate-400"}`}>
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a reply..."
            className="h-9 flex-1 border-none bg-transparent px-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1d4ed8] text-white"
          >
            <SendHorizontal size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
