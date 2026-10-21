// Procedural pixel-art backgrounds painted on a 320×180 canvas.

type Ctx = CanvasRenderingContext2D;

export interface Painter {
  base: (ctx: Ctx, w: number, h: number) => void;
  frame?: (ctx: Ctx, t: number, w: number, h: number) => void;
}

/* ---------- primitives ---------- */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Vertical gradient between colour stops with ordered dithering instead of smooth blending. */
function vgrad(ctx: Ctx, x0: number, y0: number, w: number, h: number, stops: string[]) {
  const img = ctx.getImageData(x0, y0, w, h);
  const cols = stops.map(rgb);
  for (let y = 0; y < h; y++) {
    const f = (y / Math.max(h - 1, 1)) * (cols.length - 1);
    const i = Math.min(Math.floor(f), cols.length - 2);
    const frac = f - i;
    for (let x = 0; x < w; x++) {
      const threshold = (BAYER[(y0 + y) & 3][(x0 + x) & 3] + 0.5) / 16;
      const c = frac > threshold ? cols[i + 1] : cols[i];
      const o = (y * w + x) * 4;
      img.data[o] = c[0];
      img.data[o + 1] = c[1];
      img.data[o + 2] = c[2];
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, x0, y0);
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function px(ctx: Ctx, x: number, y: number, c: string) {
  rect(ctx, x, y, 1, 1, c);
}

function disc(ctx: Ctx, cx: number, cy: number, r: number, c: string) {
  ctx.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    const span = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2 + 1, 1);
  }
}

/** Soft glow: concentric dithered rings fading out. */
function glow(ctx: Ctx, cx: number, cy: number, r: number, c: string, strength = 0.5) {
  ctx.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y) / r;
      if (d > 1) continue;
      const level = (1 - d) * strength;
      const threshold = (BAYER[(cy + y) & 3][(cx + x) & 3] + 0.5) / 16;
      if (level > threshold) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

function moon(ctx: Ctx, cx: number, cy: number, r: number) {
  glow(ctx, cx, cy, r * 3, "#3d2d7a", 0.6);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const inA = x * x + y * y <= r * r;
      const bx = x - r * 0.55;
      const by = y + r * 0.25;
      const inB = bx * bx + by * by <= r * r * 0.85;
      if (inA && !inB) px(ctx, cx + x, cy + y, x < -r * 0.5 ? "#ffe9b0" : "#ffd27a");
    }
  }
}

function starfield(ctx: Ctx, seed: number, n: number, x0: number, y0: number, w: number, h: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + Math.floor(r() * w);
    const y = y0 + Math.floor(r() * h);
    const b = r();
    px(ctx, x, y, b > 0.85 ? "#ffffff" : b > 0.5 ? "#b9a9ff" : "#6a5aa8");
  }
}

/** Animated twinkling stars with little cross flares. */
function twinkle(ctx: Ctx, t: number, seed: number, n: number, x0: number, y0: number, w: number, h: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + Math.floor(r() * w);
    const y = y0 + Math.floor(r() * h);
    const phase = r() * Math.PI * 2;
    const speed = 0.8 + r() * 1.6;
    const v = Math.sin(t * speed + phase);
    if (v > 0.2) {
      px(ctx, x, y, "#ffffff");
      if (v > 0.75) {
        px(ctx, x - 1, y, "#b9a9ff");
        px(ctx, x + 1, y, "#b9a9ff");
        px(ctx, x, y - 1, "#b9a9ff");
        px(ctx, x, y + 1, "#b9a9ff");
      }
    } else if (v > -0.4) {
      px(ctx, x, y, "#8f7fe0");
    }
  }
}

function cloud(ctx: Ctx, seed: number, x: number, y: number, w: number, dark: string, light: string) {
  const r = rng(seed);
  const puffs: [number, number, number][] = [];
  for (let i = 0; i < Math.max(3, Math.floor(w / 7)); i++) {
    puffs.push([x + r() * w, y + r() * 3, 3 + Math.floor(r() * 5)]);
  }
  puffs.forEach(([px_, py, pr]) => disc(ctx, px_, py, pr, light));
  puffs.forEach(([px_, py, pr]) => disc(ctx, px_, py + 2, pr, dark));
}

function skyline(
  ctx: Ctx,
  seed: number,
  baseY: number,
  minH: number,
  maxH: number,
  body: string,
  windows: string[],
  litChance: number,
  x0 = 0,
  x1 = 320,
) {
  const r = rng(seed);
  let x = x0 - 4;
  while (x < x1) {
    const bw = 6 + Math.floor(r() * 12);
    const bh = minH + Math.floor(r() * (maxH - minH));
    rect(ctx, x, baseY - bh, bw, bh, body);
    if (r() > 0.75) rect(ctx, x + Math.floor(bw / 2), baseY - bh - 4 - Math.floor(r() * 6), 1, 8, body);
    for (let wy = baseY - bh + 2; wy < baseY - 2; wy += 3) {
      for (let wx = x + 1; wx < x + bw - 1; wx += 2) {
        if (r() < litChance) px(ctx, wx, wy, windows[Math.floor(r() * windows.length)]);
      }
    }
    x += bw + Math.floor(r() * 2);
  }
}

