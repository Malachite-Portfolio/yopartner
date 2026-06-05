"use client";

import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getUserAuthState, subscribeUserAuthState, type UserAuthState } from "@/lib/auth/userAuth";
import { LuckyWheel, LUCKY_WHEEL_SPIN_MS, getLuckyWheelRotation } from "@/components/LuckyWheel";
import {
  getLuckyWheelStatus,
  spinLuckyWheel,
  type LuckyWheelApiReward,
  type LuckyWheelStatusPayload,
} from "@/lib/api/luckyWheel";
import { luckyWheelRewards, type LuckyWheelReward } from "@/lib/luckyWheelRewards";

type LuckyWheelModalProps = {
  onClose: () => void;
};

const emptyStatus: LuckyWheelStatusPayload = {
  canSpin: false,
  nextSpinAt: null,
  lastReward: null,
  activeRewards: [],
};

function rewardFromApi(reward: LuckyWheelApiReward | null | undefined): LuckyWheelReward | null {
  if (!reward) return null;
  const local = luckyWheelRewards[reward.rewardIndex] ?? luckyWheelRewards.find((item) => item.type === reward.clientType);
  if (!local) return null;
  return {
    ...local,
    resultLabel: reward.resultLabel || reward.label || local.resultLabel,
    value: reward.value,
  };
}

function rewardIndexFromApi(reward: LuckyWheelApiReward) {
  if (Number.isInteger(reward.rewardIndex) && reward.rewardIndex >= 0 && reward.rewardIndex < luckyWheelRewards.length) {
    return reward.rewardIndex;
  }
  return Math.max(0, luckyWheelRewards.findIndex((item) => item.type === reward.clientType));
}

function formatCooldown(value: string | null) {
  if (!value) return "Please try again later.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Please try again later.";
  return `Next spin available ${date.toLocaleString("en-IN")}.`;
}

