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

function renderGiftScene(giftKey: GiftEffectKey, giftEmoji: string) {
  switch (giftKey) {
    case "rose":
      return (
        <div className="relative h-full w-full">
          <span className="absolute inset-5 rounded-[2rem] border border-rose-200/70 bg-white/65 shadow-[0_0_55px_rgba(244,63,94,0.36)]" />
          <span className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 text-[clamp(3.6rem,9vw,6rem)]">
            {giftEmoji}
          </span>
          <span className="absolute left-1/2 top-[57%] h-[46%] w-[60%] -translate-x-1/2 rounded-b-[999px] border border-rose-200 bg-white/45" />
          {["🌸", "🌺", "✨", "💗"].map((petal, index) => (
            <span
              key={petal + index}
              className="absolute left-1/2 top-[32%] text-2xl opacity-0 animate-[rosePetalFloat_1.8s_ease-out_forwards]"
              style={
                {
                  "--petal-x": `${-80 + index * 52}px`,
                  "--petal-y": `${-65 - index * 12}px`,
                  animationDelay: `${index * 95}ms`,
                } as CSSProperties
              }
            >
              {petal}
            </span>
          ))}
        </div>
      );
    case "coffee":
      return (
        <div className="relative h-full w-full">
          <span className="absolute inset-5 rounded-[2rem] border border-amber-200/70 bg-amber-50/80 shadow-[0_0_45px_rgba(180,83,9,0.35)]" />
          <span className="absolute left-1/2 top-[57%] -translate-x-1/2 -translate-y-1/2 text-[clamp(3.8rem,9vw,6.2rem)]">
            {giftEmoji}
          </span>
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={`steam-${index}`}
              className="absolute top-[22%] h-10 w-1 rounded-full bg-amber-100/85 opacity-0 animate-[coffeeSteam_1.4s_ease-out_infinite]"
              style={{
                left: `calc(38% + ${index * 8}% )`,
                animationDelay: `${index * 140}ms`,
              }}
            />
          ))}
          <span className="absolute left-1/2 top-[76%] h-2 w-36 -translate-x-1/2 rounded-full bg-amber-900/15 blur-sm" />
        </div>
      );
    case "star":
      return (
        <div className="relative h-full w-full">
          <span className="absolute inset-4 rounded-full bg-yellow-100/55 animate-[starBurst_1.9s_ease-out_forwards]" />
          <span className="absolute inset-8 rounded-full border-[6px] border-yellow-200/80 opacity-0 animate-[starBurst_1.6s_ease-out_forwards]" />
          <span className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/25 blur-2xl" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(4.4rem,10vw,7.4rem)] drop-shadow-[0_0_20px_rgba(234,179,8,0.9)]">
            {giftEmoji}
          </span>
        </div>
      );
    case "heart":
      return (
        <div className="relative h-full w-full">
          <span className="absolute inset-4 rounded-full bg-pink-200/35 blur-2xl" />
          <span className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 text-[clamp(4rem,9vw,6.8rem)] animate-[heartBalloonFloat_2.2s_ease-out_forwards]">
            {giftEmoji}
          </span>
          {["💗", "💕", "💖", "💘", "💝"].map((heart, index) => (
            <span
              key={heart + index}
              className="absolute left-1/2 top-[58%] text-[clamp(1.4rem,3vw,2rem)] opacity-0 animate-[heartBalloonFloat_2.1s_ease-out_forwards]"
              style={
                {
                  "--heart-x": `${-105 + index * 52}px`,
                  "--heart-rise": `${120 + index * 14}px`,
                  animationDelay: `${index * 80}ms`,
                } as CSSProperties
              }
            >
              {heart}
            </span>
          ))}
        </div>
      );
    case "crown":
      return (
        <div className="relative h-full w-full">
          <span className="absolute inset-0 rounded-full bg-amber-200/35 blur-2xl animate-[crownRoyalDrop_2.6s_ease-out_forwards]" />
          <span className="absolute left-1/2 top-1/2 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-amber-200/80" />
          <span className="absolute left-[22%] top-[34%] h-[34%] w-[22%] rounded-l-full border-l-[4px] border-t-[4px] border-amber-300/90" />
          <span className="absolute right-[22%] top-[34%] h-[34%] w-[22%] rounded-r-full border-r-[4px] border-t-[4px] border-amber-300/90" />
          <span className="absolute left-1/2 top-[53%] -translate-x-1/2 -translate-y-1/2 text-[clamp(4.1rem,9.4vw,7rem)] drop-shadow-[0_0_22px_rgba(245,158,11,0.9)] animate-[crownRoyalDrop_2.7s_ease-out_forwards]">
            {giftEmoji}
          </span>
          <span className="absolute left-1/2 top-1/2 h-[102%] w-[102%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/85 opacity-0 animate-[shimmerSweep_2.1s_ease-out_forwards]" />
        </div>
      );
    case "diamond":
      return (
        <div className="relative h-full w-full">
          <span className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-br from-indigo-200/45 via-cyan-200/35 to-sky-100/25 blur-xl" />
          <span className="absolute left-1/2 top-1/2 h-[58%] w-[52%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gradient-to-br from-cyan-100 via-sky-300 to-indigo-500 shadow-[0_0_45px_rgba(56,189,248,0.65)] animate-[diamondShine_2.4s_ease-out_forwards]" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] text-[clamp(4.1rem,10vw,7.6rem)] drop-shadow-[0_0_26px_rgba(125,211,252,0.95)]">
            {giftEmoji}
          </span>
          <span className="absolute left-[16%] top-[18%] h-2 w-24 rotate-[-24deg] rounded-full bg-white/75 opacity-0 animate-[shimmerSweep_2s_ease-out_forwards]" />
        </div>
      );
    default:
      return (
        <div className="relative h-full w-full">
          <span className="absolute inset-4 rounded-full bg-white/50" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl">{giftEmoji}</span>
        </div>
      );
  }
}

