---
name: studio-video
description: Make a new motion film for the studio's product (ad, launch, feature explainer, UI-morph
  tour, with or without voice-over), from brief to delivered 16:9 + 9:16 MP4s. Use for any new
  video request, e.g. "next video: explain the onboarding feature with VO".
---

# Film pipeline

The studio's house rules are in `CLAUDE.md`; product facts and owner decisions in
`videos/BRAND.md`; the craft rulebook (community techniques mapped to our kit) in
`videos/craft/motion-craft.md`. The Template film is the starting point and pattern library;
later films become pattern libraries too (copy scenes and components from them).

Talk to the owner in plain English, show pictures and videos, never code. Ask only what the
owner must decide; don't re-ask decided things (BRAND.md "Owner decisions").

## 0. First time only: set up the brand
If `videos/BRAND.md` is still the empty template: ask for the product URL, read the site, capture
it (`node tools/capture-site.mjs <url> public/brand/site --max 25`), draft BRAND.md (messages in
the site's own words, audience, features, real numbers with a date), set `BRAND`/fonts in
`src/kit/theme.ts` from the site's CSS, ask for the logo (white mark SVG →
`public/brand/logo-mark-white.svg`), re-render the Template end card and show it. Owner approves.

## 1. Brief and style (with the owner)
`tools/new-video.sh <Name> <slug>` (PascalCase name, kebab slug, e.g. `LaunchTeaser launch-teaser`).
Fill `videos/<slug>/brief.md`: goal, audience, length, VO yes/no, the feature(s), CTA.
- **Style: choose it for this film.** Look at `videos/craft/references.md` (awesome-opus5-5-videos,
  whatships.com launch films…). Propose 2-3 references that fit the film's job (what we'd take from
  each); the owner picks; write the choice in brief.md. Never reuse a look by default.
- **Real product**: capture the page (`node tools/capture-site.mjs <url> public/<slug>/site --max 25`,
  logged-in pages with `tools/capture-app.mjs`) or read the real components from the site's code;
  ask the owner for real data (screenshots, exports). Write an INVENTORY of components + real copy;
  flag placeholder numbers.

## 2. Script (owner approves before any build)
Offer **3 storyboard variants** (different structure/angle), the owner picks. Write
`videos/<slug>/script.md` on the 120 BPM grid (1 bar = 2 s): time, on screen, VO line, sound.
Explainer VO = natural sentences, one idea per scene, ~2.3 words/s. Name the shared element that
carries each transition. Wait for OK. For big films, show **one still per scene** before animating.

## 3. Music brief + generated plates (the owner makes them while we build)
Adapt `prompts/studio/suno-music.md` to the script. Send the paste-ready parts.
If a scene would gain from a photographic plate, B-roll moment or texture (never instead of real
UI), write `videos/<slug>/gemini-prompts.md` per `prompts/studio/gemini.md` (style lock, ids,
2-3 variants each) and send the prompts ready to paste. When files arrive: `tools/gen-prep.sh`,
record `gen.json`, look at them, build the pick in with `GenPlate` (dimmed, graded, under the UI).

## 4. Build
Load `/studio-house` first (tokens, primitives, transitions, checklist). Tag each scene
productive or expressive and pick one transition family (+1 accent) in the script.
- `src/videos/<Name>/<Name>.tsx`, started from the Template. Timeline constants in film seconds
  (120 grid); every scene is a component of local time `t` and `s`.
- Kit: grounds (`Aurora`), `glass`/`panel`/`glassFill`, `Head` + `Stage`, `Cursor`
  on `cursorTrack()` with `press()` clicks, `Ripple`, `track()`/`loopTrack()`, `swapIn()` for text in
  morphing containers, `Odometer`, `Words`/`CharRise`, `LiquidWipe`/`Flood` transitions,
  `enterWhip`/`whip`. Craft rules: `videos/craft/motion-craft.md` (30 px text at phone size,
  shared elements not crossfades, no will-change on scaled layers…).
- Wrap the film in `<MotionBlur on={mb}>` so finals get 4-sub-frame motion blur.
- Layout per format with `useFmt()` (16:9 first; 9:16 after the owner locks 16:9).
- VO films: `VO` lines in the film + `vo.json`; a `captions` prop shows guide captions in previews.
  Once the owner's VO take arrives, re-cut to it: word times (`tools/vo-words.py`), `VO_AT`,
  every event on its word (`Words` `ats`), `docs/vo-timing.md`.

## 5. Review loop (before showing anything)
Run the house checklist (`/studio-house` §6) on every render, stills at every transition midpoint.
`node tools/stills.mjs <Name>-16x9 --times ...` (every beat or key moment + mid-transitions);
tile 4-up and look. Score (hook, phone readability, motion, variety, brand, sync), fix the 3
worst, repeat ≥3 rounds until all 8+. Check: nothing overlaps, text ≥ 30 px at phone size,
containers move, cursor lands on its target. Log it in `videos/<slug>/docs/review_log.md`.

## 6. Sound
- SFX: `videos/<slug>/sfx.mjs` (cue per event, times in film seconds), `node videos/<slug>/sfx.mjs`.
- Song: `public/<slug>/song.wav` → `python3 tools/music-bars.py analyze ...` → tempo (± 3 % each
  way) → `videos/<slug>/music.json` → `edit` (grid p90 < 17 ms). Register the tempo in
  `src/Root.tsx`, set `TEMPO` in sfx.mjs.
- VO: `videos/<slug>/vo.json` (id, start, max, text, optional `say` spelling). The owner records
  it (one full take is best) and drops the WAV in `public/<slug>/vo/`; with a local Voicebox:
  `node tools/voiceover.mjs build videos/<slug>/vo.json --out out/<slug>/vo.wav --duration <s>`.

## 7. Deliver
`tools/deliver.sh <Name> <slug> --mb --music public/<slug>/track-edit.wav [--vo out/<slug>/vo.wav]`
→ masters + `-share.mp4` (< 30 MB) + contact sheet. Run `python3 tools/pops.py` on the render,
look at the contact sheet, then tell the owner where the files are (or send them) with a short
note. Previews can skip `--mb` (4× faster). Commit + push the source (never `out/`).

## 8. After "locked"
Build the 9:16 layout branch, re-deliver both formats. Record the owner's decisions in
`videos/BRAND.md` and the film's `README.md`; add the film's breakdown to `/studio-house` §8.
