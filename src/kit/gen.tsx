import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { clamp, lerp } from "../../lib/motion.js";
import { BRAND } from "./theme";

// GenPlate: a Gemini-generated photo or clip (prompts/studio/gemini.md) as a graded background
// plate UNDER the real UI. Files come from tools/gen-prep.sh (public/<slug>/gen/).
//   <GenPlate t={t} src="my-film/gen/G1-hook-plate.mp4" kind="video" at={0} />
// t = scene-local seconds (drives the drift); at = film second the clip starts (video only).
// dim = brightness (0.25-0.45 under UI), tint = grade colour, drift = slow push over `dur`,
// rate = playback speed; for slow motion prefer SLOW=… tools/gen-prep.sh (interpolated frames, no judder).
const smoother = (x: number) => {
  const u = clamp(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const GenPlate: React.FC<{
  src: string; t: number; kind?: "image" | "video"; at?: number; dim?: number; sat?: number; tint?: string; tintAlpha?: number;
  blur?: number; drift?: [number, number]; dur?: number; origin?: string; vignette?: number; rate?: number;
}> = ({ src, t, kind = "image", at = 0, dim = 0.35, sat = 0.55, tint = BRAND.accent, tintAlpha = 0.28, blur = 0, drift = [1.04, 1.1], dur = 8, origin = "50% 50%", vignette = 0.7, rate = 1 }) => {
  const { fps } = useVideoConfig();
  const z = lerp(drift[0], drift[1], smoother(t / dur));
  const media: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: origin, filter: `brightness(${dim}) saturate(${sat})${blur ? ` blur(${blur}px)` : ""}` }}>
        {kind === "video" ? (
          <Sequence from={Math.round(at * fps)} layout="none">
            <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} style={media} />
          </Sequence>
        ) : (
          <Img src={staticFile(src)} style={media} />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: tint, mixBlendMode: "color", opacity: tintAlpha }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 35%, rgba(4,7,7,${vignette}) 100%)` }} />
    </AbsoluteFill>
  );
};
