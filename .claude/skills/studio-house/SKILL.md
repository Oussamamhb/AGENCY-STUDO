---
name: studio-house
description: The studio's house motion skill. Load it before building or changing any scene of a film (with /studio-video). It holds the motion and brand tokens, the kit primitives, the transition library with when-to-use, the output contract, the self-review checklist and the reference reels, and it says which installed skills we use and how (it overrides them).
---

# House skill (load before every scene)

Off-the-shelf skills teach how to code motion; this file is what makes it look like **our**
studio. Order of authority: owner decisions (`videos/BRAND.md`, `CLAUDE.md`) → this skill and
`/studio-video` → `videos/craft/motion-craft.md` + `videos/craft/motion-theory.md` → any
installed third-party skill.

## 0. Installed skills: what we take, what we ignore
Engine: **Remotion** (React, `useTime()`), always. Never HyperFrames/GSAP pages as a film's engine
unless the owner asks. Nothing may break the render contract (pure function of time, no CSS
transitions, no rAF/timers, seeded noise only).
| Skill | Use it for | Ignore |
|---|---|---|
| remotion-* (official) | API correctness: `interpolate`, `spring`, `Sequence`, audio, `OffthreadVideo`, rendering | their example looks |
| remotion-motion-graphics | its anti-generic checklist (no linear, no opacity-only, stagger, layer stack, idle breathing, render-and-inspect) | "use EVERY time" (this skill wins), its purple/Inter theme; our brand kit only |
| gsap-animation + gsap-* | effect ideas: SplitText-style reveals, ScrambleText (decode), DrawSVG, MorphSVG, CustomEase shapes. Only as a **paused timeline seeked from `useTime()`** if we ever wire GSAP in; prefer our kit | ScrollTrigger, useGSAP lifecycles, anything real-time |
| emil-design-eng, apple-design | taste: when not to animate, interruptible springs, press 0.97, momentum, restraint, materials | web-app specifics (gestures, a11y hooks) |
| iart-ai: animation-principles, motion-art-direction, beat-sync-editing, shot-composition, kinetic-typography, explainer-video, launch-video, chart-animation, animated-infographic, diagram-animation, color-motion, logo-animation, glassmorphism, micro-interaction | the vocabulary and checklists in their references | their tool picks (After Effects, Lottie, Framer Motion, Three.js, shaders) unless a scene truly needs one; never particle nebulas, ASCII, whiteboard, isometric looks (generic AI look) |
| hyperframes-* | nothing for films | all |
| launch-video / remotion-video / explainer-video / product-launch-video / motion-reel | ideas only; our pipeline is `/studio-video` | their pipelines |

## 1. Motion tokens (`src/kit/motion.ts`), never raw values in scenes
- **Springs first** for UI and containers: `sp(t, "snappy"|"default"|"heavy"|"playful")`, `track()`,
  `pop/rise/unfold`, `swapIn()`, `cursorTrack()`, `press()`. Tiny overshoot on UI, none on type.
- **Fixed-length tweens** use `tween(t, at, dur, role)` with `MOTION.ease` roles:
  `enter` (decelerate, entrances), `exit` (accelerate, exits: `dur × MOTION.dur.exitK`, shorter),
  `move` (in-out, across-frame moves, pushes), `drawer` (panels), `decel` (hero landings), `fade`
  (opacity/colour only). Never linear on position/scale (linear only for constant drift/loops).
- **Durations** `MOTION.dur`: micro 0.18 s (press, toggle), ui 0.32 s (cards, panels), surface
  0.5 s (full-frame), hero 0.9 s (camera, cinematic). Bigger distance → longer.
- **Stagger** `staggerAt(i, n, step)`: list 0.05, word 0.09, char 0.035; whole stagger ≤ 0.6 s.
- **Entrances** `enterUI()` / `blurIn()` / `swapIn()`: transform + 8 px blur + opacity together,
  from scale 0.95 (never scale 0, never opacity alone). Press = scale 0.97, 0.16 s.
- Tag every scene **productive** (UI doing its job: realistic UI speeds, springs, small moves) or
  **expressive** (brand moments: slams, 3D turns, camera, hero durations). Write the tag in the
  script table.

## 2. Brand tokens (`src/kit/theme.ts`)
Everything brand-specific is `BRAND` + `C` + `F` in `theme.ts`: one display face (tight tracking)
+ one mono/label face, one accent (`C.accent`, `C.accentDeep` on light grounds), ink `INK`.
Never hard-code a brand colour in a scene: use `C.accent` / `rgba(C.accent, a)`.
One hero accent per film. Glass radius 28 hero / 22 cards / 16 rows. Ground: `Aurora` / generated
`GenPlate` (dimmed, graded), never dot grids. **Layer stack** every film: ground (+ plate) → real
UI → type → grade (GenPlate tint/vignette) → `Grain` (last, 0.05-0.09 on dark films).
Idle elements breathe (tiny sine: `pulse()`, card float, drift) so no frame is frozen.

