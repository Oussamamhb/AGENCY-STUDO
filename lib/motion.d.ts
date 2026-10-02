export declare const clamp: (x: number, a?: number, b?: number) => number;
export declare const lerp: (a: number, b: number, p: number) => number;
export declare const SPRINGS: Record<"snappy" | "default" | "heavy" | "playful", { k: number; d: number }>;
export declare function spring(t: number, k?: number, d?: number): number;
export declare function track(t: number, keys: [number, number][], k?: number, d?: number): number;
export declare function indicator(
  t: number,
  stops: [number, number][],
  width?: number,
): { left: number; right: number };
export declare function swapAlpha(t: number, tIn: number, tOut: number): number;
export declare const loopT: (t: number, dur: number) => number;
export declare function rng(seed: number): () => number;
export declare const beatTime: (n: number, bpm?: number, offset?: number) => number;
export declare const barTime: (n: number, bpm?: number, offset?: number, beatsPerBar?: number) => number;
export declare function layout(
  w: number,
  h: number,
): {
  w: number;
  h: number;
  aspect: number;
  format: "vertical" | "square" | "wide";
  unit: number;
  cx: number;
  cy: number;
};
