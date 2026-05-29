"use client";

import { useEffect, useRef, useState } from "react";
import type { Player as SvgAPlayer } from "svgaplayerweb";

type GiftPlayerProps = {
  src: string;
  className?: string;
  loop?: number | boolean;
  preflight?: boolean;
  timeoutMs?: number;
  playbackTimeoutMs?: number;
  clearOnComplete?: boolean;
  onReady?: () => void;
  onComplete?: () => void;
  onError?: (message: string) => void;
};

function normalizeLoops(loop: number | boolean) {
  if (typeof loop === "number") return loop > 0 ? Math.floor(loop) : 1;
  return loop ? 1 : 1;
}

export function GiftPlayer({
  src,
  className,
  loop = 1,
  preflight = true,
  timeoutMs = 9000,
  playbackTimeoutMs,
  clearOnComplete = false,
  onReady,
  onComplete,
  onError,
}: GiftPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasCompletedRef = useRef(false);
  const hasFailedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !src) return;

    setLoaded(false);
    hasCompletedRef.current = false;
    hasFailedRef.current = false;
    let player: SvgAPlayer | null = null;
    let unmounted = false;
    let loadTimeout: number | null = null;
    let playbackTimeout: number | null = null;

    const clearTimers = () => {
      if (loadTimeout) {
        window.clearTimeout(loadTimeout);
        loadTimeout = null;
      }
      if (playbackTimeout) {
        window.clearTimeout(playbackTimeout);
        playbackTimeout = null;
      }
    };

    const completeOnce = () => {
      if (unmounted || hasCompletedRef.current || hasFailedRef.current) return;
      hasCompletedRef.current = true;
      clearTimers();
      if (player) {
        player.stopAnimation(false);
        if (clearOnComplete) {
          player.clear();
        }
      }
      onComplete?.();
    };

    const failOnce = (message: string) => {
      if (unmounted || hasFailedRef.current || hasCompletedRef.current) return;
      hasFailedRef.current = true;
      clearTimers();
      if (player) {
        player.stopAnimation(false);
      }
      onError?.(message);
    };

    const load = async () => {
      try {
        const svgaLib = await import("svgaplayerweb");
        if (unmounted) return;

        if (preflight) {
          const headResponse = await fetch(src, { method: "HEAD", cache: "no-store" });
          if (!headResponse.ok) {
            throw new Error(`SVGA file unavailable (${headResponse.status}).`);
          }
        }

        const response = await fetch(src, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Failed to fetch SVGA (${response.status}).`);
        }

        if (loadTimeout) window.clearTimeout(loadTimeout);
        loadTimeout = window.setTimeout(() => {
          failOnce(`SVGA load timed out after ${timeoutMs}ms.`);
        }, timeoutMs);

        const loops = normalizeLoops(loop);
        const parser = new svgaLib.Parser();
        player = new svgaLib.Player(container);
        // svgaplayerweb expects `loops` where 0 means Infinity; use 1 for single-play.
        player.loops = loops;
        player.clearsAfterStop = false;
        player.fillMode = "Forward";

        parser.load(
          src,
          (videoItem) => {
            if (unmounted || !player) return;
            try {
              const frameCount = Number(videoItem.frames) || 0;
              const fps = Number(videoItem.FPS) || 0;
              const intrinsicDurationMs = frameCount > 0 && fps > 0 ? (frameCount / fps) * 1000 * loops : 0;
              const authorityMs = playbackTimeoutMs
                ?? Math.max(1500, Math.min(Math.ceil(intrinsicDurationMs + 500), 8000));

              player.onFinished(() => {
                completeOnce();
              });
              player.setVideoItem(videoItem);
              player.startAnimation();

              clearTimers();
              playbackTimeout = window.setTimeout(() => {
                if (process.env.NODE_ENV !== "production") {
                  console.warn("[GiftPlayer] Playback timeout reached, forcing completion.", {
                    src,
                    frameCount,
                    fps,
                    loops,
                    authorityMs,
                  });
                }
                completeOnce();
              }, authorityMs);

              if (!hasFailedRef.current && !hasCompletedRef.current) {
                setLoaded(true);
                onReady?.();
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : "SVGA player failed to start animation.";
              failOnce(message);
            }
          },
          (error) => {
            const message = error instanceof Error ? error.message : "SVGA parser failed to load animation.";
            failOnce(message);
          },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to play gift animation.";
        failOnce(message);
      }
    };

    void load();

    return () => {
      unmounted = true;
      clearTimers();
      if (player) {
        player.stopAnimation();
        player.clear();
      }
      container.innerHTML = "";
    };
  }, [clearOnComplete, loop, onComplete, onError, onReady, playbackTimeoutMs, preflight, src, timeoutMs]);

  return <div ref={containerRef} className={className} style={{ opacity: loaded ? 1 : 0, transition: "opacity 160ms ease" }} aria-hidden />;
}
