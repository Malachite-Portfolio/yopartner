"use client";

import { ArrowLeft, CheckCheck, CirclePlus, EllipsisVertical, Phone, SendHorizontal, Smile, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  endSession,
  getSessionById,
  getSessionMessages,
  sendSessionMessage,
  type SessionMessageRecord,
  type SessionRecord,
} from "@/lib/api/sessions";
import { requestAudioPermission, requestVideoPermission } from "@/lib/agora";

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
  const [isEndingSession, setIsEndingSession] = useState(false);

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
    if (!session?.id) return;
    const timer = window.setInterval(async () => {
      const response = await getSessionById(session.id);
      if (response.data) {
        setSession(response.data);
      }
    }, 3000);
    return () => {
      window.clearInterval(timer);
    };
  }, [session?.id]);

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
    const raw = String(session?.user?.phoneMasked ?? session?.user?.phoneNumber ?? "");
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

  const handleEndChat = async () => {
    if (!session || session.status !== "LIVE" || isEndingSession) return;
    setIsEndingSession(true);
    const response = await endSession(session.id);
    setIsEndingSession(false);
    if (!response.data) {
      setError(response.error?.message || "Unable to end this chat.");
      return;
    }
    setSession(response.data);
    setError("");
  };

  const handleOpenAudio = async () => {
    try {
      await requestAudioPermission();
    } catch {
      setError("Microphone permission is required for audio calls.");
      return;
    }
    router.push(`/partner/calls/audio/${sessionId}`);
  };

  const handleOpenVideo = async () => {
    try {
      await requestVideoPermission();
    } catch {
      setError("Camera and microphone permission are required for video calls.");
      return;
    }
    router.push(`/partner/calls/video/${sessionId}`);
  };

  if (loading) {
    return (
      <section className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#f7fbfa] p-5 text-sm text-slate-600">
        Opening conversation...
      </section>
    );
  }

  if (!session) {
    return (
      <section className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#f7fbfa] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-xl font-semibold text-amber-800">Conversation unavailable</h2>
          <p className="mt-2 text-sm text-amber-700">{error || "Session was not found."}</p>
        </div>
      </section>
    );
  }

  const selfId = String(session.companion?.userId ?? "");
  const canMessage = session.status === "LIVE";

  return (
    <section className="relative flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-[#f7fbfa] text-[#0f172a]">
      <header className="z-20 flex h-[62px] items-center justify-between border-b border-[#d9ece7] bg-white/95 px-3.5 pt-[max(0rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.push("/partner/chats")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0f766e] transition hover:bg-[#edf7f5]"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-sm font-semibold text-[#0f766e]">
            {userPhone.slice(-2)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold leading-none">{userPhone}</p>
            <p className="mt-1 text-[12px] text-[#0f766e]">{canMessage ? "Private session" : "Session ended"}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              void handleOpenAudio();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0f766e] transition hover:bg-[#edf7f5]"
            aria-label="Start audio call"
          >
            <Phone size={17} />
          </button>
          <button
            type="button"
            onClick={() => {
              void handleOpenVideo();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0f766e] transition hover:bg-[#edf7f5]"
            aria-label="Start video call"
          >
            <Video size={17} />
          </button>
          <button
            type="button"
            onClick={() => {
              void handleEndChat();
            }}
            disabled={!canMessage || isEndingSession}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#f1f5f9] disabled:opacity-50"
            title={isEndingSession ? "Ending..." : "End chat"}
          >
            <EllipsisVertical size={16} />
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-[14px] py-4 pb-32">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-[#e5e7eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#475569]">
            Today
          </span>
        </div>

        {messages.length === 0 ? (
          <p className="mx-auto max-w-xs rounded-2xl bg-white px-4 py-2.5 text-center text-[14px] text-[#64748b] shadow-sm">
            No messages yet. Say hello.
          </p>
        ) : null}

        <div className="space-y-3">
          {messages.map((message) => {
            const own = message.senderUserId === selfId;
            return (
              <div key={message.id} className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
                {!own ? (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#d8f4ee] text-[10px] font-semibold text-[#0f766e]">
                    {userPhone.slice(-2)}
                  </span>
                ) : null}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    own
                      ? "rounded-br-md bg-[#0f172a] text-white"
                      : "rounded-bl-md bg-[#7de1d6] text-[#0f172a]"
                  }`}
                >
                  <p className="text-[14.5px] leading-relaxed">{message.body}</p>
                  <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${own ? "justify-end text-white/80" : "text-[#0f172a]/75"}`}>
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {own ? <CheckCheck size={12} /> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-[#d9ece7] bg-white/95 px-[14px] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur">
        {!canMessage ? (
          <div className="mb-2 rounded-xl bg-[#f1f5f9] px-3 py-2 text-[12px] text-[#64748b]">Session ended</div>
        ) : null}
        {error ? (
          <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>
        ) : null}
        <div className="flex items-center gap-2 rounded-full border border-[#d9ece7] bg-[#f8fafc] px-2.5 py-1.5 shadow-sm">
          <button
            type="button"
            aria-label="Add"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-white"
          >
            <CirclePlus size={18} />
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type a message..."
            className="h-9 min-w-0 flex-1 border-none bg-transparent text-[15px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
            disabled={!canMessage}
          />
          <button
            type="button"
            aria-label="Emoji"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#e2e8f0]"
          >
            <Smile size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSend();
            }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0d9488] text-white disabled:opacity-50"
            disabled={!canMessage}
          >
            <SendHorizontal size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
