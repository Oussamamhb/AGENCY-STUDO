import { useCurrentFrame, useVideoConfig } from "remotion";
import { layout } from "../../lib/motion.js";

// Current time in seconds, so lib/motion.js springs work the same as in the seek(t) engine.
export const useTime = (): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Size-aware layout for the current format (vertical / square / wide).
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  return layout(width, height);
};

// The three delivery formats. Register one <Composition> per format from the same component.
export const FORMATS = {
  "9x16": { width: 1080, height: 1920 },
  "1x1": { width: 1440, height: 1440 },
  "16x9": { width: 1920, height: 1080 },
} as const;
