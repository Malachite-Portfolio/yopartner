"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatScreen } from "@/components/chat/ChatScreen";
import {
  cancelSession,
  createSession,
  getSessionById,
  type SessionRecord,
} from "@/lib/api/sessions";
import { USER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";
import {
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";

function getUserToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(USER_FIREBASE_TOKEN_KEY);
  return token && token.trim().length > 0 ? token.trim() : null;
}

function toLoginUrl(returnUrl: string) {
  return `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
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

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/chat/${routeId}?${query}` : `/chat/${routeId}`;
  }, [routeId, searchParams]);

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
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(USER_FIREBASE_TOKEN_KEY);
        }
        router.replace(toLoginUrl(currentPath));
        return;
      }

      if (fetched.data) {
        setSession(fetched.data);
        const resolvedCompanion = await resolveCompanionRouteProfile(fetched.data.companionId);
        if (!active) return;
        if (!resolvedCompanion) {
          setErrorMessage("Your chat session is being prepared. Please try again shortly.");
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
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(USER_FIREBASE_TOKEN_KEY);
        }
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
    if (!session?.id || session.status !== "PENDING") return;
    const timer = window.setInterval(async () => {
      const latest = await getSessionById(session.id);
      if (latest.data) setSession(latest.data);
    }, 4000);
    return () => {
      window.clearInterval(timer);
    };
  }, [session?.id, session?.status]);

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

  if (isLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#dceae5] bg-white p-6 text-center text-sm text-slate-700">
          Opening chat...
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to companions
          </button>
        </div>
      </main>
    );
  }

  if (!companion || !session) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">Chat will open after your session is created.</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to companions
          </button>
        </div>
      </main>
    );
  }

  if (session.status === "PENDING") {
    return (
      <main className="flex h-screen items-center justify-center bg-[#eef3f8] p-4">
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
      <main className="flex h-screen items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#dceae5] bg-white p-6 text-center">
          <p className="text-sm font-semibold text-slate-900">
            {session.status === "FAILED"
              ? "Your chat request was declined."
              : session.status === "COMPLETED"
                ? "This chat session has ended."
                : "This chat session is not active right now."}
          </p>
          <button
            type="button"
            onClick={() => router.push(`/connect-now/${companion.id}`)}
            className="mt-4 rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to profile
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#eef3f8]">
      <ChatScreen
        key={`${companion.id}-${session.id}`}
        companion={companion}
        composerDisabled
        disabledMessage="Messaging connection is being prepared."
      />
    </main>
  );
}
