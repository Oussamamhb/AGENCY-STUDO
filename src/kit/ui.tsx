import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { clamp, lerp } from "../../lib/motion.js";
import { BRAND, C, F, INK, PAPER, asset, rgba } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Grounds: no dot grids. Soft moving light only.
// ─────────────────────────────────────────────────────────────────────────────
export type Kind = "dark" | "light" | "accent" | "white";
export const Aurora: React.FC<{ t: number; kind: Kind; strength?: number }> = ({ t, kind, strength = 1 }) => {
  const base = kind === "dark" ? BRAND.ground : kind === "light" ? PAPER : kind === "white" ? "#FAFAF8" : C.accent;
  const blobs =
    kind === "dark"
      ? [[rgba(C.accent, 0.20), 0.3, 0.35, 0.55], [rgba(C.accentDeep, 0.55), 0.72, 0.62, 0.65], [rgba(C.accent, 0.10), 0.55, 0.1, 0.4]]
      : kind === "accent"
        ? [["rgba(255,255,255,0.28)", 0.35, 0.3, 0.5], [rgba(C.accentDeep, 0.30), 0.75, 0.8, 0.6]]
        : [[rgba(C.accent, 0.20), 0.25, 1.0, 0.6], [rgba(C.accent, 0.12), 0.85, 0.9, 0.5], ["rgba(255,255,255,0.9)", 0.5, 0.2, 0.6]];
  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      {blobs.map(([c, x, y, r], i) => {
        const dx = Math.sin(t * 0.35 + i * 2.1) * 0.08;
        const dy = Math.cos(t * 0.28 + i * 1.3) * 0.07;
        return (
          <AbsoluteFill
            key={i}
            style={{ background: `radial-gradient(circle at ${((x as number) + dx) * 100}% ${((y as number) + dy) * 100}%, ${c} 0%, rgba(0,0,0,0) ${(r as number) * 100 * strength}%)` }}
          />
        );
      })}
      {kind === "dark" && <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)" }} />}
    </AbsoluteFill>
  );
};

// Glass surface. `tone` = what sits behind it.
export const glass = (tone: "dark" | "light" | "accent", s: number, radius = 22): React.CSSProperties => ({
  background:
    tone === "light"
      ? "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.55) 100%)"
      : tone === "accent"
        ? "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
  backdropFilter: `blur(${24 * s}px) saturate(1.4)`,
  WebkitBackdropFilter: `blur(${24 * s}px) saturate(1.4)`,
  border: `1px solid ${tone === "light" ? "rgba(12,13,15,0.08)" : "rgba(255,255,255,0.22)"}`,
  boxShadow:
    tone === "light"
      ? `0 ${30 * s}px ${70 * s}px rgba(12,40,25,0.16), inset 0 1px 0 rgba(255,255,255,0.9)`
      : `0 ${30 * s}px ${80 * s}px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.28)`,
  borderRadius: radius * s,
});

// Solid product card surface (dark UI from the app).
export const panel = (s: number, radius = 20): React.CSSProperties => ({
  background: "linear-gradient(180deg, #17191D 0%, #111316 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: radius * s,
  boxShadow: `0 ${34 * s}px ${80 * s}px rgba(0,0,0,0.42)`,
});

