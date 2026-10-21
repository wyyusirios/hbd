// Tiny 8-bit sound effects synthesized with Web Audio. Everything is optional and quiet.

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

function audio(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "square", vol = 0.05) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  click() {
    tone(660, 0, 0.05, "square", 0.025);
  },
  blip() {
    tone(1200, 0, 0.02, "square", 0.008);
  },
  ok() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.12, "square", 0.035));
  },
  wrong() {
    tone(196, 0, 0.12, "sawtooth", 0.03);
    tone(147, 0.1, 0.18, "sawtooth", 0.03);
  },
  item() {
    [988, 1319, 1568].forEach((f, i) => tone(f, i * 0.06, 0.1, "triangle", 0.05));
  },
  door() {
    [110, 98, 87, 82].forEach((f, i) => tone(f, i * 0.12, 0.2, "triangle", 0.07));
  },
  magic() {
    [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, i * 0.09, 0.25, "triangle", 0.035));
  },
};
