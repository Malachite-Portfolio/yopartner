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
  const playbackTimeoutMs = spotlightPremium ? 5500 : 3500;
  const giftSvgaPath = getGiftSvgaUrl(effect.gift);

  const closeOnce = useCallback(() => {
    if (hasClosedRef.current) return;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[GiftOverlay] closeOnce", { giftId: effect.gift.id, svga: giftSvgaPath });
    }
    hasClosedRef.current = true;
    onClose();
  }, [effect.gift.id, giftSvgaPath, onClose]);

  useEffect(() => {
    const hardCloseTimer = window.setTimeout(() => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[GiftOverlay] hard timeout close", { giftId: effect.gift.id, hardCloseMs });
      }
      closeOnce();
    }, hardCloseMs);

    return () => {
      window.clearTimeout(hardCloseTimer);
    };
  }, [closeOnce, effect.gift.id, hardCloseMs]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] h-[100dvh] w-screen overflow-hidden" aria-hidden>
      <span className={`absolute inset-0 ${spotlightPremium ? "bg-black/65" : "bg-black/55"}`} />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),rgba(255,255,255,0)_62%)]" />

      {!hasFailed ? (
        <div className="relative flex h-[100dvh] w-screen items-center justify-center">
          <GiftPlayer
            src={giftSvgaPath}
            loop={1}
            className="h-[100dvh] w-screen"
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
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg bg-black/50 px-3 py-2 text-sm font-semibold text-white">Gift animation unavailable</p>
        </div>
      )}
    </div>
  );
}

export function GiftOverlay({ effect, onClose }: GiftOverlayProps) {
  if (!effect) return null;
  return <GiftOverlayScene key={effect.id} effect={effect} onClose={onClose} />;
}