function hills(ctx: Ctx, seed: number, baseY: number, amp: number, color: string, w = 320, h = 180) {
  const r = rng(seed);
  const a1 = r() * 6;
  const a2 = r() * 6;
  ctx.fillStyle = color;
  for (let x = 0; x < w; x++) {
    const y = baseY - amp * (0.6 * Math.sin(x / 37 + a1) + 0.4 * Math.sin(x / 13 + a2));
    ctx.fillRect(x, Math.round(y), 1, h - Math.round(y));
  }
}

function pine(ctx: Ctx, x: number, baseY: number, h: number, color: string, edge?: string) {
  const layers = Math.max(3, Math.floor(h / 7));
  for (let i = 0; i < layers; i++) {
    const ly = baseY - h + (i * h) / layers;
    const lw = 3 + ((i + 1) / layers) * h * 0.45;
    for (let row = 0; row < h / layers + 3; row++) {
      const rw = Math.floor((lw * (row + 1)) / (h / layers + 3));
      rect(ctx, x - rw, ly + row, rw * 2 + 1, 1, color);
      if (edge && row === 0) px(ctx, x, ly, edge);
    }
  }
  rect(ctx, x - 1, baseY - 2, 3, 3, color);
}

function roundTree(ctx: Ctx, seed: number, x: number, baseY: number, size: number, leaf: string, leafDark: string, trunk: string, highlight?: string) {
  const r = rng(seed);
  rect(ctx, x - Math.floor(size / 6), baseY - size, Math.floor(size / 3), size, trunk);
  rect(ctx, x - Math.floor(size / 6) - 2, baseY - 3, Math.floor(size / 3) + 4, 3, trunk);
  const blobs: [number, number, number][] = [];
  for (let i = 0; i < 9; i++) {
    blobs.push([x + (r() - 0.5) * size * 1.3, baseY - size - r() * size * 0.7, size * 0.3 + r() * size * 0.25]);
  }
  blobs.forEach(([bx, by, br]) => disc(ctx, bx, by + 2, Math.round(br), leafDark));
  blobs.forEach(([bx, by, br]) => disc(ctx, bx, by, Math.round(br - 1), leaf));
  if (highlight) blobs.slice(0, 4).forEach(([bx, by, br]) => disc(ctx, bx - br / 3, by - br / 3, Math.max(1, Math.round(br / 3)), highlight));
}

function fireflies(ctx: Ctx, t: number, seed: number, n: number, x0: number, y0: number, w: number, h: number, colors = ["#ffe58a", "#b9ffcf"]) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const bx = x0 + r() * w;
    const by = y0 + r() * h;
    const ph = r() * 10;
    const x = bx + Math.sin(t * 0.7 + ph) * 6;
    const y = by + Math.cos(t * 0.5 + ph * 1.3) * 4;
    const on = Math.sin(t * 2 + ph) > -0.2;
    if (!on) continue;
    const c = colors[i % colors.length];
    px(ctx, x, y, c);
    if (Math.sin(t * 2 + ph) > 0.7) {
      px(ctx, x + 1, y, c + "88");
      px(ctx, x - 1, y, c + "88");
      px(ctx, x, y + 1, c + "88");
      px(ctx, x, y - 1, c + "88");
    }
  }
}

const DIGITS: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
};

function digit(ctx: Ctx, d: string, x: number, y: number, c: string) {
  const g = DIGITS[d];
  ctx.fillStyle = c;
  g.forEach((row, ry) => {
    for (let rx = 0; rx < 3; rx++) if (row[rx] === "1") ctx.fillRect(Math.round(x + rx), Math.round(y + ry), 1, 1);
  });
}

function floatingBits(ctx: Ctx, t: number, seed: number, n: number, w: number, h: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * (w - 4));
    const speed = 4 + r() * 8;
    const y = (h + 10 - ((t * speed + r() * h) % (h + 10))) - 5;
    const d = r() > 0.5 ? "1" : "0";
    const bright = r();
    digit(ctx, d, x, y, bright > 0.7 ? "#9d86ff" : bright > 0.35 ? "#5a46b8" : "#3a2d80");
  }
}

function perspectiveGrid(ctx: Ctx, horizon: number, color: string, w = 320, h = 180, offset = 0) {
  ctx.fillStyle = color;
  for (let i = -20; i <= 20; i++) {
    const xb = w / 2 + i * 24;
    for (let y = horizon; y < h; y++) {
      const f = (y - horizon) / (h - horizon);
      const x = w / 2 + (xb - w / 2) * f;
      ctx.fillRect(Math.round(x), y, 1, 1);
    }
  }
  for (let k = 0; k < 12; k++) {
    const f = ((k + offset) / 12) ** 2;
    const y = Math.round(horizon + f * (h - horizon));
    ctx.fillRect(0, y, w, 1);
  }
}

