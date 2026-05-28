"use client";

import type { CSSProperties } from "react";
import type { GiftKey } from "@/lib/api/sessions";
import { buildGiftBurstParticles, getGiftEffectConfig } from "@/lib/chat/giftEffects";

export type GiftBurstEffect = {
  id: string;
  giftKey: GiftKey;
  giftEmoji: string;
};

type GiftBurstOverlayProps = {
  effect: GiftBurstEffect | null;
};

export function GiftBurstOverlay({ effect }: GiftBurstOverlayProps) {
  if (!effect) return null;

  const config = getGiftEffectConfig(effect.giftKey);
  const particles = buildGiftBurstParticles(effect.giftKey);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center" aria-hidden>
        <div className="relative h-80 w-80">
          <span
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 animate-[giftGlow_1.1s_ease-out_forwards]"
            style={{
              background: `radial-gradient(circle at center, ${config.accentFrom}90 0%, ${config.accentTo}00 68%)`,
            }}
          />

          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl drop-shadow-xl animate-[giftCore_0.95s_cubic-bezier(0.2,0.9,0.25,1)_forwards]">
            {effect.giftEmoji}
          </span>

          {particles.map((particle) => (
            <span
              key={`${effect.id}-${particle.id}`}
              className="absolute left-1/2 top-1/2 text-3xl opacity-0 animate-[giftParticle_1.1s_ease-out_forwards]"
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
        @keyframes giftGlow {
          0% { transform: translate(-50%, -50%) scale(0.55); opacity: 0.05; }
          45% { opacity: 0.85; }
          100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0; }
        }
        @keyframes giftCore {
          0% { transform: translate(-50%, -50%) scale(0.35); opacity: 0; }
          35% { opacity: 1; }
          100% { transform: translate(-50%, -62%) scale(1.18); opacity: 0; }
        }
        @keyframes giftParticle {
          0% {
            transform: translate(-50%, -50%) scale(0.45) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--gift-tx)), calc(-50% + var(--gift-ty)))
              scale(var(--gift-scale)) rotate(var(--gift-rotate));
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
