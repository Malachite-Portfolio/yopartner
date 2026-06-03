"use client";

import { Gift, TicketPercent } from "lucide-react";
import { luckyWheelRewards } from "@/lib/luckyWheelRewards";

const WHEEL_SIZE = 500;
const CENTER = WHEEL_SIZE / 2;
const OUTER_RADIUS = 226;
const INNER_RADIUS = 72;
const SEGMENT_ANGLE = 45;
const COLORS = ["#f59e0b", "#7c3aed", "#0f766e", "#a855f7", "#14b8a6", "#f97316", "#0d9488", "#6d28d9"];

type LuckyWheelProps = {
  isSpinning: boolean;
  rotation: number;
  onSpin: () => void;
};

function polarToPoint(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER - radius * Math.sin(radians),
  };
}

function segmentPath(startAngle: number, endAngle: number) {
  const outerStart = polarToPoint(startAngle, OUTER_RADIUS);
  const outerEnd = polarToPoint(endAngle, OUTER_RADIUS);
  const innerStart = polarToPoint(startAngle, INNER_RADIUS);
  const innerEnd = polarToPoint(endAngle, INNER_RADIUS);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 1 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function topArcPath(radius: number) {
  const start = polarToPoint(180, radius);
  const end = polarToPoint(0, radius);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

export function getLuckyWheelRotation(currentRotation: number, rewardIndex: number) {
  const rewardCenterAngle = rewardIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const targetRotation = ((90 - rewardCenterAngle) % 360 + 360) % 360;
  const current = ((currentRotation % 360) + 360) % 360;
  const delta = ((targetRotation - current) % 360 + 360) % 360;
  return currentRotation + 360 * 6 + delta;
}

export function LuckyWheel({ isSpinning, rotation, onSpin }: LuckyWheelProps) {
  const segments = Array.from({ length: 8 }, (_, index) => {
    const reward = luckyWheelRewards[index % luckyWheelRewards.length];
    const startAngle = index * SEGMENT_ANGLE;
    const labelPoint = polarToPoint(startAngle + SEGMENT_ANGLE / 2, 150);

    return {
      id: `${reward.id}-${index}`,
      color: COLORS[index],
      path: segmentPath(startAngle, startAngle + SEGMENT_ANGLE),
      reward,
      labelPoint,
    };
  });

  const lights = Array.from({ length: 21 }, (_, index) => polarToPoint(180 - index * 9, OUTER_RADIUS + 3));

  return (
    <div className="relative mx-auto h-[214px] w-full max-w-[350px] overflow-hidden sm:h-[260px] sm:max-w-[500px]">
      <div className="absolute left-1/2 top-1 z-30 flex -translate-x-1/2 flex-col items-center">
        <span
          className="h-7 w-9 bg-[#f97316] drop-shadow-[0_7px_10px_rgba(124,45,18,0.28)]"
          style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }}
        />
        <span className="mt-1 h-3 w-3 rounded-full bg-[#facc15] shadow-[0_0_18px_rgba(250,204,21,0.95)]" />
      </div>

      <div className="absolute left-1/2 top-2 h-[380px] w-[380px] -translate-x-1/2 sm:h-[500px] sm:w-[500px]">
        <svg viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} className="h-full w-full overflow-visible" role="img" aria-label="Spin and win lucky wheel">
          <defs>
            <filter id="lucky-wheel-premium-glow" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="lucky-wheel-center" cx="45%" cy="38%" r="64%">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#042f2e" />
            </radialGradient>
          </defs>

          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformBox: "fill-box",
              transformOrigin: "center",
              transition: isSpinning ? "transform 4300ms cubic-bezier(0.12, 0.74, 0.12, 1)" : undefined,
            }}
          >
            {segments.map((segment) => (
              <g key={segment.id}>
                <path d={segment.path} fill={segment.color} stroke="rgba(255,255,255,0.78)" strokeWidth="4" />
                <text
                  x={segment.labelPoint.x}
                  y={segment.labelPoint.y - 6}
                  textAnchor="middle"
                  className="fill-white text-[12px] font-black uppercase tracking-[0.02em] sm:text-[13px]"
                  style={{ filter: "drop-shadow(0 2px 3px rgba(15,23,42,0.28))" }}
                >
                  {segment.reward.label.split("\n").map((line, lineIndex) => (
                    <tspan key={line} x={segment.labelPoint.x} dy={lineIndex === 0 ? 0 : 16}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            ))}
          </g>

          <path d={topArcPath(OUTER_RADIUS + 3)} fill="none" stroke="#facc15" strokeWidth="12" strokeLinecap="round" filter="url(#lucky-wheel-premium-glow)" />
          <path d={topArcPath(OUTER_RADIUS - 13)} fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth="2.5" strokeLinecap="round" />
          {lights.map((light, index) => (
            <circle
              key={`${light.x}-${light.y}`}
              cx={light.x}
              cy={light.y}
              r={index % 2 === 0 ? 5.2 : 3.8}
              fill={index % 2 === 0 ? "#fff7ed" : "#fde68a"}
              stroke="#f59e0b"
              strokeWidth="1.5"
              filter="url(#lucky-wheel-premium-glow)"
            />
          ))}

          <circle cx={CENTER} cy={CENTER} r="78" fill="rgba(255,255,255,0.78)" />
          <circle cx={CENTER} cy={CENTER} r="62" fill="url(#lucky-wheel-center)" stroke="#facc15" strokeWidth="4" />
        </svg>
      </div>

      <button
        type="button"
        onClick={onSpin}
        disabled={isSpinning}
        className="absolute bottom-[8px] left-1/2 z-40 flex h-[90px] w-[90px] -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-white bg-[#073f39] text-base font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_34px_rgba(7,63,57,0.34),inset_0_0_0_2px_rgba(250,204,21,0.72)] transition hover:scale-105 disabled:cursor-wait disabled:opacity-80 sm:bottom-[15px] sm:h-[116px] sm:w-[116px] sm:border-[7px] sm:text-lg"
        aria-label="Spin the lucky wheel"
      >
        {isSpinning ? "..." : "Spin"}
      </button>

      <div className="pointer-events-none absolute bottom-2 left-2 z-30 flex items-center gap-1.5 rounded-full border border-[#facc15]/70 bg-white/90 px-2 py-1.5 text-[10px] font-bold text-[#92400e] shadow-[0_10px_22px_rgba(245,158,11,0.18)] sm:left-8 sm:px-2.5 sm:text-[11px]">
        <Gift size={13} />
        Daily draw
      </div>
      <div className="pointer-events-none absolute bottom-3 right-4 z-30 rounded-full bg-[#facc15] p-2 text-[#78350f] shadow-[0_12px_26px_rgba(245,158,11,0.25)] sm:right-7 sm:p-2.5">
        <TicketPercent size={16} />
      </div>
      <div className="pointer-events-none absolute right-4 top-12 z-30 rotate-12 rounded-xl bg-[#7c3aed] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-[0_12px_24px_rgba(124,58,237,0.26)] sm:right-7 sm:px-3 sm:text-[11px]">
        Bonus
      </div>
    </div>
  );
}
