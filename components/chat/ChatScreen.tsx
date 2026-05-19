"use client";

import { ArrowLeft, Paperclip, Phone, SendHorizontal, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CompanionRouteProfile } from "@/lib/companionRoutes";

export type ChatScreenMessage = {
  id: string;
  sender: "self" | "other";
  text: string;
  timestamp: string;
};

type ChatScreenProps = {
  companion: CompanionRouteProfile;
  messages: ChatScreenMessage[];
  input: string;
  onInputChange: (next: string) => void;
  onSend: () => void;
  onOpenAudio: () => void;
  onOpenVideo: () => void;
  composerDisabled?: boolean;
  disabledMessage?: string;
  emptyMessage?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ChatScreen({
  companion,
  messages,
  input,
  onInputChange,
  onSend,
  onOpenAudio,
  onOpenVideo,
  composerDisabled = false,
  disabledMessage = "",
  emptyMessage = "No messages yet. Say hello when you're ready.",
}: ChatScreenProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/connect-now/${companion.id}`);
  };

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
            onClick={onOpenAudio}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            <Phone size={17} />
          </button>
          <button
            type="button"
            aria-label="Start video call"
            onClick={onOpenVideo}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            <Video size={17} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
          {messages.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">{emptyMessage}</p>
          ) : null}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "self" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2.5 shadow-sm sm:max-w-[70%] ${
                  message.sender === "self"
                    ? "rounded-br-md bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] text-white"
                    : "rounded-bl-md bg-white text-slate-800"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p
                  className={`mt-1 text-right text-[11px] ${
                    message.sender === "self" ? "text-white/85" : "text-slate-400"
                  }`}
                >
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
          {composerDisabled && disabledMessage ? (
            <p className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {disabledMessage}
            </p>
          ) : null}
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
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder="Type your message..."
              className="h-9 min-w-0 flex-1 border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              disabled={composerDisabled}
            />
            <button
              type="button"
              onClick={onSend}
              aria-label="Send message"
              disabled={composerDisabled}
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
