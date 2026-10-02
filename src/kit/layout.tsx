import React from "react";
import { clamp } from "../../lib/motion.js";
import { useFmt } from "./format";
import { blurIn, sp } from "./motion";
import { C, F, DEEP, INK } from "./theme";
import { Label, Words } from "./type";
import { LogoTile, glass } from "./ui";

// Glass "search bar" pill: logo tile pops in, the text types itself (24 chars/s) with an accent caret.
export const GlassPill: React.FC<{ t: number; s: number; text: string; tone: "dark" | "light" | "accent"; appearAt?: number; y: number; scale?: number }> = ({ t, s, text, tone, appearAt = 0, y, scale = 1 }) => {
  const dot = sp(t - appearAt, "playful");
  const tileIn = sp(t - appearAt - 0.1, "playful");
  const n = clamp(Math.floor((t - appearAt - 0.55) * 24), 0, text.length);
  const caret = n < text.length || Math.floor(t * 2.2) % 2 === 0;
  const fg = tone === "light" ? INK : "#FFFFFF";
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", transform: `scale(${scale})`, transformOrigin: "50% 0%" }}>
      <div style={{ ...glass(tone, s, 44), height: 84 * s, borderRadius: 44 * s, display: "inline-flex", alignItems: "center", gap: 18 * s, padding: `0 ${n > 0 ? 34 * s : 14 * s}px 0 ${14 * s}px`, transform: `scale(${dot})` }}>
        <LogoTile size={56 * s} style={{ transform: `scale(${tileIn}) rotate(${(1 - sp(t - appearAt - 0.1, "snappy")) * -60}deg)` }} />
        {n > 0 && (
          <div style={{ display: "flex", alignItems: "center", height: 56 * s, fontFamily: F.ui, fontWeight: 600, fontSize: 32 * s, lineHeight: 1, letterSpacing: "-0.01em", color: fg, whiteSpace: "pre" }}>
            <span style={{ paddingTop: 2 * s }}>{text.slice(0, n)}</span>
            <span style={{ width: 3 * s, height: 34 * s, borderRadius: 2 * s, background: C.accent, marginLeft: 5 * s, opacity: caret ? 1 : 0 }} />
          </div>
        )}
      </div>
    </div>
  );
};

// Feature page: headline block + a stage for the live UI. // 16:9: headline column left, stage right. 9:16: headline block on top, stage below it.
export const STAGE_V = { top: 540, h: 900 };
export const Head: React.FC<{ t: number; s: number; light: boolean; eyebrow: string; head: string; sub?: string }> = ({ t, s, light, eyebrow, head, sub }) => {
  const { v } = useFmt();
  return (
    <div style={{ position: "absolute", left: (v ? 80 : 110) * s, top: (v ? 215 : 0) * s, height: (v ? 370 : 1080) * s, width: (v ? 920 : 740) * s, display: "flex", flexDirection: "column", justifyContent: v ? "flex-start" : "center" }}>
      <Label s={s} color={light ? DEEP : C.accent} size={22} style={{ ...blurIn(t, 0.05, 0), marginBottom: (v ? 16 : 22) * s }}>{eyebrow}</Label>
      <Words text={head} t={t} at={0.15} size={(v ? 92 : 84) * s} color={light ? INK : C.text} accent={light ? DEEP : C.accent} />
      {sub && <div style={{ ...blurIn(t, 0.7, 16), marginTop: (v ? 18 : 30) * s, fontFamily: F.ui, fontWeight: 500, fontSize: (v ? 27 : 28) * s, lineHeight: v ? 1.35 : 1.4, maxWidth: (v ? 900 : 640) * s, color: light ? "rgba(12,13,15,0.6)" : "rgba(236,237,239,0.6)" }}>{sub}</div>}
    </div>
  );
};
export const Stage: React.FC<{ s: number; children: React.ReactNode }> = ({ s, children }) => {
  const { v } = useFmt();
  return <div style={{ position: "absolute", left: v ? 0 : 900 * s, top: (v ? STAGE_V.top : 0) * s, width: (v ? 1080 : 960) * s, height: (v ? STAGE_V.h : 1080) * s, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
};
// shift from 16:9 stage coordinates to the current stage (the stage centres its content)
export const useStageOffset = () => {
  const { v } = useFmt();
  return v ? [(1080 - 960) / 2, (STAGE_V.h - 1080) / 2] : [0, 0];
};
export const Tile: React.FC<{ s: number; label: string; children: React.ReactNode; light?: boolean; big?: boolean; style?: React.CSSProperties }> = ({ s, label, children, light, big, style }) => (
  <div style={{ background: light ? "#FFFFFF" : "rgba(255,255,255,0.04)", border: `1px solid ${light ? "rgba(12,13,15,0.08)" : "rgba(255,255,255,0.08)"}`, borderRadius: 14 * s, padding: `${16 * s}px ${18 * s}px`, ...style }}>
    <div style={{ fontFamily: F.mono, fontSize: 14 * s, letterSpacing: "0.12em", textTransform: "uppercase", color: light ? "rgba(12,13,15,0.5)" : "rgba(236,237,239,0.5)" }}>{label}</div>
    <div style={{ marginTop: 8 * s, fontFamily: F.ui, fontWeight: 800, fontSize: (big ? 60 : 44) * s, color: light ? INK : C.text, letterSpacing: "-0.02em", display: "flex", alignItems: "baseline" }}>{children}</div>
  </div>
);
