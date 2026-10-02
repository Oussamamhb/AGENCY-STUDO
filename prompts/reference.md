# Reference (name a look, feed a frame)

Without a reference, Opus falls back to its default: centered text, gradient background,
everything fading in. Naming a style beats describing one, and a reference video or frame
gives the model pacing, type and transitions to copy.

- **A frame:** screenshot one frame of a video you love, attach it, say what to take
  (palette, type, grain) and what not to take (subject).
- **A video:** give the file or link, extract frames with ffmpeg, describe pacing shot by
  shot before writing code.
- **A library:** a folder of your images or past work. Write a style_guide.md from it first.
- **Sources:** whatships.com (launch videos), Dribbble motion, your competitors' launch films.

Pipeline: `ref.mp4` → `frames/` (ffmpeg fps=2) → `style_guide.md` → `shotlist.md` → your OK → code.
Reject = rewrite the shot list, not the code.

```text
Reference: ./refs/launch.mp4 (and ./refs/frames/*.png)

1. Extract one frame every 0.5s with ffmpeg. Study them.
2. Write ./docs/style_guide.md: palette (hex), type (family, weight, tracking),
   shot lengths, transition types, camera moves, texture/grain, how text enters and exits.
3. Write ./docs/shotlist.md for a [DURATION]s video about [SUBJECT] in THAT style.
   Take the grammar of the reference, never its content, logos or characters.
4. Show me both files. Wait for my OK before any code.
```

In this project, "./refs" and "./docs" mean `videos/<video-name>/refs/` and
`videos/<video-name>/docs/`.

When you give a reference, let the model pick the technique. Specify the look and the
constraints, not the library, unless you need a specific framework for reuse.
