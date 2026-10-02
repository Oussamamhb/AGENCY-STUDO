import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// BRAND TOKENS: the one file to edit for a new brand (see videos/BRAND.md).
// Copy the real values from the product's site/app CSS. Every kit part reads from here.
// One display face, one UI/label face. One accent colour.
// ─────────────────────────────────────────────────────────────────────────────
export const BRAND = {
  name: "Brand", // shown on the Template end card
  url: "yourproduct.com",
  cta: "Try it free →",
  accent: "#7C8CFF", // main brand colour (buttons, highlights)
  accentDeep: "#3A44A8", // accent on light grounds
  accentInk: "#070A1A", // text on the accent colour
  ground: "#06070A", // darkest background
} as const;

// "#RRGGBB" + alpha → "rgba(...)" so glows and tints follow the brand colour.
export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const C = {
  black: "#000000",
  surface: "#101114",
  card: "#16181C",
  raised: "#1E2126",
  line: "rgba(255,255,255,0.10)",
  lineStrong: "rgba(255,255,255,0.18)",
  text: "#ECEDEF",
  muted: "rgba(236,237,239,0.55)",
  faint: "rgba(236,237,239,0.32)",
  accent: BRAND.accent,
  accentDeep: BRAND.accentDeep,
  accentInk: BRAND.accentInk,
  gold: "#FFC145",
  red: "#E05D5D",
} as const;
export const INK = "#0B0C0E"; // text on light / accent grounds
export const PAPER = "#F2F3EF"; // light ground
export const DEEP = BRAND.accentDeep; // accent on light grounds

// Fonts are self-hosted in public/fonts/ (cloud sessions can't download Google Fonts).
// To change: drop the .woff2 in public/fonts/, point the loadFont lines at it, rename here.
export const F = {
  ui: "Outfit",
  display: "Bebas Neue",
  mono: "DM Mono",
} as const;

loadFont({ family: F.ui, url: staticFile("fonts/Outfit-Variable.woff2"), weight: "100 900" });
loadFont({ family: F.display, url: staticFile("fonts/BebasNeue-Regular.woff2"), weight: "400" });
loadFont({ family: F.mono, url: staticFile("fonts/DMMono-Regular.woff2"), weight: "400" });
loadFont({ family: F.mono, url: staticFile("fonts/DMMono-Medium.woff2"), weight: "500" });

// Real assets only (public/brand/...): logo, captured site images, product art.
export const asset = (p: string) => staticFile(`brand/${p}`);
export const img = (name: string) => staticFile(`brand/site/images/${name}`);
