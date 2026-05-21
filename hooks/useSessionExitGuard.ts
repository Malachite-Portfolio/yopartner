"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseSessionExitGuardOptions = {
  active: boolean;
  onEndSession: () => Promise<void> | void;
  onNavigateAway: () => void;
};

export function useSessionExitGuard({ active, onEndSession, onNavigateAway }: UseSessionExitGuardOptions) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const activeRef = useRef(active);
  const pushedGuardRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (typeof window === "undefined" || !active) return;

    if (!pushedGuardRef.current) {
      window.history.pushState({ sessionGuard: true }, "", window.location.href);
      pushedGuardRef.current = true;
    }

    const handlePopState = () => {
      if (!activeRef.current) return;
      window.history.pushState({ sessionGuard: true }, "", window.location.href);
      setConfirmError("");
      setConfirmOpen(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [active]);

  const requestExit = useCallback(() => {
    if (!activeRef.current) {
      onNavigateAway();
      return;
    }
    setConfirmError("");
    setConfirmOpen(true);
  }, [onNavigateAway]);

  const stay = useCallback(() => {
    if (confirmLoading) return;
    setConfirmError("");
    setConfirmOpen(false);
  }, [confirmLoading]);

  const endAndExit = useCallback(async () => {
    if (confirmLoading) return;
    setConfirmLoading(true);
    setConfirmError("");
    try {
      await onEndSession();
      setConfirmOpen(false);
      onNavigateAway();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to end this session. Please try again.";
      setConfirmError(message);
    } finally {
      setConfirmLoading(false);
    }
  }, [confirmLoading, onEndSession, onNavigateAway]);

  return {
    confirmOpen: confirmOpen && active,
    confirmLoading,
    confirmError,
    requestExit,
    stay,
    endAndExit,
  };
}
