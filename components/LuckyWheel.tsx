"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { luckyWheelRewards } from "@/lib/luckyWheelRewards";

const WHEEL_SIZE = 520;
const CENTER = WHEEL_SIZE / 2;
const OUTER_RADIUS = 226;
const INNER_RADIUS = 48;
const COLORS = ["#0f766e", "#7c3aed", "#f59e0b", "#14b8a6", "#0b5f5a", "#5b21b6", "#d97706", "#0d9488"];
const TOTAL_SEGMENT_COUNT = luckyWheelRewards.length * 2;
const SEGMENT_ANGLE = 360 / TOTAL_SEGMENT_COUNT;
const POINTER_ANGLE = 90;
export const LUCKY_WHEEL_SPIN_MS = 4200;

type LuckyWheelProps = {
  disabled?: boolean;
  isSpinning: boolean;
  onSpin: () => void;
  rotation: number;
};

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

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function getRewardCenterAngle(rewardIndex: number) {
  return 180 - rewardIndex * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
}

export function getLuckyWheelRotation(currentRotation: number, rewardIndex: number) {
  const targetRotation = normalizeDegrees(POINTER_ANGLE - getRewardCenterAngle(rewardIndex));
  const current = normalizeDegrees(currentRotation);
  const delta = normalizeDegrees(targetRotation - current);
  return currentRotation + 360 * 6 + delta;
}

export function LuckyWheel({ disabled = false, isSpinning, onSpin, rotation }: LuckyWheelProps) {
  const [displayRotation, setDisplayRotation] = useState(rotation);
  const animationFrameRef = useRef<number | null>(null);
  const displayRotationRef = useRef(rotation);

  const segments = useMemo(
    () =>
      Array.from({ length: TOTAL_SEGMENT_COUNT }, (_, index) => {
        const reward = luckyWheelRewards[index % luckyWheelRewards.length];
        const startAngle = 180 - index * SEGMENT_ANGLE + displayRotation;
        const endAngle = startAngle - SEGMENT_ANGLE;
        const centerAngle = startAngle - SEGMENT_ANGLE / 2;
        const labelPoint = polarToPoint(centerAngle, 152);

        return {
          fill: COLORS[index],
          id: `${reward.id}-${index}`,
          path: segmentPath(startAngle, endAngle),
          reward,
          textX: labelPoint.x,
          textY: labelPoint.y,
        };
      }),
    [displayRotation],
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
    displayRotationRef.current = displayRotation;
  }, [displayRotation]);

  useEffect(() => {
    const startRotation = displayRotationRef.current;
    const targetRotation = rotation;
    const startedAt = performance.now();

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    if (!isSpinning) return undefined;

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / LUCKY_WHEEL_SPIN_MS, 1);
      const nextRotation = startRotation + (targetRotation - startRotation) * easeOutCubic(progress);
      displayRotationRef.current = progress === 1 ? targetRotation : nextRotation;
      setDisplayRotation(progress === 1 ? targetRotation : nextRotation);

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      animationFrameRef.current = null;
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isSpinning, rotation]);

  return (
    <div className="relative mx-auto h-[252px] w-full max-w-[380px] overflow-hidden px-3 pt-3">
      <div className="absolute left-1/2 top-0 z-40 flex -translate-x-1/2 flex-col items-center">
        <span className="h-7 w-9 bg-[#f97316] drop-shadow-[0_7px_9px_rgba(124,45,18,0.25)]" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#facc15] shadow-[0_0_18px_rgba(250,204,21,0.8)]" />
      </div>

      <div className="absolute left-1/2 top-5 h-[198px] w-[372px] -translate-x-1/2 overflow-hidden sm:h-[216px] sm:w-[408px]">
        <svg viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} className="h-[372px] w-[372px] overflow-visible sm:h-[408px] sm:w-[408px]" role="img" aria-label="Lucky wheel offers">
          <defs>
            <filter id="lucky-wheel-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g data-wheel-rotation={displayRotation}>
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
        onClick={onSpin}
        disabled={isSpinning || disabled}
        className="absolute bottom-7 left-1/2 z-40 flex h-[4.5rem] w-[4.5rem] -translate-x-1/2 items-center justify-center rounded-full border-[5px] border-white bg-[#073f39] text-[0.82rem] font-black uppercase tracking-[0.06em] text-white shadow-[0_15px_30px_rgba(7,63,57,0.34),inset_0_0_0_2px_rgba(250,204,21,0.72)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-75 sm:h-20 sm:w-20"
        aria-label="Spin the lucky wheel"
      >
        {isSpinning ? "..." : "Spin"}
      </button>
    </div>
  );
}