function bricks(ctx: Ctx, x0: number, y0: number, w: number, h: number, base: string, line: string, seed: number, accent?: string) {
  rect(ctx, x0, y0, w, h, base);
  const r = rng(seed);
  for (let y = y0; y < y0 + h; y += 6) {
    rect(ctx, x0, y, w, 1, line);
    const shift = ((y - y0) / 6) % 2 === 0 ? 0 : 6;
    for (let x = x0 + shift; x < x0 + w; x += 12) {
      rect(ctx, x, y, 1, 6, line);
      if (accent && r() > 0.8) rect(ctx, x + 2, y + 2, 7, 3, accent);
    }
  }
}

/* ---------- scenes ---------- */

const NIGHT = ["#06051a", "#0f0c33", "#1d1650", "#33206a", "#5a2a7c", "#9a4688"];

export const SKY_NIGHT: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 150, NIGHT);
    starfield(ctx, 11, 140, 0, 0, 320, 110);
    moon(ctx, 262, 34, 12);
    cloud(ctx, 3, 10, 92, 60, "#2a1f5e", "#4a3290");
    cloud(ctx, 4, 210, 100, 90, "#2a1f5e", "#4a3290");
    cloud(ctx, 5, 120, 70, 50, "#221a52", "#3d2a7d");
    hills(ctx, 7, 140, 6, "#241a52");
    skyline(ctx, 21, 158, 6, 26, "#1a1440", ["#ffcf7a", "#ff9e6b", "#c9a8ff"], 0.25);
    rect(ctx, 0, 158, 320, 22, "#0e0b28");
    starfield(ctx, 12, 30, 0, 160, 320, 20);
  },
  frame(ctx, t) {
    twinkle(ctx, t, 99, 40, 0, 0, 320, 100);
  },
};

export const SKY_DEEP: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 180, ["#04031a", "#0b0a2e", "#171247", "#271a5e", "#3b2373"]);
    starfield(ctx, 31, 260, 0, 0, 320, 180);
    // A faint milky way band.
    const r = rng(8);
    for (let i = 0; i < 500; i++) {
      const x = r() * 320;
      const y = 40 + x * 0.25 + (r() - 0.5) * 30;
      px(ctx, x, y, r() > 0.7 ? "#4b3a9a" : "#2c2370");
    }
    hills(ctx, 9, 165, 5, "#0c0a26");
  },
  frame(ctx, t) {
    twinkle(ctx, t, 77, 60, 0, 0, 320, 160);
  },
};

export const SKY_VIOLET: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 132, ["#0b0726", "#1d1048", "#3a1d6b", "#5a2a86"]);
    starfield(ctx, 41, 160, 0, 0, 320, 120);
    // Room floor and window frame edges.
    vgrad(ctx, 0, 132, 320, 48, ["#24163f", "#160d2b"]);
    rect(ctx, 0, 132, 320, 2, "#3b2766");
    rect(ctx, 0, 0, 10, 132, "#160d2b");
    rect(ctx, 310, 0, 10, 132, "#160d2b");
    rect(ctx, 10, 0, 2, 132, "#3b2766");
    rect(ctx, 308, 0, 2, 132, "#3b2766");
  },
  frame(ctx, t) {
    twinkle(ctx, t, 55, 30, 12, 0, 296, 120);
  },
};

function forest(opts: { seed: number; oldTree?: number; fork?: boolean }): Painter {
  return {
    base(ctx) {
      vgrad(ctx, 0, 0, 320, 110, ["#070620", "#120f3a", "#22185a", "#3b2470"]);
      starfield(ctx, opts.seed, 70, 0, 0, 320, 70);
      moon(ctx, 52, 26, 8);
      const r = rng(opts.seed + 1);
      for (let x = -6; x < 330; x += 9) pine(ctx, x + r() * 4, 118, 40 + r() * 30, "#1a1648");
      for (let x = -10; x < 330; x += 14) pine(ctx, x + r() * 6, 132, 34 + r() * 26, "#13183a", "#2a2f6a");
      vgrad(ctx, 0, 128, 320, 52, ["#18263a", "#13202f", "#0c1420"]);
      // Path.
      ctx.fillStyle = "#2d2a4a";
      for (let y = 128; y < 180; y++) {
        const f = (y - 128) / 52;
        const half = 6 + f * 40;
        if (opts.fork && y < 150) {
          const spread = (150 - y) * 1.6;
          ctx.fillRect(Math.round(160 - spread - half / 2), y, Math.round(half), 1);
          ctx.fillRect(Math.round(160 + spread - half / 2), y, Math.round(half), 1);
        } else {
          ctx.fillRect(Math.round(160 - half), y, Math.round(half * 2), 1);
        }
      }
      for (let i = 0; i < 60; i++) px(ctx, 120 + r() * 80, 140 + r() * 40, "#3c3860");
      // Grass tufts.
      for (let i = 0; i < 120; i++) {
        const gx = r() * 320;
        const gy = 132 + r() * 48;
        if (Math.abs(gx - 160) < 20 + (gy - 128)) continue;
        px(ctx, gx, gy, r() > 0.5 ? "#2e6b4f" : "#24503f");
        px(ctx, gx, gy - 1, "#3d8a62");
      }
      if (opts.oldTree !== undefined) {
        roundTree(ctx, opts.seed + 5, opts.oldTree, 140, 30, "#2a4f63", "#1b3449", "#4a3428", "#3e6f84");
        // Roots.
        rect(ctx, opts.oldTree - 10, 138, 6, 2, "#4a3428");
        rect(ctx, opts.oldTree + 5, 138, 7, 2, "#4a3428");
      }
      // Foreground bushes.
      for (let x = -10; x < 330; x += 22) disc(ctx, x + r() * 8, 182, 10 + r() * 6, "#0b1a22");
    },
    frame(ctx, t) {
      twinkle(ctx, t, opts.seed + 9, 14, 0, 0, 320, 60);
      fireflies(ctx, t, opts.seed + 3, 16, 10, 90, 300, 70);
    },
  };
}

