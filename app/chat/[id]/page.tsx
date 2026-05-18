"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { createSession, getMySessions } from "@/lib/api/sessions";
import {
  getCompanionRouteProfile,
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";
import { USER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";

function getUserToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(USER_FIREBASE_TOKEN_KEY);
  return token && token.trim().length > 0 ? token.trim() : null;
}

function getLoginRedirectUrl(currentPath: string) {
  return `/login?returnUrl=${encodeURIComponent(currentPath)}`;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const preferredCompanionId = searchParams.get("companionId") ?? "";
  const [companion, setCompanion] = useState<CompanionRouteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
        router.replace(getLoginRedirectUrl(currentPath));
        return;
      }

      const sessionsResponse = await getMySessions();
      if (!active) return;

      if (sessionsResponse.error?.status === 401) {
        router.replace(getLoginRedirectUrl(currentPath));
        return;
      }

      const matchedSession = sessionsResponse.data.find(
        (item) => item.id === routeId || item.sessionCode === routeId,
      );

      if (matchedSession?.companionId) {
        const resolved = await resolveCompanionRouteProfile(matchedSession.companionId);
        if (!active) return;
        if (resolved) {
          setCompanion(resolved);
          setIsLoading(false);
          return;
        }
        setCompanion(null);
        setErrorMessage("Your chat session is being prepared. Please try again shortly.");
        setIsLoading(false);
        return;
      }

      const companionIdsToTry: string[] = [];
      if (preferredCompanionId) companionIdsToTry.push(preferredCompanionId);
      companionIdsToTry.push(routeId);

      for (const id of companionIdsToTry) {
        const resolvedCompanion = await resolveCompanionRouteProfile(id);
        if (!active) return;
        if (!resolvedCompanion) continue;

        const existingSession = sessionsResponse.data.find((item) => item.companionId === resolvedCompanion.id);
        if (existingSession?.id && existingSession.id !== routeId && existingSession.sessionCode !== routeId) {
          router.replace(`/chat/${existingSession.id}?companionId=${encodeURIComponent(resolvedCompanion.id)}`);
          return;
        }

        const createResponse = await createSession({
          companionId: resolvedCompanion.id,
          serviceType: "chat",
        });
        if (!active) return;

        if (createResponse.error?.status === 401) {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(USER_FIREBASE_TOKEN_KEY);
          }
          router.replace(getLoginRedirectUrl(currentPath));
          return;
        }

        const createdSessionId = createResponse.data?.id;
        if (createdSessionId && createdSessionId !== routeId) {
          router.replace(`/chat/${createdSessionId}?companionId=${encodeURIComponent(resolvedCompanion.id)}`);
          return;
        }

        setCompanion(resolvedCompanion);
        setIsLoading(false);
        return;
      }

      const staticFallback = getCompanionRouteProfile(routeId);
      if (staticFallback) {
        setCompanion(staticFallback);
        setIsLoading(false);
        return;
      }

      setCompanion(null);
      setErrorMessage("Chat will open after your session is created.");
      setIsLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [currentPath, preferredCompanionId, routeId, router]);

  if (!routeId) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">Chat route is unavailable.</p>
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

  if (isLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#dceae5] bg-white p-6 text-center text-sm text-slate-700">
          Opening chat...
        </div>
      </main>
    );
  }

  if (!companion) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#eef3f8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">
            {errorMessage || "Chat will open after your session is created."}
          </p>
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

  return (
    <main className="h-screen overflow-hidden bg-[#eef3f8]">
      <ChatScreen key={companion.id} companion={companion} />
    </main>
  );
}
