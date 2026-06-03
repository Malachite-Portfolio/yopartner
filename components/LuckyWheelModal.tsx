"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getUserAuthState, subscribeUserAuthState } from "@/lib/auth/userAuth";
import { LuckyWheel, LUCKY_WHEEL_SPIN_MS, getLuckyWheelRotation } from "@/components/LuckyWheel";
import { luckyWheelRewards, type LuckyWheelReward } from "@/lib/luckyWheelRewards";

const WEEK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const GUEST_SCOPE = "guest";
const FORCE_INDEX_PARAM = "luckyWheelRewardIndex";
const FORCE_SCOPE_PARAM = "luckyWheelScope";

type LuckyWheelModalProps = {
  onClose: () => void;
};

type SpinRecord = {
  lastSpinAt: number;
  rewardWon: LuckyWheelReward;
  weekIdentifier: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getForcedRewardIndex() {
  if (typeof window === "undefined") return null;

  const forcedIndex = Number(new URLSearchParams(window.location.search).get(FORCE_INDEX_PARAM));
  if (Number.isInteger(forcedIndex) && forcedIndex >= 0 && forcedIndex < luckyWheelRewards.length) {
    return forcedIndex;
  }

  return null;
}

function pickRewardIndex() {
  const forcedIndex = getForcedRewardIndex();
  if (forcedIndex !== null) return forcedIndex;
  return Math.floor(Math.random() * luckyWheelRewards.length);
}

function getWeekIdentifier(timestamp: number) {
  const date = new Date(timestamp);
  const day = date.getUTCDay() || 7;
  const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);
  return weekStart.toISOString().slice(0, 10);
}

function sanitizeStorageScope(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return GUEST_SCOPE;
  return normalized.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getStorageKey(scope: string) {
  return `yopartner_lucky_wheel_spin_${scope}`;
}

function getForcedStorageScope() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const forcedScope = params.get(FORCE_SCOPE_PARAM);
  if (forcedScope) return sanitizeStorageScope(forcedScope);

  const forcedIndex = getForcedRewardIndex();
  return forcedIndex === null ? null : `forced_${forcedIndex}`;
}

function getInitialStorageScope() {
  const forcedScope = getForcedStorageScope();
  if (forcedScope) return forcedScope;

  const authState = getUserAuthState();
  return sanitizeStorageScope(authState.uid ?? authState.phone ?? GUEST_SCOPE);
}

function getRewardById(id: string | undefined) {
  return luckyWheelRewards.find((reward) => reward.id === id) ?? null;
}

function readSpinRecord(storageKey: string): SpinRecord | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SpinRecord> & { rewardWon?: Partial<LuckyWheelReward> };
    const reward = getRewardById(parsed.rewardWon?.id);
    if (!reward || typeof parsed.lastSpinAt !== "number" || !Number.isFinite(parsed.lastSpinAt)) return null;

    return {
      lastSpinAt: parsed.lastSpinAt,
      rewardWon: reward,
      weekIdentifier: typeof parsed.weekIdentifier === "string" ? parsed.weekIdentifier : getWeekIdentifier(parsed.lastSpinAt),
    };
  } catch {
    return null;
  }
}

function writeSpinRecord(storageKey: string, reward: LuckyWheelReward, timestamp: number) {
  if (!canUseStorage()) return null;

  const record: SpinRecord = {
    lastSpinAt: timestamp,
    rewardWon: reward,
    weekIdentifier: getWeekIdentifier(timestamp),
  };
  window.localStorage.setItem(storageKey, JSON.stringify(record));
  return record;
}

function isEligibleToSpin(record: SpinRecord | null, now = Date.now()) {
  return !record || now - record.lastSpinAt >= WEEK_COOLDOWN_MS;
}

export function LuckyWheelModal({ onClose }: LuckyWheelModalProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedReward, setSelectedReward] = useState<LuckyWheelReward | null>(null);
  const [storageScope, setStorageScope] = useState(() => getInitialStorageScope());
  const [spinRecord, setSpinRecord] = useState<SpinRecord | null>(() => readSpinRecord(getStorageKey(getInitialStorageScope())));

  const storageKey = useMemo(() => getStorageKey(storageScope), [storageScope]);
  const canSpin = isEligibleToSpin(spinRecord);
  const lastWonReward = spinRecord?.rewardWon ?? null;

  useEffect(() => {
    return subscribeUserAuthState((state) => {
      const forcedScope = getForcedStorageScope();
      const nextScope = forcedScope ? sanitizeStorageScope(forcedScope) : sanitizeStorageScope(state.uid ?? state.phone ?? GUEST_SCOPE);
      setStorageScope(nextScope);
      setSpinRecord(readSpinRecord(getStorageKey(nextScope)));
    });
  }, []);

  const spin = () => {
    if (isSpinning || !canSpin) return;

    const rewardIndex = pickRewardIndex();
    const reward = luckyWheelRewards[rewardIndex];
    const nextRecord = writeSpinRecord(storageKey, reward, Date.now());

    setSelectedReward(null);
    setSpinRecord(nextRecord);
    setIsSpinning(true);
    setRotation((current) => getLuckyWheelRotation(current, rewardIndex));

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
              Weekly YoPartner bonus
            </span>
            <h2 id="lucky-wheel-title" className="mt-3 text-2xl font-semibold leading-tight text-[#073f39] sm:text-3xl">
              Lucky Wheel
            </h2>
            <p className="mx-auto mt-2 max-w-[330px] text-xs leading-5 text-[#526b66]">
              Spin once every 7 days for a frontend-only reward preview.
            </p>
          </div>

          <div className="mt-4">
            <LuckyWheel disabled={!canSpin} isSpinning={isSpinning} rotation={rotation} onSpin={spin} />
          </div>
        </div>

        <div className="mt-3 min-h-[74px] rounded-[18px] border border-[#e2efe9] bg-white/82 px-4 py-3 text-center text-sm shadow-[0_10px_24px_rgba(15,118,110,0.08)]" role="status" aria-live="polite">
          {selectedReward ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0f766e]">You won</p>
              <p className="mt-1 text-lg font-semibold leading-tight text-[#073f39]">{selectedReward.resultLabel}!</p>
            </>
          ) : canSpin ? (
            <p className="mx-auto max-w-[285px] pt-2 text-xs leading-5 text-[#5d716c]">Tap spin to reveal this week&apos;s reward.</p>
          ) : (
            <>
              <p className="text-xs font-semibold leading-5 text-[#92400e]">You have already used your weekly spin. Please try again next week.</p>
              {lastWonReward ? <p className="mt-1 text-sm font-semibold text-[#073f39]">Last won: {lastWonReward.resultLabel}</p> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
