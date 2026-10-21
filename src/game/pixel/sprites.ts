// Hand-drawn pixel sprites as character grids. '.' is transparent; every other
// character maps to a colour in PALETTE. Symmetric sprites are written as the left
// half and mirrored, which keeps them compact and perfectly even.

export const PALETTE: Record<string, string> = {
  k: "#0d0a1c", // outline
  K: "#2a2342",
  w: "#f4ecdc", // cream
  W: "#ffffff",
  p: "#7b5cff", // purple
  P: "#b49cff", // lavender
  v: "#6a4fd8", // swallow sheen
  r: "#ff8fb3", // pink
  R: "#d9577f",
  e: "#e04a5f", // red
  E: "#9c2a3e",
  y: "#ffd27a", // gold
  Y: "#f0a53c",
  o: "#c8862e", // retriever shade
  n: "#8a5a3a", // brown
  N: "#5a3a24",
  t: "#c99a6b", // hamster
  T: "#ecd2a8",
  s: "#f2c7a5", // skin
  S: "#d9a07f",
  h: "#b08a5a", // Artem's hair
  H: "#7d5f3c",
  l: "#ecd58e", // Nastya's hair
  L: "#c9ac5e",
  a: "#8a8f9c", // schnauzer
  A: "#5c6170",
  i: "#c9cedb",
  c: "#2b2550", // hoodie
  C: "#3d3570",
  u: "#cdbdf0", // sweater
  b: "#3b5bb5", // jeans
  B: "#8ec5ff",
  g: "#4caf7a",
  G: "#2e6b4f",
  m: "#6fd6ff", // glow
  q: "#c2502f", // swallow throat
  x: "#d6b27c", // Artem's hair highlight
  z: "#fff2bf", // Nastya's hair highlight
  j: "#2a4290", // jeans shade
  f: "#e8dccb", // light fur
};

export type Grid = string[];

/** Mirror a left half. `odd` keeps the last column as the shared centre. */
function sym(half: Grid, odd = false): Grid {
  const w = Math.max(...half.map((r) => r.length));
  return half.map((row) => {
    const r = row.padStart(w, ".");
    const mirrored = r.split("").reverse().join("");
    return odd ? r + mirrored.slice(1) : r + mirrored;
  });
}

function recolor(grid: Grid, map: Record<string, string>): Grid {
  return grid.map((row) => row.replace(/./g, (ch) => map[ch] ?? ch));
}

type Pt = [number, number];
interface Layer {
  color: string;
  poly?: Pt[];
  circle?: [number, number, number];
  ellipse?: [number, number, number, number];
  /** Colour for pixels on the shape's top edge (feather sheen). */
  sheen?: string;
}

function inPoly(x: number, y: number, pts: Pt[]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Rasterise simple vector shapes into a sprite grid, painted in order. */
function raster(w: number, h: number, layers: Layer[]): Grid {
  const g: string[][] = Array.from({ length: h }, () => Array(w).fill("."));
  for (const l of layers) {
    const hit = (x: number, y: number) => {
      const px = x + 0.5;
      const py = y + 0.5;
      if (l.poly) return inPoly(px, py, l.poly);
      if (l.circle) return (px - l.circle[0]) ** 2 + (py - l.circle[1]) ** 2 <= l.circle[2] ** 2;
      if (l.ellipse) return ((px - l.ellipse[0]) / l.ellipse[2]) ** 2 + ((py - l.ellipse[1]) / l.ellipse[3]) ** 2 <= 1;
      return false;
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!hit(x, y)) continue;
        g[y][x] = l.sheen && (y === 0 || !hit(x, y - 1)) ? l.sheen : l.color;
      }
    }
  }
  return g.map((r) => r.join(""));
}

