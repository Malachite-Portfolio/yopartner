"use client";

import { useCallback, useEffect, useRef } from "react";

type ToneKind = "ringback" | "incoming";

type RingtoneOptions = {
  enabled: boolean;
  kind?: ToneKind;
  volume?: number;
};

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? window.webkitAudioContext ?? null;
}

function playTone(context: AudioContext, kind: ToneKind, volume: number) {
  const now = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  gain.connect(context.destination);

  const frequencies = kind === "incoming" ? [440, 480] : [420, 460];
  const oscillators = frequencies.map((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + 0.45);
    oscillator.onended = () => {
      oscillator.disconnect();
    };
    return oscillator;
  });

  window.setTimeout(() => {
    gain.disconnect();
    oscillators.forEach((oscillator) => oscillator.disconnect());
  }, 650);
}

export function useLoopingRingtone({ enabled, kind = "incoming", volume = 0.08 }: RingtoneOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context) {
      void context.close().catch(() => undefined);
    }
  }, []);

  const start = useCallback(async () => {
    if (intervalRef.current != null) return;
    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) return;

    try {
      const context = new AudioContextCtor();
      audioContextRef.current = context;
      if (context.state === "suspended") {
        await context.resume();
      }
      playTone(context, kind, volume);
      intervalRef.current = window.setInterval(() => {
        if (audioContextRef.current?.state === "running") {
          playTone(audioContextRef.current, kind, volume);
        }
      }, kind === "incoming" ? 1200 : 1600);
    } catch {
      stop();
    }
  }, [kind, stop, volume]);

  useEffect(() => {
    if (enabled) {
      void start();
      return stop;
    }
    stop();
    return stop;
  }, [enabled, start, stop]);

  return { start, stop };
}

declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor;
  }
}
