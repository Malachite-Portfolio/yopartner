"use client";

import { useEffect, useRef } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  released?: boolean;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

type UseCallPageResilienceOptions = {
  active: boolean;
  onForeground: () => Promise<void> | void;
};

export function useCallPageResilience({ active, onForeground }: UseCallPageResilienceOptions) {
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const onForegroundRef = useRef(onForeground);

  useEffect(() => {
    onForegroundRef.current = onForeground;
  }, [onForeground]);

  useEffect(() => {
    if (!active || typeof document === "undefined" || typeof navigator === "undefined") return;

    let disposed = false;

    const releaseWakeLock = async () => {
      const wakeLock = wakeLockRef.current;
      wakeLockRef.current = null;
      if (!wakeLock || wakeLock.released) return;
      try {
        await wakeLock.release();
      } catch {
        // Wake lock release can fail after the browser already released it.
      }
    };

    const requestWakeLock = async () => {
      if (disposed || document.visibilityState !== "visible" || wakeLockRef.current) return;
      const wakeLockApi = (navigator as NavigatorWithWakeLock).wakeLock;
      if (!wakeLockApi) return;
      try {
        wakeLockRef.current = await wakeLockApi.request("screen");
      } catch {
        // Unsupported, denied, or low-power mode: the call still works without it.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        void releaseWakeLock();
        return;
      }
      void requestWakeLock();
      void onForegroundRef.current();
    };

    void requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void releaseWakeLock();
    };
  }, [active]);
}
