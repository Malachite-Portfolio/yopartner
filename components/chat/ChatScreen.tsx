"use client";

import { ArrowLeft, Paperclip, Phone, SendHorizontal, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import type { CompanionRouteProfile } from "@/lib/companionRoutes";

type ChatMessage = {
  id: string;
  sender: "user" | "companion";
  text: string;
  timestamp: string;
};

const seedMessages: ChatMessage[] = [
  {
    id: "m1",
    sender: "companion",
    text: "Hi, I'm here with you. How are you feeling today?",
    timestamp: "10:04 AM",
  },
  {
    id: "m2",
    sender: "user",
    text: "I just wanted someone to talk to.",
    timestamp: "10:05 AM",
  },
  {
    id: "m3",
    sender: "companion",
    text: "That's completely okay. You can take your time.",
    timestamp: "10:05 AM",
  },
];

function getStoredMessages(storageKey: string) {
  if (typeof window === "undefined") return seedMessages;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return seedMessages;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedMessages;

    const safeMessages = parsed.filter((item) => item && typeof item.text === "string");
    if (safeMessages.length === 0) return seedMessages;

    return safeMessages.map((item, index) => ({
      id: String(item.id ?? `${Date.now()}-${index}`),
      sender: item.sender === "user" ? "user" : "companion",
      text: String(item.text),
      timestamp: String(item.timestamp ?? ""),
    })) as ChatMessage[];
  } catch {
    return seedMessages;
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ChatScreen({ companion }: { companion: CompanionRouteProfile }) {
  const router = useRouter();
  const storageKey = useMemo(() => `yp_chat_${companion.id}`, [companion.id]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => getStoredMessages(storageKey));
  const [input, setInput] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const handleSend = () => {
    const next = input.trim();
    if (!next) return;

    const timestamp = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: "user",
        text: next,
        timestamp,
      },
    ]);
    setInput("");
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/connect-now/${companion.id}`);
  };

  if (IS_PRODUCTION_READY_MODE) {
    return (
      <section className="flex h-screen min-h-screen w-full items-center justify-center bg-[#f2f7fb] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-base font-semibold text-amber-800">
            Chat is temporarily unavailable. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-4 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Profile
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-screen min-h-screen w-full flex-col overflow-hidden bg-[#f2f7fb]">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={handleBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>

          {companion.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companion.image} alt={companion.name} className="h-11 w-11 rounded-full border border-slate-200 object-cover" />
          ) : (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {getInitials(companion.name)}
            </span>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{companion.name}</p>
            <p className="text-xs text-emerald-600">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Start audio call"
            onClick={() => router.push(`/call/audio/${companion.id}`)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            <Phone size={17} />
          </button>
          <button
            type="button"
            aria-label="Start video call"
            onClick={() => router.push(`/call/video/${companion.id}`)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            <Video size={17} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2.5 shadow-sm sm:max-w-[70%] ${
                  message.sender === "user"
                    ? "rounded-br-md bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] text-white"
                    : "rounded-bl-md bg-white text-slate-800"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p
                  className={`mt-1 text-right text-[11px] ${
                    message.sender === "user" ? "text-white/85" : "text-slate-400"
                  }`}
                >
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-2 sm:px-3">
            <button
              type="button"
              aria-label="Attach"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            >
              <Paperclip size={17} />
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className="h-9 min-w-0 flex-1 border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleSend}
              aria-label="Send message"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white transition hover:bg-[#1d4ed8]"
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
