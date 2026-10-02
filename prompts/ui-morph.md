# UI morph film (write the state list, not the vibe)

The concept: **one shape, never cut.** A single element morphs size, radius and color from
state to state (button, loader, player, slider, chart, command palette), a cursor drives
each change with real clicks, and the last frame equals the first so it loops.
Based on @twoclipping's UI morph (907K views) and @verbove's MakerMap film.

```xml
<inputs>
Ask me for: my product + URL, 8 to 12 UI states that tell its story, the real data shown in
each state, brand colors + fonts + one accent, a royalty-free track near 120 BPM, formats.
</inputs>

<direction>
Product-film UI motion. One container never cuts: every state is the same element changing
size, radius and fill while its content swaps behind a short blur. A cursor drives every change.
Warm neutral canvas, one accent. Springs with at most a tiny overshoot.
Banned: bouncy easing, glows, gradients on UI chrome, particle bursts, dead time.
</direction>

<structure>
120 BPM, 8 bars, something happens on every beat.
logo → CTA button → email field (typed) → loader → success check → dashboard card
→ chart draws itself → tooltip on hover → ⌘K palette → toast → logo.
</structure>

<build>
1. One HTML file, one canvas, window.seek(t). No CSS transitions, no timers, no carried state.
2. Closed-form springs. A value with many targets = sum of one spring per change.
3. Text inside a morphing container enters after the morph starts, leaves before the next one.
4. Tab indicators: leading and trailing edges on different springs so they stretch.
5. Beat grid from the track (numpy/librosa). Start on a downbeat. UI sounds on measured peaks.
6. Render in headless Chrome at 60 fps, 4 subframes per frame, blended for motion blur.
</build>

<gotchas>
Never use will-change on anything the camera scales (blurry text).
The last frame must equal the first, cursor position and velocity included.
</gotchas>

<start>
Ask for the inputs, then show me the state list on the beat grid before writing code.
</start>
```

120 BPM = 0.5 s per beat; with 8 bars the states land on downbeats every 2 s:
logo 0s · CTA 2s · email 4s · loader 6s · check 8s · card 10s · chart 12s · ⌘K 14s · logo 16s.

In this project the build uses `lib/motion.js` (`spring`, `track`, `indicator`,
`swapAlpha`, `loopT`) and `engine/render.mjs`. To build it in Remotion instead, replace
build step 1 with "One Remotion composition driven by useTime() from src/lib/time.ts".
