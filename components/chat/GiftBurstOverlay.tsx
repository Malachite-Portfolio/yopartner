"use client";

import { useState, type CSSProperties } from "react";
import { buildGiftBurstParticles, getGiftEffectConfig, type GiftEffectKey } from "@/lib/chat/giftEffects";
import { SVGAGiftPlayer } from "@/components/chat/SVGAGiftPlayer";

export type GiftBurstEffect = {
  id: string;
  giftKey: GiftEffectKey;
  giftEmoji: string;
  svgaFile?: string;
  giftName?: string;
  amount?: number;
  premium?: boolean;
  direction?: "sent" | "received";
  reducedMotion?: boolean;
  durationMs?: number;
};

type GiftBurstOverlayProps = {
  effect: GiftBurstEffect | null;
};

function renderFallbackScene(giftEmoji: string, giftName: string) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] border border-white/45 bg-white/12 backdrop-blur-md">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3),rgba(255,255,255,0)_70%)]" />
      <div className="relative text-center">
        <p className="text-[clamp(4rem,12vw,7rem)] drop-shadow-[0_0_24px_rgba(255,255,255,0.9)]">{giftEmoji}</p>
        <p className="mt-2 text-sm font-semibold tracking-wide text-white">{giftName}</p>
      </div>
    </div>
  );
}

export function GiftBurstOverlay({ effect }: GiftBurstOverlayProps) {
  const [svgaFailedForId, setSvgaFailedForId] = useState<string | null>(null);
  if (!effect) return null;
  const svgaFailed = svgaFailedForId === effect.id;

  const config = getGiftEffectConfig(effect.giftKey);
  const isPremium = effect.premium ?? config.tier === "premium";
  const particles = isPremium ? buildGiftBurstParticles(effect.giftKey).slice(0, 18) : [];
  const reducedMotion = Boolean(effect.reducedMotion);
  const fallbackName = effect.giftName ?? config.name;
  const visualSize = isPremium ? "clamp(260px, 62vw, 520px)" : "clamp(260px, 54vw, 360px)";

  if (reducedMotion) {
    return (
      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-5" aria-hidden>
        <div className="w-full max-w-xs rounded-2xl border border-white/70 bg-white/90 px-4 py-4 text-center shadow-xl backdrop-blur-sm">
          <p className="text-4xl">{effect.giftEmoji}</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {effect.direction === "received" ? "Gift received" : "Gift sent"}: {fallbackName}
          </p>
          <p className="mt-1 text-xs text-slate-600">Premium effect reduced for motion settings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden" aria-hidden>
        <span className="absolute inset-0 bg-black/45" />
        <span
          className="absolute inset-0 opacity-0 animate-[giftGlowSweep_1.8s_ease-out_forwards]"
          style={{
            background: `radial-gradient(circle at center, ${config.overlayFrom}66, ${config.overlayTo}2e 52%, transparent 76%)`,
          }}
        />

        <div
          className="relative"
          style={{
            width: visualSize,
            height: visualSize,
          }}
        >
          {effect.svgaFile && !svgaFailed ? (
            <SVGAGiftPlayer
              src={effect.svgaFile}
              loop={1}
              className="h-full w-full"
              onError={(message) => {
                setSvgaFailedForId(effect.id);
                if (process.env.NODE_ENV !== "production") {
                  console.warn("[GiftBurstOverlay] SVGA playback failed", {
                    giftKey: effect.giftKey,
                    svgaFile: effect.svgaFile,
                    message,
                  });
                }
              }}
            />
          ) : (
            renderFallbackScene(effect.giftEmoji, fallbackName)
          )}

          {particles.map((particle) => (
            <span
              key={`${effect.id}-${particle.id}`}
              className="absolute left-1/2 top-1/2 text-[clamp(1rem,2.2vw,1.8rem)] opacity-0 animate-[premiumConfetti_1.3s_ease-out_forwards]"
              style={
                {
                  "--gift-tx": `${particle.tx}px`,
                  "--gift-ty": `${particle.ty}px`,
                  "--gift-delay": `${particle.delayMs}ms`,
                  "--gift-duration": `${particle.durationMs}ms`,
                  "--gift-rotate": `${particle.rotate}deg`,
                  "--gift-scale": particle.scale,
                  animationDelay: "var(--gift-delay)",
                  animationDuration: "var(--gift-duration)",
                } as CSSProperties
              }
            >
              {particle.emoji}
            </span>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes premiumConfetti {
          0% { transform: translate(-50%, -50%) scale(0.45) rotate(0deg); opacity: 0; }
          24% { opacity: 0.92; }
          100% {
            transform: translate(calc(-50% + var(--gift-tx)), calc(-50% + var(--gift-ty)))
              scale(var(--gift-scale)) rotate(var(--gift-rotate));
            opacity: 0;
          }
        }
        @keyframes giftGlowSweep {
          0% { opacity: 0; transform: scale(0.7); }
          28% { opacity: 0.9; }
          100% { opacity: 0; transform: scale(1.25); }
        }
      `}</style>
    </>
  );
}
