# Motion theory: the studio's short notes (our own summaries)

Source: a motion-design knowledge pack (2026-09-30), Parts 3-8 and 12-13, rewritten as
rules for our kit. Tokens and checklist: `.claude/skills/studio-house/SKILL.md`. Craft recipes:
`motion-craft.md`.

## 1. Disney's principles, as we use them
| Principle | In our films |
|---|---|
| Timing | heavier things take longer: numbers/type `sp "heavy"`, UI `sp "snappy"`, camera `MOTION.dur.hero` |
| Slow in / slow out | springs or `tween` roles; never linear on position/scale |
| Anticipation | a small dip before the big move: the cursor presses 80 ms early (`press()`), a card pulls back before it flies |
| Follow-through / overlap | children settle after the parent: text `swapIn` ~70 ms after its container; staggers |
| Staging | one focal point at a time; dim/blur the rest (report spotlight, fingerprint callouts) |
| Arcs | curved paths (the cursor, the Film 2 pass, cards dealt on arcs), not straight slides |
| Secondary action | glow pulse, card float, "Synced from EA" chip settling while the main move happens |
| Squash & stretch | tiny: press scale 0.97, slam overshoot on UI only |
| Exaggeration | restrained in UI scenes (productive), bolder in slams and 3D turns (expressive) |
| Solid drawing / appeal | one curve family everywhere (the tokens), one type system, one grade |

## 2. UX in Motion (Willenskomer): the vocabulary for UI scenes
Easing · Offset & delay (stagger) · Parenting (child follows parent) · Transformation (one shape
becomes another: our shared elements) · Value change (odometers, bars) · Masking (wipes, reveals)
· Overlay (glass over plates) · Cloning (a card clones into its detail view) · Obscuration (blur
the ground behind the focus) · Parallax (plates drift slower than UI) · Dimensionality (3D turns,
dealt cards) · Dolly & zoom (`camAt`). Name the principle for each scene change in the script.

## 3. Fluid interfaces (Apple WWDC18) and invisible details (Rauno Freiberg)
UI we fake should behave physically: respond instantly (the click lands on the beat, the button
reacts on press, not after), move continuously (no teleports between states), carry momentum
(a flicked card keeps going, then settles on a spring), and be redirectable (retarget with
`track()` mid-move, never restart). Premium = consistent metaphors (a report is paper, a dossier
binds), morphing instead of swapping, and restraint: the more often a motion repeats, the
smaller it should be.

## 4. Numbers
- Ease roles: enter = decelerate, exit = accelerate and ~70 % of the entrance length, move =
  in-out, opacity = sine. Springs for anything organic or gesture-like.
- Durations: micro 120-250 ms · cards/panels 250-400 ms · full-frame 450-600 ms · hero/camera
  0.7-1.2 s. Longer distance → longer duration. At 60 fps, 100 ms = 6 frames.
- Stagger: lists 30-80 ms, words 60-120 ms, characters 20-50 ms; the last item lands within
  ~0.5-0.7 s of the first.
- Press: scale 0.97, ~160 ms; enter from 0.95 + blur, never from scale 0.

## 5. Editing (Murch, eye-trace, rhythm)
- Rule of six, in order: emotion > story > rhythm > eye-trace > 2D plane > 3D space. Sacrifice
  from the bottom. Cut when the viewer has seen enough (the "blink").
- Eye-trace: the next shot's key element appears where the eye already is; motion leaving right
  hands off to motion arriving from the same side.
- Rhythm: cuts and key hits on beats, big reveal on the kick-in; vary shot length (quick stacks,
  then a held hero of 2-3 s so it breathes). Hook in 1-2 s, product by ~6 s.
- One transition family per film + one accent; transitions motivated by motion, never decoration.
- VO films: J-cuts (voice leads the picture) smooth scene changes.

## 6. Kinetic typography
Two faces max (Outfit 800 + DM Mono). Reveal in reading order, line by line. Long or complex text
→ simpler motion; key words get the hold and the accent colour (one highlighted word = the focal
point). Every text element has an entrance, an emphasis and an exit, the same per element type.
Techniques we use: mask/baseline rise (`CharRise`), per-word rise on VO times (`Words ats`),
split-flap and decode (Film 2 chips; ScrambleText-style), highlight box drawn behind a word,
scale punch on the key word, 3D X-axis fold-in (`Slam3`). Hold ≥ 0.3 s per word once fully in.

## 7. Explainer / launch playbook
- Explainer (60-90 s): relatable pain → "there's a better way" → how it works in 3 steps →
  outcome → CTA. Launch (30-60 s): hook → reveal → 3 features one beat each → proof → CTA.
  Teaser (6-15 s): motion + one line + logo.
- The product is the hero, shown in the rhythm of real use (search → click → result), rebuilt as
  live components. Simplify dense UI on screen (dim inactive panels, keep only the key control
  sharp). Show the setting next to the result (the `basis:` stat next to the AI line).
- Cursor: fast, confident, slightly curved; click = ripple + button 0.97.
- UI moves at real UI speeds (productive); the camera can be slower and cinematic (expressive).

## 8. Frames
Layer stack: ground (gradient/plate) → assets → UI and type → grade → grain + vignette. Depth
from parallax, soft shadows and depth-of-field blur on secondary layers. Idle elements breathe
with a tiny sine. One hero accent colour, neutrals do the rest. Texture (grain, glass, a touch of
light) is what stops the "generated" look; chromatic aberration only as a rare accent.

## 9. Productive vs expressive (Carbon, Material 3)
Tag every scene: **productive** = functional UI motion, fast and small (hub, search, click,
report); **expressive** = brand moments, slower and bigger (hook slams, 3D turns, verdicts, end
card). A film alternates them; two expressive scenes in a row feel loud, two productive ones flat.

## Further study (for us, not fed as text)
The Illusion of Life (Thomas & Johnston) · In the Blink of an Eye (Murch) · The Animator's
Survival Kit (Williams) · animations.dev (Emil Kowalski) · School of Motion · Material 3 motion
tokens (m3.material.io/styles/motion) · IBM Carbon motion · UX in Motion manifesto ·
rauno.me/craft/interaction-design. Reference libraries: Motionographer, Art of the Title, Mobbin,
Godly, awesome-motion-graphics, moonb.io / advids / Superside launch-video breakdowns.
SFX sources if the synth set ever falls short (owner's call, check licences): Pixabay SFX, Mixkit,
Uppbeat.
