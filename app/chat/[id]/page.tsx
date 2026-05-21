"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  sendSessionMessage,
  type SessionRecord,
  type SessionMessageRecord,
} from "@/lib/api/sessions";
import { USER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";
import {
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";
import { requestAudioPermission, requestVideoPermission } from "@/lib/agora";
import { isActiveSessionStatus } from "@/lib/sessionStatus";

function getUserToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(USER_FIREBASE_TOKEN_KEY);
  return token && token.trim().length > 0 ? token.trim() : null;
}

function toLoginUrl(returnUrl: string) {
  return `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
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
  const [isCancelling, setIsCancelling] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<SessionMessageRecord[]>([]);
  const [messageError, setMessageError] = useState("");
  const [isEndingSession, setIsEndingSession] = useState(false);

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/chat/${routeId}?${query}` : `/chat/${routeId}`;
  }, [routeId, searchParams]);

  const refreshMessages = useCallback(async (sessionId: string) => {
    const response = await getSessionMessages(sessionId);
    if (response.error) {
      setMessageError(response.error.message || "Unable to load messages right now.");
      return;
    }
    setMessages(response.data);
    setMessageError("");
  }, []);

  useEffect(() => {
    if (!routeId) return;

    let active = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");

      if (!getUserToken()) {
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
        setErrorMessage(created.error.message || "Unable to create chat session.");
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
      setIsLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [currentPath, preferredCompanionId, routeId, router]);

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

  const handleEndLiveSession = async () => {
    if (!session?.id || session.status !== "LIVE" || isEndingSession) return;
    setIsEndingSession(true);
    const response = await endSession(session.id);
    setIsEndingSession(false);
    if (!response.data) {
      setMessageError(response.error?.message || "Unable to end chat session.");
      return;
    }
    setSession(response.data);
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
    } finally {
      setIsEndingSession(false);
    }
  }, [isEndingSession, session?.id]);

  const navigateAfterExit = useCallback(() => {
    router.push("/connect-now");
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
    router.push(`/call/audio/${session.id}?companionId=${encodeURIComponent(companion.id)}`);
  };

  const handleOpenVideo = async () => {
    if (!session || !companion) return;
    try {
      await requestVideoPermission();
    } catch {
      setMessageError("Camera and microphone permission are required for video calls.");
      return;
    }
    router.push(`/call/video/${session.id}?companionId=${encodeURIComponent(companion.id)}`);
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
          void handleEndLiveSession();
        }}
        endingSession={isEndingSession}
        onBackRequest={exitGuard.requestExit}
      />
    </main>
  );
}