export function LuckyWheelModal({ onClose }: LuckyWheelModalProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<UserAuthState>(() => getUserAuthState());
  const [status, setStatus] = useState<LuckyWheelStatusPayload>(emptyStatus);
  const [selectedReward, setSelectedReward] = useState<LuckyWheelReward | null>(null);
  const [message, setMessage] = useState("");

  const loggedIn = authState.loggedIn;
  const lastWonReward = rewardFromApi(status.lastReward);
  const canSpin = loggedIn && status.canSpin && !isLoading;

  const loadStatus = useCallback(async () => {
    if (!getUserAuthState().loggedIn) {
      setStatus(emptyStatus);
      setMessage("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const response = await getLuckyWheelStatus();
    if (response.error) {
      setStatus(emptyStatus);
      setMessage(response.error.status === 401 ? "Please login to spin and claim rewards." : response.error.message);
      setIsLoading(false);
      return;
    }

    setStatus(response.data ?? emptyStatus);
    setMessage("");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  useEffect(() => {
    return subscribeUserAuthState((nextState) => {
      setAuthState(nextState);
      setSelectedReward(null);
      if (!nextState.loggedIn) {
        setStatus(emptyStatus);
        setMessage("");
        setIsLoading(false);
        return;
      }
      void loadStatus();
    });
  }, [loadStatus]);

  const spin = async () => {
    if (isSpinning || isLoading) return;
    if (!loggedIn) {
      setMessage("Please login to spin and claim rewards.");
      return;
    }
    if (!status.canSpin) {
      setMessage(formatCooldown(status.nextSpinAt));
      return;
    }

    setMessage("");
    setSelectedReward(null);

    const response = await spinLuckyWheel();
    if (response.error || !response.data) {
      setMessage(response.error?.message || "Unable to spin right now. Please try again.");
      return;
    }
    const spinData = response.data;

    if (!spinData.spun) {
      setStatus({
        canSpin: spinData.canSpin,
        nextSpinAt: spinData.nextSpinAt,
        lastReward: spinData.reward,
        activeRewards: spinData.activeRewards,
      });
      setMessage(formatCooldown(spinData.nextSpinAt));
      return;
    }

    const reward = rewardFromApi(spinData.reward);
    if (!reward) {
      setMessage("Reward could not be loaded. Please reopen the wheel.");
      await loadStatus();
      return;
    }

    setStatus({
      canSpin: spinData.canSpin,
      nextSpinAt: spinData.nextSpinAt,
      lastReward: spinData.reward,
      activeRewards: spinData.activeRewards,
    });
    setIsSpinning(true);
    setRotation((current) => getLuckyWheelRotation(current, rewardIndexFromApi(spinData.reward)));

    window.setTimeout(() => {
      setSelectedReward(reward);
      setIsSpinning(false);
    }, LUCKY_WHEEL_SPIN_MS);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#052f2b]/46 px-3 py-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="lucky-wheel-title">
      <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[430px] overflow-y-auto rounded-[26px] border border-white/70 bg-[#fffdf8] p-4 shadow-[0_30px_90px_rgba(7,63,57,0.32)] sm:p-5">
        <button
          type="button"
          onClick={onClose}
          disabled={isSpinning}
          className="absolute right-3 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#526b66] shadow-sm transition hover:bg-[#eef8f5] disabled:cursor-wait disabled:opacity-60"
          aria-label="Close lucky wheel"
        >
          <X size={17} />
        </button>

        <div className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_18%_15%,rgba(20,184,166,0.16),transparent_28%),radial-gradient(circle_at_86%_22%,rgba(124,58,237,0.2),transparent_34%),linear-gradient(135deg,#fffdf8_0%,#f5fbf8_58%,#fff7ed_100%)] px-3 pb-4 pt-5 sm:px-5">
          <div className="pr-11 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d2e9e3] bg-white/82 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0f766e] shadow-sm">
              <Sparkles size={13} />
              Daily YoPartner bonus
            </span>
            <h2 id="lucky-wheel-title" className="mt-3 text-2xl font-semibold leading-tight text-[#073f39] sm:text-3xl">
              Lucky Wheel
            </h2>
            <p className="mx-auto mt-2 max-w-[330px] text-xs leading-5 text-[#526b66]">
              Spin once every 24 hours. Rewards are saved to your account.
            </p>
          </div>

          <div className="mt-4">
            <LuckyWheel disabled={!canSpin} isSpinning={isSpinning} rotation={rotation} onSpin={spin} />
          </div>
        </div>

        <div className="mt-3 min-h-[74px] rounded-[18px] border border-[#e2efe9] bg-white/82 px-4 py-3 text-center text-sm shadow-[0_10px_24px_rgba(15,118,110,0.08)]" role="status" aria-live="polite">
          {!loggedIn ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold leading-5 text-[#92400e]">Please login to spin and claim rewards.</p>
              <Link href="/login?returnUrl=/" className="inline-flex rounded-full bg-[#0f766e] px-4 py-2 text-xs font-bold text-white">
                Login
              </Link>
            </div>
          ) : selectedReward ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0f766e]">You won</p>
              <p className="mt-1 text-lg font-semibold leading-tight text-[#073f39]">{selectedReward.resultLabel}!</p>
            </>
          ) : isLoading ? (
            <p className="mx-auto max-w-[285px] pt-2 text-xs leading-5 text-[#5d716c]">Checking your spin eligibility...</p>
          ) : status.canSpin ? (
            <p className="mx-auto max-w-[285px] pt-2 text-xs leading-5 text-[#5d716c]">Tap spin to reveal today&apos;s reward.</p>
          ) : (
            <>
              <p className="text-xs font-semibold leading-5 text-[#92400e]">{message || formatCooldown(status.nextSpinAt)}</p>
              {lastWonReward ? <p className="mt-1 text-sm font-semibold text-[#073f39]">Last won: {lastWonReward.resultLabel}</p> : null}
            </>
          )}
        </div>

        {loggedIn && status.activeRewards.length > 0 ? (
          <div className="mt-3 rounded-[18px] border border-[#e2efe9] bg-white/82 px-4 py-3 text-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0f766e]">Active rewards</p>
            <div className="mt-2 space-y-1.5">
              {status.activeRewards.map((reward) => (
                <p key={reward.id} className="flex items-center justify-between gap-3 text-xs text-[#526b66]">
                  <span className="font-semibold text-[#073f39]">{reward.resultLabel}</span>
                  <span>{reward.remainingValue} left</span>
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
