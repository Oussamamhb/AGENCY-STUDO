# MOTION-STUDIO: a motion studio run by Claude

This repo makes professional motion-graphics ads and explainers for **one product** (described
in `videos/BRAND.md`) for Instagram, TikTok and YouTube. Films are code (Remotion), rendered and
reviewed frame by frame. Built on the "How to build a motion design studio with Opus 5.5" course
(@0xMovez) and github.com/yihui-dev/awesome-opus5-5-videos.

"The owner" = the person running this studio. They may not be a developer: explain in plain
English, show results (stills, contact sheets, MP4s) rather than code, and ask before big
creative decisions.

## Start here (every new session)
1. Read `videos/BRAND.md`: product, messages, brand, assets, **owner decisions**. If it is still
   the empty template, the first job is to fill it in with the owner (read their site, capture it,
   set `src/kit/theme.ts`, replace the placeholder logo in `public/brand/`).
2. For any new film, follow the `/studio-video` skill (`.claude/skills/studio-video/SKILL.md`), and
   load the **house skill** `/studio-house` before building or changing any scene (motion + brand
   tokens, primitives, transition library, output contract, self-review checklist).
   It outranks every installed third-party skill (GSAP, Emil Kowalski, iart-ai, remotion-motion-graphics…):
   their ideas are welcome, their engines, themes and "use me every time" claims are not.
3. `src/videos/Template/` is the starting point every film is copied from.

## Taste (defaults; the owner's own decisions in BRAND.md win)
- Style: **picked per film**, never locked to one look. For each new film propose 2-3 fitting
  references (see `videos/craft/references.md`: what we take from each), the owner picks, record
  it in the film's `brief.md`.
- Craft rulebook: `videos/craft/motion-craft.md` (community techniques mapped to the kit), theory
  notes `videos/craft/motion-theory.md` (principles, editing, type, explainer playbook);
  community prompts in `prompts/community/`, studio guides in `prompts/studio/`.
- Banned: dot-grid backgrounds, terminal/code prompts, neon circle highlights, static
  screenshots, "everything fades in", generic AI look, other companies' logos or implied endorsement.
- Data: real data only (real accounts, real numbers with a date). Never invent screens or stats.
- Features without a real page are announced with kinetic text only.
- Music: the owner makes it in **Suno** (guide: `prompts/studio/suno-music.md`). Never ship our
  synthesized temp score.
- Voice-over: only for explainer films; natural full sentences that explain the feature
  (short hype one-liners feel robotic). Recorded by the owner (Voicebox, ElevenLabs, their own
  voice…) per `tools/voiceover.mjs`.
- Generated imagery (Gemini / Veo, or any image/video model the owner has): plates, B-roll and
  textures **under** the real UI only; never product UI, real people, logos or text. Claude writes
  paste-ready prompts in `videos/<slug>/gemini-prompts.md` (rules + style lock:
  `prompts/studio/gemini.md`), the owner generates and uploads, Claude preps (`tools/gen-prep.sh`)
  and builds them in with `GenPlate`. Must look shot, not generated. New plates for every film.
- Order: 16:9 first → owner locks it → 9:16 from the same timeline.
- Every film: script approved by the owner before building.

## Render contract
- Every film is a pure function of time. Remotion: everything derives from `useTime()`.
  Route A: `window.seek(t)` paints frame t.
- No CSS transitions, no setTimeout, no requestAnimationFrame in render mode, no state carried
  between frames. Seeded noise only (`rng` = mulberry32), never Math.random.
- Motion from `lib/motion.js` via the kit (`src/kit/motion.ts`): closed-form springs
  (`sp(t, "snappy"|"default"|"heavy"|"playful")`), `track()` for values with several targets,
  `indicator()`, `pop/rise/unfold/whip/enterWhip/blurIn`. Tiny overshoot on UI, none on type.
  No linear slides, no generic ease curves. Also: `cursorTrack()` (cursor starts from rest, never
  overshoots), `press()` (mouse down 80 ms before the beat, up on it), `swapIn()` (text enters
  ~70 ms after its container moves, 3 px blur, scale .965→1), `loopTrack()` (seamless loops),
  `Flood` (shape floods the frame in ~0.3 s), `MotionBlur` (4 sub-frames, finals only: `deliver.sh --mb`).
  Fixed-length tweens use the named tokens `MOTION` / `tween(t, at, dur, role)` (enter/exit/move/
  drawer/decel/fade), `staggerAt()`, `enterUI()`; never raw curves or durations in scene code.
  Texture: `Grain` last in the layer stack.
- Readable text is at least 30 px tall at phone size (camera zooms to get there). If a change only
  works as a crossfade, find a shared element instead.
- Author on the **120 BPM grid** (1 beat 0.5 s, 1 bar 2 s). When the music has another tempo,
  the film's `tempo` prop plays the whole timeline at tempo/120 (see Sound).
