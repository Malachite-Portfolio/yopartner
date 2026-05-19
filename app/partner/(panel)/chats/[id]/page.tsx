"use client";

import { Phone, SendHorizontal, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getSessionById,
  getSessionMessages,
  sendSessionMessage,
  type SessionMessageRecord,
  type SessionRecord,
} from "@/lib/api/sessions";

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value || "Member";
  return `+91******${digits.slice(-4)}`;
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function PartnerChatDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? "";
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<SessionMessageRecord[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    void (async () => {
      setLoading(true);
      const response = await getSessionById(sessionId);
      if (response.error || !response.data) {
        setError(response.error?.message || "Unable to load this conversation.");
        setLoading(false);
        return;
      }
      setSession(response.data);
      setLoading(false);
    })();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || session?.status !== "LIVE") return;
    void (async () => {
      const response = await getSessionMessages(sessionId);
      if (response.data) setMessages(response.data);
    })();
    const timer = window.setInterval(async () => {
      const response = await getSessionMessages(sessionId);
      if (response.data) setMessages(response.data);
    }, 2000);
    return () => {
      window.clearInterval(timer);
    };
  }, [session?.status, sessionId]);

  const userPhone = useMemo(() => {
    const raw = String(session?.user?.phoneNumber ?? "");
    return maskPhone(raw);
  }, [session?.user]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !session || session.status !== "LIVE") return;
    setInput("");

    const optimistic: SessionMessageRecord = {
      id: `temp-${Date.now()}`,
      sessionId: session.id,
      senderUserId: String(session.companion?.userId ?? ""),
      body: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    const response = await sendSessionMessage(session.id, text);
    if (!response.data) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setError(response.error?.message || "Unable to send message.");
      return;
    }
    const createdMessage = response.data;
    setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), createdMessage]);
    setError("");
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        Opening conversation...
      </section>
    );
  }

  if (!session) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-semibold text-amber-800">Conversation unavailable</h2>
        <p className="mt-2 text-sm text-amber-700">{error || "Session was not found."}</p>
      </section>
    );
  }

  const selfId = String(session.companion?.userId ?? "");
  const canMessage = session.status === "LIVE";

  return (
    <section className="flex min-h-[calc(100vh-140px)] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{userPhone}</p>
          <p className="text-xs text-slate-500">
            Conversation type: {session.type || session.serviceType || "CHAT"} - Status: {session.status || "LIVE"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/partner/calls/audio/${sessionId}`)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            aria-label="Start audio call"
          >
            <Phone size={16} />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/partner/calls/video/${sessionId}`)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            aria-label="Start video call"
          >
            <Video size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3">
        {messages.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            No messages yet. Say hello when you’re ready.
          </p>
        ) : null}
        {messages.map((message) => {
          const own = message.senderUserId === selfId;
          return (
            <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  own
                    ? "rounded-br-md bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] text-white"
                    : "rounded-bl-md bg-white text-slate-800"
                }`}
              >
                <p>{message.body}</p>
                <p className={`mt-1 text-[11px] ${own ? "text-white/85" : "text-slate-400"}`}>
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {!canMessage ? (
          <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Waiting for partner to accept.
          </div>
        ) : null}
        {error ? (
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {error}
          </div>
        ) : null}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type a reply..."
            className="h-9 flex-1 border-none bg-transparent px-2 text-sm outline-none"
            disabled={!canMessage}
          />
          <button
            type="button"
            onClick={() => {
              void handleSend();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1d4ed8] text-white disabled:opacity-50"
            disabled={!canMessage}
          >
            <SendHorizontal size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
