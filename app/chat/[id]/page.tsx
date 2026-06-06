"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatScreen, type ChatScreenMessage } from "@/components/chat/ChatScreen";
import { GiftOverlay, type GiftOverlayEffect } from "@/components/chat/GiftOverlay";
import { EndSessionConfirmModal } from "@/components/session/EndSessionConfirmModal";
import { useSessionExitGuard } from "@/hooks/useSessionExitGuard";
import {
  cancelSession,
  createSession,
  endSession,
  type GiftQuantity,
  getSessionById,
  getSessionMessages,
  sendSessionGift,
  sendSessionMessage,
  type SessionRecord,
  type SessionMessageRecord,
} from "@/lib/api/sessions";
import { getWallet } from "@/lib/api/wallet";
import {
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";
import { requestAudioPermission, requestVideoPermission } from "@/lib/agora";
import { playGiftSound } from "@/lib/chat/giftSound";
import {
  CHAT_GIFT_CATALOG,
  CHAT_GIFT_GROUPS,
  getCatalogGiftByKey,
  getCatalogGiftsByTier,
  getGiftMediaUrl,
  getGiftPngUrl,
  getGiftThumbnailUrl,
  type ChatGiftCatalogItem,
} from "@/lib/chat/giftCatalog";
import { isActiveSessionStatus, isTerminalSessionStatus } from "@/lib/sessionStatus";
import { getUserAuthTokenWithRestore } from "@/lib/auth/userAuth";
import { WALLET_UPDATED_EVENT } from "@/lib/wallet";

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

function mapGiftSendError(code?: string) {
  switch (code) {
    case "INVALID_GIFT":
      return "This gift is currently unavailable.";
    case "INSUFFICIENT_BALANCE":
    case "INSUFFICIENT_WALLET_BALANCE":
      return "You don't have enough wallet balance.";
    case "SESSION_NOT_LIVE":
      return "Gifts can only be sent during an active chat.";
    case "PARTNER_NOT_FOUND":
      return "Partner unavailable.";
    default:
      return "Could not send gift. Please try again.";
  }
}

function buildFallbackCompanion(sessionData: SessionRecord): CompanionRouteProfile {
  return {
    id: sessionData.companionId,
    name: sessionData.companion?.name?.trim() || "Companion",
    isVerifiedPartner: false,
    tagline: "Private session",
    online: sessionData.status === "LIVE",
    chatPrice: 0,
    voicePrice: 0,
    videoPrice: 0,
  };
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
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [sessionEndNotice, setSessionEndNotice] = useState("");
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [walletBalance, setWalletBalance] = useState(0);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isGiftDrawerContentReady, setIsGiftDrawerContentReady] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState(() => CHAT_GIFT_CATALOG[0]?.id ?? "");
  const [selectedGiftQuantity, setSelectedGiftQuantity] = useState<GiftQuantity>(1);
  const [giftError, setGiftError] = useState("");
  const [isSendingGift, setIsSendingGift] = useState(false);
  const [activeGiftEffect, setActiveGiftEffect] = useState<GiftOverlayEffect | null>(null);
  const [selectedGiftPreviewFailed, setSelectedGiftPreviewFailed] = useState(false);
  const [failedCardPreviewGiftIds, setFailedCardPreviewGiftIds] = useState<Record<string, boolean>>({});
  const reviewRedirectUrlRef = useRef<string | null>(null);
  const seenGiftMessageIdsRef = useRef<Set<string>>(new Set());
  const hasHydratedGiftFeedRef = useRef(false);
  const autoEndedRewardRef = useRef(false);
  const handleGiftOverlayClose = useCallback(() => {
    setActiveGiftEffect(null);
  }, []);

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/chat/${routeId}?${query}` : `/chat/${routeId}`;
  }, [routeId, searchParams]);
  const selectedGift = useMemo(
    () => CHAT_GIFT_CATALOG.find((gift) => gift.id === selectedGiftId) ?? CHAT_GIFT_CATALOG[0],
    [selectedGiftId],
  );
  const giftGroups = useMemo(
    () => CHAT_GIFT_GROUPS.map((group) => ({ ...group, gifts: getCatalogGiftsByTier(group.tier) })),
    [],
  );
  const selectedGiftTotal = selectedGift ? selectedGift.price * selectedGiftQuantity : 0;
  const hasGiftBalance = selectedGiftTotal > 0 ? walletBalance >= selectedGiftTotal : false;

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const seenGiftKeys = new Set<string>();
    const seenMediaUrls = new Set<string>();
    CHAT_GIFT_CATALOG.forEach((gift) => {
      if (gift.id !== gift.giftKey) {
        console.warn("[chat] catalog mismatch: id and giftKey differ", { id: gift.id, giftKey: gift.giftKey });
      }
      const mediaUrl = getGiftMediaUrl(gift);
      if (!mediaUrl) {
        console.warn("[chat] catalog mismatch: missing media url", {
          id: gift.id,
          giftKey: gift.giftKey,
          mediaType: gift.mediaType,
        });
      }
      if (seenGiftKeys.has(gift.giftKey)) {
        console.warn("[chat] catalog duplicate giftKey detected", { giftKey: gift.giftKey, id: gift.id });
      } else {
        seenGiftKeys.add(gift.giftKey);
      }
      if (seenMediaUrls.has(mediaUrl)) {
        console.warn("[chat] catalog duplicate mediaUrl detected", { giftKey: gift.giftKey, mediaUrl });
      } else {
        seenMediaUrls.add(mediaUrl);
      }
    });
  }, []);

  useEffect(() => {
    if (!isGiftModalOpen) return;
    const frame = window.requestAnimationFrame(() => setIsGiftDrawerContentReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isGiftModalOpen]);

  const triggerGiftCelebration = useCallback(
    async (
      gift: NonNullable<SessionMessageRecord["gift"]>,
      isMine: boolean,
      catalogGift?: ChatGiftCatalogItem | null,
    ) => {
      const resolvedGift = catalogGift ?? getCatalogGiftByKey(gift.giftKey);
      if (!resolvedGift) return;
      const mediaUrl = getGiftMediaUrl(resolvedGift);
      if (process.env.NODE_ENV !== "production" && !mediaUrl.trim()) {
        console.warn("[chat] selected gift has empty media path", {
          giftId: resolvedGift.id,
          giftKey: resolvedGift.giftKey,
          mediaType: resolvedGift.mediaType,
        });
      }
      await playGiftSound(resolvedGift.sound, isMine ? 0.11 : 0.09);
      setActiveGiftEffect({
        id: `${resolvedGift.id}-${Date.now()}`,
        gift: resolvedGift,
        direction: isMine ? "sent" : "received",
        quantity: gift.quantity && gift.quantity > 1 ? gift.quantity : 1,
      });
    },
    [],
  );

  const refreshMessages = useCallback(async (sessionId: string, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsMessagesLoading(true);
    }
    const response = await getSessionMessages(sessionId);
    if (response.error) {
      setMessageError(response.error.message || "Unable to load messages right now.");
      if (!options?.silent) {
        setIsMessagesLoading(false);
      }
      return;
    }
    if (!hasHydratedGiftFeedRef.current) {
      const seedIds = new Set<string>();
      for (const message of response.data) {
        if (message.messageType === "GIFT") {
          seedIds.add(message.id);
        }
      }
      seenGiftMessageIdsRef.current = seedIds;
      hasHydratedGiftFeedRef.current = true;
    }
    setMessages(response.data);
    if (!options?.silent) {
      setIsMessagesLoading(false);
    }
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
        const existingSession = fetched.data;
        setSession(existingSession);
        setCompanion(buildFallbackCompanion(existingSession));
        void refreshWalletBalance();
        setIsLoading(false);
        void (async () => {
          const resolvedCompanion = await resolveCompanionRouteProfile(existingSession.companionId);
          if (!active || !resolvedCompanion) return;
          setCompanion(resolvedCompanion);
        })();
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
      void refreshMessages(session.id, { silent: false });
    }, 0);
    const timer = window.setInterval(() => {
      void refreshMessages(session.id, { silent: true });
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
    seenGiftMessageIdsRef.current = new Set();
    hasHydratedGiftFeedRef.current = false;
    autoEndedRewardRef.current = false;
  }, [session?.id]);

  useEffect(() => {
    const freeSeconds = session?.reward?.freeSeconds ?? null;
    if (
      !session?.id ||
      session.status !== "LIVE" ||
      !session.reward?.shouldAutoEndAtFreeLimit ||
      !freeSeconds ||
      isEndingSession
    ) {
      return;
    }

    const baseTime = session.liveStartedAt || session.startedAt || session.acceptedAt;
    const baseMs = baseTime ? new Date(baseTime).getTime() : Number.NaN;
    if (Number.isNaN(baseMs)) return;
    const elapsed = Math.max(0, Math.floor((clockNow - baseMs) / 1000));
    if (elapsed < freeSeconds || autoEndedRewardRef.current) return;

    autoEndedRewardRef.current = true;
    setSessionEndNotice("Your free chat time is over. Please add money to continue.");
    setIsEndingSession(true);

    void (async () => {
      try {
        const response = await endSession(session.id);
        if (response.data) {
          setSession(response.data);
          return;
        }
        setMessageError(response.error?.message || "Your free chat time is over. Please add money to continue.");
      } finally {
        setIsEndingSession(false);
      }
    })();
  }, [
    clockNow,
    isEndingSession,
    session?.acceptedAt,
    session?.id,
    session?.liveStartedAt,
    session?.reward?.freeSeconds,
    session?.reward?.shouldAutoEndAtFreeLimit,
    session?.startedAt,
    session?.status,
  ]);

  useEffect(() => {
    if (!hasHydratedGiftFeedRef.current || messages.length === 0) return;

    const unseenGiftMessages = messages
      .filter(
        (message): message is SessionMessageRecord & { gift: NonNullable<SessionMessageRecord["gift"]> } =>
          message.messageType === "GIFT" && Boolean(message.gift) && !seenGiftMessageIdsRef.current.has(message.id),
      )
      .sort((first, second) => +new Date(first.createdAt) - +new Date(second.createdAt));

    if (unseenGiftMessages.length === 0) return;

    unseenGiftMessages.forEach((message) => seenGiftMessageIdsRef.current.add(message.id));
    const latestGiftMessage = unseenGiftMessages[unseenGiftMessages.length - 1];
    void triggerGiftCelebration(
      latestGiftMessage.gift,
      Boolean(latestGiftMessage.isMine),
      getCatalogGiftByKey(latestGiftMessage.gift.giftKey),
    );
  }, [messages, triggerGiftCelebration]);

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
    if (!selectedGift) return;
    if (!hasGiftBalance) {
      setGiftError("Insufficient balance for this gift.");
      return;
    }

    setIsSendingGift(true);
    setGiftError("");
    const response = await sendSessionGift(session.id, selectedGift.giftKey, selectedGiftQuantity);
    setIsSendingGift(false);

    if (!response.data) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[chat] send gift failed", {
          sessionId: session.id,
          giftKey: selectedGift.giftKey,
          quantity: selectedGiftQuantity,
          error: response.error,
        });
      }
      if (response.error?.code === "INSUFFICIENT_BALANCE" || response.error?.code === "INSUFFICIENT_WALLET_BALANCE") {
        setGiftError("You don't have enough wallet balance.");
        await refreshWalletBalance();
        return;
      }
      setGiftError(response.error?.code ? mapGiftSendError(response.error.code) : response.error?.message || mapGiftSendError());
      return;
    }

    const giftResult = response.data;
    if (!giftResult) return;

    setMessages((current) => [...current, giftResult.message]);
    seenGiftMessageIdsRef.current.add(giftResult.message.id);
    setWalletBalance(giftResult.walletBalance);
    void triggerGiftCelebration(giftResult.gift, true, selectedGift);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT));
    }
    setIsGiftDrawerContentReady(false);
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
          <p className="mt-2 text-xs text-slate-500">
            {sessionEndNotice || "Session ended. Redirecting to Connect Now..."}
          </p>
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
      <ChatScreen
        companion={companion}
        messages={screenMessages}
        messagesLoading={isMessagesLoading}
        messagesLoadingLabel="Loading chat messages..."
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
          setSelectedGiftPreviewFailed(false);
          setFailedCardPreviewGiftIds({});
          setSelectedGiftQuantity(1);
          setIsGiftDrawerContentReady(false);
          void refreshWalletBalance();
          setIsGiftModalOpen(true);
        }}
        giftActionDisabled={isSendingGift}
      />
      <GiftOverlay effect={activeGiftEffect} onClose={handleGiftOverlayClose} />
      {isGiftModalOpen ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/70">
          <div className="w-full max-w-lg overflow-hidden rounded-t-3xl border-t border-slate-700 bg-[#0a0f14] text-white shadow-2xl">
            <div className="flex justify-center pt-2">
              <span className="h-1 w-12 rounded-full bg-white/25" />
            </div>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-base font-semibold">Send Gift</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/wallet?addMoney=1")}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm text-emerald-300"
                  aria-label="Add money"
                >
                  +
                </button>
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
                  Coins {"\u20B9"}{walletBalance}
                </span>
              </div>
            </div>

            {selectedGift ? (
              <div className="border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101820] p-2">
                  <div className="h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-[#0a0f14]">
                    {isGiftDrawerContentReady && !selectedGiftPreviewFailed ? (
                      selectedGift.mediaType === "png" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getGiftPngUrl(selectedGift)}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={() => {
                            setSelectedGiftPreviewFailed(true);
                          }}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getGiftThumbnailUrl(selectedGift)}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={() => {
                            setSelectedGiftPreviewFailed(true);
                          }}
                        />
                      )
                    ) : (
                      <div className="relative h-full w-full overflow-hidden">
                        {selectedGift?.mediaType === "svga" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getGiftThumbnailUrl(selectedGift)} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <>
                            <span className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-700" />
                            <span className="absolute inset-x-4 bottom-3 top-3 rounded-lg border border-white/10 bg-white/5" />
                            <span className="absolute inset-x-0 bottom-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                              PNG
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-300">Selected gift</p>
                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-300" />
                      <span>{"\u20B9"}{selectedGift.price} {selectedGiftQuantity > 1 ? `x${selectedGiftQuantity}` : ""}</span>
                    </p>
                    <p className="text-xs text-slate-400">Total {"\u20B9"}{selectedGiftTotal}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="max-h-[52vh] space-y-3 overflow-y-auto px-4 py-3">
              {!isGiftDrawerContentReady ? (
                <div className="rounded-xl border border-white/10 bg-[#111a23] p-4 text-center text-xs text-slate-400">
                  Loading gifts...
                </div>
              ) : null}
              {isGiftDrawerContentReady ? giftGroups.map((group) => {
                if (group.gifts.length === 0) return null;

                return (
                  <section key={group.tier}>
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{group.label}</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {group.gifts.map((gift) => {
                        const selected = gift.id === selectedGift?.id;
                        const premium = gift.premium;
                        const cardFailed = Boolean(failedCardPreviewGiftIds[gift.id]);
                        return (
                          <button
                            key={gift.id}
                            type="button"
                            onClick={() => {
                              setSelectedGiftPreviewFailed(false);
                              setSelectedGiftId(gift.id);
                            }}
                            className={`relative overflow-hidden rounded-xl border p-1.5 text-center transition ${
                              selected
                                ? "border-emerald-400 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                                : "border-white/10 bg-[#111a23]"
                            }`}
                          >
                            {premium ? (
                              <span className="absolute right-1 top-1 rounded-full bg-fuchsia-500/80 px-1 py-[1px] text-[8px] font-semibold uppercase text-white">
                                P
                              </span>
                            ) : null}
                            <div className="mx-auto mb-1 h-12 w-12 overflow-hidden rounded-lg bg-[#0a0f14]">
                              {!cardFailed && gift.mediaType === "png" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={getGiftPngUrl(gift)}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={() => {
                                    setFailedCardPreviewGiftIds((current) => ({ ...current, [gift.id]: true }));
                                  }}
                                />
                              ) : gift.mediaType === "svga" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getGiftThumbnailUrl(gift)} alt="" className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="relative h-full w-full overflow-hidden">
                                  <span className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-700" />
                                  <span className="absolute inset-x-2 bottom-2 top-2 rounded-md border border-white/10 bg-white/5" />
                                  <span className="absolute inset-x-0 bottom-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                                    PNG
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" />
                              <span>{"\u20B9"}{gift.price}</span>
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              }) : null}
            </div>

            <div className="border-t border-white/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <div className="mb-3 flex items-center gap-2">
                {([1, 10, 50, 100] as GiftQuantity[]).map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setSelectedGiftQuantity(qty)}
                    className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                      selectedGiftQuantity === qty
                        ? "bg-emerald-500 text-white"
                        : "border border-white/20 bg-white/5 text-slate-300"
                    }`}
                  >
                    x{qty}
                  </button>
                ))}
              </div>

              {!hasGiftBalance ? (
                <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  Insufficient balance. Add money to send this gift.
                </p>
              ) : null}
              {giftError ? (
                <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {giftError}
                </p>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsGiftDrawerContentReady(false);
                    setIsGiftModalOpen(false);
                  }}
                  className="h-11 w-28 rounded-xl border border-white/20 text-sm font-semibold text-slate-200"
                >
                  Close
                </button>
                {!hasGiftBalance ? (
                  <button
                    type="button"
                    onClick={() => router.push("/wallet?addMoney=1")}
                    className="h-11 flex-1 rounded-xl bg-[#c8191e] text-sm font-semibold text-white"
                  >
                    Add Money
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      void handleSendGift();
                    }}
                    disabled={isSendingGift || !selectedGift}
                    className="h-11 flex-1 rounded-xl bg-emerald-500 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isSendingGift ? "Sending..." : selectedGift ? `Send Gift ₹${selectedGiftTotal}` : "Select a Gift"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}








