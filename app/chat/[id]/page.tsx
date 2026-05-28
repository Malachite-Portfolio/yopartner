"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatScreen, type ChatScreenMessage } from "@/components/chat/ChatScreen";
import { EndSessionConfirmModal } from "@/components/session/EndSessionConfirmModal";
import { useSessionExitGuard } from "@/hooks/useSessionExitGuard";
import {
  cancelSession,
  createSession,
  endSession,
  getSessionById,
  getSessionMessages,
  sendSessionGift,
  sendSessionMessage,
  type GiftKey,
  type SessionRecord,
  type SessionMessageRecord,
} from "@/lib/api/sessions";
import { getWallet } from "@/lib/api/wallet";
import {
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";
import { requestAudioPermission, requestVideoPermission } from "@/lib/agora";
import { isActiveSessionStatus, isTerminalSessionStatus } from "@/lib/sessionStatus";
import { getUserAuthTokenWithRestore } from "@/lib/auth/userAuth";
import { WALLET_UPDATED_EVENT } from "@/lib/wallet";

const chatGiftCatalog: Array<{
  key: GiftKey;
  name: string;
  emoji: string;
  amount: number;
}> = [
  { key: "rose", name: "Rose", emoji: "🌹", amount: 10 },
  { key: "coffee", name: "Coffee", emoji: "☕", amount: 25 },
  { key: "star", name: "Star", emoji: "⭐", amount: 50 },
  { key: "heart", name: "Heart", emoji: "💖", amount: 100 },
  { key: "crown", name: "Crown", emoji: "👑", amount: 250 },
  { key: "diamond", name: "Diamond", emoji: "💎", amount: 500 },
];

function toLoginUrl(returnUrl: string) {
  return `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
}

function getCallAvailabilityErrorMessage(error: { message?: string; status?: number } | null) {
  if (!error) return "Unable to start call right now.";
  const message = (error.message ?? "").trim();
  const normalized = message.toLowerCase();
  if (normalized.includes("offline")) return "Partner is currently offline.";
  if (normalized.includes("busy")) return "Partner is currently busy.";
  if (!error.status || error.status >= 500 || error.status === 503) {
    return "Could not check partner availability. Please try again.";
  }
  return message || "Unable to start call right now.";
}

function toScreenMessages(messages: SessionMessageRecord[]): ChatScreenMessage[] {
  return messages.map((message) => ({
    id: message.id,
    sender: message.isMine ? "self" : "other",
    text: message.text ?? message.body,
    messageType: message.messageType,
    gift: message.gift,
    timestamp: new Date(message.createdAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));
}

function isReviewableChatSession(session?: SessionRecord | null): session is SessionRecord {
  if (!session) return false;
  const serviceType = session.serviceType ?? session.type;
  return serviceType === "CHAT" && (session.status === "ENDED" || session.status === "COMPLETED");
}

function getReviewUrl(session: SessionRecord) {
  return `/review/${session.id}?companionId=${encodeURIComponent(session.companionId)}`;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const preferredCompanionId = searchParams.get("companionId") ?? "";
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [companion, setCompanion] = useState<CompanionRouteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddMoneyPrompt, setShowAddMoneyPrompt] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<SessionMessageRecord[]>([]);
  const [messageError, setMessageError] = useState("");
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [walletBalance, setWalletBalance] = useState(0);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedGiftKey, setSelectedGiftKey] = useState<GiftKey>("rose");
  const [giftError, setGiftError] = useState("");
  const [isSendingGift, setIsSendingGift] = useState(false);
  const [giftAnimationEmoji, setGiftAnimationEmoji] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [giftToast, setGiftToast] = useState("");
  const reviewRedirectUrlRef = useRef<string | null>(null);

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/chat/${routeId}?${query}` : `/chat/${routeId}`;
  }, [routeId, searchParams]);
  const selectedGift = useMemo(
    () => chatGiftCatalog.find((gift) => gift.key === selectedGiftKey) ?? chatGiftCatalog[0],
    [selectedGiftKey],
  );
  const hasGiftBalance = walletBalance >= selectedGift.amount;

  const refreshMessages = useCallback(async (sessionId: string) => {
    const response = await getSessionMessages(sessionId);
    if (response.error) {
      setMessageError(response.error.message || "Unable to load messages right now.");
      return;
    }
    setMessages(response.data);
    setMessageError("");
  }, []);

  const refreshWalletBalance = useCallback(async () => {
    const walletResponse = await getWallet();
    if (walletResponse.data) {
      setWalletBalance(walletResponse.data.balance);
    }
  }, []);

  useEffect(() => {
    if (!routeId) return;

    let active = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setShowAddMoneyPrompt(false);

      const token = await getUserAuthTokenWithRestore();
      if (!token) {
        router.replace(toLoginUrl(currentPath));
        return;
      }

      const fetched = await getSessionById(routeId);
      if (!active) return;

      if (fetched.error?.status === 401) {
        router.replace(toLoginUrl(currentPath));
        return;
      }

      if (fetched.data) {
        setSession(fetched.data);
        const resolvedCompanion = await resolveCompanionRouteProfile(fetched.data.companionId);
        if (!active) return;
        if (!resolvedCompanion) {
          setErrorMessage("Unable to open this chat right now. Please try again from the companion profile.");
          setCompanion(null);
          setIsLoading(false);
          return;
        }
        setCompanion(resolvedCompanion);
        void refreshWalletBalance();
        setIsLoading(false);
        return;
      }

      const candidateCompanionId = preferredCompanionId || routeId;
      const resolvedCompanion = await resolveCompanionRouteProfile(candidateCompanionId);
      if (!active) return;
      if (!resolvedCompanion) {
        setErrorMessage("Unable to open this chat right now. Please start again from the companion profile.");
        setCompanion(null);
        setIsLoading(false);
        return;
      }

      const created = await createSession({
        companionId: resolvedCompanion.id,
        serviceType: "chat",
      });
      if (!active) return;
      if (created.error?.status === 401) {
        router.replace(toLoginUrl(currentPath));
        return;
      }
      if (created.error) {
        if (created.error.code === "INSUFFICIENT_WALLET_BALANCE") {
          setErrorMessage("Minimum ₹50 wallet balance is required to start a chat.");
          setShowAddMoneyPrompt(true);
        } else {
          setErrorMessage(created.error.message || "Unable to create chat session.");
          setShowAddMoneyPrompt(false);
        }
        setCompanion(resolvedCompanion);
        setIsLoading(false);
        return;
      }
      if (!created.data?.id) {
        setErrorMessage("Unable to create chat session.");
        setCompanion(resolvedCompanion);
        setIsLoading(false);
        return;
      }
      if (created.data.id !== routeId) {
        router.replace(`/chat/${created.data.id}?companionId=${encodeURIComponent(resolvedCompanion.id)}`);
        return;
      }
      setSession(created.data);
      setCompanion(resolvedCompanion);
      void refreshWalletBalance();
      setIsLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [currentPath, preferredCompanionId, refreshWalletBalance, routeId, router]);

  useEffect(() => {
    if (!session?.id) return;
    const timer = window.setInterval(async () => {
      const latest = await getSessionById(session.id);
      if (latest.data) setSession(latest.data);
    }, session.status === "PENDING" ? 4000 : 5000);
    return () => {
      window.clearInterval(timer);
    };
  }, [session?.id, session?.status]);

  useEffect(() => {
    if (!session?.id || session.status !== "LIVE") return;
    const loadNow = window.setTimeout(() => {
      void refreshMessages(session.id);
    }, 0);
    const timer = window.setInterval(() => {
      void refreshMessages(session.id);
    }, 2000);
    return () => {
      window.clearTimeout(loadNow);
      window.clearInterval(timer);
    };
  }, [refreshMessages, session?.id, session?.status]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    applyPreference();
    mediaQuery.addEventListener("change", applyPreference);
    return () => mediaQuery.removeEventListener("change", applyPreference);
  }, []);

  useEffect(() => {
    if (!giftAnimationEmoji) return;
    const timer = window.setTimeout(() => {
      setGiftAnimationEmoji(null);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [giftAnimationEmoji]);

  useEffect(() => {
    if (!giftToast) return;
    const timer = window.setTimeout(() => {
      setGiftToast("");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [giftToast]);

  useEffect(() => {
    if (!isTerminalSessionStatus(session?.status)) return;
    const redirectTarget = isReviewableChatSession(session) ? getReviewUrl(session) : "/connect-now";
    const timer = window.setTimeout(() => {
      router.push(redirectTarget);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [router, session]);

  const handleCancelPending = async () => {
    if (!session?.id || isCancelling) return;
    setIsCancelling(true);
    const response = await cancelSession(session.id);
    setIsCancelling(false);
    if (response.data) {
      setSession(response.data);
      return;
    }
    setErrorMessage(response.error?.message || "Unable to cancel this request right now.");
  };

  const handleConfirmEndSession = useCallback(async () => {
    if (!session?.id) return;
    if (isEndingSession) throw new Error("Session is already ending.");
    const shouldReviewAfterEnd = session.status === "LIVE";
    setIsEndingSession(true);
    try {
      const response = await endSession(session.id);
      if (!response.data) {
        throw new Error(response.error?.message || "Unable to end this session. Please try again.");
      }
      reviewRedirectUrlRef.current =
        shouldReviewAfterEnd && isReviewableChatSession(response.data) ? getReviewUrl(response.data) : null;
      setSession(response.data);
    } finally {
      setIsEndingSession(false);
    }
  }, [isEndingSession, session]);

  const navigateAfterExit = useCallback(() => {
    router.push(reviewRedirectUrlRef.current ?? "/connect-now");
    reviewRedirectUrlRef.current = null;
  }, [router]);

  const exitGuard = useSessionExitGuard({
    active: isActiveSessionStatus(session?.status),
    onEndSession: handleConfirmEndSession,
    onNavigateAway: navigateAfterExit,
  });

  const exitConfirmModal = (
    <EndSessionConfirmModal
      open={exitGuard.confirmOpen}
      loading={exitGuard.confirmLoading}
      error={exitGuard.confirmError}
      onStay={exitGuard.stay}
      onEndSession={() => {
        void exitGuard.endAndExit();
      }}
    />
  );

  const handleOpenAudio = async () => {
    if (!session || !companion) return;
    try {
      await requestAudioPermission();
    } catch {
      setMessageError("Microphone permission is required for audio calls.");
      return;
    }
    const created = await createSession({
      companionId: companion.id,
      serviceType: "audio",
    });
    if (created.error?.status === 401) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/call/audio/${companion.id}`)}`);
      return;
    }
    if (!created.data?.id) {
      setMessageError(getCallAvailabilityErrorMessage(created.error));
      return;
    }
    router.push(`/call/audio/${created.data.id}?companionId=${encodeURIComponent(companion.id)}`);
  };

  const handleOpenVideo = async () => {
    if (!session || !companion) return;
    try {
      await requestVideoPermission();
    } catch {
      setMessageError("Camera and microphone permission are required for video calls.");
      return;
    }
    const created = await createSession({
      companionId: companion.id,
      serviceType: "video",
    });
    if (created.error?.status === 401) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/call/video/${companion.id}`)}`);
      return;
    }
    if (!created.data?.id) {
      setMessageError(getCallAvailabilityErrorMessage(created.error));
      return;
    }
    router.push(`/call/video/${created.data.id}?companionId=${encodeURIComponent(companion.id)}`);
  };

  const handleSendMessage = async () => {
    if (!session?.id || session.status !== "LIVE") return;
    const body = messageInput.trim();
    if (!body) return;
    setMessageInput("");

    const optimistic: SessionMessageRecord = {
      id: `temp-${Date.now()}`,
      sessionId: session.id,
      senderId: session.userId ?? "",
      senderUserId: session.userId ?? "",
      senderRole: "USER",
      text: body,
      body,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    setMessages((current) => [...current, optimistic]);

    const response = await sendSessionMessage(session.id, body);
    if (!response.data) {
      setMessageError(response.error?.message || "Unable to send message.");
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      return;
    }
    const createdMessage = response.data;
    setMessageError("");
    setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), createdMessage]);
  };

  const handleSendGift = async () => {
    if (!session?.id || session.status !== "LIVE" || isSendingGift) return;
    if (!hasGiftBalance) {
      setGiftError("Insufficient balance for this gift.");
      return;
    }

    setIsSendingGift(true);
    setGiftError("");
    const response = await sendSessionGift(session.id, selectedGift.key);
    setIsSendingGift(false);

    if (!response.data) {
      if (response.error?.code === "INSUFFICIENT_WALLET_BALANCE") {
        setGiftError("Insufficient balance for this gift.");
        await refreshWalletBalance();
        return;
      }
      setGiftError(response.error?.message || "Could not send gift. Please try again.");
      return;
    }

    const giftResult = response.data;
    if (!giftResult) return;

    setMessages((current) => [...current, giftResult.message]);
    setWalletBalance(giftResult.walletBalance);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT));
    }
    if (prefersReducedMotion) {
      setGiftToast(`Gift sent: ${giftResult.gift.giftEmoji} ${giftResult.gift.giftName}`);
    } else {
      setGiftAnimationEmoji(giftResult.gift.giftEmoji);
    }
    setIsGiftModalOpen(false);
  };

  if (isLoading) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#dceae5] bg-white p-6 text-center text-sm text-slate-700">
          Opening chat...
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">{errorMessage}</p>
          {showAddMoneyPrompt ? (
            <button
              type="button"
              onClick={() => router.push("/wallet?addMoney=1")}
              className="mt-4 rounded-xl bg-[#c8191e] px-4 py-2 text-sm font-semibold text-white"
            >
              Add Money
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className={`${showAddMoneyPrompt ? "mt-2" : "mt-4"} rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white`}
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  if (!companion || !session) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">Chat will open after your session is created.</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  if (session.status === "PENDING") {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#eef3f8] p-4">
        {exitConfirmModal}
        <div className="w-full max-w-md rounded-2xl border border-[#dceae5] bg-white p-6 text-center">
          <p className="text-sm font-semibold text-slate-900">Waiting for partner to accept your chat request...</p>
          <p className="mt-2 text-xs text-slate-500">We&apos;ll connect you as soon as they accept.</p>
          <button
            type="button"
            disabled={isCancelling}
            onClick={() => {
              void handleCancelPending();
            }}
            className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-70"
          >
            {isCancelling ? "Cancelling..." : "Cancel request"}
          </button>
        </div>
      </main>
    );
  }

  if (session.status !== "LIVE") {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#eef3f8] p-4">
        {exitConfirmModal}
        <div className="w-full max-w-md rounded-2xl border border-[#dceae5] bg-white p-6 text-center">
          <p className="text-sm font-semibold text-slate-900">
            {session.status === "DECLINED"
              ? "Partner declined this chat request."
              : session.status === "ENDED"
                ? "This chat session has ended."
                : session.status === "CANCELLED" || session.status === "EXPIRED"
                  ? "This chat session is no longer active."
                : "This chat session is not active right now."}
          </p>
          <p className="mt-2 text-xs text-slate-500">Session ended. Redirecting to Connect Now...</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  const screenMessages = toScreenMessages(messages);
  const baseTime = session.liveStartedAt || session.startedAt || session.acceptedAt;
  const baseMs = baseTime ? new Date(baseTime).getTime() : Number.NaN;
  const elapsedSeconds = Number.isNaN(baseMs) ? 0 : Math.max(0, Math.floor((clockNow - baseMs) / 1000));
  const timerLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  return (
    <main className="h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#eef3f8]">
      {exitConfirmModal}
      {messageError ? (
        <div className="absolute left-1/2 top-3 z-50 -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {messageError}
        </div>
      ) : null}
      {giftToast ? (
        <div className="absolute left-1/2 top-12 z-50 -translate-x-1/2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {giftToast}
        </div>
      ) : null}
      <ChatScreen
        companion={companion}
        messages={screenMessages}
        input={messageInput}
        onInputChange={setMessageInput}
        onSend={() => {
          void handleSendMessage();
        }}
        onOpenAudio={() => {
          void handleOpenAudio();
        }}
        onOpenVideo={() => {
          void handleOpenVideo();
        }}
        composerDisabled={false}
        onEndSession={() => {
          exitGuard.requestExit();
        }}
        endingSession={isEndingSession}
        onBackRequest={exitGuard.requestExit}
        sessionTimerLabel={timerLabel}
        showGiftAction
        onGiftClick={() => {
          setGiftError("");
          void refreshWalletBalance();
          setIsGiftModalOpen(true);
        }}
        giftActionDisabled={isSendingGift}
      />
      {giftAnimationEmoji ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <span className="animate-[giftFloat_1.8s_ease-out_forwards] text-6xl">{giftAnimationEmoji}</span>
        </div>
      ) : null}
      {isGiftModalOpen ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Send a gift</h3>
            <p className="mt-1 text-sm text-slate-600">Appreciate your partner with a small gift.</p>
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              Wallet Balance: ₹{walletBalance}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {chatGiftCatalog.map((gift) => {
                const selected = gift.key === selectedGift.key;
                return (
                  <button
                    key={gift.key}
                    type="button"
                    onClick={() => setSelectedGiftKey(gift.key)}
                    className={`rounded-xl border px-2 py-2 text-center transition ${
                      selected ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    <p className="text-xl">{gift.emoji}</p>
                    <p className="text-xs font-semibold text-slate-800">{gift.name}</p>
                    <p className="text-[11px] text-slate-500">₹{gift.amount}</p>
                  </button>
                );
              })}
            </div>

            {!hasGiftBalance ? (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                Insufficient balance. Add money to send this gift.
              </p>
            ) : null}
            {giftError ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {giftError}
              </p>
            ) : null}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGiftModalOpen(false)}
                className="h-10 flex-1 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
              >
                Back
              </button>
              {!hasGiftBalance ? (
                <button
                  type="button"
                  onClick={() => router.push("/wallet?addMoney=1")}
                  className="h-10 flex-1 rounded-xl bg-[#c8191e] text-sm font-semibold text-white"
                >
                  Add Money
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void handleSendGift();
                  }}
                  disabled={isSendingGift}
                  className="h-10 flex-1 rounded-xl bg-[#0f766e] text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSendingGift ? "Sending..." : "Send Gift"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
      <style jsx global>{`
        @keyframes giftFloat {
          0% { transform: translateY(40px) scale(0.7); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-180px) scale(1.2); opacity: 0; }
        }
      `}</style>
    </main>
  );
}
