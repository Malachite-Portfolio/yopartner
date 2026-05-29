"use client";

import { useEffect, useRef, useState } from "react";
import type { Player as SvgAPlayer } from "svgaplayerweb";

type GiftPlayerProps = {
  src: string;
  className?: string;
  loop?: number | boolean;
  preflight?: boolean;
  timeoutMs?: number;
  onReady?: () => void;
  onComplete?: () => void;
  onError?: (message: string) => void;
};

function normalizeLoops(loop: number | boolean) {
  if (typeof loop === "number") return Math.max(0, loop);
  return loop ? 1 : 1;
}

export function GiftPlayer({
  src,
  className,
  loop = 1,
  preflight = true,
  timeoutMs = 9000,
  onReady,
  onComplete,
  onError,
}: GiftPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !src) return;

    setLoaded(false);
    let player: SvgAPlayer | null = null;
    let unmounted = false;
    let loadTimeout: number | null = null;
    let finished = false;

    const fail = (message: string) => {
      if (finished || unmounted) return;
      finished = true;
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
          fail(`SVGA load timed out after ${timeoutMs}ms.`);
        }, timeoutMs);

        const loops = normalizeLoops(loop);
        const parser = new svgaLib.Parser();
        player = new svgaLib.Player(container);
        player.loops = loops;
        player.clearsAfterStop = false;
        player.fillMode = "Forward";
        player.onFinished(() => {
          if (loops > 0) {
            onComplete?.();
          }
        });

        parser.load(
          src,
          (videoItem) => {
            if (unmounted || !player) return;
            try {
              player.setVideoItem(videoItem);
              player.startAnimation();
              if (loadTimeout) {
                window.clearTimeout(loadTimeout);
                loadTimeout = null;
              }
              if (!finished) {
                setLoaded(true);
                onReady?.();
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : "SVGA player failed to start animation.";
              fail(message);
            }
          },
          (error) => {
            const message = error instanceof Error ? error.message : "SVGA parser failed to load animation.";
            fail(message);
          },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to play gift animation.";
        fail(message);
      }
    };

    void load();

    return () => {
      unmounted = true;
      if (loadTimeout) {
        window.clearTimeout(loadTimeout);
      }
      if (player) {
        player.clear();
        player.stopAnimation();
      }
      container.innerHTML = "";
    };
  }, [loop, onComplete, onError, onReady, preflight, src, timeoutMs]);

  return <div ref={containerRef} className={className} style={{ opacity: loaded ? 1 : 0, transition: "opacity 160ms ease" }} aria-hidden />;
}