export function GiftBurstOverlay({ effect }: GiftBurstOverlayProps) {
  const [svgaFailedForId, setSvgaFailedForId] = useState<string | null>(null);
  if (!effect) return null;
  const svgaFailed = svgaFailedForId === effect.id;

  const config = getGiftEffectConfig(effect.giftKey);
  const particles = buildGiftBurstParticles(effect.giftKey);
  const isPremium = effect.premium ?? config.tier === "premium";
  const reducedMotion = Boolean(effect.reducedMotion);

  if (reducedMotion) {
    return (
      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-5" aria-hidden>
        <div className="w-full max-w-xs rounded-2xl border border-white/70 bg-white/90 px-4 py-4 text-center shadow-xl backdrop-blur-sm">
          <p className="text-4xl">{effect.giftEmoji}</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {effect.direction === "received" ? "Gift received" : "Gift sent"}: {effect.giftName ?? config.name}
          </p>
          <p className="mt-1 text-xs text-slate-600">Premium effect reduced for motion settings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <span
          className={`absolute inset-0 opacity-0 ${
            isPremium ? "animate-[shimmerSweep_1.8s_ease-out_forwards]" : "animate-[starBurst_1.4s_ease-out_forwards]"
          }`}
          style={{
            background:
              effect.giftKey === "diamond"
                ? "radial-gradient(circle at center, rgba(103,232,249,0.35), rgba(99,102,241,0.3) 52%, transparent 78%)"
                : effect.giftKey === "crown"
                  ? "radial-gradient(circle at center, rgba(252,211,77,0.34), rgba(251,191,36,0.26) 52%, transparent 76%)"
                  : `radial-gradient(circle at center, ${config.overlayFrom}4f, ${config.overlayTo}2b 50%, transparent 74%)`,
          }}
        />

        <div className="relative h-[clamp(120px,38vw,260px)] w-[clamp(120px,38vw,260px)]">
          {effect.svgaFile && !svgaFailed ? (
            <SVGAGiftPlayer
              src={effect.svgaFile}
              loop={1}
              className="h-full w-full"
              onError={() => setSvgaFailedForId(effect.id)}
            />
          ) : (
            renderGiftScene(effect.giftKey, effect.giftEmoji)
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
        @keyframes rosePetalFloat {
          0% { transform: translate(-50%, -5%) scale(0.6); opacity: 0; }
          25% { opacity: 0.95; }
          100% { transform: translate(calc(-50% + var(--petal-x)), calc(-5% + var(--petal-y))) rotate(20deg); opacity: 0; }
        }
        @keyframes coffeeSteam {
          0% { transform: translateY(0) scaleY(0.65); opacity: 0; }
          35% { opacity: 0.72; }
          100% { transform: translateY(-34px) scaleY(1.35); opacity: 0; }
        }
        @keyframes starBurst {
          0% { transform: scale(0.25); opacity: 0; }
          40% { opacity: 0.9; }
          100% { transform: scale(1.24); opacity: 0; }
        }
        @keyframes heartBalloonFloat {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
          30% { opacity: 0.95; }
          100% { transform: translate(calc(-50% + var(--heart-x, 0px)), calc(-1 * var(--heart-rise, 150px))) scale(1.18); opacity: 0; }
        }
        @keyframes crownRoyalDrop {
          0% { transform: translate(-50%, -72%) scale(0.38); opacity: 0; }
          24% { opacity: 0.98; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes diamondShine {
          0% { transform: translate(-50%, -50%) rotate(45deg) scale(0.35); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(45deg) scale(1.05); opacity: 1; }
        }
        @keyframes premiumConfetti {
          0% { transform: translate(-50%, -50%) scale(0.45) rotate(0deg); opacity: 0; }
          20% { opacity: 0.98; }
          100% {
            transform: translate(calc(-50% + var(--gift-tx)), calc(-50% + var(--gift-ty)))
              scale(var(--gift-scale)) rotate(var(--gift-rotate));
            opacity: 0;
          }
        }
        @keyframes shimmerSweep {
          0% { opacity: 0; transform: scale(0.7); }
          35% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.25); }
        }
      `}</style>
    </>
  );
}
