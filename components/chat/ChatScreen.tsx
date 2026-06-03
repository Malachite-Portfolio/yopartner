"use client";

import { ArrowLeft, CheckCheck, CirclePlus, EllipsisVertical, Gift, Phone, SendHorizontal, Smile, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getCatalogGiftByKey, getGiftPngUrl } from "@/lib/chat/giftCatalog";
import type { CompanionRouteProfile } from "@/lib/companionRoutes";
import { VerifiedPartnerBadge } from "@/components/VerifiedPartnerBadge";

export type ChatScreenMessage = {
  id: string;
  sender: "self" | "other";
  text: string;
  timestamp: string;
  messageType?: "TEXT" | "GIFT";
  gift?: {
    giftKey: string;
    giftName: string;
    giftEmoji: string;
    amount: number;
    quantity?: number;
    unitAmount?: number;
  } | null;
};

type ChatScreenProps = {
  companion: CompanionRouteProfile;
  messages: ChatScreenMessage[];
  messagesLoading?: boolean;
  messagesLoadingLabel?: string;
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
  const gift = getCatalogGiftByKey(giftKey);
  const isPremium = gift?.premium ?? false;
  if (isPremium) {
    return own
      ? "rounded-br-md border border-amber-300/80 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 text-amber-950 shadow-[0_0_24px_rgba(245,158,11,0.35)]"
      : "rounded-bl-md border border-sky-300/75 bg-gradient-to-br from-sky-100 via-indigo-50 to-cyan-100 text-slate-900 shadow-[0_0_24px_rgba(59,130,246,0.3)]";
  }
  return own
    ? "rounded-br-md border border-rose-200/85 bg-rose-50 text-rose-950"
    : "rounded-bl-md border border-amber-200/85 bg-amber-50 text-amber-950";
}

