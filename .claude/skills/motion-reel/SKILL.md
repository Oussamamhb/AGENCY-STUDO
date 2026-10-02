---
name: motion-reel
description: Make a product or showreel motion video rendered from code. Use when the
  user asks for a launch video, showreel, product reel, animated explainer or motion ad.
---

# Motion reel

> In this repo, brand films follow the `studio-video` skill (brand kit, Suno music, deliver.sh).
> Use this generic course pipeline only for quick one-offs.

## Inputs to collect first
Product + URL, duration, formats (9:16 / 1:1 / 16:9), brand colors + fonts,
a reference (frame, video or image folder), music (file or "synthesize").
Pick a short kebab-case video name; it names `videos/<name>/`, `public/<name>/`, `out/<name>/`.

## Pipeline
1. Gather assets from the URL with Playwright into `public/<name>/`. List them.
2. If a reference exists, extract frames (`ffmpeg -i ref.mp4 -vf fps=2 videos/<name>/refs/frames/%03d.png`)
   and write `videos/<name>/docs/style_guide.md` from it (see `prompts/reference.md`).
3. Measure or synthesize music. `tools/beats.py` → beats.json, or `tools/music.mjs` (writes its own beats.json).
4. Write `videos/<name>/docs/shotlist.md` on the beat grid. Show it and wait for OK.
5. Build it following CLAUDE.md, with `lib/motion.js` springs:
   - Remotion (default): `src/videos/<Name>/`, `useTime()`/`useLayout()`, one composition per format.
   - Route A (when asked): `videos/<name>/index.html` with `window.seek(t)`, from `engine/template/`.
6. Contact sheet → critique pass (`prompts/critique-pass.txt`) → fix. 3 rounds minimum.
   Remotion: `node tools/stills.mjs <Name>-9x16 --beats public/<name>/beats.json`.
   Route A: `node engine/render.mjs --page videos/<name>/index.html --beats public/<name>/beats.json`.
7. Full render → `tools/sfx.mjs` → `tools/mix.sh` (-14 LUFS) → `out/<name>/final-<format>.mp4`, all formats.
   Then `tools/critique.sh` on the final and one more critique pass.
8. Deliver final.mp4, contact.png, poster.png. Say what you'd improve next.

## Hard rules
- Real product UI only. Never invent screens.
- No Math.random, no timers, no CSS transitions in render mode.
- Banned: corner labels, centered title on gradient, everything fading in.
