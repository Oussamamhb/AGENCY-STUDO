import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, lerp } from "../../../lib/motion.js";
import { useTime } from "../../lib/time";
import {
  Aurora, BRAND, C, Chip, Cursor, DEEP, F, LogoTile, FormatProvider, GlassPill, Head, INK, Label, LiquidWipe, Odometer, Ripple, Stage, Tile, Words,
  blurIn, enterWhip, glass, panel, pop, rgba, rise, sp, unfold, useFmt, useFormat, useStageOffset, whip,
} from "../../kit";

// Starting point for a new video (copied by tools/new-video.sh). Three scenes that show
// the house patterns: a typed glass pill hook, a feature page (headline + live UI with a real
// click), and the end card. Everything is a pure function of `t` on the 120 BPM film grid
// (1 beat = 0.5 s, 1 bar = 2 s); the `tempo` prop re-times the whole film onto the music.
export const T = { hook: 0, feature: 3, end: 9, duration: 13 } as const;

// ── Hook: glass pill types the promise over dark aurora ─────────────────────────
const Hook: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const { v } = useFmt();
  return (
    <AbsoluteFill>
      <Aurora t={t} kind="dark" />
      <GlassPill t={t} s={s} text="Everything your team needs" tone="dark" appearAt={0.15} y={(v ? 918 : 498) * s} />
    </AbsoluteFill>
  );
};

// ── Feature page: a list row is clicked, the container morphs into the detail ───
const Feature: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const [ox, oy] = useStageOffset();
  const clickAt = 1.4;
  const m = sp(t - 1.6, "default"); // morph list → detail
  const cp = sp(t - 0.6, "default"); // cursor travel
  return (
    <>
      <Head t={t} s={s} light={false} eyebrow="Feature" head={"Say the benefit.\n[In five words.]"} sub="One line of plain explanation under the headline." />
      <Stage s={s}>
        <div style={{ position: "relative", width: lerp(640, 860, m) * s, height: lerp(300, 460, m) * s, ...panel(s, 24), overflow: "hidden", ...rise(t, 0.1, 80 * s) }}>
          {m < 0.98 && (
            <div style={{ position: "absolute", inset: 0, padding: 26 * s, opacity: 1 - m }}>
              <Label s={s} color={C.muted} size={16}>Pick one</Label>
              {["Northwind", "Atlas Studio", "Harbor & Co"].map((n, i) => (
                <div key={n} style={{ ...rise(t, 0.35 + i * 0.1, 30 * s, "snappy"), marginTop: 14 * s, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${14 * s}px ${16 * s}px`, borderRadius: 14 * s, background: i === 0 && t > 1.1 ? rgba(C.accent, 0.1) : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 && t > 1.1 ? rgba(C.accent, 0.5) : "rgba(255,255,255,0.06)"}` }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 28 * s, color: C.text }}>{n}</span>
                  <div style={{ background: i === 0 ? C.accent : "transparent", color: i === 0 ? C.accentInk : C.muted, borderRadius: 99, padding: `${8 * s}px ${18 * s}px`, fontFamily: F.ui, fontWeight: 700, fontSize: 20 * s, transform: `scale(${i === 0 && t > clickAt && t < clickAt + 0.12 ? 0.92 : 1})` }}>Open</div>
                </div>
              ))}
            </div>
          )}
          {m > 0.02 && (
            <div style={{ position: "absolute", inset: 0, padding: 30 * s, opacity: clamp(m * 2) }}>
              <div style={{ display: "flex", gap: 10 * s }}>{["Live", "Verified"].map((c, i) => <div key={c} style={pop(t, 1.9 + i * 0.07)}><Chip s={s} tone={i ? "accent" : "dark"} size={15}>{c}</Chip></div>)}</div>
              <div style={{ marginTop: 14 * s }}><Words text="Northwind" t={t} at={1.8} size={64 * s} color={C.text} /></div>
              <div style={{ position: "absolute", left: 30 * s, right: 30 * s, bottom: 30 * s, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 * s }}>
                <div style={unfold(t, 2.3)}><Tile s={s} label="Score" big><Odometer value={1738 * sp(t - 2.4, "heavy")} size={60 * s} /></Tile></div>
                <div style={unfold(t, 2.42)}><Tile s={s} label="Growth" big><Odometer value={64 * sp(t - 2.5, "heavy")} size={60 * s} />%</Tile></div>
              </div>
            </div>
          )}
        </div>
        {t < 1.7 && <Cursor x={(lerp(980, 700, cp) + ox) * s} y={(lerp(900, 425, cp) + oy) * s} s={s} down={t > clickAt && t < clickAt + 0.12} />}
        <Ripple t={t} at={clickAt} x={(706 + ox) * s} y={(432 + oy) * s} s={s} />
      </Stage>
    </>
  );
};

