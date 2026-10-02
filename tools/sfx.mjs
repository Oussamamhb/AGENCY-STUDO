// Synthesize UI / motion-design sound effects on a timeline (seeded, identical every run).
//   node tools/sfx.mjs cues.json out/<video>/sfx.wav
//   cues.json: [{"t": 0.5, "type": "click"}, {"t": 2, "type": "whoosh", "gain": 0.8}, ...]
// UI:      click (mouse click-clack), tick, key (typing), pop, swipe, whoosh, thump, stamp
// Impacts: impact (word slam), boom (the drop / final hit, long tail)
// Build:   riser {dur}, reverse {dur} (reverse swell that ends on the next hit)
// Tonal:   success (two-note chime), error (double buzz)
// Motion:  liquid {dur} (goo morph / liquid wipe), glitch (digital chaos)
// Optional per cue: gain, dur (riser/reverse/liquid/swipe/whoosh), wet (reverb send 0..1),
// pitch (multiplier). Place cues on the beat grid when there is music.
import { readFileSync } from "node:fs";
import { noiseGen, writeWav } from "./wav.mjs";

const SR = 48000;
const TAU = 2 * Math.PI;
const cues = JSON.parse(readFileSync(process.argv[2], "utf8"));

// ── small DSP helpers ─────────────────────────────────────────────────────────
// State-variable filter; call with a cutoff per sample so sweeps are smooth.
function svf(q = 0.7) {
  let low = 0, band = 0;
  return (x, fc) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return { low, band, high };
  };
}
const expGlide = (a, b, p) => a * Math.pow(b / a, Math.min(1, Math.max(0, p)));
// Oscillator whose frequency changes over time (phase accumulates, no clicks).
function osc() {
  let ph = 0;
  return (freq) => { ph += (TAU * freq) / SR; return Math.sin(ph); };
}

