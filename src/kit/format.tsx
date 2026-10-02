import React from "react";
import { useLayout } from "../lib/time";

// One timeline, every format. Scenes are authored in "design px": s = short side / 1080, so a
// 16:9 frame is 1920×1080 design px and a 9:16 frame is 1080×1920. Read the format with useFmt()
// and branch layout (not timing) on `v`. Vertical keeps content in the Reels/Shorts safe zone
// (~y 190-1560 design px).
export const W = 1920;
// Format: one timeline, laid out per aspect. Units are "design px" (s = short side / 1080).
// fw/fh = frame size in design px (16:9 → 1920×1080, 9:16 → 1080×1920). Vertical keeps
// everything inside the Reels/Shorts safe zone (~y 200-1560).
export type Fmt = { v: boolean; fw: number; fh: number };
export const FmtCtx = React.createContext<Fmt>({ v: false, fw: W, fh: 1080 });
export const useFmt = () => React.useContext(FmtCtx);

// Wrap a film in <FormatProvider> once; read `s` from the returned value.
export const useFormat = () => {
  const L = useLayout();
  const s = Math.min(L.w, L.h) / 1080;
  const fmt: Fmt = { v: L.h > L.w, fw: L.w / s, fh: L.h / s };
  return { ...fmt, s, L };
};
export const FormatProvider: React.FC<{ value: Fmt; children: React.ReactNode }> = ({ value, children }) => <FmtCtx.Provider value={value}>{children}</FmtCtx.Provider>;
