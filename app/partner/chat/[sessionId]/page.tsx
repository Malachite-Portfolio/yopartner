"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PartnerGuard } from "@/components/partner/PartnerGuard";
import { GiftOverlay, type GiftOverlayEffect } from "@/components/chat/GiftOverlay";
import { ChatScreen, type ChatScreenMessage } from "@/components/chat/ChatScreen";
import { EndSessionConfirmModal } from "@/components/session/EndSessionConfirmModal";
import { useSessionExitGuard } from "@/hooks/useSessionExitGuard";
import {
  endSession,
  getSessionById,
  getSessionMessages,
  sendSessionMessage,
  type SessionMessageRecord,
  type SessionRecord,
} from "@/lib/api/sessions";
import { requestAudioPermission, requestVideoPermission } from "@/lib/agora";
import { playGiftSound } from "@/lib/chat/giftSound";
import { getCatalogGiftByKey } from "@/lib/chat/giftCatalog";
import type { CompanionRouteProfile } from "@/lib/companionRoutes";
import { isActiveSessionStatus, isTerminalSessionStatus } from "@/lib/sessionStatus";

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value || "Member";
  return `+91******${digits.slice(-4)}`;
}

function resolveMemberDisplayName(session: SessionRecord | null) {
  const primaryName = session?.user?.name?.trim();
  if (primaryName) return primaryName;
  const fallbackFullName = session?.user && "fullName" in session.user ? String((session.user as { fullName?: string }).fullName ?? "").trim() : "";
  if (fallbackFullName) return fallbackFullName;
  const masked = String(session?.user?.phoneMasked ?? "");
  if (masked.trim()) return masked;
  return maskPhone(String(session?.user?.phoneNumber ?? ""));
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

export default function PartnerChatSessionPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId ?? "";
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<SessionMessageRecord[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [input, setInput] = useState("");
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [activeGiftEffect, setActiveGiftEffect] = useState<GiftOverlayEffect | null>(null);
  const seenGiftMessageIdsRef = useRef<Set<string>>(new Set());
  const hasHydratedGiftFeedRef = useRef(false);
  const handleGiftOverlayClose = useCallback(() => {
    setActiveGiftEffect(null);
  }, []);

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
      if (response.data) setSession(response.data);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [session?.id]);

  useEffect(() => {
    if (!sessionId || session?.status !== "LIVE") return;
    const refresh = async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsMessagesLoading(true);
      }
      const response = await getSessionMessages(sessionId);
      if (!response.data) {
        if (!options?.silent) {
          setIsMessagesLoading(false);
        }
        return;
      }

      const nextMessages = response.data;
      if (!hasHydratedGiftFeedRef.current) {
        const hydratedGiftIds = new Set<string>();
        nextMessages.forEach((message) => {
          if (message.messageType === "GIFT" && message.id) {
            hydratedGiftIds.add(message.id);
          }
        });
        seenGiftMessageIdsRef.current = hydratedGiftIds;
        hasHydratedGiftFeedRef.current = true;
      }

      setMessages(nextMessages);
      if (!options?.silent) {
        setIsMessagesLoading(false);
      }

      const unseenGiftMessages = nextMessages
        .filter(
          (message): message is SessionMessageRecord & { gift: NonNullable<SessionMessageRecord["gift"]> } =>
            message.messageType === "GIFT" && Boolean(message.gift) && !seenGiftMessageIdsRef.current.has(message.id),
        )
        .sort((first, second) => +new Date(first.createdAt) - +new Date(second.createdAt));

      if (unseenGiftMessages.length === 0) return;

      unseenGiftMessages.forEach((message) => {
        seenGiftMessageIdsRef.current.add(message.id);
      });
      const latestGiftMessage = unseenGiftMessages[unseenGiftMessages.length - 1];
      if (!latestGiftMessage?.gift) return;
      const catalogGift = getCatalogGiftByKey(latestGiftMessage.gift.giftKey);
      if (!catalogGift) return;
      void playGiftSound(catalogGift.sound, latestGiftMessage.isMine ? 0.11 : 0.08);
      setActiveGiftEffect({
        id: `${catalogGift.id}-${Date.now()}`,
        gift: catalogGift,
        direction: latestGiftMessage.isMine ? "sent" : "received",
        quantity: latestGiftMessage.gift.quantity && latestGiftMessage.gift.quantity > 1 ? latestGiftMessage.gift.quantity : 1,
      });
    };
    void refresh({ silent: false });
    const timer = window.setInterval(() => {
      void refresh({ silent: true });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [session?.status, sessionId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    hasHydratedGiftFeedRef.current = false;
    seenGiftMessageIdsRef.current = new Set();
  }, [sessionId]);

  useEffect(() => {
    if (!isTerminalSessionStatus(session?.status)) return;
    const timer = window.setTimeout(() => {
      router.push("/partner/dashboard");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [router, session?.status]);

  const memberName = useMemo(() => {
    return resolveMemberDisplayName(session);
  }, [session]);

  const memberProfile = useMemo<CompanionRouteProfile>(
    () => ({
      id: sessionId,
      name: memberName,
      isVerifiedPartner: false,
      tagline: "Private session",
      online: session?.status === "LIVE",
      chatPrice: 0,
      voicePrice: 0,
      videoPrice: 0,
    }),
    [memberName, session?.status, sessionId],
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !session || session.status !== "LIVE") return;
    setInput("");

    const optimisticId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: SessionMessageRecord = {
      id: optimisticId,
      sessionId: session.id,
      senderId: String(session.companion?.userId ?? ""),
      senderUserId: String(session.companion?.userId ?? ""),
      senderRole: "PARTNER",
      text,
      body: text,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    setMessages((current) => [...current, optimistic]);
    const response = await sendSessionMessage(session.id, text, optimisticId);
    if (!response.data) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setError(response.error?.message || "Unable to send message.");
      return;
    }
    const createdMessage = response.data;
    setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), createdMessage]);
    setError("");
  };

  const handleConfirmEndSession = useCallback(async () => {
    if (!session?.id) return;
    if (isEndingSession) throw new Error("Session is already ending.");
    setIsEndingSession(true);
    try {
      const response = await endSession(session.id);
      if (!response.data) {
        throw new Error(response.error?.message || "Unable to end this session. Please try again.");
      }
      setSession(response.data);
      setError("");
    } finally {
      setIsEndingSession(false);
    }
  }, [isEndingSession, session?.id]);

  const navigateAfterExit = useCallback(() => {
    router.push("/partner/dashboard");
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
  const baseTime = session?.liveStartedAt || session?.startedAt || session?.acceptedAt;
  const baseMs = baseTime ? new Date(baseTime).getTime() : Number.NaN;
  const elapsedSeconds = Number.isNaN(baseMs) ? 0 : Math.max(0, Math.floor((clockNow - baseMs) / 1000));
  const timerLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  return (
    <PartnerGuard requireOnboarding>
      <main className="fixed inset-0 z-[9999] h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#f7fbfa]">
        {exitConfirmModal}
        {loading ? (
          <section className="flex h-full items-center justify-center p-5 text-sm text-slate-600">
            Opening conversation...
          </section>
        ) : !session ? (
          <section className="flex h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-xl font-semibold text-amber-800">Conversation unavailable</h2>
              <p className="mt-2 text-sm text-amber-700">{error || "Session was not found."}</p>
            </div>
          </section>
        ) : (
          <>
            {error ? (
              <div className="absolute left-1/2 top-3 z-50 -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {error}
              </div>
            ) : null}
            <ChatScreen
              companion={memberProfile}
              messages={toScreenMessages(messages)}
              messagesLoading={isMessagesLoading}
              messagesLoadingLabel="Loading chat messages..."
              input={input}
              onInputChange={setInput}
              onSend={() => {
                void handleSend();
              }}
              onOpenAudio={() => {
                void handleOpenAudio();
              }}
              onOpenVideo={() => {
                void handleOpenVideo();
              }}
              composerDisabled={session.status !== "LIVE"}
              disabledMessage="Session ended"
              onEndSession={() => {
                exitGuard.requestExit();
              }}
              endingSession={isEndingSession}
              backHref="/partner/dashboard"
              backLabel="Back to Dashboard"
              onBackRequest={exitGuard.requestExit}
              showCallActions={false}
              sessionTimerLabel={timerLabel}
            />
            <GiftOverlay effect={activeGiftEffect} onClose={handleGiftOverlayClose} />
          </>
        )}
      </main>
    </PartnerGuard>
  );
}