// Each voice renders into a Float32Array. `n` = seeded noise for this cue.
const VOICES = {
  click({ n }) {
    const len = 0.09, out = new Float32Array(Math.ceil(len * SR));
    const bp = svf(0.6);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const hit = (dt, g) => (t >= dt ? g * Math.exp(-(t - dt) * 900) : 0);
      const e = hit(0, 1) + hit(0.042, 0.45);
      const body = (t < 0.03 ? Math.sin(TAU * 190 * t) * Math.exp(-t * 140) * 0.25 : 0);
      out[i] = bp(n() * e, 3600).band * 1.6 + Math.sin(TAU * 2100 * t) * e * 0.18 + body;
    }
    return out;
  },
  tick({ n, pitch }) {
    const out = new Float32Array(Math.ceil(0.03 * SR));
    const bp = svf(0.5);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR, e = Math.exp(-t * 1300);
      out[i] = bp(n() * e, 5200 * pitch).band * 1.2 + Math.sin(TAU * 2600 * pitch * t) * e * 0.2;
    }
    return out;
  },
  key({ n, pitch }) {
    const out = new Float32Array(Math.ceil(0.05 * SR));
    const bp = svf(0.8);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR, e = Math.exp(-t * 700);
      out[i] = bp(n() * e, 2400 * pitch).band * 1.3 + Math.sin(TAU * 320 * pitch * t) * Math.exp(-t * 200) * 0.18;
    }
    return out;
  },
  pop({ pitch }) {
    const out = new Float32Array(Math.ceil(0.2 * SR));
    const o = osc(), lp = svf(0.9);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const f = expGlide(300, 820, t / 0.05) * pitch;
      const e = Math.min(1, t / 0.003) * Math.exp(-t * 26);
      out[i] = lp(o(f) * e * 0.55, 2500).low;
    }
    return out;
  },
  swipe({ n, dur }) {
    const d = dur ?? 0.22, out = new Float32Array(Math.ceil(d * SR));
    const bp = svf(0.55);
    for (let i = 0; i < out.length; i++) {
      const p = i / out.length;
      out[i] = bp(n(), expGlide(900, 6500, p)).band * Math.pow(Math.sin(Math.PI * p), 1.5) * 0.55;
    }
    return out;
  },
  whoosh({ n, dur }) {
    const d = dur ?? 0.5, out = new Float32Array(Math.ceil(d * SR));
    const bp = svf(0.7), lp = svf(0.7);
    for (let i = 0; i < out.length; i++) {
      const p = i / out.length;
      const fc = p < 0.6 ? expGlide(250, 2600, p / 0.6) : expGlide(2600, 700, (p - 0.6) / 0.4);
      const e = p < 0.6 ? Math.pow(p / 0.6, 2) : Math.pow(1 - (p - 0.6) / 0.4, 1.4);
      const x = n();
      out[i] = (bp(x, fc).band * 0.75 + lp(x, 180).low * 0.5) * e;
    }
    return out;
  },
  thump({ n, pitch }) {
    const out = new Float32Array(Math.ceil(0.5 * SR));
    const o = osc(), lp = svf(0.7);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      out[i] = o(expGlide(115, 42, t / 0.3) * pitch) * Math.exp(-t * 10) * 0.9 + lp(n(), 900).low * Math.exp(-t * 90) * 0.6;
    }
    return out;
  },
  stamp({ n }) {
    const out = new Float32Array(Math.ceil(0.45 * SR));
    const o = osc(), bp = svf(0.8), hp = svf(0.7);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR, x = n();
      out[i] = o(expGlide(150, 55, t / 0.15)) * Math.exp(-t * 16) * 0.95
        + bp(x, 1400).band * Math.exp(-t * 40) * 1.1
        + hp(x, 5000).high * Math.exp(-t * 130) * 0.35;
    }
    return out;
  },
  impact({ n, pitch }) {
    const out = new Float32Array(Math.ceil(1.4 * SR));
    const sub = osc(), punch = osc(), hp = svf(0.7), bp = svf(1.2);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR, x = n();
      const s = sub(expGlide(62, 32, t / 0.9) * pitch) * Math.exp(-t * 3.2)
        + punch(expGlide(170, 55, t / 0.08) * pitch) * Math.exp(-t * 24) * 0.8
        + hp(x, 3500).high * Math.exp(-t * 55) * 0.55
        + bp(x, 900).band * Math.exp(-t * 11) * 0.35;
      out[i] = Math.tanh(s * 1.2) * 0.85;
    }
    return out;
  },
  boom({ n, pitch }) {
    const out = new Float32Array(Math.ceil(3.2 * SR));
    const sub = osc(), punch = osc(), hp = svf(0.7), lp = svf(0.6);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR, x = n();
      const s = sub(expGlide(55, 28, t / 1.6) * pitch) * Math.exp(-t * 1.5) * 1.1
        + punch(expGlide(150, 45, t / 0.1) * pitch) * Math.exp(-t * 16)
        + hp(x, 3000).high * Math.exp(-t * 35) * 0.5
        + lp(x, expGlide(3000, 250, t / 2)).low * Math.exp(-t * 2.2) * 0.45;
      out[i] = Math.tanh(s * 1.3) * 0.9;
    }
    return out;
  },
  riser({ n, dur }) {
    const d = dur ?? 2, out = new Float32Array(Math.ceil(d * SR));
    const bp = svf(0.45), o = osc();
    for (let i = 0; i < out.length; i++) {
      const p = i / out.length;
      const g = Math.pow(p, 2.2) * Math.min(1, (out.length - i) / (0.015 * SR));
      const tone = o(expGlide(110, 880, p) * (1 + 0.006 * Math.sin(TAU * 5 * p * d))) * 0.18;
      out[i] = (bp(n(), expGlide(300, 7500, p)).band * 0.8 + tone) * g;
    }
    return out;
  },
  reverse({ n, dur }) {
    const d = dur ?? 0.8, out = new Float32Array(Math.ceil(d * SR));
    const lp = svf(0.6);
    for (let i = 0; i < out.length; i++) {
      const p = i / out.length;
      out[i] = lp(n(), expGlide(400, 9000, p)).low * Math.pow(p, 3) * Math.min(1, (out.length - i) / (0.004 * SR)) * 0.9;
    }
    return out;
  },
  success({ pitch }) {
    const out = new Float32Array(Math.ceil(0.9 * SR));
    const notes = [[0, 1318.5], [0.075, 1760]];
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      let s = 0;
      for (const [dt, f0] of notes) {
        if (t < dt) continue;
        const u = t - dt, f = f0 * pitch, a = Math.min(1, u / 0.002);
        s += a * (Math.sin(TAU * f * u) * Math.exp(-u * 6) + Math.sin(TAU * f * 2.76 * u) * Math.exp(-u * 18) * 0.25 + Math.sin(TAU * f * 5.4 * u) * Math.exp(-u * 40) * 0.08);
      }
      out[i] = s * 0.3;
    }
    return out;
  },
  error() {
    const out = new Float32Array(Math.ceil(0.25 * SR));
    const lp = svf(0.8);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const on = (t < 0.06 ? 1 : 0) + (t > 0.09 && t < 0.15 ? 1 : 0);
      out[i] = lp(Math.tanh(Math.sin(TAU * 185 * t) * 4) * on, 1800).low * 0.35;
    }
    return out;
  },
  liquid({ n, dur }) {
    const d = dur ?? 0.7, out = new Float32Array(Math.ceil(d * SR));
    const o = osc(), lp = svf(0.9), lpn = svf(0.7);
    const bubbles = Array.from({ length: 7 }, (_, k) => [((k + 0.3 + n() * 0.4) / 7.5) * d, 420 + (n() + 1) * 260]);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR, p = t / d;
      const f = expGlide(85, 260, p) * (1 + 0.28 * Math.sin(TAU * 11 * t));
      let s = lp(o(f), 600).low * Math.sin(Math.PI * p) * 0.8 + lpn(n(), expGlide(300, 1800, Math.sin(Math.PI * p))).low * Math.sin(Math.PI * p) * 0.35;
      for (const [bt, bf] of bubbles) {
        if (t < bt) continue;
        const u = t - bt;
        if (u < 0.08) s += Math.sin(TAU * bf * (1 + u * 12) * u) * Math.exp(-u * 60) * 0.22;
      }
      out[i] = s;
    }
    return out;
  },
  glitch({ n, pitch }) {
    const out = new Float32Array(Math.ceil(0.06 * SR));
    const bp = svf(1.4);
    let held = 0;
    const hold = Math.round(SR / (2600 * pitch));
    for (let i = 0; i < out.length; i++) {
      if (i % hold === 0) held = Math.round(n() * 4) / 4;
      const e = Math.min(1, i / 60) * Math.min(1, (out.length - i) / 120);
      out[i] = bp(held, 2200 * pitch).band * e * 0.5;
    }
    return out;
  },
};
// default reverb send per voice
const WET = { whoosh: 0.25, impact: 0.35, boom: 0.5, riser: 0.3, success: 0.4, liquid: 0.3, stamp: 0.2, swipe: 0.12, pop: 0.1 };

