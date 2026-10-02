# Motion craft: the studio's rulebook

What the best Opus 5.5 motion videos do, collected from the community prompts in
`prompts/community/` (Jens Heitmann's website-to-video guide, @twoclipping's one-shape and
keynote templates, @verbove, @rexan_wong's workflow) and from our own films. Each rule says
where it lives in our kit. `CLAUDE.md` holds the non-negotiables; this file is the how.

## 1. Direction (before any code)
- **Pick the look per film from the references** (`videos/craft/references.md`).
  No house style is locked: every film gets its own reference(s), chosen with the owner and
  recorded in `videos/<slug>/brief.md` (reference numbers + what we take from each).
- **Study real references first** (@rexan_wong step 1): awesome-opus5-5-videos, whatships.com (2,300+
  real launch films, see `videos/craft/references.md`), the brag gallery.
- **Offer 3 storyboard variants** (different structure/look), the owner picks one. Then **one
  still per scene before anything moves** (@rexan_wong steps 4-5; @twoclipping "4 stills").
- **Plan on the 120 BPM grid**: a beat every 0.5 s, a bar every 2 s. Something happens on every
  beat; a paragraph or quote holds **4-6 s** (Jens). Write the state list/beat map first.
- **One shared element carries every change** (a progress bar becomes a volume track, a knob
  becomes a tab indicator). If a change only works as a crossfade, find the shared element
  instead: every stiff moment is a crossfade where a shared element belonged (Jens's pro tip).

## 2. Capture (real product only)
- Capture the live site with `tools/capture-site.mjs`: scroll to the bottom first (lazy
  sections), screenshot every section and every state (tabs, toggles, accordions, sliders).
- Copy the text **verbatim**; sample colours from pixels; record the fonts.
- Better still, read the real components from the site's code (save them under
  `videos/<slug>/reference/`) and rebuild them 1:1 as kit components (`src/kit/`).
- Write an INVENTORY (component, real copy, what it does when touched, how a shape becomes it).
  **Flag sample/placeholder numbers and leave them out**; check every number on screen.

## 3. Motion (all pure functions of t)
| Rule | Kit |
|---|---|
| Closed-form springs, tiny overshoot at most; damping ~0.85-0.9 of critical | `sp()`, `SPRINGS` |
| A value with many targets = sum of one spring per change | `track()` |
| **Loops**: also add every step at t + T, so the last frame = first frame in position *and* velocity | `loopTrack()` |
| Liquid indicators: leading edge on a stiffer spring than the trailing edge | `indicator()` |
| Text/icons inside a morphing container: own enter **~70 ms after** the shape starts, faster exit, ~3 px blur, scale 0.965 → 1 | `swapIn()` / `swapAlpha()` |
| **Cursor** moves on a 4th-order step: starts from rest, never overshoots | `cursorTrack()` |
| Mouse **down 80 ms before the beat, release on the beat** | `press()` |
| Drags: while held, value = pure function of the cursor; on release spring back from where it is | `track()` from the release value |
| The camera zooms/pans per state so **readable text is ≥ 30 px tall at phone size** (Jens: 64 % framing gave 6 px quotes) | per scene |
| Never `will-change` on anything the camera scales (blurry text) | rule |
| A flood (shape filling the frame) must overscale past the corners and take ~0.3 s | `Flood` |
| Never fade black straight into the accent colour: move an accent element between states (@verbove) | rule |
| Never set opacity/filter on a preserve-3d element: fade its wrapper (@twoclipping) | rule |
| A child with `visibility: visible` shows through a hidden parent: use `inherit` | rule |
| Measure element positions at runtime for match cuts | rule |

**Banned** (all templates agree, plus the owner's list in CLAUDE.md): bouncy easing, particle
bursts, glows on UI chrome, gradients on UI chrome, shockwave rings, RGB split, camera shake,
lens flares, neon, grid floors, flashing backgrounds, mismatched icon strokes, dead time,
invented copy, anything that looks like a template.

## 4. Effects recipes
- **Liquid (goo)**: blur + alpha threshold, then composite the source on top so glass stays sharp
  (`Goo`, `LiquidWipe`).
- **Liquid glass (iOS 26)** over photos/UI: each glass element holds its own clone of the scene
  behind it, filtered by an SVG `feImage` displacement map (rounded-rect distance field) through
  three `feDisplacementMap`s at slightly different scales (chromatic edges) plus a rim light.
  `backdrop-filter: url()` misreads displacement maps in Chromium: clone the scene instead.
  (Our `glass()` is the simple blur version; build the displacement version when a film needs it.)
- **Iris**: 6 blades around a hexagonal aperture; each blade = its two vertices, both edge
  extensions and the short arc between them.
- **Wordmark squeeze**: every letter moves toward the dot by the same factor and its width follows
  (narrow `wdth`, scale the rest) so letters stay touching.
- **Footage**: re-encode all-intra (`ffmpeg -g 1`) or extract frames; draw frame
  floor((t - start) * fps); await the decode before READY.
- **Motion blur**: 4 sub-frames per frame blended (Jens: 4, @verbove: 6, keynote: t-1/240, t, t+1/240).
  Remotion: `MotionBlur` wrapper (`@remotion/motion-blur`), switched on for finals only (4× render time).
  4 samples can show stepped copies on whip-fast moves: use `samples={6..8}` for films with fast whips.

## 5. Checks before the full render
1. One still **per beat** plus one **mid-transition**, tiled into a contact sheet, and READ them:
   off the grid, cramped, clipped, too small, cursor off its target (`tools/stills.mjs --every 0.5`).
2. Log cursor, shape edges and dragged elements; look for acceleration spikes and any gap between
   the cursor and what it drags.
3. **Single-frame pops**: frame-difference spikes ≥ 3× their neighbours (`tools/pops.py`).
4. Loops: the jump from the last frame to the first is no bigger than a normal frame step.
5. Scores 8+ on hook, phone readability, motion, variety, brand, sync (CLAUDE.md loop).
6. Only then the full render. Watch it on a phone before sending.

## 6. Sound
- Measure the song (tempo, downbeats, kick onset) and trim/stretch so kicks land on the beats
  (`tools/music-bars.py`; > 1 BPM off 120 → meet in the middle).
- Every UI event gets a short dry sound placed by its **measured peak**, not its file start; well
  under the music; wrap across the loop point for loops. Master -14 LUFS, true peak ≤ -1.5 dBTP.
- Only music/SFX with a licence that allows commercial use (the owner's Suno songs are ours).

## 7. Formats
Square 1440 (community default), 16:9 1920×1080, 9:16 1080×1920 from one timeline (layout
branches, never timing). Vertical keeps text in the Reels/Shorts safe zone.
