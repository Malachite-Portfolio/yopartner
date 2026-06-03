"use client";

import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { LuckyWheel, getLuckyWheelRotation } from "@/components/LuckyWheel";
import { luckyWheelRewards, type LuckyWheelReward } from "@/lib/luckyWheelRewards";

const SPIN_DURATION_MS = 4300;

type LuckyWheelModalProps = {
  onClose: () => void;
};

function pickRewardIndex() {
  return Math.floor(Math.random() * luckyWheelRewards.length);
}

export function LuckyWheelModal({ onClose }: LuckyWheelModalProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedReward, setSelectedReward] = useState<LuckyWheelReward | null>(null);

  const spin = () => {
    if (isSpinning) return;

    const rewardIndex = pickRewardIndex();
    const reward = luckyWheelRewards[rewardIndex];

    setSelectedReward(null);
    setIsSpinning(true);
    setRotation((current) => getLuckyWheelRotation(current, rewardIndex));

    window.setTimeout(() => {
      setSelectedReward(reward);
      setIsSpinning(false);
    }, SPIN_DURATION_MS);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#052f2b]/46 px-3 py-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="lucky-wheel-title">
      <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[560px] overflow-y-auto rounded-[30px] border border-white/70 bg-[#fffdf8] p-4 shadow-[0_30px_90px_rgba(7,63,57,0.32)] sm:p-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#526b66] shadow-sm transition hover:bg-[#eef8f5]"
          aria-label="Close lucky wheel"
        >
          <X size={17} />
        </button>

        <div className="overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_18%_15%,rgba(20,184,166,0.16),transparent_28%),radial-gradient(circle_at_86%_22%,rgba(124,58,237,0.2),transparent_34%),linear-gradient(135deg,#fffdf8_0%,#f5fbf8_58%,#fff7ed_100%)] px-3 pb-4 pt-5 sm:px-5">
          <div className="pr-11">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d2e9e3] bg-white/82 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0f766e] shadow-sm">
              <Sparkles size={13} />
              YoPartner promo
            </span>
            <h2 id="lucky-wheel-title" className="mt-3 text-2xl font-semibold leading-tight text-[#073f39] sm:text-3xl">
              Spin & Win
            </h2>
            <p className="mt-2 max-w-[420px] text-sm leading-6 text-[#526b66]">
              Try your luck for chat minutes, talktime, call time, or a video-call offer.
            </p>
          </div>

          <div className="mt-4">
            <LuckyWheel isSpinning={isSpinning} rotation={rotation} onSpin={spin} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {luckyWheelRewards.map((reward) => (
              <div key={reward.id} className="rounded-2xl border border-white/80 bg-white/82 px-3 py-2 shadow-[0_8px_18px_rgba(15,118,110,0.08)]">
                <p className="whitespace-pre-line text-xs font-bold leading-4 text-[#173934]">{reward.label}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedReward ? (
          <div className="mt-3 rounded-[22px] border border-[#facc15]/55 bg-[#fff7ed] px-4 py-3 text-center shadow-[0_12px_26px_rgba(245,158,11,0.12)]" role="status" aria-live="polite">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f97316]">You won</p>
            <p className="mt-1 text-lg font-semibold text-[#073f39]">{selectedReward.resultLabel}!</p>
            <p className="mt-1 text-xs leading-5 text-[#7c5f45]">Frontend-only for now, ready for reward redemption wiring.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
