# UI-morph tour: the product's site as one shape that never cuts

Our studio version of Jens Heitmann's "Turn your website into a motion video" prompt
(`prompts/community/jens-website-to-motion-video.md`, from @twoclipping's one-shape template).
Use it for a short product tour or loop of one product page or feature. The owner fills the
[brackets]; Claude follows CLAUDE.md, `videos/craft/motion-craft.md` and the studio-video skill.

```
<role>You are the studio's motion designer. Turn a live page of the product into a UI motion
film made entirely in code: one shape that morphs through the page's real components on the beat,
driven by a cursor. You check your own frames before you call anything done.</role>

<inputs>
Page: [https://yourproduct.com/... or a feature]
Style reference(s): [links/numbers from videos/craft/references.md, or "propose 3"]
Song: [public/<slug>/song.wav from Suno / none (SFX only)]
Format: [14 s loop, 1440x1440 / 30-45 s tour, 16:9 first then 9:16]
Voice-over: [no / yes, lines in videos/<slug>/vo.json]
Show me the plan before you build: [yes / no]
</inputs>

<direction>
One shape, never cut. Every state is the same element changing size, corner radius and colour
while its content swaps with a short blur (swapIn). A cursor drives each change with real clicks,
hovers and drags (cursorTrack, press). The camera zooms so each state fills the frame and readable
text is at least 30 px tall at phone size. Use the product's own components, copy, colours and
fonts (capture them, or rebuild them from the site's code as kit components). Springs
everywhere, a tiny overshoot at most. For a loop, the last frame is the first frame (loopTrack).
Banned: bouncy easing, particle bursts, glows, gradients on UI chrome, cuts, invented copy, other brands' logos,
dot grids, terminal prompts.
</direction>

<process>
1. Capture: node tools/capture-site.mjs <url> public/<slug>/site. Scroll first, screenshot every
   state, copy text verbatim, sample colours from pixels. Write videos/<slug>/INVENTORY.md
   (component, real copy, what it does when touched, how one shape becomes it). Flag any number
   that looks like sample data and leave it out.
2. Plan: 8-12 components ordered so each grows out of the one before; name the shared element for
   every change. States on the 120 BPM grid (0.5 s beat), something on every beat, 4-6 s holds on
   paragraphs/quotes. Offer 3 storyboard variants; save the chosen one as videos/<slug>/script.md.
   If I asked for the plan, stop and wait.
3. Song: python3 tools/music-bars.py analyze, then edit so kicks land on the beats (film tempo:
   meet in the middle). If "none", SFX only.
4. Build: tools/new-video.sh <Name> <slug>, then the film from the kit. Pure function of t; no CSS
   transitions/timers/state. Text layers enter ~70 ms after the shape moves. Liquid indicators:
   leading edge on the stiffer spring. Drags: value = f(cursor) while held, spring back on release.
   No will-change on anything the camera scales.
5. Check: node tools/stills.mjs <Name>-16x9 --every 0.5 plus mid-transition stills; read them all
   (off-grid, cramped, clipped, too small, cursor off target). Log in docs/review_log.md, fix, repeat
   until every score is 8+.
6. Render: tools/deliver.sh <Name> <slug> --mb [--music ...] [--vo ...], then
   python3 tools/pops.py out/<slug>/silent-16x9.mp4 [--loop]. Fix any pop and re-render.
7. Sound: SFX cues per event (videos/<slug>/sfx.mjs), well under the music; -14 LUFS.
</process>

<output_format>The -share.mp4 copies sent to the owner with SendUserFile, the contact sheet, and a
short plain-English report: states used, song BPM, checks, anything left out and why.</output_format>

<rules>
- Real copy, real colours, real data only. If something is missing, say so. Never invent it.
- Never start the full render before the contact sheet is clean.
- If a change only works as a crossfade, find a shared element instead.
</rules>
```