// Frosted glass fill / surface (darker, for UI cards over busy grounds). u = design scale.
export const glassFill = (u: number, radius: number): React.CSSProperties => ({
  background: "linear-gradient(rgba(214,228,233,0.086), rgba(214,228,233,0.02)), rgba(0,0,0,0.5)",
  backdropFilter: `blur(${20 * u}px) saturate(1.4)`,
  WebkitBackdropFilter: `blur(${20 * u}px) saturate(1.4)`,
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: radius * u,
});
export const glassSurface = (u: number, radius: number): React.CSSProperties => ({
  ...glassFill(u, radius),
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 ${8 * u}px ${24 * u}px ${-8 * u}px rgba(0,0,0,0.6), 0 ${40 * u}px ${80 * u}px rgba(0,0,0,0.35)`,
});
// Idle breathing (opacity 1 → .5 → 1 every 2 s) and a typewriter, both pure functions of t.
export const pulse = (t: number) => 0.75 + 0.25 * Math.cos((t * Math.PI * 2) / 2);
export const typed = (text: string, t: number, at: number, cps = 60) => text.slice(0, clamp(Math.floor((t - at) * cps), 0, text.length));

// ─────────────────────────────────────────────────────────────────────────────
// Small parts
// ─────────────────────────────────────────────────────────────────────────────
// Brand logo on an accent tile (public/brand/logo-mark.svg, a white mark).
export const LogoTile: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.24, background: C.accent, display: "grid", placeItems: "center", flexShrink: 0, ...style }}>
    <Img src={asset("logo-mark-white.svg")} style={{ width: size * 1.0 }} />
  </div>
);

export const Chip: React.FC<{ s: number; children: React.ReactNode; tone?: "dark" | "light" | "accent" | "gold"; size?: number; style?: React.CSSProperties }> = ({ s, children, tone = "dark", size = 18, style }) => {
  const map = {
    dark: { bg: "rgba(255,255,255,0.06)", bd: "rgba(255,255,255,0.14)", fg: C.text },
    light: { bg: "#FFFFFF", bd: "rgba(12,13,15,0.10)", fg: INK },
    accent: { bg: rgba(C.accent, 0.14), bd: rgba(C.accent, 0.45), fg: C.accent },
    gold: { bg: "rgba(255,193,69,0.12)", bd: "rgba(255,193,69,0.45)", fg: C.gold },
  }[tone];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 * s, background: map.bg, border: `1px solid ${map.bd}`, color: map.fg, borderRadius: 8 * s, padding: `${7 * s}px ${12 * s}px`, fontFamily: F.mono, fontWeight: 500, fontSize: size * s, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", ...style }}>
      {children}
    </div>
  );
};

export const Cursor: React.FC<{ x: number; y: number; s: number; down?: boolean; dark?: boolean }> = ({ x, y, s, down, dark }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `scale(${down ? 0.84 : 1})`, transformOrigin: "10% 10%", filter: `drop-shadow(0 ${4 * s}px ${8 * s}px rgba(0,0,0,0.35))`, zIndex: 20 }}>
    <svg width={40 * s} height={40 * s} viewBox="0 0 24 24">
      <path d="M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.13 1.58a2 2 0 0 0-1.43 1.43l-1.58 6.13a.5.5 0 0 1-.95.06z" fill={dark ? INK : "#FFFFFF"} stroke={dark ? "#FFFFFF" : INK} strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  </div>
);

// Click ripple drawn at a point.
export const Ripple: React.FC<{ t: number; at: number; x: number; y: number; s: number; color?: string }> = ({ t, at, x, y, s, color = C.accent }) => {
  const e = clamp((t - at) / 0.5);
  if (e <= 0 || e >= 1) return null;
  const r = lerp(8, 60, 1 - Math.pow(1 - e, 3)) * s;
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${2 * s}px solid ${color}`, opacity: 1 - e, zIndex: 19 }} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Liquid (goo) helpers: shapes drawn inside <Goo> melt into each other.
// ─────────────────────────────────────────────────────────────────────────────
export const Goo: React.FC<{ id: string; w: number; h: number; blur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, w, h, blur = 18, children, style }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>
    <defs>
      <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="b" />
        <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 36 -16" />
      </filter>
    </defs>
    <g filter={`url(#${id})`}>{children}</g>
  </svg>
);

// Full-screen liquid wipe. p: 0..1 covers, 1..2 uncovers. Blobs grow from `origin`, merge,
// then drain away towards the edges.
export const LiquidWipe: React.FC<{ p: number; w: number; h: number; color?: string; origin?: [number, number]; id: string }> = ({ p, w, h, color = C.accent, origin = [0.5, 0.5], id }) => {
  if (p <= 0 || p >= 2) return null;
  const R = Math.hypot(w, h);
  const blobs = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    const d = i === 0 ? 0 : 0.18 + (i % 3) * 0.08;
    return { a, d, delay: i === 0 ? 0 : 0.05 + (i % 4) * 0.06 };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 50 }}>
      <Goo id={id} w={w} h={h} blur={Math.max(w, h) * 0.018}>
        {blobs.map((b, i) => {
          const cover = clamp((p - b.delay) / 0.85);
          const e = cover < 1 ? 1 - Math.pow(1 - cover, 3) : 1;
          const un = p > 1 ? clamp((p - 1 - b.delay * 0.6) / 0.8) : 0;
          const ue = un * un;
          const ox = origin[0] * w + Math.cos(b.a) * b.d * w * (1 + ue * 2.5);
          const oy = origin[1] * h + Math.sin(b.a) * b.d * h * (1 + ue * 2.5);
          const r = lerp(0, R * (i === 0 ? 0.62 : 0.34), e) * (1 - ue);
          return r > 0.5 ? <circle key={i} cx={ox} cy={oy} r={r} fill={color} /> : null;
        })}
      </Goo>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Icons (lucide-style strokes, 24x24 viewBox).
