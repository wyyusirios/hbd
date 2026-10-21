"use client";

import { useEffect, useRef } from "react";
import type { Painter } from "./backgrounds";

/**
 * Low-resolution canvas scaled up with crisp pixels. `paint.base` is drawn once
 * into an offscreen buffer; `paint.frame` runs on top of it at ~12 fps.
 */
export function PixelCanvas({ paint, w = 320, h = 180, className = "" }: { paint: Painter; w?: number; h?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const buffer = document.createElement("canvas");
    buffer.width = w;
    buffer.height = h;
    const bctx = buffer.getContext("2d");
    if (!bctx) return;
    paint.base(bctx, w, h);
    ctx.drawImage(buffer, 0, 0);
    const frameFn = paint.frame;
    if (!frameFn) return;

    let raf = 0;
    let last = 0;
    const start = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 80) return;
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(buffer, 0, 0);
      frameFn(ctx, (now - start) / 1000, w, h);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paint, w, h]);

  return <canvas ref={ref} width={w} height={h} className={`pixel-canvas ${className}`} />;
}
