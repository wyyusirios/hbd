"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { spriteSize, spriteUrl } from "./sprites";

export const STAGE_W = 320;
export const STAGE_H = 180;

function useFrame(count: number, fps: number) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % count), 1000 / fps);
    return () => window.clearInterval(id);
  }, [count, fps]);
  return frame % Math.max(count, 1);
}

interface SpriteProps {
  name?: string;
  frames?: string[];
  fps?: number;
  /** Centre x in stage pixels (0–320). */
  x: number;
  /** Bottom y in stage pixels (0–180), or centre y when anchor is "center". */
  y: number;
  scale?: number;
  anchor?: "bottom" | "center";
  flip?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
}

/** A sprite placed on the 320×180 stage, scaled with the stage. */
export function Sprite({
  name,
  frames,
  fps = 4,
  x,
  y,
  scale = 1,
  anchor = "bottom",
  flip,
  className = "",
  style,
  label,
  onClick,
  disabled,
  children,
}: SpriteProps) {
  const list = frames ?? (name ? [name] : []);
  const frame = useFrame(list.length, fps);
  const current = list[frame] ?? "";
  const { w, h } = spriteSize(list[0] ?? "");
  const pw = w * scale;
  const ph = h * scale;
  const top = anchor === "bottom" ? y - ph : y - ph / 2;
  const box: CSSProperties = {
    left: `${((x - pw / 2) / STAGE_W) * 100}%`,
    top: `${(top / STAGE_H) * 100}%`,
    width: `${(pw / STAGE_W) * 100}%`,
    height: `${(ph / STAGE_H) * 100}%`,
    ...style,
  };
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={spriteUrl(current)} alt="" draggable={false} className="pix" style={flip ? { transform: "scaleX(-1)" } : undefined} />
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={`sprite hotspot ${className}`}
        style={box}
        onClick={onClick}
        aria-label={label}
        title={label}
        disabled={disabled}
      >
        {img}
        {children}
      </button>
    );
  }
  return (
    <div className={`sprite ${className}`} style={box} aria-hidden>
      {img}
      {children}
    </div>
  );
}

/** A sprite inside regular UI, sized in CSS pixels per sprite pixel. */
export function Pix({ name, size = 3, className = "", frames, fps = 4 }: { name: string; size?: number; className?: string; frames?: string[]; fps?: number }) {
  const list = frames ?? [name];
  const frame = useFrame(list.length, fps);
  const { w, h } = spriteSize(list[0]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={spriteUrl(list[frame])}
      alt=""
      draggable={false}
      className={`pix ${className}`}
      style={{ width: w * size, height: h * size }}
    />
  );
}

/** Invisible clickable region on the stage, in stage pixels. */
export function Hotspot({
  x,
  y,
  w,
  h,
  label,
  onClick,
  className = "",
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  onClick: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`hotspot area ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        left: `${(x / STAGE_W) * 100}%`,
        top: `${(y / STAGE_H) * 100}%`,
        width: `${(w / STAGE_W) * 100}%`,
        height: `${(h / STAGE_H) * 100}%`,
      }}
    >
      {children}
    </button>
  );
}

/** Absolutely positioned arbitrary content on the stage. */
export function At({ x, y, w, h, children, className = "", style }: { x: number; y: number; w?: number; h?: number; children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`at ${className}`}
      style={{
        left: `${(x / STAGE_W) * 100}%`,
        top: `${(y / STAGE_H) * 100}%`,
        width: w !== undefined ? `${(w / STAGE_W) * 100}%` : undefined,
        height: h !== undefined ? `${(h / STAGE_H) * 100}%` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