## 3. Primitive library (use before writing new)
| Need | Kit |
|---|---|
| kinetic title / slam | `Words` (`ats` per-word VO times), `CharRise`, `Label` |
| UI card / glass | `glass`, `panel`, `glassFill`, `glassSurface`, `Tile`, `Head`+`Stage`, `GlassPill` |
| cursor + click | `Cursor` on `cursorTrack()` (curved, starts at rest), `press()` 80 ms early, `Ripple` |
| numbers | `Odometer` |
| callout / highlight | lift-out callouts with a shared element, spotlight by dimming the rest |
| product UI | rebuild the real components from captures/site code as kit components (one file per product area, e.g. `src/kit/<area>.tsx`) |
| camera | `camAt/camStyle/camPt` (push-in, dolly to a feature) |
| plates | `GenPlate` (generated clips/images under the UI) |
| end card | Template `End` (logo tile + wordmark, CTA line, URL pill, button click) |
| texture | `Grain`, GenPlate vignette |
When a film builds a new reusable part (depth slam, cube turn, dealt cards, split-flap chips),
move it into the kit when a second film needs it and add it to this table.

## 4. Transition library (one family per film + one accent)
| Transition | Our version | When |
|---|---|---|
| Hard cut on the beat | whole-frame cut (motion blur!) | default; most of a film is cuts |
| Shared element / morph | one element carries over (flood→hub, card→banner, row→header, callout→card) | every UI-to-UI change; if it only works as a crossfade, find the shared element |
| Zoom-through (dolly) | `camAt` push into an element that becomes the next screen | entering a feature |
| Mask / liquid wipe | `LiquidWipe`, `Flood` (~0.3 s) | colour/section change, follow the motion direction |
| 3D turn | cube turn, tip-back, page with perspective, dealt cards, flip | chapter/page changes |
| Whip | `whip/enterWhip` + whoosh | energy moments only |
| Smash cut | loud slam → silent clean UI | problem → solution |
| Blur dissolve | 10-20 frames | calm moments only, never between two busy layouts (stagger out/in or dip to ground) |
| J/L-cut | the VO leads the picture by a few frames | VO films, scene changes |
Eye-trace: where the eye is at the end of shot A is where shot B's key element appears.
Hits land on beats/downbeats; big reveals on the song's kick-in.

## 5. Output contract
16:9 first → owner locks → 9:16 from the same timeline (`useFmt().v`, layout only, never timing).
1:1 / 4:5 only if the owner asks. 60 fps, H.264 yuv420p CRF 16, motion blur on finals
(`tools/mb-render.py`), -14 LUFS / -1 dB TP. Vertical safe zone y 190-1560. Text ≥ 30 px at phone
size. Hook in 1-2 s, product by ~6 s. Share copies < 30 MB.

## 6. Self-review loop (every render, log in `videos/<slug>/docs/review_log.md`)
Stills (`tools/stills.mjs`) at start, every scene's settled frame, **every transition midpoint**,
end card; tile 4-up (`tools/grid4.py`); look. Then run the checklist:
- [ ] linear easing on position/scale? → spring or `tween` role
- [ ] opacity-only fades? → `enterUI`/`blurIn` (y 8-24 px, scale .95→1, blur 8→0)
- [ ] everything at once? → stagger (`staggerAt`)
- [ ] anything from scale(0)? → 0.95
- [ ] more than one focal point? → dim/blur the rest
- [ ] text ≥ 30 px at phone size, held ≥ 0.3 s per word once fully in?
- [ ] cuts/hits on the beat (grid p90 < 17 ms), VO words locked (`ats`)?
- [ ] eye-trace continuous across cuts; one transition family?
- [ ] hook ≤ 2 s, product ≤ 6 s; safe zones in every format?
- [ ] grain/grade/plate applied, idle breathing?
- [ ] SFX on every major hit, not every tiny one; voice ~11 dB over music (`tools/mix-check.py`)?
- [ ] `tools/pops.py` clean, contact sheet looked at, watched at phone size?
Score hook / readability / motion / variety / brand / sync; fix the 3 worst; ≥ 3 rounds, all 8+.

## 7. SFX map (`videos/<slug>/sfx.mjs`, synthesized by `tools/sfx.mjs`)
cursor press → click-clack · typing → keys · card/tile in → pop (soft, repeated ones quiet) ·
whip/push → whoosh · flood/liquid → liquid · success/ready → chime · verdict/stamp → stamp ·
slam → impact only without music (with music the song carries it). No risers/booms with music.

## 8. Reference reels (breakdowns; we can't watch video, so these are what we learn from)
Write a breakdown here for every finished film and every reference that becomes a film's look:
hook, cut rhythm, easing feel, type, transitions, what the owner liked. Starter entries:
- **Template** (this repo): typed glass pill hook in 2 s → liquid wipe → feature page (headline +
  live UI, cursor click, container morph, odometer tiles) → whip → white end card with CTA click.
- **Proven launch-film recipe** (from a 72 s launch film this studio's workflow made): hook =
  typed glass pill in 2 s; word slams on downbeats; cuts every 2-4 s on a 120 grid; springs with
  tiny overshoot; aurora grounds, liquid-glass UI, goo/whip transitions; the cursor drives every
  container; the song's kick-in lands on the first big reveal.
- **Proven VO-explainer recipe**: one full VO take drives the edit; shared elements carry every
  change; reading parts stay static full-frame (no zoom while the viewer reads); stamps one per beat.
- whatships.com launch films (Stripe/Linear/Vercel-style): see `videos/craft/references.md`.
