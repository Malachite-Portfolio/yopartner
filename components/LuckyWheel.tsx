"use client";

import { Gift, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getUserAuthState, subscribeUserAuthState } from "@/lib/auth/userAuth";
import { luckyWheelRewards, type LuckyWheelReward } from "@/lib/luckyWheelRewards";

const WHEEL_SIZE = 520;
const CENTER = WHEEL_SIZE / 2;
const OUTER_RADIUS = 232;
const INNER_RADIUS = 54;
const COLORS = ["#0f766e", "#7c3aed", "#f59e0b", "#14b8a6", "#0b5f5a", "#5b21b6", "#d97706", "#0d9488"];
const VISIBLE_SEGMENT_COUNT = luckyWheelRewards.length;
const TOTAL_SEGMENT_COUNT = VISIBLE_SEGMENT_COUNT * 2;
const SEGMENT_ANGLE = 180 / VISIBLE_SEGMENT_COUNT;
const POINTER_ANGLE = 90;
const SPIN_MS = 4200;
const WEEK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const GUEST_SCOPE = "guest";
const FORCE_INDEX_KEY = "yopartner_lucky_wheel_force_index";
const FORCE_INDEX_PARAM = "luckyWheelRewardIndex";
const FORCE_SCOPE_PARAM = "luckyWheelScope";

type SpinRecord = {
  lastSpinAt: number;
  rewardWon: LuckyWheelReward;
  weekIdentifier: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function polarToPoint(angle: number, radius = OUTER_RADIUS) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER - radius * Math.sin(radians),
  };
}

