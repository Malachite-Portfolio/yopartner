"use client";

import { useEffect, useState } from "react";
import { GiftPlayer } from "@/components/chat/GiftPlayer";
import { getGiftSvgaPath, type ChatGiftCatalogItem, isSpotlightPremiumGift } from "@/lib/chat/giftCatalog";

export type GiftOverlayEffect = {
  id: string;
  gift: ChatGiftCatalogItem;
  direction?: "sent" | "received";
};

type GiftOverlayProps = {
  effect: GiftOverlayEffect | null;
  onClose: () => void;
};

export function GiftOverlay({ effect, onClose }: GiftOverlayProps) {
  const [failedEffectId, setFailedEffectId] = useState<string | null>(null);

  useEffect(() => {
    if (!effect) return;

    const failSafe = window.setTimeout(() => {
      onClose();
    }, 5200);

    return () => {
      window.clearTimeout(failSafe);
    };
  }, [effect, onClose]);

  if (!effect) return null;

  const spotlightPremium = isSpotlightPremiumGift(effect.gift.giftKey);
  const hasFailed = failedEffectId === effect.id;
  const scaleClass = spotlightPremium ? "w-[min(92vw,560px)] h-[min(92vw,560px)]" : "w-[min(82vw,420px)] h-[min(82vw,420px)]";
  const giftSvgaPath = getGiftSvgaPath(effect.gift);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[80] flex items-center justify-center overflow-hidden" aria-hidden>
        <span className={`absolute inset-0 ${spotlightPremium ? "bg-black/60" : "bg-black/45"}`} />
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),rgba(255,255,255,0)_60%)]" />

        <div className={`relative ${scaleClass} drop-shadow-[0_0_18px_rgba(255,255,255,0.28)]`}>
          {!hasFailed ? (
            <GiftPlayer
              src={giftSvgaPath}
              loop={1}
              className="h-full w-full"
              onComplete={onClose}
              onError={(message) => {
                setFailedEffectId(effect.id);
                if (process.env.NODE_ENV !== "production") {
                  console.warn("[GiftOverlay] Failed to render SVGA gift", {
                    giftKey: effect.gift.giftKey,
                    svga: giftSvgaPath,
                    message,
                  });
                }
                window.setTimeout(onClose, 900);
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/30 bg-white/10 backdrop-blur-md">
              <p className="px-4 text-center text-sm font-semibold text-white">Gift animation unavailable</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
