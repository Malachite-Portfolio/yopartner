import type { GiftKey } from "@/lib/api/sessions";

export type GiftEffectConfig = {
  key: GiftKey;
  accentFrom: string;
  accentTo: string;
  particles: string[];
  tones: number[];
};

export const GIFT_EFFECTS: Record<GiftKey, GiftEffectConfig> = {
  rose: {
    key: "rose",
    accentFrom: "#fb7185",
    accentTo: "#e11d48",
    particles: ["🌹", "💗", "✨"],
    tones: [659.25, 783.99, 987.77],
  },
  coffee: {
    key: "coffee",
    accentFrom: "#c08457",
    accentTo: "#7c2d12",
    particles: ["☕", "✨", "🤎"],
    tones: [369.99, 493.88, 739.99],
  },
  star: {
    key: "star",
    accentFrom: "#facc15",
    accentTo: "#ca8a04",
    particles: ["⭐", "✨", "🌟"],
    tones: [523.25, 783.99, 1046.5],
  },
  heart: {
    key: "heart",
    accentFrom: "#ec4899",
    accentTo: "#be185d",
    particles: ["💖", "💗", "✨"],
    tones: [587.33, 783.99, 1174.66],
  },
  crown: {
    key: "crown",
    accentFrom: "#f59e0b",
    accentTo: "#b45309",
    particles: ["👑", "✨", "🌟"],
    tones: [440, 659.25, 987.77, 1318.51],
  },
  diamond: {
    key: "diamond",
    accentFrom: "#38bdf8",
    accentTo: "#0e7490",
    particles: ["💎", "✨", "🩵"],
    tones: [493.88, 739.99, 987.77, 1479.98],
  },
};

export type GiftBurstParticle = {
  id: string;
  emoji: string;
  tx: number;
  ty: number;
  rotate: number;
  delayMs: number;
  durationMs: number;
  scale: number;
};

export function getGiftEffectConfig(giftKey: GiftKey): GiftEffectConfig {
  return GIFT_EFFECTS[giftKey];
}

export function buildGiftBurstParticles(giftKey: GiftKey): GiftBurstParticle[] {
  const config = getGiftEffectConfig(giftKey);
  const angles = [-88, -63, -38, -14, 12, 36, 58, 82];
  const radius = [170, 190, 210, 230, 230, 210, 190, 170];

  return angles.map((angle, index) => {
    const radians = (angle * Math.PI) / 180;
    const distance = radius[index] ?? 190;
    const emoji = config.particles[index % config.particles.length];
    return {
      id: `${giftKey}-particle-${index}`,
      emoji,
      tx: Math.round(Math.cos(radians) * distance),
      ty: Math.round(Math.sin(radians) * distance),
      rotate: index % 2 === 0 ? -24 : 24,
      delayMs: index * 30,
      durationMs: 950 + index * 45,
      scale: index % 3 === 0 ? 1.2 : 1,
    };
  });
}

let cachedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!cachedAudioContext) {
    cachedAudioContext = new AudioContextClass();
  }
  return cachedAudioContext;
}

export async function playGiftSound(giftKey: GiftKey, volume = 0.08) {
  const context = getAudioContext();
  if (!context) return;

  try {
    if (context.state === "suspended") {
      await context.resume();
    }

    const config = getGiftEffectConfig(giftKey);
    const now = context.currentTime + 0.01;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(volume, now + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    config.tones.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index % 2 === 0 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(index * 5, now);

      const startAt = now + index * 0.04;
      const endAt = startAt + 0.32;

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.24, startAt + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
    });

    window.setTimeout(() => {
      master.disconnect();
    }, 1300);
  } catch {
    // Ignore playback errors in restricted autoplay contexts.
  }
}