// Swallow in flight, side view, flying left: rust throat, white belly, long forked tail.
function swallowFlight(upper: Pt[], lower: Pt[]): Grid {
  return raster(48, 28, [
    { color: "K", poly: lower, sheen: "v" },
    { color: "k", poly: [[24, 13], [34, 11.5], [47.5, 8], [35, 14], [25, 15.5]], sheen: "v" },
    { color: "k", poly: [[24, 15], [35, 15.5], [47.5, 20], [34, 17.5], [25, 17]] },
    { color: "k", ellipse: [17, 14, 9.5, 4], sheen: "v" },
    { color: "w", ellipse: [16, 16.4, 7.5, 2] },
    { color: "k", circle: [8.5, 12.5, 4.2], sheen: "v" },
    { color: "k", poly: [[2.5, 13], [5, 11.5], [5, 14]] },
    { color: "q", ellipse: [7.4, 15, 2.4, 1.6] },
    { color: "k", poly: upper, sheen: "v" },
    { color: "W", poly: [[6.6, 11.6], [7.9, 11.6], [7.9, 12.9], [6.6, 12.9]] },
  ]);
}

const swallowA = swallowFlight(
  [[12, 11], [18, 9.5], [30, 2], [41, 0], [28, 7.5], [22, 12.5]],
  [[14, 15], [22, 15], [33, 21], [44, 26], [30, 23], [19, 18]],
);

const swallowB = swallowFlight(
  [[12, 11], [18, 10], [32, 6], [45, 5], [30, 10.5], [22, 12.5]],
  [[14, 15], [22, 15], [34, 18.5], [46, 19], [30, 20], [19, 17.5]],
);

// Perched swallow, facing left.
const swallowPerch = raster(32, 26, [
  { color: "k", poly: [[21, 15], [31, 23], [28.5, 23.5], [19, 17.5]] },
  { color: "k", poly: [[20, 16], [25, 25], [23, 25], [18, 17.5]] },
  { color: "k", poly: [[6, 7], [12, 6], [19, 9], [23.5, 15], [20, 17.5], [11, 16.5], [6, 12]], sheen: "v" },
  { color: "w", poly: [[6.5, 10.5], [10, 15], [17, 16.8], [12, 12.5], [8, 9.5]] },
  { color: "k", circle: [8.5, 6.5, 4.2], sheen: "v" },
  { color: "k", poly: [[2.5, 7], [5, 5.5], [5, 8]] },
  { color: "q", ellipse: [7.2, 9.2, 2.4, 1.6] },
  { color: "K", poly: [[10, 8.5], [18, 9.5], [29, 19.5], [26, 20], [16, 15.5], [10.5, 12]], sheen: "v" },
  { color: "W", poly: [[6.6, 5.6], [7.9, 5.6], [7.9, 6.9], [6.6, 6.9]] },
  { color: "A", poly: [[11, 16.5], [12, 16.5], [12, 19], [11, 19]] },
  { color: "A", poly: [[14, 17], [15, 17], [15, 19], [14, 19]] },
]);

