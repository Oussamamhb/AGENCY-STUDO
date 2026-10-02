// Motion toolkit shared by both engines (Remotion and the single-page seek(t) engine).
// Every function is a pure function of time in seconds, so any frame can be
// rendered on its own and every render is identical.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;

// Stiffness (k) and damping (d) presets.
export const SPRINGS = {
  snappy: { k: 320, d: 30 }, // buttons, toggles, leading edges
  default: { k: 170, d: 26 }, // cards, containers, camera
  heavy: { k: 90, d: 20 }, // big type, 3D objects, logo lockups
  playful: { k: 220, d: 14 }, // mascots, stickers (visible overshoot)
};

// Closed-form damped spring step response, 0 -> 1, unit mass.
export function spring(t, k = 170, d = 26) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k);
  const z = d / (2 * w0);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t); // z >= 1 treated as critical
}

// A value that changes target several times: one spring per change, summed.
// keys: [[time, value], ...] sorted by time.
export function track(t, keys, k = 170, d = 26) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], k, d);
  }
  return v;
}

// A tab indicator that stretches: the leading edge is stiffer than the trailing one.
// stops: [[time, x], ...]
export function indicator(t, stops, width = 120) {
  const lead = track(t, stops, 320, 30);
  const trail = track(t, stops, 140, 22);
  return { left: Math.min(lead, trail), right: Math.max(lead, trail) + width };
}

// Text inside a morphing box: fades in just after the morph starts, out just
// before the next one.
export function swapAlpha(t, tIn, tOut) {
  return Math.min(clamp((t - tIn - 0.08) / 0.12), clamp((tOut - 0.1 - t) / 0.1));
}

// Seamless loop: wrap time so the last frame equals the first.
export const loopT = (t, dur) => ((t % dur) + dur) % dur;

// Seeded random numbers (mulberry32). Never use Math.random in a render.
export function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Beat grid helpers. With beats.json from tools/beats.py, prefer its measured times.
export const beatTime = (n, bpm = 120, offset = 0) => offset + (n * 60) / bpm;
export const barTime = (n, bpm = 120, offset = 0, beatsPerBar = 4) =>
  beatTime(n * beatsPerBar, bpm, offset);

// Layout for one timeline rendered in several formats (9:16, 1:1, 16:9).
// Reframe per format instead of cropping.
export function layout(w, h) {
  const aspect = w / h;
  const format = aspect < 0.8 ? "vertical" : aspect > 1.25 ? "wide" : "square";
  const unit = Math.min(w, h) / 100; // 1 unit = 1% of the short side
  return { w, h, aspect, format, unit, cx: w / 2, cy: h / 2 };
}
