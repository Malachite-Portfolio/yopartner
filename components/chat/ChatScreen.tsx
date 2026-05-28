"use client";

import { ArrowLeft, CheckCheck, CirclePlus, EllipsisVertical, Gift, Phone, SendHorizontal, Smile, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getGiftEffectConfig } from "@/lib/chat/giftEffects";
import type { CompanionRouteProfile } from "@/lib/companionRoutes";

export type ChatScreenMessage = {
  id: string;
  sender: "self" | "other";
  text: string;
  timestamp: string;
  messageType?: "TEXT" | "GIFT";
  gift?: {
    giftKey: "rose" | "coffee" | "star" | "heart" | "crown" | "diamond";
    giftName: string;
    giftEmoji: string;
    amount: number;
  } | null;
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
  onEndSession?: () => void;
  endingSession?: boolean;
  backHref?: string;
  backLabel?: string;
  onBackRequest?: () => void;
  showCallActions?: boolean;
  sessionTimerLabel?: string;
  showGiftAction?: boolean;
  onGiftClick?: () => void;
  giftActionDisabled?: boolean;
};

const COMMON_EMOJIS = ["😀", "😊", "❤️", "🙏", "👍", "😄", "😢"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getGiftBubbleClass(giftKey: NonNullable<ChatScreenMessage["gift"]>["giftKey"], own: boolean) {
  const tier = getGiftEffectConfig(giftKey).tier;
  if (tier === "premium") {
    return own
      ? "rounded-br-md border border-amber-300/80 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 text-amber-950 shadow-[0_0_24px_rgba(245,158,11,0.35)]"
      : "rounded-bl-md border border-sky-300/75 bg-gradient-to-br from-sky-100 via-indigo-50 to-cyan-100 text-slate-900 shadow-[0_0_24px_rgba(59,130,246,0.3)]";
  }
  if (tier === "mid") {
    return own
      ? "rounded-br-md border border-pink-200/85 bg-pink-100/90 text-pink-950 shadow-[0_0_16px_rgba(236,72,153,0.24)]"
      : "rounded-bl-md border border-yellow-200/85 bg-yellow-50 text-amber-950 shadow-[0_0_16px_rgba(250,204,21,0.22)]";
  }
  return own
    ? "rounded-br-md border border-rose-200/85 bg-rose-50 text-rose-950"
    : "rounded-bl-md border border-amber-200/85 bg-amber-50 text-amber-950";
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
  emptyMessage = "No messages yet. Say hello.",
  onEndSession,
  endingSession = false,
  backHref = "/connect-now",
  backLabel = "Go back",
  onBackRequest,
  showCallActions = true,
  sessionTimerLabel,
  showGiftAction = false,
  onGiftClick,
  giftActionDisabled = false,
}: ChatScreenProps) {
  const router = useRouter();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [attachMessage, setAttachMessage] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setShowMenu(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [showMenu]);

  const handleBack = () => {
    if (onBackRequest) {
      onBackRequest();
      return;
    }
    router.push(backHref);
  };

  return (
    <section className="relative flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden bg-[#f7fbfa] text-[#0f172a]">
      <header className="z-20 flex h-[62px] shrink-0 items-center justify-between border-b border-[#d9ece7] bg-white/95 px-3.5 pt-[max(0rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            aria-label={backLabel}
            onClick={handleBack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0f766e] transition hover:bg-[#edf7f5]"
          >
            <ArrowLeft size={18} />
          </button>

          {companion.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companion.image} alt={companion.name} className="h-10 w-10 rounded-full border border-[#d9ece7] object-cover" />
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-sm font-semibold text-[#0f766e]">
              {getInitials(companion.name)}
            </span>
          )}

          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold leading-none">{companion.name}</p>
            <p className="mt-1 text-[12px] text-[#0f766e]">
              {composerDisabled ? "Session ended" : "Private session"}
              {sessionTimerLabel ? ` • ${sessionTimerLabel}` : ""}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-1" ref={menuRef}>
          {showCallActions ? (
            <button
              type="button"
              aria-label="Start audio call"
              onClick={onOpenAudio}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0f766e] transition hover:bg-[#edf7f5]"
            >
              <Phone size={17} />
            </button>
          ) : null}
          {showCallActions ? (
            <button
              type="button"
              aria-label="Start video call"
              onClick={onOpenVideo}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0f766e] transition hover:bg-[#edf7f5]"
            >
              <Video size={17} />
            </button>
          ) : null}
          {onEndSession ? (
            <button
              type="button"
              onClick={() => setShowMenu((current) => !current)}
              disabled={endingSession}
              aria-label="End chat"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#f1f5f9] disabled:opacity-60"
              title={endingSession ? "Ending..." : "Menu"}
            >
              <EllipsisVertical size={16} />
            </button>
          ) : null}
          {showMenu && onEndSession ? (
            <div className="absolute right-0 top-11 z-30 min-w-[140px] rounded-xl border border-[#dceae5] bg-white p-1.5 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onEndSession();
                }}
                disabled={endingSession}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                {endingSession ? "Ending..." : "End session"}
              </button>
            </div>
          ) : null}
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
            {emptyMessage}
          </p>
        ) : null}

        <div className="space-y-3">
          {messages.map((message) => {
            const own = message.sender === "self";
            const gift = message.messageType === "GIFT" ? message.gift : null;
            const isGift = Boolean(gift);
            const giftTier = gift ? getGiftEffectConfig(gift.giftKey).tier : null;
            const isPremiumGift = giftTier === "premium";

            return (
              <div key={message.id} className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
                {!own ? (
                  companion.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={companion.image} alt={companion.name} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#d8f4ee] text-[10px] font-semibold text-[#0f766e]">
                      {getInitials(companion.name)}
                    </span>
                  )
                ) : null}

                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    isGift
                      ? getGiftBubbleClass(gift!.giftKey, own)
                      : own
                        ? "rounded-br-md bg-[#0f172a] text-white"
                        : "rounded-bl-md bg-[#7de1d6] text-[#0f172a]"
                  } ${isPremiumGift ? "relative overflow-hidden" : ""}`}
                >
                  {isGift ? (
                    <>
                      {isPremiumGift ? (
                        <>
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 animate-[messageShine_2.2s_ease-out_infinite]" />
                          <span className="absolute right-2 top-2 rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-200">
                            Premium Gift
                          </span>
                        </>
                      ) : null}
                      <p className="text-[14.5px] font-semibold leading-relaxed">
                        {own ? "You sent" : "You received"} {gift?.giftEmoji} {gift?.giftName}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-700/90">Gift amount ₹{gift?.amount}</p>
                    </>
                  ) : (
                    <p className="text-[14.5px] leading-relaxed">{message.text}</p>
                  )}
                  <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${own && !isGift ? "justify-end text-white/80" : "text-[#0f172a]/75"}`}>
                    <span>{message.timestamp}</span>
                    {own ? <CheckCheck size={12} /> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-[#d9ece7] bg-white/95 px-[14px] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur">
        {attachMessage ? (
          <p className="mb-2 rounded-xl bg-[#f1f5f9] px-3 py-2 text-[12px] text-[#64748b]">{attachMessage}</p>
        ) : null}
        {composerDisabled && disabledMessage ? (
          <p className="mb-2 rounded-xl bg-[#f1f5f9] px-3 py-2 text-[12px] text-[#64748b]">
            {disabledMessage || "Session ended"}
          </p>
        ) : null}
        <div className="flex items-center gap-2 rounded-full border border-[#d9ece7] bg-[#f8fafc] px-2.5 py-1.5 shadow-sm">
          <button
            type="button"
            aria-label="Add"
            onClick={() => {
              setAttachMessage("Attachments coming soon.");
              setShowEmojiPicker(false);
            }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-white transition hover:bg-[#1e293b]"
          >
            <CirclePlus size={18} />
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
            placeholder="Type a message..."
            className="h-9 min-w-0 flex-1 border-none bg-transparent text-[15px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
            disabled={composerDisabled}
          />
          <button
            type="button"
            aria-label="Emoji"
            onClick={() => {
              setShowEmojiPicker((current) => !current);
            }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#e2e8f0]"
          >
            <Smile size={18} />
          </button>
          {showGiftAction ? (
            <button
              type="button"
              aria-label="Send gift"
              onClick={onGiftClick}
              disabled={composerDisabled || giftActionDisabled}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#b45309] transition hover:bg-amber-100 disabled:opacity-60"
            >
              <Gift size={18} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSend}
            aria-label="Send message"
            disabled={composerDisabled}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0d9488] text-white transition hover:bg-[#0f766e] disabled:opacity-60"
          >
            <SendHorizontal size={16} />
          </button>
        </div>
        {showEmojiPicker && !composerDisabled ? (
          <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-[#dceae5] bg-white p-2 shadow-sm">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onInputChange(`${input}${emoji}`);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-[#f1f5f9]"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes messageShine {
          0% { transform: translateX(-120%); opacity: 0; }
          22% { opacity: 0.85; }
          100% { transform: translateX(140%); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
