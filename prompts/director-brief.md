# Director's brief (overnight, flagship films)

The big viral films came from 9,500 to 19,000-character briefs. They don't describe a video,
they hire a crew:

- **Film in one line.** The logline and the joke, so every decision can be checked against it.
- **References.** Source video, song, image library, a GitHub repo of prior work. What to keep, what to push.
- **Tools & keys.** Skills to load, APIs available (image, video, voice), budget, where docs live. "Spend it economically."
- **Character bible.** Proportions, palette sampled from a sheet, expressions, an identity lock that survives every style change.
- **Beat sheet.** Acts with timestamps, a visual payoff every 3 to 5 seconds, a hook in the first 2.
- **Text on screen.** When lyrics or captions go huge, when they sit like subtitles. Composition leaves room for them.
- **Workflow gates.** Plan → rig → stills → animatic → full pass → polish → audio → render. Don't skip gates.
- **Critique loop.** Render stills, score them, write the 3 worst problems, fix, repeat until every score is 8+.
- **Deliverables.** Final MP4, loop check, poster frame, contact sheet, clean source with a README.

Advanced: generate-then-trace. A video model renders base shots with characters and physics,
then Claude redraws the whole video in code on top, so the viewer only sees the code-drawn layer.

```text
You are the director, animator, sound designer and render engineer for a [DURATION] film
made in code. Treat this as a multi-session production. Don't rush to a final render.

## The film in one line
[LOGLINE. What the viewer should feel at the end.]

## References and inputs
- ./refs/ : [video / frames / image library]. Take the grammar, never the content.
- ./audio/track.wav : use it unchanged. Measure beats with beats.py first.
- Skills available: [/remotion-best-practices | /hyperframes | /claude-animation].
- APIs in .env: [ELEVENLABS_API_KEY, FAL_KEY]. Budget: [$X]. Be economical.

## Look
[3-5 lines: palette, type, texture, camera language. Banned looks.]

## Beat sheet
0:00-0:02  hook: [the single most striking image]
0:02-0:10  [act 1]
...        a new visual payoff every 3-5 seconds
[END]      the last frame sets up the first frame (loop)

## Workflow, with gates
1. Write docs/style_guide.md and docs/shotlist.md (every shot: frames, camera, text, SFX).
   Show me the shot list. Then continue without waiting if I don't answer in 10 minutes.
2. Build stills for every shot. Contact sheet. Critique.
3. Animatic at 960x540 with placeholder audio. Fix pacing before polish.
4. Full animation, polish pass, sound pass, final render.
5. Split work across subagents per chapter. Write docs/ANIMATION_GUIDE.md first
   so every subagent codes in the same style.

## Critique loop (every shot, at least 3 rounds)
Render 3-5 stills, score 1-10 on: hook, readability at 360px wide, motion, composition,
depth, sound sync, polish. Log scores + 3 biggest problems in docs/review_log.md. Fix. Repeat
until all are 8+.

## Deliverables
out/final.mp4 · out/loop_check.mp4 · out/poster.png · out/contact.png · README.md
```

In this project: `./refs`, `./docs` → `videos/<video-name>/refs|docs/`; `./audio` → `public/<video-name>/`;
`out/` → `out/<video-name>/`. For long films also ask for `docs/STORYBOARD.md` after the first
pass and split chapters into `src/videos/<Name>/ch01…` (Remotion) or `videos/<name>/ch/` (route A).
