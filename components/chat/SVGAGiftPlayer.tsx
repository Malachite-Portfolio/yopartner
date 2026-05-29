"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT_TYPES, FILL_MODE, Parser, Player } from "svga.lite";

type SVGAGiftPlayerProps = {
  src: string;
  className?: string;
  loop?: number | boolean;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

export function SVGAGiftPlayer({ src, className, loop = 1, onEnd, onError }: SVGAGiftPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    setHasLoaded(false);
    let disposed = false;
    const parser = new Parser();
    let player: Player | null = null;

    const loadAndPlay = async () => {
      try {
        const response = await fetch(src, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Failed to fetch SVGA (${response.status}).`);
        }

        const buffer = await response.arrayBuffer();
        if (disposed) return;

        const video = await parser.do(buffer);
        if (disposed) return;

        player = new Player(canvas, undefined, {
          loop,
          fillMode: FILL_MODE.FORWARDS,
          cacheFrames: true,
          intersectionObserverRender: false,
        });
        player.$on(EVENT_TYPES.END, () => {
          onEnd?.();
        });
        await player.mount(video);
        if (disposed) return;
        player.start();
        setHasLoaded(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to play SVGA gift.";
        onError?.(message);
      }
    };

    void loadAndPlay();

    return () => {
      disposed = true;
      parser.destroy();
      if (player) {
        player.stop();
        player.clear();
        player.destroy();
      }
    };
  }, [loop, onEnd, onError, src]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ opacity: hasLoaded ? 1 : 0, transition: "opacity 180ms ease" }}
      aria-hidden
    />
  );
}