// ---------------------------------------------------------------------------
const ICONS: Record<string, string[]> = {
  gamepad: ["M6 11h4", "M8 9v4", "M15 12h.01", "M18 10h.01", "M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z"],
  sync: ["M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5", "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16", "M16 16h5v5"],
  shield: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "M9 12l2 2 4-4"],
  trend: ["M22 7 13.5 15.5 8.5 10.5 2 17", "M16 7h6v6"],
  cursor: ["M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"],
  star: ["M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"],
  trophy: ["M6 9H4.5a2.5 2.5 0 0 1 0-5H6", "M18 9h1.5a2.5 2.5 0 0 0 0-5H18", "M4 22h16", "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22", "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22", "M18 2H6v7a6 6 0 0 0 12 0V2Z"],
};
export const Icon: React.FC<{ name: keyof typeof ICONS | string; size: number; color?: string; stroke?: number; fill?: string }> = ({ name, size, color = C.text, stroke = 2, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {(ICONS[name] ?? []).map((d, i) => <path key={i} d={d} />)}
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Flood: a shape (circle from `origin`) fills the frame edge to edge in ~0.3 s, overscaling past
// the corners so the whole frame changes together. p: 0..1 floods, 1..2 contracts to `to`.
// ─────────────────────────────────────────────────────────────────────────────
export const Flood: React.FC<{ t: number; at: number; w: number; h: number; origin: [number, number]; to?: [number, number]; color?: string; dur?: number; hold?: number }> = ({ t, at, w, h, origin, to, color = INK, dur = 0.3, hold = 0.5 }) => {
  const R = Math.hypot(w, h) * 1.15;
  const inP = clamp((t - at) / dur);
  const outP = to ? clamp((t - at - dur - hold) / dur) : 0;
  if (inP <= 0 || outP >= 1) return null;
  const e = (x: number) => 1 - Math.pow(1 - x, 3);
  const r = lerp(0, R, e(inP)) * (1 - e(outP));
  const cx = lerp(origin[0], to ? to[0] : origin[0], outP) * w;
  const cy = lerp(origin[1], to ? to[1] : origin[1], outP) * h;
  return <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", background: color, zIndex: 60, pointerEvents: "none" }} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Motion blur for finals: renders the film `samples` times per frame across the shutter and
// blends them (the community's "4 sub-frames + tmix"). Children must read time themselves
// (useTime), so wrap the whole film component: <MotionBlur on={mb}><Film .../></MotionBlur>.
// 4× render time: keep it off for stills and previews.
// ─────────────────────────────────────────────────────────────────────────────
export const MotionBlur: React.FC<{ on?: boolean; samples?: number; shutter?: number; children: React.ReactNode }> = ({ on, samples = 4, shutter = 180, children }) =>
  on ? <CameraMotionBlur samples={samples} shutterAngle={shutter}>{children}</CameraMotionBlur> : <>{children}</>;

// ─────────────────────────────────────────────────────────────────────────────
// Texture: film grain on top of everything (kills the flat "AI video" look). A small seeded
// noise tile re-rolled 24 times a second (film cadence), tiled across the frame: deterministic
// for a given t, cheap to render. `amount` ~0.05-0.09 on dark films. Put it last, above the UI.
// ─────────────────────────────────────────────────────────────────────────────
export const Grain: React.FC<{ t: number; amount?: number; s?: number; fps?: number }> = ({ t, amount = 0.07, s = 1, fps = 24 }) => {
  const seed = Math.floor(t * fps) % 97;
  const tile = Math.round(220 * s);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='${(0.9 / s).toFixed(3)}' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.6 -0.3'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: amount, mixBlendMode: "overlay", backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`, backgroundSize: `${tile}px ${tile}px` }} />
  );
};
