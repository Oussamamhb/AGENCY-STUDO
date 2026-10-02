# Turn Your Website Into a Motion Video (Zero After Effects), by Jens Heitmann (JENS AI)

Source: public Notion page https://app.notion.com/p/Turn-Your-Website-Into-a-Motion-Video-Zero-After-Effects-3e795decbef9816e9f74ebead1772484 (read 2026-09-30, verbatim). Credits: Jens Heitmann (@jens.heitmann); template by @twoclipping; other prompts by their authors as named. Stored for study; our adaptation is prompts/studio/ui-morph-tour.md and the craft notes in videos/craft/motion-craft.md.
> 💡 
  **JENS AI** · by Jens Heitmann (@jens.heitmann)
  Every frame in these videos is code. A button turns into a music player, the player into a slider, the slider into a chart, and it stays one shape the whole time, moving on the beat and looping at 60 fps. [@twoclipping open sourced the template on X](https://x.com/twoclipping/status/2103273003555402193). I ran it on my own websites, fixed what broke, and folded it all into one prompt. You give it your URL and it hands back the video. Further down are the other prompts going around X and the /brag skill from the reel.

## The one I made
[video]  https://pub-4571f10dc390493bb401964f88dc55dc.r2.dev/motion/ui-morph-community.mp4 My 42-second tour of [community.jensheitmann.com](http://community.jensheitmann.com), 1440x1440 at 60 fps. It is the video from the reel, and the prompt below holds every fix I made while building it.

## How to use this guide
1. Make an empty folder and open Claude Code in it.
1. Copy the prompt below and fill the four [brackets]: your URL, a song, the format, and whether you want to see the plan first.
1. Send it. If you asked for the plan, read it and say go. The finished video lands in the folder as `motion-video.mp4`.
> 💡 
  **This guide lives in the free community.** Every playbook like this one, plus the step-by-step build guides, free tools, and install-ready Claude Code skills I use every day: [join the Jens AI community on Skool](https://community.jensheitmann.com). Free, and you do not need to know how to code.
---

## The prompt
```XML
<role>You are a motion designer and creative developer. You turn a live website into a UI motion video made entirely in code: one shape that morphs through the site's real components on the beat of a song, driven by a cursor. You check your own frames before you call anything done.</role>

<inputs>
Website: [https://your-site.com]
Song: [path to an MP3 around 120 BPM, e.g. made with ElevenLabs Music or downloaded from Mixkit / none]
Format: [14-second loop, 1440x1440 / 42-second tour of the page in order, 1440x1440]
Show me the plan before you build: [yes / no, just build it]
</inputs>

<direction>
One shape, never cut. Every state is the same element changing its size, corner radius and colour while its content swaps with a short blur. A cursor drives each change with real clicks, hovers and drags. The camera zooms so each state fills the frame. Use the site's own components, copy, colours and font. Springs everywhere, a tiny overshoot at most. For a loop, the last frame is the first frame.
Banned: bouncy easing, particle bursts, glows, gradients on UI chrome, cuts, invented copy.
</direction>

<process>
1. Setup. In this folder, check for Node with Playwright and Chromium, Python 3 with numpy and scipy, and ffmpeg. Install what is missing.
2. Capture. Open the site in Playwright at 1440 px wide. Scroll to the bottom in steps first, because some sections only render once they are scrolled into view. Screenshot every section and every state of every interactive part: each tab panel, toggle, accordion and slider. Copy all text verbatim into copy.json. Sample colours from screenshot pixels, not from CSS variables. Record the font families. Write INVENTORY.md with each component's specs, real copy, what it does when touched, and how one shape could become it. Flag any number that looks like sample or placeholder data and leave it out.
3. Plan. Pick 8 to 12 components that show what the product does, ordered so each one grows out of the one before. For every change, name a shared element that carries across (a progress bar becomes a volume track, a toggle knob becomes a tab indicator). Put the states on a 120 BPM grid, a beat every 0.5 seconds (7 bars make 14 seconds, 21 bars make 42), with something happening on every beat and a 4 to 6 second hold on anything with a paragraph or a quote. Save the plan as states.md. If I asked to see the plan, stop here and wait for my go.
4. Song. If I gave a song, measure it with numpy: tempo by autocorrelation of an onset envelope, downbeats by low-band energy, and where the kick starts (10 percent of its peak). Trim it so the kick onsets land on the video's beats, starting on a downbeat. If the tempo is more than 1 BPM away from 120, tell me before you go on. If the song is none, skip this step.
5. Engine. Build scene.html:
   - seek(t) computes every style from the time t alone. No CSS transitions, no CSS animations, no timers, no state carried between frames.
   - Springs are closed-form step responses. A value that changes target N times is the sum of N step responses; for a loop of length T, also add each step at t + T, so the last frame matches the first in position and velocity. Damping 0.85 to 0.9.
   - Every text or icon layer has its own enter, about 70 ms after the shape starts moving, and a faster exit, with about 3 px of blur and a scale between 0.965 and 1.
   - Liquid indicators: the leading edge rides a stiffer spring than the trailing edge.
   - The cursor moves on a 4th-order step, so it starts from rest and never overshoots. Mouse down 80 ms before the beat, release on the beat.
   - Drags: while held, the value is a pure function of the cursor position relative to where it grabbed. On release it springs back from wherever it is.
   - The camera zooms and pans per state so any text meant to be read is at least 30 px tall in the frame.
   - If the site has video worth showing, pre-extract its frames with ffmpeg, decode them to ImageBitmaps before READY, and draw frame floor((t - start) * fps) into a canvas, on a light background.
   - Expose window.seek, window.READY and window.SOUNDS (every click, key and tick with its time).
   - Never put will-change on anything the camera scales.
6. Check. Render one still per beat into contact-sheet.png, plus a still in the middle of every transition, and read every one: off the grid, cramped, clipped, too small, cursor off its target. Log every frame's cursor, shape edges and dragged elements, and look for acceleration spikes and any gap between the cursor and what it drags. The jump from the last frame to the first must be no bigger than a normal frame step. There must be no console errors. Fix and repeat until all of this is clean.
7. Render. Playwright with Chrome DevTools Protocol screenshots, 4 subframes per frame centred on the frame time, piped into ffmpeg: tmix=frames=4, keep every 4th frame, H.264 at 60 fps, crf 12, yuv420p.
8. Sound. Synthesise short, dry UI clicks with numpy (band-passed noise plus a quick sine blip), one per event in window.SOUNDS. Place each by its measured peak, keep them well under the music, and wrap them across the loop point. Master to -14 LUFS with true peak at or below -1.5 dBTP using two-pass ffmpeg loudnorm, and mux as AAC.
</process>

<output_format>motion-video.mp4 in this folder, plus contact-sheet.png and a short report: the states used, the song's measured BPM, the probe numbers, the loudness, and anything you left out and why.</output_format>

<rules>
- Real copy, real colours and real data only. If something is missing, say so. Never invent it.
- Never start the full render before the contact sheet is clean.
- If a change only works as a crossfade, find a shared element instead.
</rules>
```
**Fill in:** your URL, a song, a format and yes or no on the plan. For the song, ElevenLabs Music made both of ours: they measured 119.95 and 120.0 BPM, close enough to sit on the grid without stretching. Check that your plan covers commercial use. Mixkit also has free tracks cleared for commercial use, and "none" gives you UI clicks only.
---

## What happens when you send it
[image] 02-chain.png attachment:038bdba4-454e-42cc-85b2-af34d99b147f:02-chain.png 
1. **Capture.** It screenshots your site, copies every word and samples the colours from pixels. The video is built from your own components, so it looks like your product.
1. **Plan.** It lines up 8 to 12 states on a 120 BPM grid, one beat every half second. This is where you can step in if you said yes to the plan.
1. **Song.** It measures your song's tempo and kick with numpy and trims it so the kicks land on the beats.
1. **Build.** It writes one HTML file where every frame is computed from the time alone. That is what makes motion blur, frame-accurate rendering and a seamless loop possible.
1. **Check.** It renders one still per beat and reads them before rendering the whole thing, the way it did on ours (below).
1. **Render and sound.** 4 subframes per frame for motion blur at 60 fps, then quiet clicks timed to the frame, mastered to -14 LUFS.
[image] 07-stills-check.png attachment:e54efe74-5140-4531-86cc-8237714435ef:07-stills-check.png 
A 14-second loop comes out at 840 frames.
---

## More prompts people are using
The prompt above is mine. These are the other prompts going around X, copied word for word, typos included. Each link opens the post with the video it made.

### 1. One shape, never cut, by @twoclipping
The template my prompt started from: one black pill morphs through 8 to 12 UI states in a 14-second loop. It asks you for the states, a colour and a song first. [Watch the video on X](https://x.com/twoclipping/status/2103273003555402193)
▸ Show the full prompt
  ```Plain Text
<inputs>
Ask me for: 8 to 12 UI states I want the shape to become (e.g. button, loader, player, slider, toggle, tabs, chart, command palette, toast), pure black and white or one accent color, and a royalty-free song around 120 BPM (e.g. Mixkit, free for commercial use).
</inputs>

<direction>
Dribbble-level UI motion. One shape, never cut: every state is the same element morphing its size, radius and color while its content swaps with a short blur. A cursor drives every change with real clicks and drags. Light warm-gray canvas, black and white components, one clean UI font (Geist). Springs everywhere, a tiny overshoot at most. The camera zooms so each state fills the frame. The last frame is the first frame, so it loops.
Banned: bouncy easing, particle bursts, glows, gradients on UI chrome, mismatched icon strokes, dead time, anything that looks like a template.
</direction>

<structure>
120 BPM, 7 bars, something happens on every beat.
Button → loader → check → dynamic island → music player with a play/pause morph → scrub the progress bar → it becomes a volume slider that stretches when dragged past max → a toggle flips on the beat → the knob becomes a liquid tab indicator → the tabs open into a chart that draws itself, with a tooltip on hover → it collapses into ⌘K → type to filter → enter → toast → back to the button.
</structure>

<build>
1. One HTML file, square 1440x1440. Every style is computed from time inside seek(t): no CSS transitions, no timers, no state carried between frames.
2. Springs are closed-form step responses. A value that changes target many times is the sum of one spring per change, so it stays a pure function of time.
3. The tab indicator's two edges ride different springs, so the leading edge stretches ahead of the trailing one. Same trick for the toggle knob.
4. Drags are direct manipulation: while the cursor is held, the value is computed from its position. On release it springs back from wherever it was.
5. Analyze the song with numpy for the beat grid and start on a downbeat. Place every UI sound by its measured peak.
6. Render with Playwright: 4 subframes per frame, blended with ffmpeg tmix for motion blur at 60fps.
7. Render one frame per beat before the full render. Fix anything off the grid, cramped or hard to read.
</build>

<gotchas>
Never put will-change on anything the camera scales or the text renders blurry. Text that swaps inside a morphing container needs its own enter and exit timing or it overlaps. Make the last frame identical to the first, cursor position and speed included, or the loop stutters.
</gotchas>

<start>
Ask me for the inputs, then show me the state list on the beat grid before you write any code.
</start>
  ```

### 2. An Apple-keynote launch film, by @twoclipping
A 29-second launch film for a print shop called "develop.", with phone, browser and checkout UI and liquid glass, all in one continuous take. It asks for a brand name, 9 to 12 photos, a song and a stock clip of a wall first, then shows you the beat map and 4 stills before it builds. [Watch the video on X](https://x.com/twoclipping/status/2103835273813496100)
▸ Show the full prompt
  ```Plain Text
<inputs>
Ask me for: a one-word brand name for the wordmark (a verb works best), 9 to 12 high-res photos, a royalty-free song around 120 BPM with a drop and a quiet breakdown (Mixkit, free for commercial use), and a free stock clip of a plain wall with moving plant shadows (Pexels).
</inputs>

<direction>
An Apple-keynote launch film, 2D only, one continuous take. Every scene is made out of the previous one: nothing fades, blurs or cuts. Objects change shape instead: text rises out of a mask line, icons pop from zero on a spring, bars draw across, pages push, and a black shape floods the whole frame and contracts into the next scene. Warm off-white canvas, black UI, iOS 26 liquid glass over the photos. Archivo (wdth 125, weight 800) for the wordmark, Geist for UI. A cursor drives every change with real clicks, drags and long-presses. The camera zooms screen-studio style so each moment fills the square, and the cursor scales with it.
Banned: crossfades, blur-ins, brightness "developing", 3D flips, particles, glows, holds longer than 1s, anything that looks like a template.
</direction>

<structure>
120 BPM, 54 beats, something happens on every beat.
Open: the wordmark squeezes into its own period like an accordion, the dot grows into a black pill, a label rises inside it. Click: six iris blades close over the label and snap open onto a photo. The circle becomes a square, shrinks, the grid unfolds from behind it like a paper map (center, plus, corners), reflows into a bento, and a click zooms into one tile, landing exactly on the drop.
Glass: a glass word pops in letter by letter, melts into a droplet that stretches into a glass toolbar. The adjust icon turns it into a slider. Dragging relights the photo from day to golden hour (two aligned shots), and the knob turns into a glass lens while held. It lifts into a glass orb, the next photo opens inside it as a circle, and the orb expands into a lock screen: glass clock digits, date, and a home bar that stretches into a glass music player.
Stage: the lock screen pulls back into a phone (the bezel grows out of the screen edge). The Dynamic Island stretches like liquid, pinches off, flies over and grows into a Mac window that rolls up like a blind. Long-press the wallpaper, drag it onto a Safari tab, the page pushes in, drop it and it becomes the hero of a landing page. Scroll: the hero morphs into a framed print on a product card, with the mat and molding growing out of the photo's edge. Pick a frame color (it paints across) and a size, then the nav button flies down into "Order print".
Order: one black shape keeps morphing: Ordered ✓ → Printing % → On its way (a van on a route) → Delivered ✓.
Wall: the delivered circle floods the frame edge to edge, holds black for a beat, and contracts into the framed print hanging on the real wall footage. The same iris opens onto the print, closes again, the frame floods the screen and contracts into the pill → the dot → the letters spring back out, landing on the beat return. Last frame = first frame.
</structure>

<build>
1. One HTML file, square 1440x1440. Every style is computed from time inside an async seek(t): no CSS transitions, no timers, no state between frames.
2. Springs are closed-form step responses. A value with many targets is the sum of one spring per change, so it stays a pure function of time.
3. Liquid glass: each glass element holds its own clone of the scene behind it, filtered with an SVG feImage displacement map (a rounded-rect distance field) through three feDisplacementMaps at slightly different scales for chromatic edges, plus a rim light. Glass letters: a canvas distance field per glyph gives the map, mask and highlights.
4. Goo: blur + alpha threshold, then composite the source atop it so the glass stays sharp inside.
5. Iris: 6 blades around a hexagonal aperture. Each blade is its two vertices, both edge extensions and the SHORT arc between them.
6. Wordmark squeeze: every letter moves toward the dot by the same factor and its drawn width follows (narrow the wdth axis, scale the rest), so the letters stay touching.
7. Footage: re-encode all-intra (ffmpeg -g 1), load it as a blob URL, await 'seeked' before drawing each frame.
8. Sound: a downloaded SFX for every event (Mixkit), never synthesized, each placed by its measured peak. The song starts on a downbeat: the zoom lands on the drop, the wall sits in the breakdown, the wordmark returns with the beat. Loudnorm to -14 LUFS.
9. Render with Playwright: 4 subframes per frame blended with ffmpeg tmix, 60fps. Check one frame per beat, then scan for single-frame pops (frame-difference spikes 3x their neighbours).
</build>

<gotchas>
backdrop-filter: url() misreads displacement maps in Chromium, so clone the scene instead. A flood must overscale past the corners and take about 0.3s, or half the screen changes in one frame. A child with visibility: visible shows through a hidden parent, so use inherit. Text that swaps inside a morphing shape needs its own mask. python http.server can't range-seek video, so use the blob URL.
</gotchas>

<start>
Ask me for the inputs, then show me the beat map and 4 stills (open, glass, stage, wall) before you write the full film.
</start>
  ```

### 3. The one-liner, by @stephanlivera
One sentence, run on Opus 5.5 at Max effort. His showreel passed 1.9M views. [Watch the video on X](https://x.com/stephanlivera/status/2103315922098470926)
```Plain Text
make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.
```

### 4. Pick a SaaS and launch it, by @moritzkremb
Opus picked a product on its own and made a 46-second launch video in Notion's style. In the replies he says it used HyperFrames. [Watch the video on X](https://x.com/moritzkremb/status/2103066071838466494) · [the prompt reply](https://x.com/moritzkremb/status/2103066083905417476)
```Plain Text
I want you to create a highly professional SaaS product launch video. Go and find some SaaS, preferably just one that people know, so it's easier to identify with it. Pick that, and then make sure to get actual assets and images and all of that stuff from the internet. Turn it into these typical, very professionally edited, motion-graphics-styled product launch videos that you see people making on Twitter when they launch new SaaS products (which are showing off the features, the benefits, and all of these things).
```

### 5. A product video from one line, by @ajith_io
A 40-second video for his product, DistilBook. Put your own product's name where it says Distilbook. [Watch the video on X](https://x.com/ajith_io/status/2103469807375208546)
```Plain Text
Research Distilbook.Make a dynamic 40-second motion graphics video on Distilbook that shows what an incredible motion designer you are. like it's your showreel - Go all out.
```

### 6. /brag, Apple style, by @0xhrushi
A 25-second launch video for his Mac app, NotchView. He pasted the /brag repo link and one sentence into Claude Code. [Watch the video on X](https://x.com/0xhrushi/status/2103392921559126157) · [his prompt reply](https://x.com/0xhrushi/status/2104207304765947919)
```Plain Text
https://github.com/latent-spaces/brag here's the skill now using this skill make me an launch video for this which is like very apple style of video exactly like how apple would do it
```

### 7. The workflow, by @rexan_wong
Rexan shared a workflow instead. His own one-prompt video looked mid, so he went through the viral ones to see how they were made. His six steps, word for word ([read the whole post](https://x.com/rexan_wong/status/2103707054108299437) for the reasoning under each):
1. get reference videos to direct from -> [whatships.com](http://whatships.com)
1. install @HyperFrames_ or @Remotion so opus can build the video
1. install @21st_dev for high quality components in the video
1. steps 1-3 were context + setup. now dump all of it into opus
1. pick the storyboard you like
1. let claude cook
Under step 4 he asks Opus for 3 storyboard variants, and under step 5 for one still frame per scene before anything moves.
---

## The skill: /brag
[latent-spaces/brag](https://github.com/latent-spaces/brag) is the skill repo from the reel, by Shunit Haviv Hakimi (@shunithaviv), MIT licensed. Its README calls it "a Claude Code skill that turns the project you created into a short, shareable launch video". On Opus 5.5, /brag switches to /brag-slim, the lean version, on its own.
**Install in Claude Code:**
```Plain Text
/plugin marketplace add latent-spaces/brag
/plugin install brag@brag
```
**Any other agent** (Cursor, Codex, Gemini CLI and more):
```Plain Text
npx skills add https://github.com/latent-spaces/brag --skill brag
```
Then open your project and run `/brag`, or tell Opus 5.5 "let's /brag about this." You can watch the videos it makes on the [/brag launch site](https://latent-spaces.github.io/brag/).
---

## Pro tips
> 💡 
  Check every number on screen before you post. Our travel-site video nearly shipped a "5.9x" that came from a build running on sample prices. The prompt flags placeholder data, but you know your product better than it does.
> 💡 
  Watch it on your phone first. Our first tour framed each section at 64 percent of the frame width, and the quotes came out about 6 px tall on a phone. The 30 px rule in the prompt is there because of it.
> 💡 
  If something looks janky, ask which transition is a crossfade. Every stiff moment in our builds turned out to be a crossfade where a shared element belonged.
---

## Before you burn a week of usage (the fine print)
- The original prompt template is @twoclipping's: [x.com/twoclipping/status/2103273003555402193](https://x.com/twoclipping/status/2103273003555402193). This guide is that template run on real websites, with the fixes folded in.
- Rendering is heavy. At 4 subframes and 60 fps, every second of video is 240 screenshots, so a 14-second loop is 3,360 of them. That is why the prompt refuses to render before the contact sheet is clean.
- Every video we made is a 1440 px square. Nothing in the engine depends on the shape of the frame, but we have not rendered a vertical one yet.
- Only animate sites, footage and music you have the rights to. Check the licence on every song.
---
Built by **JENS AI** · Jens Heitmann
More Claude Code workflows every week: follow **@jens.heitmann** on Instagram.
Comment "MOTION" on the post that brought you here and share it with one builder who needs it.
Want the full prompt systems? Join the free community: **[community.jensheitmann.com](https://community.jensheitmann.com)**