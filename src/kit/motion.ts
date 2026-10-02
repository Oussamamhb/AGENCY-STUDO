import type React from "react";
import { Easing } from "remotion";
import { SPRINGS, clamp, spring, track } from "../../lib/motion.js";

// Closed-form springs as a function of local time (seconds since the element's start).
// snappy = UI, default = containers, heavy = numbers/type, playful = pops with a tiny overshoot.
export const sp = (t: number, kind: keyof typeof SPRINGS = "default") =>
  spring(t, SPRINGS[kind].k, SPRINGS[kind].d);

// Scene visibility helper: local time and whether the scene is on screen.
export const within = (t: number, from: number, to: number) => t >= from && t < to;

// Pop: scale from 0 with a spring, optional rotation settle.
export const pop = (t: number, at: number, kind: "snappy" | "default" | "heavy" | "playful" = "snappy", rot = 0): React.CSSProperties => {
  const p = sp(t - at, kind);
  return { transform: `scale(${p}) rotate(${(1 - p) * rot}deg)`, opacity: clamp(p * 3) };
};
// Rise: move up into place with a short blur.
export const rise = (t: number, at: number, dist: number, kind: "snappy" | "default" | "heavy" = "default"): React.CSSProperties => {
  const p = sp(t - at, kind);
  const b = (1 - p) * 12;
  return { transform: `translateY(${(1 - p) * dist}px)`, opacity: clamp(p * 1.6), filter: b > 0.4 ? `blur(${b}px)` : undefined };
};
// Grow width from 0 (container unfolds from its left edge).
export const unfold = (t: number, at: number): React.CSSProperties => {
  const p = sp(t - at, "default");
  return { clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 16px)`, transform: `translateX(${(1 - p) * -20}px)` };
};
// Whip: a scene's exit, pushed sideways with motion blur.
export const whip = (t: number, out: number, w: number): React.CSSProperties => {
  const q = sp(t - out, "snappy");
  if (q < 0.001) return {};
  return { transform: `translateX(${-q * w * 0.35}px) scale(${1 - q * 0.04})`, filter: `blur(${Math.min(30, q * 40)}px)`, opacity: 1 - q };
};
export const enterWhip = (t: number, w: number): React.CSSProperties => {
  const p = sp(t, "snappy");
  if (p > 0.999) return {};
  return { transform: `translateX(${(1 - p) * w * 0.3}px)`, filter: p < 0.98 ? `blur(${(1 - p) * 30}px)` : undefined };
};

// Fade-and-blur in helper for any block.
export const blurIn = (t: number, at: number, dist = 30, exitAt = 999): React.CSSProperties => {
  const p = sp(t - at, "default");
  const q = clamp((t - exitAt) / 0.3);
  const b = (1 - p) * 16 + q * 24;
  return { opacity: clamp(p * 1.4) * (1 - q), filter: b > 0.3 ? `blur(${b}px)` : undefined, transform: `translateY(${(1 - p) * dist}px)` };
};

// Velocity-based blur for a value that moves fast (pure function of time).
export const speedBlur = (f: (t: number) => number, t: number, k = 0.02, max = 18) =>
  Math.min(max, Math.abs(f(t) - f(t - 1 / 60)) * 60 * k);

// ── Community-craft helpers (videos/craft/motion-craft.md) ─────────────────
// Loop-safe track: every step is also added one loop later (t + T), so the last frame equals the
// first in position and velocity.
export const loopTrack = (t: number, keys: [number, number][], T: number, kind: keyof typeof SPRINGS = "default") => {
  const { k, d } = SPRINGS[kind];
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const dv = keys[i][1] - keys[i - 1][1];
    v += dv * spring(t - keys[i][0], k, d) + dv * spring(t + T - keys[i][0], k, d) - dv;
  }
  return v;
};
// 4th-order smooth step (starts and ends at rest, never overshoots). Used for the cursor.
const step4 = (x: number) => {
  const u = clamp(x);
  return u * u * u * (u * (u * 6 - 15) + 10); // quintic smootherstep: zero velocity & acceleration at both ends
};
// Cursor path: keys = [[time, x, y], ...]; moves between keys over `dur` seconds, ending on each key's time.
export const cursorTrack = (t: number, keys: [number, number, number][], dur = 0.45): [number, number] => {
  let x = keys[0][1], y = keys[0][2];
  for (let i = 1; i < keys.length; i++) {
    const e = step4((t - (keys[i][0] - dur)) / dur);
    x += (keys[i][1] - keys[i - 1][1]) * e;
    y += (keys[i][2] - keys[i - 1][2]) * e;
  }
  return [x, y];
};
// Mouse button: down 80 ms before each beat, released on the beat.
export const press = (t: number, beats: number[]) => beats.some((b) => t > b - 0.08 && t < b);
// Text / icon layer inside a morphing container: enters ~70 ms after the shape starts moving,
// ~3 px blur, scale 0.965 → 1; leaves faster before the next morph.
export const swapIn = (t: number, shapeAt: number, exitAt = 999): React.CSSProperties => {
  const p = sp(t - shapeAt - 0.07, "snappy");
  const q = clamp((t - exitAt) / 0.12);
  const a = clamp(p * 1.5) * (1 - q);
  const b = (1 - p) * 3 + q * 3;
  return { opacity: a, transform: `scale(${0.965 + 0.035 * p - q * 0.035})`, filter: b > 0.2 ? `blur(${b}px)` : undefined };
};

// ── Camera: zoom z about a focus point (fx, fy) in design px. Every key is a critically damped
// spring (track), so zooms and pans start and stop at rest. camPt maps a design point to the screen
// (use it to keep a cursor or an overlay glued to what the camera shows).
export type Cam = { fx: number; fy: number; z: number };
export type CamKey = [number, number, number, number]; // [t, fx, fy, z]
export const camAt = (t: number, keys: CamKey[], k = 110, d = 21): Cam => ({
  fx: track(t, keys.map((q) => [q[0], q[1]]), k, d),
  fy: track(t, keys.map((q) => [q[0], q[2]]), k, d),
  z: track(t, keys.map((q) => [q[0], q[3]]), k, d),
});
export const camStyle = (c: Cam, s: number): React.CSSProperties => ({ transform: `scale(${c.z})`, transformOrigin: `${c.fx * s}px ${c.fy * s}px` });
export const camPt = (c: Cam, x: number, y: number): [number, number] => [c.fx + (x - c.fx) * c.z, c.fy + (y - c.fy) * c.z];

// ─────────────────────────────────────────────────────────────────────────────
// Motion tokens (house skill `.claude/skills/studio-house`): named roles, never raw curves or
// durations in scene code. Springs (`sp`) stay the default for UI and containers; these curves
// are for tweens with a fixed length (camera pushes, wipes, exits, fades).
// Enter = decelerate, exit = accelerate and shorter, on-screen move = in-out, opacity = sine.
// ─────────────────────────────────────────────────────────────────────────────
export const MOTION = {
  ease: {
    enter: Easing.bezier(0.23, 1, 0.32, 1), // strong ease-out: entrances, UI responses
    exit: Easing.bezier(0.3, 0, 0.8, 0.15), // accelerate away (M3 emphasized-accelerate)
    move: Easing.bezier(0.77, 0, 0.175, 1), // strong in-out: moves across the frame, pushes
    drawer: Easing.bezier(0.32, 0.72, 0, 1), // iOS sheet: panels sliding in
    decel: Easing.bezier(0.05, 0.7, 0.1, 1), // emphasized decelerate: hero landings
    fade: (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x), // opacity / colour only
  },
  // seconds: micro = press/toggle, ui = cards/panels, surface = full-frame, hero = cinematic moves
  dur: { micro: 0.18, ui: 0.32, surface: 0.5, hero: 0.9, exitK: 0.7 },
  // seconds between items; the last item lands within `cap` of the first
  stagger: { list: 0.05, word: 0.09, char: 0.035, cap: 0.6 },
  press: { scale: 0.97, dur: 0.16 },
  from: { scale: 0.95, y: 16, blur: 8 }, // never enter from scale(0) or with opacity alone
} as const;
export type EaseRole = keyof typeof MOTION.ease;

// 0→1 progress of a fixed-length tween with a named ease role.
export const tween = (t: number, at: number, dur: number, role: EaseRole = "enter") =>
  MOTION.ease[role](clamp((t - at) / dur));

// Start offset of item i of n, capped so the whole stagger fits in MOTION.stagger.cap.
export const staggerAt = (i: number, n: number, step: number = MOTION.stagger.list, cap: number = MOTION.stagger.cap) =>
  i * (n > 1 ? Math.min(step, cap / (n - 1)) : step);

// Standard entrance (+ optional exit): transform + blur + opacity together, never opacity alone.
// Exit runs MOTION.dur.exitK × the entrance length with the accelerate curve.
export const enterUI = (t: number, at: number, dur: number = MOTION.dur.ui, exitAt = 999, s = 1): React.CSSProperties => {
  const p = tween(t, at, dur, "enter");
  const q = tween(t, exitAt, dur * MOTION.dur.exitK, "exit");
  const { scale, y, blur } = MOTION.from;
  return {
    opacity: p * (1 - q),
    transform: `translateY(${((1 - p) * y - q * y) * s}px) scale(${scale + (1 - scale) * p - q * (1 - scale)})`,
    filter: p < 1 || q > 0 ? `blur(${(blur * (1 - p) + blur * q) * s}px)` : undefined,
  };
};