// ── End card: logo lockup, CTA clicked, URL ─────────────────────────────────────
const End: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const { v, fw } = useFmt();
  const slide = sp(t - 0.5, "default");
  const clickAt = 2.4;
  const row = v ? 1150 : 690;
  const cp = sp(t - 1.9, "default");
  return (
    <AbsoluteFill>
      <Aurora t={t} kind="white" />
      <div style={{ position: "absolute", left: 0, right: 0, top: (v ? 620 : 290) * s, display: "flex", justifyContent: "center", alignItems: "center", gap: 34 * s }}>
        <LogoTile size={170 * s} style={{ transform: `translateX(${(1 - slide) * 220 * s}px) scale(${sp(t - 0.1, "playful")})` }} />
        <div style={{ overflow: "hidden", width: slide * 520 * s }}>
          <div style={{ fontFamily: F.ui, fontWeight: 800, fontSize: 150 * s, letterSpacing: "-0.045em", color: INK, whiteSpace: "nowrap", lineHeight: 1.1 }}>{BRAND.name}</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: (v ? 860 : 540) * s, display: "flex", justifyContent: "center" }}>
        <Words text={v ? "One line.\n[The call to action.]" : "One line. [The call to action.]"} t={t} at={1.0} size={(v ? 80 : 64) * s} color={INK} accent={DEEP} align="center" />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: row * s, display: "flex", justifyContent: "center", gap: 18 * s }}>
        <div style={{ ...glass("light", s, 40), ...pop(t, 1.6, "playful"), fontFamily: F.mono, fontSize: 30 * s, color: INK, padding: `${16 * s}px ${30 * s}px` }}>{BRAND.url}</div>
        <div style={{ ...pop(t, 1.72, "playful"), fontFamily: F.ui, fontWeight: 700, fontSize: 32 * s, color: C.accentInk, background: C.accent, borderRadius: 99, padding: `${16 * s}px ${34 * s}px`, transform: `${pop(t, 1.72, "playful").transform} scale(${t > clickAt && t < clickAt + 0.12 ? 0.94 : 1})` }}>{BRAND.cta}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: (v ? 1290 : 830) * s, display: "flex", justifyContent: "center", ...blurIn(t, 2.6, 8) }}>
        <Label s={s} color="rgba(12,13,15,0.55)" size={18}>Free to start &nbsp;·&nbsp; No card needed</Label>
      </div>
      {t > 1.8 && <Cursor x={lerp(fw / 2 + 440, fw / 2 + 170, cp) * s} y={lerp(row + 210, row + 32, cp) * s} s={s} down={t > clickAt && t < clickAt + 0.12} dark />}
      <Ripple t={t} at={clickAt} x={(fw / 2 + 180) * s} y={(row + 45) * s} s={s} color={DEEP} />
    </AbsoluteFill>
  );
};

export const TEMPLATE_DURATION = T.duration;
export const Template: React.FC<{ tempo?: number }> = ({ tempo = 120 }) => {
  const t = useTime() * (tempo / 120);
  const { s, L, v, fw, fh } = useFormat();
  const w = fw * s;
  const ft = t - T.feature;
  return (
    <FormatProvider value={{ v, fw, fh }}>
      <AbsoluteFill style={{ background: BRAND.ground, overflow: "hidden" }}>
        {t < T.feature && <Hook t={t} s={s} />}
        {t >= T.feature && t < T.end && (
          <AbsoluteFill>
            <Aurora t={t} kind="dark" />
            <AbsoluteFill style={{ ...enterWhip(ft, w), ...whip(ft, T.end - T.feature - 0.28, w) }}>
              <Feature t={ft} s={s} />
            </AbsoluteFill>
          </AbsoluteFill>
        )}
        {t >= T.end && <End t={t - T.end} s={s} />}
        {/* liquid wipe into the feature page */}
        <LiquidWipe id="tw1" p={(t - (T.feature - 0.62)) / 0.62} w={L.w} h={L.h} origin={[0.5, 0.5]} />
      </AbsoluteFill>
    </FormatProvider>
  );
};