export const FOREST_CHEST = forest({ seed: 101, oldTree: 230 });
export const FOREST_FORK = forest({ seed: 202, fork: true, oldTree: 262 });
export const FOREST_CLEARING = forest({ seed: 303, oldTree: 160 });

export const DIGITAL: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 100, ["#05041a", "#0d0a33", "#1e1460", "#3a1f7a"]);
    vgrad(ctx, 0, 100, 320, 80, ["#120c3a", "#08061e"]);
    glow(ctx, 160, 100, 60, "#5a3fd8", 0.35);
    perspectiveGrid(ctx, 100, "#3a2a9a");
  },
  frame(ctx, t) {
    floatingBits(ctx, t, 5, 26, 320, 96);
  },
};

export const CHAT_SPACE: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 110, ["#070522", "#140f45", "#2b1a66", "#5a2a86", "#a04a8e"]);
    starfield(ctx, 61, 90, 0, 0, 320, 90);
    vgrad(ctx, 0, 110, 320, 70, ["#1a1048", "#0b0826"]);
    perspectiveGrid(ctx, 110, "#3d2a8a");
    // Floating chat bubbles.
    const r = rng(4);
    for (let i = 0; i < 7; i++) {
      const bx = 10 + r() * 290;
      const by = 10 + r() * 80;
      const bw = 14 + r() * 18;
      rect(ctx, bx, by, bw, 8, "#2a2070");
      rect(ctx, bx + 1, by + 1, bw - 2, 6, "#3a2c94");
      rect(ctx, bx + 3, by + 3, bw * 0.5, 1, "#8f7fe0");
      rect(ctx, bx + 3, by + 8, 2, 2, "#2a2070");
    }
  },
  frame(ctx, t) {
    twinkle(ctx, t, 62, 20, 0, 0, 320, 90);
  },
};

export const BOARD: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 180, ["#0a0826", "#160f42", "#0d0a2c"]);
    perspectiveGrid(ctx, 150, "#2a1f70");
    rect(ctx, 30, 12, 260, 120, "#1b1450");
    rect(ctx, 32, 14, 256, 116, "#110c38");
    for (let x = 34; x < 286; x += 8) for (let y = 16; y < 128; y += 8) px(ctx, x, y, "#2a2070");
    rect(ctx, 30, 12, 260, 1, "#8f7fe0");
    rect(ctx, 30, 131, 260, 1, "#5a46b8");
    rect(ctx, 30, 12, 1, 120, "#8f7fe0");
    rect(ctx, 289, 12, 1, 120, "#5a46b8");
  },
  frame(ctx, t) {
    floatingBits(ctx, t, 9, 8, 320, 180);
  },
};

export const CAKE_ROOM: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 180, ["#120a2e", "#22124a", "#3a1a5e", "#2a1048"]);
    const r = rng(17);
    for (let i = 0; i < 18; i++) {
      glow(ctx, Math.floor(r() * 320), Math.floor(r() * 120), 6 + Math.floor(r() * 10), r() > 0.5 ? "#ff8fb3" : "#9d86ff", 0.35);
    }
    // Table.
    rect(ctx, 0, 132, 320, 48, "#2a1840");
    rect(ctx, 0, 132, 320, 2, "#5a3a7a");
    for (let x = 0; x < 320; x += 16) rect(ctx, x, 134, 1, 46, "#22123a");
  },
  frame(ctx, t) {
    twinkle(ctx, t, 18, 18, 0, 0, 320, 120);
  },
};

