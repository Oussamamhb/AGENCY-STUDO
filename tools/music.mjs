// Synthesize an original music bed in code, on an exact beat grid.
//   node tools/music.mjs --out public/<video>/track.wav [--bpm 120] [--bars 8] [--root 57] [--seed 1]
// Also writes <out>.beats.json (same shape as tools/beats.py) so the animation can
// read the grid without measuring. Arrangement: intro (kick + pluck), build (hats,
// bass), full groove, and a held final chord that resolves on the last downbeat.
import { writeFileSync } from "node:fs";
import { noiseGen, writeWav } from "./wav.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf("--" + k);
  return i >= 0 ? argv[i + 1] : d;
};
const OUT = opt("out", "out/track.wav");
const BPM = Number(opt("bpm", 120));
const BARS = Math.max(2, Number(opt("bars", 8)));
const ROOT = Number(opt("root", 57)); // MIDI note, 57 = A3 (A minor)
const SR = 48000;
const beat = 60 / BPM;
const bar = beat * 4;
const TAIL = 2 * beat;
const buf = new Float32Array(Math.ceil((BARS * bar + TAIL) * SR));
const noise = noiseGen(Number(opt("seed", 1)));
const TAU = 2 * Math.PI;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// i - VI - III - VII (e.g. Am F C G), as semitone offsets from the root.
const PROG = [
  [0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5],
];

function add(t0, len, fn, gain = 1) {
  const s = Math.floor(t0 * SR);
  for (let i = 0; i < len * SR && s + i < buf.length; i++) buf[s + i] += fn(i / SR) * gain;
}
const kick = (t) => Math.sin(TAU * (50 * t + 70 * (1 - Math.exp(-t * 30)) / 30)) * Math.exp(-t * 7);
const hat = () => { let p = 0; return (t) => { const n = noise(); const hp = n - p; p = n; return hp * Math.exp(-t * 60); }; };
const clap = () => { let p = 0; return (t) => { const n = noise(); const hp = n - p * 0.6; p = n; return hp * Math.exp(-t * 18) * (t < 0.012 ? 1.4 : 1); }; };
const pluck = (f) => (t) => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t)) * Math.exp(-t * 7);
const bass = (f, len) => (t) => Math.tanh(1.8 * Math.sin(TAU * f * t)) * Math.min(1, t * 200) * Math.min(1, (len - t) * 40);

// Sidechain: duck the bass/chords right after each kick.
const kicks = [];

for (let b = 0; b < BARS; b++) {
  const t0 = b * bar;
  const chord = PROG[b % PROG.length];
  const last = b === BARS - 1;
  const section = b < 2 ? "intro" : b < 4 ? "build" : "full";

  // Kick: bar downbeat in the intro, four on the floor after.
  for (let k = 0; k < 4; k++) {
    if (section === "intro" && k % 2) continue;
    if (last && k > 0) continue;
    kicks.push(t0 + k * beat);
    add(t0 + k * beat, 0.45, kick, 0.9);
  }
  // Claps on 2 and 4 in the full section.
  if (section === "full" && !last) for (const k of [1, 3]) add(t0 + k * beat, 0.25, clap(), 0.35);
  // Off-beat hats from the build on.
  if (section !== "intro" && !last) {
    for (let e = 0; e < 8; e++) add(t0 + e * beat / 2, 0.06, hat(), e % 2 ? 0.22 : 0.1);
  }
  // Bass: eighth-note pulse on the chord root.
  if (section !== "intro") {
    const f = hz(ROOT - 12 + chord[0]);
    const steps = last ? 1 : 8;
    const len = last ? bar : beat / 2 * 0.9;
    for (let e = 0; e < steps; e++) add(t0 + e * beat / 2, len, bass(f, len), 0.28);
  }
  // Pluck arpeggio, sixteenths; held chord on the final bar.
  if (last) {
    for (const n of chord) add(t0, bar + TAIL, (t) => pluck(hz(ROOT + 12 + n))(t * 0.35), 0.18);
  } else {
    for (let s = 0; s < 16; s++) {
      const n = chord[s % 3] + (s % 6 < 3 ? 12 : 24);
      add(t0 + s * beat / 4, 0.4, pluck(hz(ROOT + n)), s % 4 === 0 ? 0.13 : 0.08);
    }
  }
  // Riser into the full section.
  if (b === 3) add(t0 + bar / 2, bar / 2, (t) => noise() * (t / (bar / 2)) ** 2 * 0.25, 1);
}

// Sidechain duck applied to everything except the kick itself (approximation:
// gentle dip after each kick keeps the low end clean).
for (const k of kicks) {
  const s = Math.floor(k * SR);
  for (let i = 0; i < 0.12 * SR && s + i < buf.length; i++) buf[s + i] *= 0.75 + 0.25 * (i / (0.12 * SR));
}

// Normalise to -1 dBFS peak.
let peak = 0;
for (const v of buf) peak = Math.max(peak, Math.abs(v));
const g = 0.89 / (peak || 1);
for (let i = 0; i < buf.length; i++) buf[i] *= g;

writeWav(OUT, buf, SR);
const beats = Array.from({ length: BARS * 4 + 1 }, (_, i) => +(i * beat).toFixed(3));
writeFileSync(OUT.replace(/\.wav$/, "") + ".beats.json", JSON.stringify({
  bpm: BPM,
  duration: +(buf.length / SR).toFixed(3),
  beats,
  downbeats: beats.filter((_, i) => i % 4 === 0),
  hits: kicks.map((k) => +k.toFixed(3)),
}, null, 1));
console.log(`music: ${BARS} bars at ${BPM} BPM (${(BARS * bar).toFixed(1)}s) -> ${OUT}`);