- Encode H.264 yuv420p, CRF 16, 60 fps.

## Look
- Brand tokens live in **one file**, `src/kit/theme.ts` (`BRAND`: name, url, CTA, accent colours;
  fonts). One display face (starter: Outfit 800, tight tracking), one UI/label face (DM Mono).
- Fonts are self-hosted in `public/fonts/` and loaded by `theme.ts` (`@remotion/fonts` +
  `staticFile`). Google Fonts downloads fail inside cloud sessions.
- Every 2 to 4 seconds something new must happen. Hook in the first 2 seconds.
- Real product UI only (captures via `tools/capture-site.mjs` / `tools/capture-app.mjs`, real
  logo/colors/fonts). Rebuild UI as live containers from the captures; never invent screens.
- Never use will-change on anything the camera scales. Text inside a morphing container enters
  after the morph starts and leaves before the next one.
- Every format from one timeline: branch layout (never timing) on `useFmt().v`; design px are
  `s = short side / 1080` (16:9 = 1920×1080, 9:16 = 1080×1920). Vertical keeps content inside
  the Reels/Shorts safe zone (~y 190-1560). Never crop a 16:9 render to vertical.

## Sound
- **Music** = owner's Suno song, fitted with `tools/music-bars.py` (tracks every beat; Suno
  songs drift in tempo, so never one global stretch). Re-order whole bars to fit the story:
  kick-in on the film's big moment, a break under the calm part, the song's own ending last.
  Film tempo: meet in the middle (song ±3 %, film ±3 %). Grid check p90 < 17 ms (one frame).
- **SFX** synthesized by `tools/sfx.mjs` from `videos/<slug>/sfx.mjs` → `sfx.json`: mouse
  click-clacks, typing keys, pops, swipes, whooshes, liquid, success chimes, stamp, impacts.
  With music: no risers/booms (the song builds); `tools/sfx-balance.py` sets the stem so UI
  transients sit ~+6.5 dB over the music (deliver.sh does it). Without music: add impacts on
  slams, riser + reverse into drops, mix at -16 LUFS.
- **Voice-over** (explainers): script in `videos/<slug>/vo.json`; the owner records it (one full
  take is best) or runs `node tools/voiceover.mjs generate/build ...` against a local Voicebox;
  `tools/mix.sh` ducks music under it. When the owner sends **one full VO take**, the VO drives
  the edit: measure word times (`tools/vo-words.py`: faster-whisper word timestamps + the loudness
  envelope for exact onsets), place the take at a fixed `VO_AT`, lock every event to its spoken
  word (`Words` `ats` per-word times), log the map in `videos/<slug>/docs/vo-timing.md`, and mix
  it with `deliver.sh --vo` (offset copy in `out/<slug>/vo.wav`).
- Final loudness -14 LUFS, true peak -1 dB (`tools/mix.sh`).

## Loop before you show the owner anything
1. Render stills at the key moments and LOOK at them (4-up grids are efficient to read:
   `tools/grid4.py`).
2. Score 1-10: hook in first 2 s, readability at phone size, motion quality, variety, brand
   accuracy, sound sync.
3. Fix the 3 worst problems. Repeat until every score is 8+ (minimum 3 rounds for new films).
   Log scores and problems in `videos/<slug>/docs/review_log.md`.
4. Only then the full render (`tools/deliver.sh`, `--mb` for finals). Run
   `python3 tools/pops.py out/<slug>/silent-16x9.mp4` (single-frame pops) and look at the contact
   sheet before sending. Watch it at phone size.

## Where things live
| Path | What |
|---|---|
| `src/kit/` | **Studio kit**: theme (brand tokens, fonts, `asset()`), motion helpers, type (`Words`, `CharRise`, `Label`, `Odometer`), UI (`Aurora`, `glass`, `panel`, `LogoTile`, `Chip`, `Cursor`, `Ripple`, `Goo`, `LiquidWipe`, `Flood`, `MotionBlur`, `Grain`, `Icon`), `GenPlate`, format (`useFormat`, `useFmt`, `FormatProvider`), layout (`GlassPill`, `Head`, `Stage`, `Tile`, `useStageOffset`). See `src/kit/README.md`. |
| `src/videos/<Name>/` | One film = one component with a `tempo` prop; registered as `<Name>-16x9` / `<Name>-9x16` via `film()` in `src/Root.tsx` |
| `src/videos/Template/` | Starting point (hook, feature page with a click, end card) copied by `tools/new-video.sh` |
| `videos/BRAND.md` | Product, messages, brand, asset index, owner decisions |
| `videos/craft/` | `motion-craft.md` (the craft rulebook), `motion-theory.md`, `references.md` (where to find references) |
| `videos/<slug>/` | brief.md, script.md, sfx.mjs → sfx.json, music.json, docs/ (shotlist, review_log) |
| `public/brand/` | Real brand assets: logo SVGs, site captures |
| `public/<slug>/` | That film's song (`song.wav`), fitted track, captures, `vo/`, `gen/` (generated plates + `gen.json` provenance) |
| `prompts/` | Course prompt library, `prompts/community/` (viral prompts stored verbatim with credits), `prompts/studio/` (Suno guide, `gemini.md`, `ui-morph-tour.md`) |
| `tools/` | Pipeline scripts (below). `out/` = renders (not committed) |
| `engine/` | Route A (one `index.html` + `window.seek(t)`), for single-file one-shots when asked |

