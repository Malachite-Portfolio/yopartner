"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT_TYPES, FILL_MODE, Parser, Player } from "svga.lite";

type GiftPlayerProps = {
  src: string;
  className?: string;
  loop?: number | boolean;
  preflight?: boolean;
  onReady?: () => void;
  onComplete?: () => void;
  onError?: (message: string) => void;
};

function normalizeLoop(loop: number | boolean) {
  if (typeof loop === "number") return loop;
  return loop ? 0 : 1;
}

export function GiftPlayer({ src, className, loop = 1, preflight = true, onReady, onComplete, onError }: GiftPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    setLoaded(false);
    const parser = new Parser();
    let player: Player | null = null;
    let unmounted = false;

    const load = async () => {
      try {
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

        const svgaBuffer = await response.arrayBuffer();
        if (unmounted) return;

        const video = await parser.do(svgaBuffer);
        if (unmounted) return;

        player = new Player(canvas, undefined, {
          loop: normalizeLoop(loop),
          fillMode: FILL_MODE.FORWARDS,
          cacheFrames: true,
          intersectionObserverRender: false,
        });

        if (normalizeLoop(loop) > 0) {
          player.$on(EVENT_TYPES.END, () => {
            onComplete?.();
          });
        }

        await player.mount(video);
        if (unmounted) return;

        setLoaded(true);
        onReady?.();
        player.start();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to play gift animation.";
        onError?.(message);
      }
    };

    void load();

    return () => {
      unmounted = true;
      parser.destroy();
      if (player) {
        player.stop();
        player.clear();
        player.destroy();
      }
    };
  }, [loop, onComplete, onError, onReady, preflight, src]);

  return <canvas ref={canvasRef} className={className} style={{ opacity: loaded ? 1 : 0, transition: "opacity 160ms ease" }} aria-hidden />;
}
