"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GiftPlayer } from "@/components/chat/GiftPlayer";
import { getGiftSvgaUrl, type ChatGiftCatalogItem, isSpotlightPremiumGift } from "@/lib/chat/giftCatalog";

export type GiftOverlayEffect = {
  id: string;
  gift: ChatGiftCatalogItem;
  direction?: "sent" | "received";
};

type GiftOverlayProps = {
  effect: GiftOverlayEffect | null;
  onClose: () => void;
};

type SceneProps = {
  effect: GiftOverlayEffect;
  onClose: () => void;
};

function GiftOverlayScene({ effect, onClose }: SceneProps) {
  const [isPreparing, setIsPreparing] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);
  const hasClosedRef = useRef(false);

  const spotlightPremium = isSpotlightPremiumGift(effect.gift.giftKey);
  const hardCloseMs = spotlightPremium ? 6000 : 4000;
  const playbackTimeoutMs = spotlightPremium ? 5200 : 3200;
  const scaleClass = spotlightPremium ? "w-[min(92vw,560px)] h-[min(92vw,560px)]" : "w-[min(82vw,420px)] h-[min(82vw,420px)]";
  const giftSvgaPath = getGiftSvgaUrl(effect.gift);

  const closeOnce = useCallback(() => {
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;
    onClose();
  }, [onClose]);

  useEffect(() => {
    const hardCloseTimer = window.setTimeout(() => {
      closeOnce();
    }, hardCloseMs);

    return () => {
      window.clearTimeout(hardCloseTimer);
    };
  }, [closeOnce, hardCloseMs]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[80] flex items-center justify-center overflow-hidden" aria-hidden>
      <span className={`absolute inset-0 ${spotlightPremium ? "bg-black/60" : "bg-black/45"}`} />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),rgba(255,255,255,0)_60%)]" />

      <div className={`relative ${scaleClass} drop-shadow-[0_0_18px_rgba(255,255,255,0.28)]`}>
        {!hasFailed ? (
          <GiftPlayer
            src={giftSvgaPath}
            loop={1}
            className="h-full w-full"
            playbackTimeoutMs={playbackTimeoutMs}
            clearOnComplete
            onComplete={closeOnce}
            onReady={() => {
              setIsPreparing(false);
            }}
            onError={(message) => {
              setHasFailed(true);
              setIsPreparing(false);
              if (process.env.NODE_ENV !== "production") {
                console.warn("[GiftOverlay] Failed to render SVGA gift", {
                  giftId: effect.gift.id,
                  giftKey: effect.gift.giftKey,
                  svga: giftSvgaPath,
                  error: message,
                });
              }
              window.setTimeout(closeOnce, 1500);
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/30 bg-white/10 backdrop-blur-md">
            <p className="px-4 text-center text-sm font-semibold text-white">Gift animation unavailable</p>
          </div>
        )}

        {!hasFailed && isPreparing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-white/35 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Preparing gift...
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function GiftOverlay({ effect, onClose }: GiftOverlayProps) {
  if (!effect) return null;
  return <GiftOverlayScene key={effect.id} effect={effect} onClose={onClose} />;
}
