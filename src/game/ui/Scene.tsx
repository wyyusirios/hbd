"use client";

import type { ReactNode } from "react";
import { PixelCanvas } from "../pixel/PixelCanvas";
import type { Painter } from "../pixel/backgrounds";

export type PanelPos = "bottom" | "right" | "left" | "center" | "top";

interface SceneProps {
  bg: Painter | string;
  art?: ReactNode;
  panel?: ReactNode;
  panelPos?: PanelPos;
  /** Darken the background (for text-heavy scenes over busy art). */
  dim?: boolean;
  /**
   * Stage pixels to pan the camera up on landscape screens, where the panel
   * covers the bottom of the stage. Ignored on portrait, where the panel sits below.
   */
  lift?: number;
  className?: string;
}

/**
 * A 16:9 stage with pixel art plus a UI panel. On landscape screens the panel
 * floats over the stage; on portrait phones it drops below the stage.
 */
export function Scene({ bg, art, panel, panelPos = "bottom", dim, lift = 0, className = "" }: SceneProps) {
  return (
    <div className={`screen ${className}`}>
      <div className="frame">
        <div className="stage" style={lift ? ({ "--lift": `${(lift / 180) * 100}%` } as React.CSSProperties) : undefined}>
          {typeof bg === "string" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bg} alt="" className="stage-img" draggable={false} />
          ) : (
            <PixelCanvas paint={bg} />
          )}
          {dim && <div className="stage-dim" />}
          <div className="art">{art}</div>
        </div>
        {panel && <div className={`panel-wrap pos-${panelPos}`}>{panel}</div>}
      </div>
    </div>
  );
}

/** A full-viewport scene without the fixed 16:9 stage (title, desktop, terminal…). */
export function FullScene({ bg, children, className = "" }: { bg?: Painter | string; children: ReactNode; className?: string }) {
  return (
    <div className={`screen full ${className}`}>
      {bg &&
        (typeof bg === "string" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bg} alt="" className="full-bg" draggable={false} />
        ) : (
          <PixelCanvas paint={bg} className="full-bg" />
        ))}
      <div className="full-content">{children}</div>
    </div>
  );
}