function SvgaGiftBubblePreview() {
  return (
    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-amber-300/70 bg-[#0f172a]">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(250,204,21,0.55),rgba(168,85,247,0.22)_45%,rgba(15,23,42,0.98)_100%)]" />
      <span className="absolute inset-x-2 top-2 h-2 rounded-full bg-white/30 blur-sm" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-amber-200 backdrop-blur-sm">
          <Gift size={14} />
        </span>
      </span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/35 px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-[0.08em] text-amber-100">
        Premium
      </span>
    </div>
  );
}

export function ChatScreen({
  companion,
  messages,
  messagesLoading = false,
  messagesLoadingLabel = "Loading messages...",
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
  const [failedGiftPreviewByMessageId, setFailedGiftPreviewByMessageId] = useState<Record<string, boolean>>({});
  const [giftPreviewRetryNonceByMessageId, setGiftPreviewRetryNonceByMessageId] = useState<Record<string, number>>({});
  const giftPreviewRetryTimerByMessageIdRef = useRef<Record<string, number>>({});
  const giftPreviewRetryCountByMessageIdRef = useRef<Record<string, number>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);
  const MAX_GIFT_PREVIEW_RETRIES = 3;

  useEffect(() => {
    if (!showMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setShowMenu(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [showMenu]);

  useEffect(() => {
    return () => {
      Object.values(giftPreviewRetryTimerByMessageIdRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      giftPreviewRetryTimerByMessageIdRef.current = {};
      giftPreviewRetryCountByMessageIdRef.current = {};
    };
  }, []);

  const scheduleGiftPreviewRetry = (messageId: string) => {
    setFailedGiftPreviewByMessageId((current) => ({ ...current, [messageId]: true }));
    const retryCount = (giftPreviewRetryCountByMessageIdRef.current[messageId] ?? 0) + 1;
    giftPreviewRetryCountByMessageIdRef.current[messageId] = retryCount;
    if (retryCount > MAX_GIFT_PREVIEW_RETRIES) {
      return;
    }
    const existingTimer = giftPreviewRetryTimerByMessageIdRef.current[messageId];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }
    giftPreviewRetryTimerByMessageIdRef.current[messageId] = window.setTimeout(() => {
      setGiftPreviewRetryNonceByMessageId((current) => ({ ...current, [messageId]: (current[messageId] ?? 0) + 1 }));
      setFailedGiftPreviewByMessageId((current) => {
        const next = { ...current };
        delete next[messageId];
        return next;
      });
      delete giftPreviewRetryTimerByMessageIdRef.current[messageId];
    }, 450);
  };

  const clearGiftPreviewFailure = (messageId: string) => {
    const pendingTimer = giftPreviewRetryTimerByMessageIdRef.current[messageId];
    if (pendingTimer) {
      window.clearTimeout(pendingTimer);
      delete giftPreviewRetryTimerByMessageIdRef.current[messageId];
    }
    delete giftPreviewRetryCountByMessageIdRef.current[messageId];
    setFailedGiftPreviewByMessageId((current) => {
      if (!(messageId in current)) return current;
      const next = { ...current };
      delete next[messageId];
      return next;
    });
  };

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
            <p className="flex min-w-0 items-center gap-1.5 text-[17px] font-semibold leading-none">
              <span className="min-w-0 truncate">{companion.name}</span>
              {companion.isVerifiedPartner ? <VerifiedPartnerBadge /> : null}
            </p>
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
          messagesLoading ? (
            <p className="mx-auto max-w-xs rounded-2xl bg-white px-4 py-2.5 text-center text-[14px] text-[#64748b] shadow-sm">
              {messagesLoadingLabel}
            </p>
          ) : (
            <p className="mx-auto max-w-xs rounded-2xl bg-white px-4 py-2.5 text-center text-[14px] text-[#64748b] shadow-sm">
              {emptyMessage}
            </p>
          )
        ) : null}

        <div className="space-y-3">
          {messages.map((message) => {
            const own = message.sender === "self";
            const gift = message.messageType === "GIFT" ? message.gift : null;
            const isGift = Boolean(gift);
            const isPremiumGift = gift ? Boolean(getCatalogGiftByKey(gift.giftKey)?.premium) : false;

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
                      <div className="mb-2">
                        {(() => {
                          const resolvedGift = gift ? getCatalogGiftByKey(gift.giftKey) : null;
                          const previewFailed = failedGiftPreviewByMessageId[message.id];
                          if (!resolvedGift) {
                            return (
                              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-slate-300/70 bg-white/70 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                                Gift
                              </div>
                            );
                          }

                          if (resolvedGift.mediaType === "png" && !previewFailed) {
                            const retryNonce = giftPreviewRetryNonceByMessageId[message.id] ?? 0;
                            const pngPreviewUrl = getGiftPngUrl(resolvedGift);
                            const retryJoiner = pngPreviewUrl.includes("?") ? "&" : "?";
                            const previewSrc = retryNonce > 0 ? `${pngPreviewUrl}${retryJoiner}retry=${retryNonce}` : pngPreviewUrl;
                            return (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewSrc}
                                alt={gift?.giftName || resolvedGift.name}
                                className="h-14 w-14 rounded-xl border border-slate-300/60 bg-white/75 object-contain p-1"
                                loading="lazy"
                                onLoad={() => {
                                  clearGiftPreviewFailure(message.id);
                                }}
                                onError={() => {
                                  scheduleGiftPreviewRetry(message.id);
                                }}
                              />
                            );
                          }

                          if (resolvedGift.mediaType === "svga") {
                            return <SvgaGiftBubblePreview />;
                          }

                          return (
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-slate-300/70 bg-white/70 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                              Gift
                            </div>
                          );
                        })()}
                      </div>
                      {isPremiumGift ? (
                        <>
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 animate-[messageShine_2.2s_ease-out_infinite]" />
                          <span className="absolute right-2 top-2 rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-200">
                            Premium Gift
                          </span>
                        </>
                      ) : null}
                      <p className="text-[14.5px] font-semibold leading-relaxed">
                        {own ? "You sent a gift" : "You received a gift"}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-700/90">
                        <span>Gift amount ₹{gift?.amount}</span>
                        {gift?.quantity && gift.quantity > 1 ? (
                          <span className="rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            x{gift.quantity}
                          </span>
                        ) : null}
                      </div>
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