export const PLAZA: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 120, ["#070522", "#140f45", "#2b1a66", "#4a2380"]);
    starfield(ctx, 71, 80, 0, 0, 320, 70);
    moon(ctx, 280, 22, 7);
    // House facades.
    const r = rng(72);
    const houses = [
      [0, 60, 50, "#2a2154"],
      [48, 70, 46, "#33285f"],
      [92, 54, 40, "#2b2257"],
      [230, 64, 44, "#30265d"],
      [272, 52, 52, "#2a2154"],
    ] as const;
    houses.forEach(([x, top, w, c]) => {
      rect(ctx, x, top, w, 130 - top, c);
      // Roof.
      for (let i = 0; i < 8; i++) rect(ctx, x - 2 + i, top - i, w + 4 - i * 2, 1, "#1a1438");
      for (let wy = top + 8; wy < 120; wy += 14) {
        for (let wx = x + 5; wx < x + w - 8; wx += 11) {
          const lit = r() > 0.35;
          rect(ctx, wx, wy, 6, 8, lit ? "#ffcf7a" : "#1a1438");
          if (lit) {
            rect(ctx, wx + 2, wy, 1, 8, "#e0a050");
            rect(ctx, wx, wy + 3, 6, 1, "#e0a050");
          }
        }
      }
    });
    // Cobblestones.
    vgrad(ctx, 0, 130, 320, 50, ["#2a2448", "#1c1834", "#121024"]);
    for (let y = 132; y < 180; y += 4) {
      for (let x = (y / 4) % 2 ? 0 : 4; x < 320; x += 8) rect(ctx, x, y, 6, 1, "#36305a");
    }
    // Lamp posts.
    [140, 200].forEach((lx) => {
      glow(ctx, lx, 84, 22, "#ffcf7a", 0.45);
      rect(ctx, lx - 1, 86, 2, 46, "#120e26");
      rect(ctx, lx - 3, 80, 6, 6, "#120e26");
      rect(ctx, lx - 2, 81, 4, 4, "#ffe0a0");
    });
  },
  frame(ctx, t) {
    twinkle(ctx, t, 73, 18, 0, 0, 320, 60);
    fireflies(ctx, t, 74, 6, 120, 70, 100, 40, ["#ffe0a0"]);
  },
};

export const HALL: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 140, ["#100b2c", "#1c1442", "#261a52"]);
    // Arched windows with stars.
    [40, 110, 210, 280].forEach((wx, i) => {
      if (i === 1 || i === 2) return;
      rect(ctx, wx - 12, 26, 24, 50, "#0a0822");
      disc(ctx, wx, 26, 12, "#0a0822");
      starfield(ctx, 80 + i, 12, wx - 10, 18, 20, 56);
    });
    // Pillars.
    [80, 240].forEach((x) => {
      rect(ctx, x - 6, 10, 12, 130, "#2e2462");
      rect(ctx, x - 6, 10, 2, 130, "#43378a");
      rect(ctx, x - 8, 10, 16, 4, "#43378a");
      rect(ctx, x - 8, 136, 16, 4, "#43378a");
    });
    // Central door.
    rect(ctx, 140, 60, 40, 80, "#2a1838");
    disc(ctx, 160, 60, 20, "#2a1838");
    rect(ctx, 144, 62, 32, 78, "#4a2e3e");
    disc(ctx, 160, 62, 16, "#4a2e3e");
    rect(ctx, 159, 46, 2, 94, "#2a1838");
    rect(ctx, 154, 100, 2, 4, "#ffd27a");
    rect(ctx, 164, 100, 2, 4, "#ffd27a");
    // Floor tiles.
    vgrad(ctx, 0, 140, 320, 40, ["#2a2050", "#161032"]);
    for (let y = 140; y < 180; y += 6) rect(ctx, 0, y, 320, 1, "#211a44");
    for (let x = 0; x < 320; x += 20) rect(ctx, x, 140, 1, 40, "#211a44");
  },
  frame(ctx, t) {
    fireflies(ctx, t, 81, 10, 20, 20, 280, 120, ["#c9a8ff", "#ffe0a0"]);
  },
};