function segmentPath(startAngle: number, endAngle: number) {
  const outerStart = polarToPoint(startAngle);
  const outerEnd = polarToPoint(endAngle);
  const innerStart = polarToPoint(startAngle, INNER_RADIUS);
  const innerEnd = polarToPoint(endAngle, INNER_RADIUS);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function topArcPath(radius = OUTER_RADIUS) {
  const start = polarToPoint(180, radius);
  const end = polarToPoint(0, radius);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function getRewardCenterAngle(rewardIndex: number) {
  return 180 - rewardIndex * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
}

function getLandingRotation(currentRotation: number, rewardIndex: number) {
  const targetRotation = normalizeDegrees(POINTER_ANGLE - getRewardCenterAngle(rewardIndex));
  const current = normalizeDegrees(currentRotation);
  const delta = normalizeDegrees(targetRotation - current);
  return currentRotation + 360 * 6 + delta;
}

function pickRewardIndex() {
  if (process.env.NODE_ENV !== "production" && canUseStorage()) {
    const forcedFromUrl = Number(new URLSearchParams(window.location.search).get(FORCE_INDEX_PARAM));
    if (Number.isInteger(forcedFromUrl) && forcedFromUrl >= 0 && forcedFromUrl < luckyWheelRewards.length) {
      return forcedFromUrl;
    }

    const forced = Number(window.localStorage.getItem(FORCE_INDEX_KEY));
    if (Number.isInteger(forced) && forced >= 0 && forced < luckyWheelRewards.length) {
      return forced;
    }
  }

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

function getInitialStorageScope() {
  const forcedScope =
    process.env.NODE_ENV !== "production" && canUseStorage()
      ? new URLSearchParams(window.location.search).get(FORCE_SCOPE_PARAM)
      : null;
  if (forcedScope) return sanitizeStorageScope(forcedScope);

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

export function LuckyWheel() {
  const [isOpen, setIsOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultReward, setResultReward] = useState<LuckyWheelReward | null>(null);
  const [storageScope, setStorageScope] = useState(() => getInitialStorageScope());
  const [spinRecord, setSpinRecord] = useState<SpinRecord | null>(() => readSpinRecord(getStorageKey(getInitialStorageScope())));

  const storageKey = useMemo(() => getStorageKey(storageScope), [storageScope]);
  const canSpin = isEligibleToSpin(spinRecord);
  const lastWonReward = spinRecord?.rewardWon ?? null;

  const segments = useMemo(
    () =>
      Array.from({ length: TOTAL_SEGMENT_COUNT }, (_, index) => {
        const reward = luckyWheelRewards[index % luckyWheelRewards.length];
        const startAngle = 180 - index * SEGMENT_ANGLE;
        const endAngle = startAngle - SEGMENT_ANGLE;
        const labelPoint = polarToPoint(startAngle - SEGMENT_ANGLE / 2, index < VISIBLE_SEGMENT_COUNT ? 156 : 146);

        return {
          id: `${reward.id}-${index}`,
          reward,
          path: segmentPath(startAngle, endAngle),
          fill: COLORS[index],
          textX: labelPoint.x,
          textY: labelPoint.y,
        };
      }),
    [],
  );

  const lights = useMemo(
    () =>
      Array.from({ length: 17 }, (_, index) => {
        const angle = 180 - index * (180 / 16);
        return polarToPoint(angle, OUTER_RADIUS + 4);
      }),
    [],
  );

  useEffect(() => {
    return subscribeUserAuthState((state) => {
      const forcedScope =
        process.env.NODE_ENV !== "production" && canUseStorage()
          ? new URLSearchParams(window.location.search).get(FORCE_SCOPE_PARAM)
          : null;
      const nextScope = forcedScope ? sanitizeStorageScope(forcedScope) : sanitizeStorageScope(state.uid ?? state.phone ?? GUEST_SCOPE);
      setStorageScope(nextScope);
      setSpinRecord(readSpinRecord(getStorageKey(nextScope)));
    });
  }, []);

  const spin = () => {
    if (isSpinning || !canSpin) return;

    const rewardIndex = pickRewardIndex();
    const reward = luckyWheelRewards[rewardIndex];
    const nextRotation = getLandingRotation(rotation, rewardIndex);
    const nextRecord = writeSpinRecord(storageKey, reward, Date.now());

    setResultReward(null);
    setSpinRecord(nextRecord);
    setIsSpinning(true);
    setRotation(nextRotation);

    window.setTimeout(() => {
      setResultReward(reward);
      setIsSpinning(false);
    }, SPIN_MS);
  };

  const closeModal = () => {
    if (isSpinning) return;
    setIsOpen(false);
    setResultReward(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-4 z-50 inline-flex h-14 items-center gap-2 rounded-full border border-white/80 bg-[#073f39] px-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_18px_40px_rgba(7,63,57,0.28)] transition hover:-translate-y-0.5 hover:bg-[#0f766e] sm:bottom-6 sm:right-6"
        aria-label="Open lucky wheel"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#facc15] text-[#78350f]">
          <Gift size={18} />
        </span>
        Lucky Spin
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#052f2b]/50 px-3 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-[430px] overflow-hidden rounded-[24px] border border-white/80 bg-[#fffdf8] px-4 pb-5 pt-4 text-center shadow-[0_30px_80px_rgba(7,63,57,0.3)] sm:px-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSpinning}
              className="absolute right-3 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#61756f] hover:bg-[#eef8f5] disabled:cursor-wait disabled:opacity-60"
              aria-label="Close lucky wheel"
            >
              <X size={17} />
            </button>

            <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#cbe7df] bg-white/86 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#0f766e] shadow-sm">
              <Sparkles size={13} />
              Weekly YoPartner bonus
            </span>
            <h2 className="mt-3 text-[1.55rem] font-semibold leading-tight text-[#073f39]">Lucky Wheel</h2>
            <p className="mx-auto mt-1 max-w-[320px] text-xs leading-5 text-[#526b66]">Spin once every 7 days for a frontend-only reward preview.</p>

            <div className="relative mx-auto mt-4 h-[238px] w-full max-w-[372px] overflow-hidden px-3 pt-3">
              <div className="absolute left-1/2 top-1 z-40 flex -translate-x-1/2 flex-col items-center">
                <span className="h-7 w-9 bg-[#f97316] drop-shadow-[0_7px_9px_rgba(124,45,18,0.25)]" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#facc15] shadow-[0_0_18px_rgba(250,204,21,0.8)]" />
              </div>

              <div className="absolute left-1/2 top-5 h-[438px] w-[438px] -translate-x-1/2">
                <svg viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} className="h-full w-full overflow-visible" role="img" aria-label="Lucky wheel offers">
                  <defs>
                    <filter id="lucky-wheel-glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <g
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transformBox: "fill-box",
                      transformOrigin: "center",
                      transition: isSpinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.76, 0.14, 1)` : undefined,
                    }}
                  >
                    {segments.map((segment) => (
                      <g key={segment.id}>
                        <path d={segment.path} fill={segment.fill} stroke="rgba(255,255,255,0.72)" strokeWidth="3" />
                        <text x={segment.textX} y={segment.textY - 7} textAnchor="middle" className="fill-white text-[13px] font-black uppercase drop-shadow">
                          {segment.reward.label.split("\n").map((line, index) => (
                            <tspan key={line} x={segment.textX} dy={index === 0 ? 0 : 15}>
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    ))}
                  </g>
                  <path d={topArcPath(OUTER_RADIUS + 2)} fill="none" stroke="#facc15" strokeWidth="9" filter="url(#lucky-wheel-glow)" strokeLinecap="round" />
                  <path d={topArcPath(OUTER_RADIUS - 12)} fill="none" stroke="rgba(255,255,255,0.58)" strokeWidth="2" strokeLinecap="round" />
                  {lights.map((light, index) => (
                    <circle
                      key={`${light.x}-${light.y}`}
                      cx={light.x}
                      cy={light.y}
                      r={index % 2 === 0 ? 4.6 : 3.2}
                      fill={index % 2 === 0 ? "#fff7ed" : "#fde68a"}
                      stroke="#f59e0b"
                      strokeWidth="1.4"
                    />
                  ))}
                </svg>
              </div>

              <button
                type="button"
                onClick={spin}
                disabled={isSpinning || !canSpin}
                className="absolute bottom-3 left-1/2 z-40 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-white bg-[#073f39] text-[0.95rem] font-black uppercase tracking-[0.06em] text-white shadow-[0_15px_30px_rgba(7,63,57,0.34),inset_0_0_0_2px_rgba(250,204,21,0.72)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-75 sm:h-[5.5rem] sm:w-[5.5rem]"
                aria-label="Spin the lucky wheel"
              >
                {isSpinning ? "..." : "Spin"}
              </button>
            </div>

            <div className="mt-1 min-h-[74px] rounded-[16px] border border-[#e2efe9] bg-white/78 px-4 py-3 text-sm shadow-[0_10px_24px_rgba(15,118,110,0.08)]">
              {resultReward ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0f766e]">You won</p>
                  <p className="mt-1 text-lg font-semibold leading-tight text-[#073f39]">{resultReward.resultLabel}!</p>
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
      ) : null}
    </>
  );
}