// ── render the timeline ───────────────────────────────────────────────────────
const rendered = cues.map((c, k) => {
  const voice = VOICES[c.type];
  if (!voice) throw new Error(`Unknown sound type "${c.type}". Use: ${Object.keys(VOICES).join(", ")}`);
  return voice({ n: noiseGen(1000 + k * 7919), dur: c.dur, pitch: c.pitch ?? 1 });
});
const end = Math.max(...cues.map((c, k) => c.t + rendered[k].length / SR)) + 2;
const N = Math.ceil(end * SR);
const dry = new Float32Array(N), wet = new Float32Array(N);
cues.forEach((c, k) => {
  const buf = rendered[k], g = c.gain ?? 1, w = c.wet ?? WET[c.type] ?? 0, start = Math.round(c.t * SR);
  for (let i = 0; i < buf.length && start + i < N; i++) {
    if (start + i < 0) continue;
    dry[start + i] += buf[i] * g;
    wet[start + i] += buf[i] * g * w;
  }
});

// Schroeder reverb on the send
function reverb(input) {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ d: Math.round((d * SR) / 44100), i: 0 })).map((c) => ({ ...c, buf: new Float32Array(c.d) }));
  const aps = [225, 556].map((d) => ({ d: Math.round((d * SR) / 44100), i: 0 })).map((a) => ({ ...a, buf: new Float32Array(a.d) }));
  const out = new Float32Array(input.length);
  for (let n = 0; n < input.length; n++) {
    let s = 0;
    for (const c of combs) { const y = c.buf[c.i]; c.buf[c.i] = input[n] + y * 0.78; c.i = (c.i + 1) % c.d; s += y; }
    s /= combs.length;
    for (const a of aps) { const y = a.buf[a.i]; const v = -s + y; a.buf[a.i] = s + y * 0.5; a.i = (a.i + 1) % a.d; s = v; }
    out[n] = s;
  }
  return out;
}
const rv = reverb(wet);
const mix = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) { mix[i] = Math.tanh((dry[i] + rv[i] * 0.8) * 0.95); peak = Math.max(peak, Math.abs(mix[i])); }
for (let i = 0; i < N; i++) mix[i] *= 0.89 / peak;

writeWav(process.argv[3], mix, SR);
console.log(`sfx: ${cues.length} cues -> ${process.argv[3]}`);