export const WINDOW_ROOM: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 180, ["#140c30", "#1d1240", "#170e34"]);
    // Window with night sky and city.
    const wx = 70;
    const wy = 18;
    const ww = 180;
    const wh = 104;
    vgrad(ctx, wx, wy, ww, wh, NIGHT.slice(0, 5));
    starfield(ctx, 91, 90, wx, wy, ww, 60);
    moon(ctx, wx + 140, wy + 22, 9);
    skyline(ctx, 92, wy + wh, 8, 34, "#1a1440", ["#ffcf7a", "#ff9e6b", "#c9a8ff"], 0.3, wx, wx + ww);
    // Frame and cross bars.
    rect(ctx, wx - 4, wy - 4, ww + 8, 4, "#3a2a5a");
    rect(ctx, wx - 4, wy + wh, ww + 8, 4, "#3a2a5a");
    rect(ctx, wx - 4, wy, 4, wh, "#3a2a5a");
    rect(ctx, wx + ww, wy, 4, wh, "#3a2a5a");
    rect(ctx, wx + ww / 2 - 1, wy, 3, wh, "#3a2a5a");
    // Windowsill.
    rect(ctx, wx - 14, wy + wh + 4, ww + 28, 6, "#5a3e6e");
    rect(ctx, wx - 14, wy + wh + 4, ww + 28, 1, "#8a6aa0");
    // Curtains.
    for (let i = 0; i < 26; i++) {
      const c = i % 4 < 2 ? "#4a2a6e" : "#3a2058";
      rect(ctx, wx - 30 + i, 10, 1, 120 - Math.abs(13 - i) * 0.6, c);
      rect(ctx, wx + ww + 4 + i, 10, 1, 120 - Math.abs(13 - i) * 0.6, c);
    }
    // Plants on the sill.
    [wx - 4, wx + ww - 10].forEach((x) => {
      rect(ctx, x, wy + wh - 6, 10, 10, "#8a5a3a");
      disc(ctx, x + 5, wy + wh - 12, 6, "#2e6b4f");
      disc(ctx, x + 3, wy + wh - 14, 3, "#4caf7a");
    });
    vgrad(ctx, 0, 140, 320, 40, ["#22163e", "#120a26"]);
  },
  frame(ctx, t) {
    twinkle(ctx, t, 93, 20, 70, 18, 180, 60);
  },
};

export const LIBRARY: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 180, ["#140c2c", "#1d1238", "#120a24"]);
    const r = rng(111);
    const bookColors = ["#5a2a6e", "#2a3a7a", "#7a3a4a", "#3a5a4a", "#6a4a2a", "#4a3a8a", "#8a5a6a"];
    [10, 112, 214].forEach((sx) => {
      rect(ctx, sx, 8, 96, 140, "#3a2418");
      rect(ctx, sx + 2, 10, 92, 136, "#24140e");
      for (let shelf = 0; shelf < 4; shelf++) {
        const sy = 12 + shelf * 34;
        rect(ctx, sx + 2, sy + 30, 92, 3, "#4a3020");
        let bx = sx + 4;
        while (bx < sx + 90) {
          const bw = 3 + Math.floor(r() * 4);
          const bh = 18 + Math.floor(r() * 11);
          if (bx + bw > sx + 92) break;
          const c = bookColors[Math.floor(r() * bookColors.length)];
          rect(ctx, bx, sy + 30 - bh, bw, bh, c);
          rect(ctx, bx, sy + 30 - bh + 3, bw, 1, "#d9b86a55");
          bx += bw + (r() > 0.85 ? 3 : 0);
        }
      }
    });
    // Warm lamp.
    glow(ctx, 160, 0, 60, "#ffcf7a", 0.18);
    vgrad(ctx, 0, 148, 320, 32, ["#2a1a2a", "#160c18"]);
    for (let x = 0; x < 320; x += 24) rect(ctx, x, 148, 1, 32, "#1e1220");
  },
  frame(ctx, t) {
    fireflies(ctx, t, 112, 10, 0, 10, 320, 140, ["#ffe0a0"]);
  },
};

export const DOOR_WALL: Painter = {
  base(ctx) {
    bricks(ctx, 0, 0, 320, 150, "#2a2050", "#1a1438", 5, "#30265c");
    glow(ctx, 160, 80, 90, "#6a4fd8", 0.22);
    // Torches.
    [70, 250].forEach((x) => {
      glow(ctx, x, 60, 24, "#ffb36b", 0.5);
      rect(ctx, x - 2, 62, 4, 14, "#3a2418");
      rect(ctx, x - 3, 58, 6, 4, "#ffb36b");
      rect(ctx, x - 1, 54, 2, 4, "#ffe0a0");
    });
    vgrad(ctx, 0, 150, 320, 30, ["#22183e", "#120c26"]);
  },
  frame(ctx, t) {
    [70, 250].forEach((x, i) => {
      const f = Math.sin(t * 9 + i) > 0 ? 1 : 0;
      rect(ctx, x - 1 + f, 52, 2, 3, "#fff2c0");
    });
    fireflies(ctx, t, 141, 8, 40, 30, 240, 110, ["#c9a8ff"]);
  },
};

const GARLAND = { x0: 94, y0: 64, x1: 290, y1: 74, sag: 16 };
const BULB_COLORS = ["#ffd27a", "#ff8fb3", "#b49cff", "#8ee8ff", "#fff0c0"];

function garlandPoint(t: number): [number, number] {
  const { x0, y0, x1, y1, sag } = GARLAND;
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)];
}

