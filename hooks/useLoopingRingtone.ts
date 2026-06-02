"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const MIN_AUDIBLE_VOLUME: Record<ToneKind, number> = {
  ringback: 0.6,
  incoming: 0.9,
};

let activeAudio: HTMLAudioElement | null = null;
let activeOwner: symbol | null = null;

function cleanupAudio(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
  audio.src = "";
  audio.load();
}

export function useLoopingRingtone({ enabled, kind = "incoming", volume = 0.08 }: RingtoneOptions) {
  const ownerRef = useRef<symbol>(Symbol("looping-ringtone"));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const effectiveVolume = Math.min(1, Math.max(volume, MIN_AUDIBLE_VOLUME[kind]));

  const stop = useCallback(() => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      cleanupAudio(audio);
    }
    if (activeOwner === ownerRef.current) {
      activeAudio = null;
      activeOwner = null;
    }
    setPlayBlocked(false);
    setIsPlaying(false);
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || audioRef.current) return;

    if (activeAudio && activeOwner !== ownerRef.current) {
      cleanupAudio(activeAudio);
      activeAudio = null;
      activeOwner = null;
    }

    const audio = new Audio(RINGTONE_SOURCES[kind]);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = effectiveVolume;
    audioRef.current = audio;
    activeAudio = audio;
    activeOwner = ownerRef.current;

    try {
      await audio.play();
      setPlayBlocked(false);
      setIsPlaying(true);
    } catch {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[ringtone] ${kind} playback blocked until user interaction.`);
      }
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      if (activeAudio === audio) {
        activeAudio = null;
        activeOwner = null;
      }
      cleanupAudio(audio);
      setPlayBlocked(true);
      setIsPlaying(false);
    }
  }, [effectiveVolume, kind]);

  useEffect(() => {
    if (enabled) {
      const timer = window.setTimeout(() => {
        void start();
      }, 0);
      return () => {
        window.clearTimeout(timer);
        stop();
      };
    }
    return stop;
  }, [enabled, start, stop]);

  useEffect(() => {
    if (!enabled) return;
    const handleGesture = () => {
      void start();
    };
    window.addEventListener("pointerdown", handleGesture, { capture: true, once: true });
    window.addEventListener("keydown", handleGesture, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointerdown", handleGesture, { capture: true });
      window.removeEventListener("keydown", handleGesture, { capture: true });
    };
  }, [enabled, start]);

  useEffect(() => {
    if (!enabled || !playBlocked || typeof document === "undefined") return;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = kind === "incoming" ? "Tap to enable ringtone" : "Tap to enable sound";
    button.setAttribute("aria-label", button.textContent);
    button.style.position = "fixed";
    button.style.left = "50%";
    button.style.bottom = "calc(env(safe-area-inset-bottom, 0px) + 88px)";
    button.style.transform = "translateX(-50%)";
    button.style.zIndex = "2147483647";
    button.style.border = "1px solid rgba(15, 118, 110, 0.35)";
    button.style.borderRadius = "999px";
    button.style.background = "#0f766e";
    button.style.color = "#ffffff";
    button.style.boxShadow = "0 14px 34px rgba(15, 23, 42, 0.28)";
    button.style.font = "600 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    button.style.padding = "12px 18px";
    button.style.minHeight = "44px";
    button.onclick = () => {
      void start();
    };

    document.body.appendChild(button);
    return () => {
      button.remove();
    };
  }, [enabled, kind, playBlocked, start]);

  return { isPlaying, playBlocked, start, stop };
}
