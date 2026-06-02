"use client";

import { useCallback, useEffect, useRef } from "react";

type ToneKind = "ringback" | "incoming";

type RingtoneOptions = {
  enabled: boolean;
  kind?: ToneKind;
  volume?: number;
};

const RINGTONE_SOURCES: Record<ToneKind, string> = {
  ringback: "/sounds/outgoing-ringback.wav",
  incoming: "/sounds/incoming-ringtone.wav",
};

export function useLoopingRingtone({ enabled, kind = "incoming", volume = 0.08 }: RingtoneOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
      audio.load();
    }
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || audioRef.current) return;

    try {
      const audio = new Audio(RINGTONE_SOURCES[kind]);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = volume;
      audioRef.current = audio;
      await audio.play();
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