export const SPRITES: Record<string, Grid> = {
  swallowA,
  swallowB,

  swallowPerch,

  guideMark: [
    "P.......P",
    "PP.....PP",
    ".PPP.PPP.",
    "..PPWPP..",
    "...PPP...",
    "...P.P...",
    "..P...P..",
  ],

  buba: sym([
    "...NN...",
    "..NrtN..",
    "..Nttttt",
    ".Ntttttt",
    ".NtkWttt",
    "NttkkTtt",
    "NrrtTTTt",
    "NrrTTTTk",
    "NtTTTTTT",
    ".NtTTTTT",
    ".NttTTTT",
    "..NtNTTT",
    "...NNNNN",
  ]),

  chomik: sym([
    "...kk...",
    "..kwwk..",
    "..kwrk..",
    "..kwrk..",
    "..kwrk..",
    "..kwwk..",
    "..kwwkkk",
    ".kwwwwww",
    "kwwwwwww",
    "kwwkWwww",
    "kwwkkwww",
    "kwrrwwwr",
    ".kwwwwwk",
    "..kwwPPv",
    ".kwwwwwP",
    ".kwwwwww",
    ".kwiwwww",
    "..kkkkkk",
  ]),

  artem: sym([
    "...kkkkk",
    "..khhhhh",
    ".khhhhhh",
    ".khhHhhh",
    "khhHssss",
    "khHsssss",
    "khHskWss",
    "khHsksss",
    "khHsrsss",
    "khHsssss",
    "khhHssRR",
    "khhhSsss",
    "khhhhkSS",
    "khhhcccc",
    "khhcCccc",
    "khhcCccc",
    "khcCcccc",
    ".kcCcccw",
    ".kcCcccw",
    ".ksccccc",
    "..kccccc",
    "..kbbbbb",
    "..kbbbb.",
    "..kbbbb.",
    "..kbbbb.",
    "..kKKKK.",
    "..kkkkk.",
  ]),

  nastya: sym([
    "...kkkkk",
    "..klllll",
    ".kllllll",
    ".kllLlll",
    "kllLssss",
    "klLsssss",
    "klLskWss",
    "klLsksss",
    "klLsrsss",
    "klLsssss",
    "kllLssRR",
    "klllSsss",
    "kllllkSS",
    "klllluuu",
    "kllluPuu",
    "klllluuu",
    "kllluuuu",
    ".kllPuuu",
    ".kluPuuu",
    ".ksuuuuu",
    "..kuuuuu",
    "..kBBBBB",
    "..kBBBB.",
    "..kBBBB.",
    "..kBBBB.",
    "..kKKKK.",
    "..kkkkk.",
  ]),

  schnauzer: sym([
    "..kk....",
    ".kak....",
    ".kaakkkk",
    "kaaaaaaa",
    "kaiiiaaa",
    "kakWaaaa",
    "kaaaiiii",
    ".kaiiiik",
    ".kiiiiii",
    "..kiiiii",
    "..kaiiii",
    ".kaaaaii",
    ".kaaaaai",
    ".kaaaaaa",
    ".kaiaaai",
    "..kkkkkk",
  ]),

  retriever: sym([
    "....kkkkk",
    "...kyyyyy",
    "..koyyyyy",
    ".kooyyyyy",
    ".kooykWyy",
    ".kooyyyyy",
    "kooyyyyTT",
    "kooyyyTTk",
    ".kooyTTTT",
    "..koyTTTr",
    "...kyyyyy",
    "..kyyyyyy",
    ".kyyyyyyy",
    ".kyoyyyyy",
    ".kyoyyyyy",
    ".kyTTyyyT",
    "..kkkkkkk",
  ]),

  postman: sym([
    "..kkkkkk",
    ".kbbbbbb",
    ".kbbbbby",
    "kkkkkkkk",
    "..kNssss",
    "..kNskWs",
    "..kNssss",
    "..kNsNNN",
    "...ksssR",
    "....kSSS",
    "..kbbbbb",
    ".kbbybbb",
    ".kbbbbbb",
    "kbbbbbyb",
    "ksbbbbbb",
    "ksbbbbbb",
    ".kbbbbbb",
    "..kcccc.",
    "..kcccc.",
    "..kcccc.",
    "..kKKKK.",
    "..kkkkk.",
  ]),

  robot: sym([
    "......k",
    "......y",
    "...kkkk",
    "..kiiii",
    ".kiAAAA",
    ".kiABAA",
    ".kiAAAA",
    ".kiAABB",
    "..kiiii",
    "...kkkk",
    ".kiiiii",
    "kiiyiii",
    "kiiiiii",
    ".kkiiii",
    "..ka..a",
    "..kk.kk",
  ]),

  cake: sym([
    "....k.....k.....",
    "....wP....wP....",
    "....Pw....Pw....",
    "....wP....wP....",
    "....Pw....Pw....",
    "..kkkkkkkkkkkkkk",
    ".krrrrrrrrrrrrrr",
    "krrWrrrrrWrrrrrr",
    "krrrrrrrrrrrrrrr",
    "kRrrRrrrRrrrrRrr",
    "kwRwwRwwwRwwwwRw",
    "kwwwwwwwwwwwwwww",
    "kTTTTTTTTTTTTTTT",
    "kTTTTTTTTTTTTTTT",
    "krrrrrrrrrrrrrrr",
    "kTTTTTTTTTTTTTTT",
    "kTTTTyTTTTTPTTTT",
    "kTTTTTTTTTTTTTTT",
    "kkkkkkkkkkkkkkkk",
    "iiiiiiiiiiiiiiii",
    ".AAAAAAAAAAAAAAA",
  ]),

  flameA: [".y.", "yYy", "yWy", ".Y."],
  flameB: ["..y", ".yY", "yWy", ".Y."],

  chestClosed: sym([
    "..kkkkkk",
    ".knnnnnn",
    "knNnnnnn",
    "knnnnnnn",
    "kyyyyyyy",
    "knnnnnny",
    "knnnnnnk",
    "knNnnnnn",
    "knnnnnnn",
    "kyyyyyyy",
    "kkkkkkkk",
  ]),

  chestOpen: sym([
    ".kkkkkkk",
    "knnnnnnn",
    "knNnnnnn",
    "kkkkkkkk",
    "kKKKKKKK",
    "kKyYyWyy",
    "knnnnnny",
    "knnnnnnk",
    "knNnnnnn",
    "knnnnnnn",
    "kyyyyyyy",
    "kkkkkkkk",
  ]),

  key: [
    "..kkk.......",
    ".kyyyk......",
    "kyk.kykkkkkk",
    "kyk.kyyyyyyk",
    ".kyyykkykyk.",
    "..kkk..k.k..",
  ],

  apple: [
    "....kG..",
    "...kGG..",
    ".kkekkk.",
    "keeWeeek",
    "keWeeeek",
    "keeeeeEk",
    ".keeeEk.",
    "..kkkk..",
  ],

  feather: [
    "......kk",
    ".....kPk",
    "....kPWk",
    "...kPWPk",
    "..kPWPk.",
    "..kWPPk.",
    ".kPWPk..",
    ".kWPk...",
    "kPPk....",
    "kkk.....",
    "k.......",
  ],

  coin: [
    "..kkkk..",
    ".kyyyyk.",
    "kyYWyyYk",
    "kyWyyyYk",
    "kyyyyyYk",
    "kyyyyYYk",
    ".kYYYYk.",
    "..kkkk..",
  ],

  map: [
    "kkkkkkkkkk",
    "kTTTTTTTwk",
    "kTnnTTeTek",
    "kTTnTTTeTk",
    "kTTTnTeTek",
    "kTTTTnTTTk",
    "kwTTTTTTTk",
    "kkkkkkkkkk",
  ],

  note: [
    "kkkkkkk.",
    "kwwwwwkk",
    "kwiiiwwk",
    "kwwwwwwk",
    "kwiiiiwk",
    "kwwwwwwk",
    "kwiiwwwk",
    "kwwwwwwk",
    "kkkkkkkk",
  ],

  envelope: [
    "kkkkkkkkkkkk",
    "kwkwwwwwwkwk",
    "kwwkwwwwkwwk",
    "kwwwkrrkwwwk",
    "kwwwwkkwwwwk",
    "kwwwwwwwwwwk",
    "kwwwwwwwwwwk",
    "kkkkkkkkkkkk",
  ],

  heart: sym(
    [".kk..", "krrkk", "krWrr", "krrrr", ".krrr", "..krr", "...kr", "....k"],
    true,
  ),

  star: ["...y...", "...y...", "..yWy..", "yyWWWyy", "..yWy..", "...y...", "...y..."],

  hourglass: sym(["kkkk", "knnn", ".kBB", ".kyy", "..ky", "..ky", ".kBy", ".kyy", "knnn", "kkkk"]),

  seal: sym(["..kkk", ".kYyy", "kYyWy", "kyyky", "kyyyy", ".kyyy", "..kek", ".kek.", ".kk.."], true),

  mushroom: sym(["..kk", ".kmm", "kmWm", "kmmm", "kkkk", "..kw", "..kw", "..kw", ".kkk"]),

  mailbox: sym([
    ".kkkk",
    "keeee",
    "keEEE",
    "keEkk",
    "keEkw",
    "keeee",
    "keeee",
    ".kkkk",
    "...kA",
    "...kA",
    "...kA",
    "...kA",
    "..kkk",
  ]),

  folder: [
    "kkkkk.........",
    "kYYYYk........",
    "kYYYYYkkkkkkkk",
    "kyyyyyyyyyyyyk",
    "kyWyyyyyyyyyyk",
    "kyyyyyyyyyyyyk",
    "kyyyyyyyyyyyyk",
    "kyyyyyyyyyyyyk",
    "kYYYYYYYYYYYYk",
    "kkkkkkkkkkkkkk",
  ],

  rock: sym(["....kkkk", "..kkaaaa", ".kaiaaaa", "kaiiaaaa", "kaiaaaaa", "kaaaaaAA", "kAAAAAAA", ".kkkkkkk"]),

  sparkle: ["..W..", ".WyW.", "WyWyW", ".WyW.", "..W.."],

  discordIcon: [
    ".kkk..kkk.",
    "kPPPkkPPPk",
    "kPPPPPPPPk",
    "kPWkPPWkPk",
    "kPkkPPkkPk",
    "kPPPPPPPPk",
    ".kPPkkPPk.",
    "..kk..kk..",
  ],

  artemTall: sym([
    "......kkk",
    "....kkhhh",
    "...khhxhh",
    "..khhxhhh",
    "..khxhhhh",
    ".khhhhHHh",
    ".khhHHsss",
    ".khhSssss",
    ".khhsskks",
    ".khhsskWs",
    ".khhrssss",
    ".khhsssks",
    ".khhHsssk",
    ".khhhSsss",
    ".khhhhSSS",
    ".khhhhkss",
    ".khhhcCcc",
    "khhhcCCcc",
    "khhcCcccc",
    "khxcCcccc",
    "khcCcccwc",
    "kkcCcccwc",
    ".kcCccccc",
    ".kcCccccc",
    ".kscCcccc",
    ".kSkcccCc",
    "..kcccccc",
    "..kjbbbbb",
    "..kjbbbbb",
    "..kjbbbk.",
    "..kjbbbk.",
    "..kjbbbk.",
    "..kjbbbk.",
    "..kjbbbk.",
    "..kKKKKk.",
    ".kKKKKKk.",
    ".kkkkkkk.",
  ]),

  nastyaTall: sym([
    "......kkk",
    "....kklll",
    "...kllzll",
    "..kllzlll",
    "..klzllll",
    ".kllllLLl",
    ".kllLLsss",
    ".kllSssss",
    ".kllsskks",
    ".kllsskWs",
    ".kllrssss",
    ".kllsssks",
    ".kllLsssk",
    ".klllSsss",
    "klllllSSS",
    "kllzllkss",
    "klzlllPuu",
    "kllllPuuu",
    "klllLPuuu",
    "kllzlPuuu",
    "klllLPuuu",
    "kllllPuuu",
    ".kllkPuuu",
    "..kkPuuuu",
    "..ksPuuuu",
    "..kSkuuPu",
    "..kuuuuuu",
    "..kBBBBBB",
    "..kiBBBBB",
    "..kiBBBk.",
    "..kiBBBk.",
    "..kiBBBk.",
    "..kiBBBk.",
    "..kiBBBk.",
    "..kRRRRk.",
    ".kRRRRRk.",
    ".kkkkkkk.",
  ]),

  // Grey miniature schnauzer sitting, facing right: bushy brows, long beard, light leg furnishings.
  schnauzerSide: [
    "..........kkkk..........",
    ".........kAAAAk.........",
    "........kAaaaAAkkkkk....",
    "........kaaaaaaaaaaak...",
    "........kaaiiiiiaaaaak..",
    "........kaakkWiiaaaaaakk",
    "........kaaaaaaaaaaaaKKk",
    "........kaaaaiiiiiiiiiik",
    ".........kaaiiiiiiiiiik.",
    ".........kaaiiiiiiiiik..",
    "..kk.....kaaaiiiiiiik...",
    "..kAk...kaaaaiiiiik.....",
    "...kAkkkAAAAAAaaak......",
    "...kAAAAAAAAAAaaik......",
    "..kaAAAAAAAAAaaaiik.....",
    "..kaaaaaaaaaaaaiiik.....",
    "..kaaaaaAaaaaaiiiik.....",
    "..kaaaaAAaaaakiiiik.....",
    "..kaaaAAAaaaakiiik......",
    "..kiiiiikiiiikiiik......",
    "...kkkkkk.kkkkkkk.......",
  ],

  // Golden retriever sitting, facing left: floppy ears, fluffy chest, feathered tail.
  retrieverSide: [
    ".......kkkk...............",
    ".....kkyyyykk.............",
    "....kyyyyyyyyk............",
    "...kyyyyyyyooyk...........",
    "..kyykWyyyyoooyk..........",
    ".kyyyyyyyyyoooyk..........",
    "kKyyyyyyyyyoooyk..........",
    "kkyyTTyyyyyoooyk..........",
    ".krryTyyyyyooyk...........",
    "..kkyyyyyyyyyyk...........",
    "....kTTyyyyyyyykk.........",
    "...kTTTyyyyyyyyyykk.......",
    "...kTTyyyyyyyyyyyyyk......",
    "...kTyyyyyyyyyyyyyyyk.....",
    "...kTyyyyyyyyyyyooyyk...kk",
    "...kyyyyyyyyyyyoooyyk.kyyk",
    "...kyyyykyyyyyyoooyyykyyk.",
    "...kyyyykyyyyyyyoyyyyyyk..",
    "...kyyyykyyyyyyyyyyyyyk...",
    "..kTyyyykTyyyyyyyyyyyk....",
    "..kkkkkk.kkkkkkkkkkkk.....",
  ],

  bin: [
    ".kkkkkk.",
    "kiiiiiik",
    "kkkkkkkk",
    ".kaiaik.",
    ".kaiaik.",
    ".kaiaik.",
    ".kaiaik.",
    ".kkkkkk.",
  ],

  candleGold: sym(["..y", ".yW", "..k", ".ky", ".ky", ".kY", ".ky", ".kY", "kkk"], true),
};

SPRITES.silverKey = recolor(SPRITES.key, { y: "i", Y: "a" });
SPRITES.bubaHappy = SPRITES.buba.map((row, i) => (i === 4 ? row.replace("kW", "kk").replace("Wk", "kk") : row));

export function spriteSize(name: string) {
  const g = SPRITES[name];
  if (!g) return { w: 1, h: 1 };
  return { w: Math.max(...g.map((r) => r.length)), h: g.length };
}

const cache = new Map<string, string>();

/** Render a sprite into a PNG data URL (1 canvas pixel per sprite pixel). */
export function spriteUrl(name: string): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const g = SPRITES[name];
  if (!g || typeof document === "undefined") return "";
  const { w, h } = spriteSize(name);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  g.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = PALETTE[row[x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  const url = canvas.toDataURL();
  cache.set(name, url);
  return url;
}
