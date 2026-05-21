"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PartnerGuard } from "@/components/partner/PartnerGuard";
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
import type { CompanionRouteProfile } from "@/lib/companionRoutes";
import { isActiveSessionStatus } from "@/lib/sessionStatus";

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value || "Member";
  return `+91******${digits.slice(-4)}`;
}

function toScreenMessages(messages: SessionMessageRecord[]): ChatScreenMessage[] {
  return messages.map((message) => ({
    id: message.id,
    sender: message.isMine ? "self" : "other",
    text: message.text ?? message.body,
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
      if (response.data) setSession(response.data);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [session?.id]);

  useEffect(() => {
    if (!sessionId || session?.status !== "LIVE") return;
    const refresh = async () => {
      const response = await getSessionMessages(sessionId);
      if (response.data) setMessages(response.data);
    };
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [session?.status, sessionId]);

  const memberName = useMemo(() => {
    const raw = String(session?.user?.phoneMasked ?? session?.user?.phoneNumber ?? session?.user?.name ?? "");
    return maskPhone(raw);
  }, [session?.user]);

  const memberProfile = useMemo<CompanionRouteProfile>(
    () => ({
      id: sessionId,
      name: memberName,
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

    const optimistic: SessionMessageRecord = {
      id: `temp-${Date.now()}`,
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
                void handleEndChat();
              }}
              endingSession={isEndingSession}
              backHref="/partner/dashboard"
              backLabel="Back to Dashboard"
              onBackRequest={exitGuard.requestExit}
              showCallActions={false}
            />
          </>
        )}
      </main>
    </PartnerGuard>
  );
}