function flowerBush(ctx: Ctx, seed: number, cx: number, cy: number, r: number) {
  const rr = rng(seed);
  disc(ctx, cx, cy + 1, r, "#1f4a3a");
  disc(ctx, cx - r / 3, cy - 1, Math.max(2, r - 2), "#2e6b4f");
  disc(ctx, cx + r / 3, cy, Math.max(2, r - 3), "#3a7a58");
  const cols = ["#ff8fb3", "#ffd27a", "#ffffff", "#c9a8ff"];
  for (let i = 0; i < r * 3; i++) {
    const a = rr() * Math.PI * 2;
    const d = rr() * (r - 1);
    const fx = Math.round(cx + Math.cos(a) * d);
    const fy = Math.round(cy + Math.sin(a) * d * 0.8);
    const c = cols[Math.floor(rr() * cols.length)];
    px(ctx, fx, fy, c);
    if (rr() > 0.6) px(ctx, fx + 1, fy, c);
  }
}

function lantern(ctx: Ctx, x: number, baseY: number) {
  glow(ctx, x, baseY - 14, 14, "#ffcf7a", 0.5);
  rect(ctx, x, baseY - 10, 1, 10, "#2a1a2e");
  rect(ctx, x - 3, baseY - 18, 7, 8, "#2a1a2e");
  rect(ctx, x - 2, baseY - 17, 5, 6, "#ffe0a0");
  rect(ctx, x - 1, baseY - 16, 3, 4, "#fff6d8");
  rect(ctx, x - 4, baseY - 19, 9, 1, "#2a1a2e");
  rect(ctx, x - 1, baseY, 3, 1, "#2a1a2e");
}

