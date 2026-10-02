# Studio kit

`import { ... } from "../../kit";` in any film. Everything takes local time `t` (seconds)
and the design scale `s` (1 design px = `s` real px; `s = short side / 1080`).
**Brand = `theme.ts`** (`BRAND` colours, name, url, CTA; fonts). Change it there, nowhere else.
Lower-level motion maths (`track`, `indicator`, `clamp`, `lerp`, `rng`) lives in `lib/motion.js`.

| File | Exports | Use |
|---|---|---|
| `theme.ts` | `BRAND`, `C` colours (`C.accent`…), `rgba(hex, a)`, `F` fonts (Outfit / DM Mono / Bebas), `INK`, `PAPER`, `DEEP`, `asset(path)`, `img(name)` | Loads the self-hosted fonts. `asset("logo-mark-white.svg")` → `public/brand/...` |
| `motion.ts` | `sp(t, kind)`, `within`, `pop`, `rise`, `unfold`, `whip`, `enterWhip`, `blurIn`, `speedBlur`, `loopTrack`, `cursorTrack`, `press`, `swapIn`, `camAt/camStyle/camPt`, `MOTION`, `tween`, `staggerAt`, `enterUI` | Springs, motion tokens, ready-made enter/exit styles: `style={pop(t, 1.2, "playful")}` |
| `type.tsx` | `Words` (blur-in words, `[accent]` syntax, `\n` lines, `ats` per-word VO times), `CharRise`, `Label` (mono caps), `Odometer` (rolling digits) | Headlines, labels, counting stats |
| `ui.tsx` | `Aurora` grounds (dark/light/accent/white), `glass()` / `panel()` / `glassFill()` / `glassSurface()`, `pulse`, `typed`, `LogoTile`, `Chip`, `Cursor`, `Ripple`, `Goo`, `LiquidWipe`, `Icon`, `Flood`, `MotionBlur`, `Grain` | Backgrounds, containers, clicks, transitions, texture |
| `format.tsx` | `useFormat()` → `{ s, L, v, fw, fh }`, `FormatProvider`, `useFmt()`, `W` | One timeline, per-format layout (`v` = vertical) |
| `layout.tsx` | `GlassPill` (typed search pill), `Head` + `Stage` (feature page: headline block + live UI area, stacks in 9:16), `useStageOffset()`, `STAGE_V`, `Tile` (stat tile) | Page layouts that already handle 16:9 and 9:16 |
| `gen.tsx` | `GenPlate` | Generated photo/clip as a dimmed, graded plate under the real UI |

Start every film from `src/videos/Template/Template.tsx` (typed pill hook → feature page with a
real click and a container morph → end card with a CTA click). When a film builds a strong new
part (a slam sequence, a 3D page turn, a product-specific card), move it into the kit once a
second film needs it, and add it to the table above and to the house skill's primitive list.
