export type GiftSoundType =
  | "rose"
  | "coffee"
  | "star"
  | "heart"
  | "crown"
  | "diamond"
  | "diamond_rain"
  | "luxury_watch"
  | "marry";

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

type ToneSpec = {
  frequency: number;
  start: number;
  duration: number;
  gain: number;
  type: OscillatorType;
  detune?: number;
  slideTo?: number;
};

function scheduleTone(context: AudioContext, master: GainNode, now: number, spec: ToneSpec) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = now + spec.start;
  const endAt = startAt + spec.duration;

  oscillator.type = spec.type;
  oscillator.frequency.setValueAtTime(spec.frequency, startAt);
  if (typeof spec.slideTo === "number") {
    oscillator.frequency.exponentialRampToValueAtTime(spec.slideTo, endAt);
  }
  if (typeof spec.detune === "number") {
    oscillator.detune.setValueAtTime(spec.detune, startAt);
  }

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(spec.gain, startAt + Math.min(0.05, spec.duration * 0.35));
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

  oscillator.connect(gain);
  gain.connect(master);
  oscillator.start(startAt);
  oscillator.stop(endAt + 0.02);
}

function schedulePop(context: AudioContext, master: GainNode, now: number, start: number, strength = 0.2) {
  scheduleTone(context, master, now, {
    frequency: 210,
    slideTo: 95,
    start,
    duration: 0.11,
    gain: strength,
    type: "triangle",
  });
}

export async function playGiftSound(sound: GiftSoundType, volume = 0.09) {
  const context = getAudioContext();
  if (!context) return;

  try {
    if (context.state === "suspended") {
      await context.resume();
    }

    const now = context.currentTime + 0.01;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(Math.max(0.02, volume), now + 0.03);

    let totalDuration = 1.0;
    switch (sound) {
      case "rose":
        scheduleTone(context, master, now, { frequency: 659.25, start: 0, duration: 0.24, gain: 0.14, type: "sine" });
        scheduleTone(context, master, now, { frequency: 880, start: 0.12, duration: 0.3, gain: 0.12, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 1174.66, start: 0.28, duration: 0.34, gain: 0.09, type: "sine" });
        totalDuration = 0.92;
        break;
      case "coffee":
        scheduleTone(context, master, now, { frequency: 293.66, start: 0, duration: 0.22, gain: 0.15, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 392, start: 0.1, duration: 0.26, gain: 0.12, type: "sine" });
        scheduleTone(context, master, now, { frequency: 523.25, start: 0.22, duration: 0.3, gain: 0.1, type: "triangle" });
        totalDuration = 0.94;
        break;
      case "star":
        scheduleTone(context, master, now, { frequency: 783.99, start: 0, duration: 0.18, gain: 0.14, type: "square" });
        scheduleTone(context, master, now, { frequency: 987.77, start: 0.08, duration: 0.2, gain: 0.12, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 1318.51, start: 0.16, duration: 0.24, gain: 0.11, type: "sine" });
        scheduleTone(context, master, now, { frequency: 1567.98, start: 0.26, duration: 0.28, gain: 0.1, type: "triangle" });
        totalDuration = 1.04;
        break;
      case "heart":
        schedulePop(context, master, now, 0, 0.22);
        scheduleTone(context, master, now, { frequency: 698.46, start: 0.08, duration: 0.2, gain: 0.14, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 932.33, start: 0.2, duration: 0.26, gain: 0.12, type: "sine" });
        scheduleTone(context, master, now, { frequency: 1174.66, start: 0.34, duration: 0.34, gain: 0.1, type: "triangle" });
        totalDuration = 1.08;
        break;
      case "crown":
        scheduleTone(context, master, now, { frequency: 329.63, start: 0, duration: 0.24, gain: 0.15, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 440, start: 0.1, duration: 0.24, gain: 0.14, type: "sine" });
        scheduleTone(context, master, now, { frequency: 587.33, start: 0.2, duration: 0.28, gain: 0.13, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 783.99, start: 0.31, duration: 0.34, gain: 0.12, type: "sine" });
        scheduleTone(context, master, now, { frequency: 1046.5, start: 0.44, duration: 0.38, gain: 0.1, type: "triangle", detune: 6 });
        totalDuration = 1.26;
        break;
      case "diamond":
        scheduleTone(context, master, now, { frequency: 523.25, start: 0, duration: 0.2, gain: 0.13, type: "sine" });
        scheduleTone(context, master, now, { frequency: 783.99, start: 0.08, duration: 0.22, gain: 0.12, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 1046.5, start: 0.16, duration: 0.26, gain: 0.11, type: "sine" });
        scheduleTone(context, master, now, { frequency: 1318.51, start: 0.26, duration: 0.3, gain: 0.1, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 1661.22, start: 0.36, duration: 0.34, gain: 0.09, type: "sine" });
        scheduleTone(context, master, now, { frequency: 2093, start: 0.48, duration: 0.36, gain: 0.08, type: "triangle" });
        totalDuration = 1.36;
        break;
      case "diamond_rain":
        scheduleTone(context, master, now, { frequency: 659.25, start: 0, duration: 0.22, gain: 0.13, type: "sine" });
        scheduleTone(context, master, now, { frequency: 1046.5, start: 0.12, duration: 0.24, gain: 0.12, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 1567.98, start: 0.24, duration: 0.28, gain: 0.11, type: "sine" });
        scheduleTone(context, master, now, { frequency: 2637.02, start: 0.38, duration: 0.34, gain: 0.09, type: "triangle" });
        totalDuration = 1.28;
        break;
      case "luxury_watch":
        scheduleTone(context, master, now, { frequency: 196, start: 0, duration: 0.16, gain: 0.15, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 246.94, start: 0.1, duration: 0.2, gain: 0.13, type: "square" });
        scheduleTone(context, master, now, { frequency: 293.66, start: 0.22, duration: 0.24, gain: 0.12, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 392, start: 0.34, duration: 0.28, gain: 0.1, type: "sine" });
        scheduleTone(context, master, now, { frequency: 523.25, start: 0.46, duration: 0.36, gain: 0.09, type: "triangle" });
        totalDuration = 1.3;
        break;
      case "marry":
        schedulePop(context, master, now, 0.02, 0.24);
        scheduleTone(context, master, now, { frequency: 392, start: 0.06, duration: 0.2, gain: 0.14, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 523.25, start: 0.16, duration: 0.24, gain: 0.13, type: "sine" });
        scheduleTone(context, master, now, { frequency: 783.99, start: 0.28, duration: 0.3, gain: 0.12, type: "triangle" });
        scheduleTone(context, master, now, { frequency: 1174.66, start: 0.42, duration: 0.4, gain: 0.1, type: "sine" });
        totalDuration = 1.42;
        break;
      default:
        totalDuration = 1.0;
    }

    master.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

    window.setTimeout(() => {
      master.disconnect();
    }, Math.ceil(totalDuration * 1000 + 220));
  } catch {
    // Ignore playback errors in restricted autoplay contexts.
  }
}
