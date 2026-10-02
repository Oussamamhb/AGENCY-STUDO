import React from "react";
import { clamp } from "../../lib/motion.js";
import { sp } from "./motion";
import { C, F } from "./theme";

// Words blur in one by one and blur out together. [accent] marks the accent words.
export const Words: React.FC<{
  text: string; t: number; at: number; size: number; color: string; accent?: string; weight?: number;
  stagger?: number; exitAt?: number; align?: "left" | "center"; tracking?: number; lineHeight?: number; font?: string;
  ats?: number[]; // per-word entry times (lock each word to its spoken word in the VO); overrides at + i * stagger
}> = ({ text, t, at, size, color, accent = C.accent, weight = 800, stagger = 0.07, exitAt = 999, align = "left", tracking = -0.04, lineHeight = 1.02, font = F.ui, ats }) => {
  const lines = text.split("\n");
  const q = clamp((t - exitAt) / 0.3);
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", opacity: 1 - q, filter: q > 0 ? `blur(${q * 24}px)` : undefined }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "nowrap", gap: `0 ${size * 0.26}px`, justifyContent: align === "center" ? "center" : "flex-start" }}>
          {line.split(/(\[[^\]]+\])/).filter(Boolean).flatMap((chunk) => {
            const acc = chunk.startsWith("[");
            return (acc ? chunk.slice(1, -1) : chunk).trim().split(/\s+/).filter(Boolean).map((w) => ({ w, acc }));
          }).map(({ w, acc }, wi) => {
            const i = k++;
            const p = sp(t - (ats?.[i] ?? at + i * stagger), "default");
            if (p <= 0.001) return <span key={wi} style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight, letterSpacing: `${tracking}em`, opacity: 0, whiteSpace: "nowrap" }}>{w}</span>;
            return (
              <span
                key={wi}
                style={{
                  fontFamily: font, fontWeight: weight, fontSize: size, lineHeight, letterSpacing: `${tracking}em`, whiteSpace: "nowrap",
                  color: acc ? accent : color,
                  opacity: clamp(p * 1.4),
                  filter: p < 0.98 ? `blur(${(1 - p) * 18}px)` : undefined,
                  transform: `translateY(${(1 - p) * size * 0.14}px)`,
                  display: "inline-block",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Small uppercase mono label.
export const Label: React.FC<{ children: React.ReactNode; s: number; color: string; size?: number; style?: React.CSSProperties }> = ({ children, s, color, size = 20, style }) => (
  <div style={{ fontFamily: F.mono, fontSize: size * s, letterSpacing: "0.16em", textTransform: "uppercase", color, ...style }}>{children}</div>
);

// ---------------------------------------------------------------------------
// Odometer: digit columns roll like a counter; lower digits carry into higher.
// ---------------------------------------------------------------------------
export const Odometer: React.FC<{
  value: number; digits?: number; size: number; color?: string; font?: string; weight?: number; decimals?: number; separator?: boolean; blur?: number;
}> = ({ value, digits, size, color = C.text, font = F.ui, weight = 800, decimals = 0, separator = true, blur = 0 }) => {
  const v = Math.max(0, value) * Math.pow(10, decimals);
  const n = digits ?? Math.max(1, String(Math.round(v)).length);
  const cols: React.ReactNode[] = [];
  for (let k = n - 1; k >= 0; k--) {
    const p = Math.pow(10, k);
    const base = Math.floor(v / p) % 10;
    const rem = v % p;
    const frac = k === 0 ? v - Math.floor(v) : clamp(rem - (p - 1), 0, 1);
    const pos = base + frac;
    cols.push(
      <span key={k} style={{ display: "inline-block", height: size * 1.0, overflow: "hidden", verticalAlign: "top" }}>
        <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-pos * size}px)`, filter: blur ? `blur(${blur}px)` : undefined }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
            <span key={i} style={{ height: size, lineHeight: `${size}px` }}>{d}</span>
          ))}
        </span>
      </span>,
    );
    const intPos = k - decimals;
    if (decimals > 0 && k === decimals) cols.push(<span key={`dot${k}`}>.</span>);
    if (separator && intPos > 0 && intPos % 3 === 0 && k > decimals) cols.push(<span key={`sep${k}`}>,</span>);
  }
  return (
    <span style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: `${size}px`, color, display: "inline-flex", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
      {cols}
    </span>
  );
};

// Characters rise out of a mask one by one (single line; accentFrom = index where the accent starts).
export const CharRise: React.FC<{ text: string; t: number; at: number; size: number; color: string; accentFrom?: number; accent?: string; weight?: number }> = ({ text, t, at, size, color, accentFrom = 999, accent = C.accent, weight = 800 }) => (
  <div style={{ display: "flex", overflow: "hidden", paddingBottom: size * 0.12 }}>
    {[...text].map((ch, i) => {
      const p = sp(t - at - i * 0.022, "default");
      return (
        <span key={i} style={{ display: "inline-block", whiteSpace: "pre", fontFamily: F.ui, fontWeight: weight, fontSize: size, lineHeight: 1.05, letterSpacing: "-0.035em", color: i >= accentFrom ? accent : color, transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 8}deg)`, opacity: clamp(p * 2) }}>
          {ch}
        </span>
      );
    })}
  </div>
);