export const GARDEN: Painter = {
  base(ctx) {
    // Sunset sky with a soft sun and lit clouds.
    vgrad(ctx, 0, 0, 320, 124, ["#241857", "#4a2878", "#8a3c86", "#d4587a", "#f88a6e", "#ffbf7f", "#ffe0a8"]);
    starfield(ctx, 171, 30, 0, 0, 320, 34);
    glow(ctx, 236, 112, 54, "#fff3c8", 0.55);
    disc(ctx, 236, 112, 15, "#ffe9b0");
    disc(ctx, 236, 112, 12, "#fff4d0");
    cloud(ctx, 11, 18, 30, 74, "#6a3482", "#a24f92");
    cloud(ctx, 12, 140, 22, 56, "#7a3a88", "#b65a96");
    cloud(ctx, 13, 196, 60, 90, "#c25a84", "#ff9a8e");
    cloud(ctx, 14, 40, 76, 60, "#b2507e", "#f0848a");
    // Far hills and a faint city on the horizon.
    hills(ctx, 3, 116, 6, "#9a4a86");
    skyline(ctx, 172, 120, 4, 14, "#7a3a76", ["#ffd9a0", "#ffb3c8"], 0.18, 120, 320);
    hills(ctx, 4, 124, 5, "#6a3070");
    // Grass.
    vgrad(ctx, 0, 122, 320, 58, ["#5a8a5a", "#3e7350", "#2c5a42", "#1f4636"]);
    const r = rng(9);
    for (let i = 0; i < 260; i++) {
      const gx = r() * 320;
      const gy = 124 + r() * 56;
      px(ctx, gx, gy, r() > 0.5 ? "#6fa06a" : "#24503f");
    }
    // Stone path from the door down to the front.
    for (let y = 140; y < 180; y++) {
      const t = (y - 140) / 40;
      const cx = 60 + t * t * 70;
      const half = 5 + t * 14;
      rect(ctx, cx - half, y, half * 2, 1, "#a88a8a");
    }
    for (let y = 141; y < 180; y += 4) {
      const t = (y - 140) / 40;
      const cx = 60 + t * t * 70;
      const half = 5 + t * 14;
      for (let x = cx - half + 2; x < cx + half - 3; x += 7 + t * 3) rect(ctx, x, y + 1, 4 + t * 3, 2, "#c9adad");
      rect(ctx, cx - half, y, half * 2, 1, "#8a6e78");
    }
    // House.
    rect(ctx, 10, 64, 84, 78, "#5a3460");
    for (let y = 66; y < 142; y += 5) rect(ctx, 10, y, 84, 1, "#4a2a52");
    for (let i = 0; i < 30; i++) {
      const w = 98 - i * 3.1;
      rect(ctx, 52 - w / 2, 64 - i, w, 1, i % 4 === 0 ? "#5a2440" : "#3a1830");
    }
    rect(ctx, 4, 64, 96, 2, "#7a3a56");
    rect(ctx, 70, 26, 9, 22, "#3a1830");
    rect(ctx, 68, 24, 13, 3, "#5a2440");
    // Windows with warm light, curtains and flower boxes.
    [
      [20, 78],
      [60, 78],
      [20, 106],
    ].forEach(([wx, wy]) => {
      glow(ctx, wx + 7, wy + 8, 16, "#ffcf7a", 0.42);
      rect(ctx, wx - 1, wy - 1, 16, 18, "#2e1830");
      rect(ctx, wx, wy, 14, 16, "#ffd98a");
      rect(ctx, wx, wy, 14, 5, "#fff0c0");
      rect(ctx, wx, wy, 3, 16, "#e88aa8");
      rect(ctx, wx + 11, wy, 3, 16, "#e88aa8");
      rect(ctx, wx + 6, wy, 2, 16, "#c27a50");
      rect(ctx, wx, wy + 7, 14, 1, "#c27a50");
      rect(ctx, wx - 2, wy + 16, 18, 3, "#6a3a2a");
      for (let k = 0; k < 7; k++) px(ctx, wx - 1 + k * 2.4, wy + 15, ["#ff8fb3", "#ffd27a", "#ffffff"][k % 3]);
    });
    // Door with a porch lamp and steps.
    rect(ctx, 52, 104, 18, 38, "#2e1830");
    rect(ctx, 54, 106, 14, 36, "#7a4038");
    rect(ctx, 54, 106, 14, 2, "#9a5a48");
    rect(ctx, 60, 106, 1, 36, "#5a2e2a");
    px(ctx, 65, 124, "#ffd27a");
    glow(ctx, 76, 104, 10, "#ffcf7a", 0.6);
    rect(ctx, 75, 102, 3, 4, "#ffe9b0");
    rect(ctx, 48, 142, 26, 2, "#8a6e78");
    rect(ctx, 46, 144, 30, 2, "#a88a8a");
    // Blossoming tree on the right.
    roundTree(ctx, 6, 298, 128, 30, "#3a6a52", "#284a3e", "#4a2c26", "#5a9a6a");
    const rb = rng(31);
    for (let i = 0; i < 60; i++) px(ctx, 270 + rb() * 60, 70 + rb() * 50, rb() > 0.5 ? "#ffb3c8" : "#ffe0ea");
    // Picket fence.
    for (let x = 104; x < 272; x += 9) {
      rect(ctx, x, 112, 4, 16, "#e8cfc0");
      rect(ctx, x, 112, 4, 1, "#fff4e8");
      rect(ctx, x + 3, 113, 1, 15, "#c9a8a0");
      px(ctx, x + 1, 111, "#e8cfc0");
      px(ctx, x + 2, 111, "#e8cfc0");
    }
    rect(ctx, 104, 116, 168, 2, "#d9b8a8");
    rect(ctx, 104, 123, 168, 2, "#d9b8a8");
    // Garland wire.
    for (let t = 0; t <= 1; t += 0.004) {
      const [gx, gy] = garlandPoint(t);
      px(ctx, gx, gy, "#2a1a2e");
    }
    // Flower beds and lanterns.
    flowerBush(ctx, 41, 18, 154, 10);
    flowerBush(ctx, 42, 34, 166, 9);
    flowerBush(ctx, 43, 280, 152, 11);
    flowerBush(ctx, 44, 302, 166, 10);
    flowerBush(ctx, 45, 254, 170, 8);
    lantern(ctx, 96, 150);
    lantern(ctx, 272, 140);
    // Scattered small flowers in the grass.
    const rf = rng(77);
    for (let i = 0; i < 70; i++) {
      const fx = rf() * 320;
      const fy = 132 + rf() * 48;
      const c = ["#ff8fb3", "#b49cff", "#ffd27a", "#ffffff"][Math.floor(rf() * 4)];
      px(ctx, fx, fy, c);
      px(ctx, fx, fy + 1, "#2e6b4f");
    }
  },
  frame(ctx, t) {
    // Twinkling garland bulbs.
    for (let i = 0; i <= 22; i++) {
      const [bx, by] = garlandPoint(i / 22);
      const on = Math.sin(t * 2.2 + i * 1.7) > -0.3;
      const c = BULB_COLORS[i % BULB_COLORS.length];
      if (on) glow(ctx, Math.round(bx), Math.round(by + 3), 4, c, 0.5);
      rect(ctx, bx - 1, by + 1, 3, 3, on ? c : "#5a4050");
      if (on) px(ctx, bx, by + 2, "#ffffff");
    }
    // Chimney smoke.
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.25 + k / 4) % 1;
      const sx = 74 + Math.sin(p * 6 + k) * 3 + p * 10;
      const sy = 22 - p * 22;
      const rr = 1 + Math.round(p * 3);
      if (p < 0.9) disc(ctx, sx, sy, rr, p > 0.5 ? "#b47a9a66" : "#c99ab088");
    }
    fireflies(ctx, t, 151, 24, 0, 60, 320, 110, ["#fff0c0", "#ffd27a", "#ffb3c8"]);
  },
};

export const WALLPAPER: Painter = {
  base(ctx) {
    vgrad(ctx, 0, 0, 320, 180, ["#120a3a", "#2a1670", "#5a2aa0", "#9a4ab0"]);
    starfield(ctx, 161, 120, 0, 0, 320, 120);
    hills(ctx, 162, 150, 8, "#3a1f7a");
    hills(ctx, 163, 162, 6, "#24145a");
  },
  frame(ctx, t) {
    twinkle(ctx, t, 164, 30, 0, 0, 320, 120);
  },
};