## Commands
- New film: `tools/new-video.sh <Name> <slug>` (scaffold + Root registration)
- Preview in the browser: `npm run studio`
- Stills: `node tools/stills.mjs <Name>-16x9 --times 0.5,2,4.5` → `out/stills/<Name>-16x9/`
- Capture real UI: `node tools/capture-site.mjs <url> public/<slug>/site --max 25`;
  logged-in pages: `node tools/capture-app.mjs public/<slug>/app --base <url> --pages /a,/b`
- Song: `python3 tools/music-bars.py analyze public/<slug>/song.wav`, then
  `python3 tools/music-bars.py edit videos/<slug>/music.json`
- SFX cues: `node videos/<slug>/sfx.mjs`
- Deliver: `tools/deliver.sh <Name> <slug> [--music public/<slug>/track-edit.wav] [--vo out/<slug>/vo.wav] [--formats "16x9"]`
  → masters, `-share.mp4` copies (< 30 MB), contact sheets
- Temp music for timing only (never a final): `node tools/music.mjs --out out/temp.wav --bpm 120 --bars 8`
- Determinism check: render the same frames twice and compare (PSNR = inf).
- Single-frame pops / loop seam: `python3 tools/pops.py <video.mp4> [--loop]`
- Generated files: `tools/gen-prep.sh <slug> <files...>` → `public/<slug>/gen/` (60 fps interpolated clips, `SLOW=` for slow motion, WebP images)
- Motion-blur finals, fast: `python3 tools/mb-render.py <Name>-<fmt> out/<slug>/silent-<fmt>.mp4 --ranges videos/<slug>/mb-ranges.json`
  (parallel chunks, blur only on moving frames; ranges from a no-blur pass: `mb-render.py ... --ranges none.json` with `[]`, then
  `python3 tools/mb-ranges.py <nomb.mp4> videos/<slug>/mb-ranges.json`), then `tools/deliver.sh <Name> <slug> --skip-render --formats <fmt> ...` to mix

## Gotchas (learned the hard way)
- Windows: run the tools from Git Bash (Claude Code's shell). `python3` may be called `python`
  or `py`; ffmpeg and rubberband must be on PATH (`scripts/setup.sh` says what's missing).
- Cloud Chromium needs the session proxy CA in its NSS store: `scripts/setup.sh` does it (runs
  on session start). `remotion.config.ts` already points Remotion at the cloud Chromium; don't
  pass `--browser-executable`.
- The cloud Chromium's GPU process is single-threaded, so `--concurrency` barely speeds up heavy
  frames (motion blur, video plates, backdrop blur). For `--mb` finals: render frame chunks in
  parallel (`tools/mb-render.py`), motion blur only on the moving frames, then splice frame-exactly.
  Hard cuts must sit on whole frames or the blur blends one frame of the previous shot into the slam.
- Veo / AI clips are often 24 fps: prep them with motion interpolation (`tools/gen-prep.sh`, `SLOW=`
  for slow motion), never slow them with `playbackRate` (repeated frames judder).
- `tools/sfx.mjs` normalizes its output to a fixed peak, so lowering one sound raises the rest:
  balance the stem against the music afterwards (sfx-balance / deliver.sh), not by hand.
- rubberband time maps: never write an explicit `0 0` line (NaN ratio).
- With `set -o pipefail`, `cmd | head -1` kills the script (SIGPIPE).
- Suno's first beat of a new section is often softer; `music-bars.py analyze` corrects the
  downbeat for it; the section jumps must land in the first column of its table.

## Engines
- **Remotion (default)**. React compositions in `src/`. Skills in `.claude/skills/remotion-*`.
  Remotion needs a paid company license for companies above 3 people.
- **Route A (seek(t) page)**. `engine/render.mjs` + one `index.html`; zero dependencies beyond
  Playwright and ffmpeg. Use when asked, or when a single self-contained file is the better fit.
- HyperFrames skills and the claude-animation plugin are installed; use only when asked.

## Effort
Medium for small fixes and re-renders, xhigh for new films, max when the first 3 seconds have
to carry a launch.
