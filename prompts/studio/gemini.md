# Gemini (the owner's Google AI account): photos and video clips for our films

The owner can generate **images** (Gemini app image model, "Nano Banana") and **8-second video
clips** (Veo, in the Gemini app or in Flow). Claude can't reach Gemini from the cloud, so it works
like the voice-over: **Claude writes paste-ready prompts, the owner generates, uploads the files,
Claude reviews and builds them in.**

## What Gemini is for (and what it is never for)
| Use it for | Never for |
|---|---|
| **Plates**: a photographic background layer behind our real UI (e.g. a desk lit by a monitor at night, hands on a phone, rain on a window; match the product's world) | **Product UI**: every product screen, card and number stays our real, rebuilt component with real data |
| **B-roll moments** for hooks and breaks (a light flickering on, a hand picking up the device, a door opening) | **Real people**: no real players, no faces of real people, no lookalikes. Real users stay real data, never an AI face |
| **Textures and grounds** for type slams (frosted glass, brushed metal, wet asphalt under coloured light) | **Logos and brands**: no product logo (we have the real SVG), no other companies' logos, signs or ad boards |
| **Objects** we can't build as UI (a glass object that stands for the product, a trophy on a desk), always faceless and brandless | **Text**: generated text garbles. All type is ours, set in Remotion |

The owner's bans still apply to anything generated: no generic AI look (glowing particle
nebulas, holograms, neon, "futuristic HUD"), no dot grids, no neon circles. We want it to look
**shot**, not generated: real lenses, real light, film grain, restraint.

## The style lock (paste at the end of every prompt)
> Style: premium sports-tech commercial, shot on a cinema camera with a 35 mm or 50 mm lens,
> shallow depth of field, natural film grain. Dark, near-black shadows. Light is cool teal
> (#38B2AC) with soft blue (#63B3ED) rim light; no other strong colours. Calm and restrained,
> no lens flares, no neon, no particles, no holograms. No text, no letters, no numbers, no logos,
> no brand marks, no advertising boards. No recognizable faces.

For video add:
> Camera: one slow, smooth move (push-in, dolly or gentle orbit), no shake, no cuts, no speed
> ramps. Audio: none needed (we replace it).

## How to prompt (one shot per prompt)
Write it like a shot on a call sheet, in this order:
1. **Shot + lens**: "Close-up, 50 mm, shallow depth of field", "Wide shot from the tunnel mouth".
2. **Subject + action**: one subject, one simple action ("hands grip a game controller, thumbs
   press the sticks").
3. **Place + time + light**: "a dark living room at night, lit only by the TV's teal glow".
4. **Camera move** (video): one move, its speed ("slow push-in over 8 seconds").
5. The **style lock**.

Ask for **2-4 variants** of each shot and send all of them; Claude picks by looking at them.

## Specs
- Format: **16:9** for the 16:9 film; generate the **9:16** version separately once the 16:9 is
  locked (never crop one into the other, same rule as our renders).
- Images: the highest resolution offered. Video: 1080p if the plan allows, else 720p (plates sit
  behind glass and blur, so 720p works).
- Check the corners for a **visible watermark** before sending. If there is one, say so; we don't
  remove watermarks, we pick another route together.
- Commercial use: the owner is responsible for the account's terms; Google's generated media
  carries an invisible SynthID mark, which is fine.

## Handoff (like the VO)
1. Claude puts the film's prompts in `videos/<slug>/gemini-prompts.md` (ids like `G1-hook-plate`)
   and gives them to the owner in chat, ready to paste.
2. The owner generates, names the files by id (`G1-hook-plate-a.mp4`, `G1-hook-plate-b.mp4`…)
   and uploads them in chat (or commits them to `public/<slug>/gen/raw/`).
3. Claude runs `tools/gen-prep.sh` (normalises: 60 fps all-intra H.264 without audio for clips,
   WebP for images, into `public/<slug>/gen/`), writes `public/<slug>/gen/gen.json` (prompt,
   tool, date, which variant was picked: provenance for every generated file), looks at stills,
   and builds the pick in with `GenPlate` (`src/kit/gen.tsx`): dimmed, graded to the brand,
   slow drift, always **under** the real UI.
4. Review loop as usual (stills, scores, pops). A plate that makes the UI harder to read goes.

## Grading rules (GenPlate does these)
- Plates sit at 25-45 % brightness under UI, desaturated toward teal, with a vignette.
- Motion under UI is slow; the UI and type carry the rhythm, never the plate.
- A plate never crossfades into UI: it sits under a scene, and the scene's shared element or
  flood carries the transition as before.
