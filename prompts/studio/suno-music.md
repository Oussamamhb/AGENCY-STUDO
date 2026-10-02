# Suno music for our films

The owner makes the music in Suno (v6, Advanced); we fit it to the film bar by bar with
`tools/music-bars.py`. Starter taste (change it in `videos/BRAND.md`): **upbeat, groovy, four-on-the-floor** (style A
below won the worked example's launch film). Never EDM/dubstep. Per film: adapt the Structure block and the timing table
to the film's script, keep the settings and the Exclude list.

## How the song gets synced (for Claude)
1. Owner sends the WAV → `public/<slug>/song.wav`.
2. `python3 tools/music-bars.py analyze public/<slug>/song.wav` → tempo, downbeat, energy per bar.
3. Choose the film tempo (meet in the middle: song ±3 %, film ±3 %) and write
   `videos/<slug>/music.json` with the bar order that fits the story (kick-in on the film's big
   moment, a break under the calm part, the song's own ending at the end).
4. `python3 tools/music-bars.py edit videos/<slug>/music.json` → grid check p90 < 17 ms.
5. Register the film with that tempo in `src/Root.tsx`, scale the SFX cues (sfx.mjs TEMPO), then
   `tools/deliver.sh <Name> <slug> --music public/<slug>/track-edit.wav`.

## With a voice-over (explainers)
The voice comes first. Ask Suno for an arrangement **with space**: lean grooves with no lead
melody, an almost-empty break, stab hits, one warm hook for the end (write the series brief in
`videos/<slug>/music.md`). Map each block to the VO: lean groove
under explanations, break under the line that must land, stabs in the pauses between short spoken
words, the hook under the end card. `tools/mix.sh` carves 2-4 kHz out of the music and ducks it
~10-12 dB while the narrator speaks; ask for **stems** so the chords/hook can come in only in his pauses.

---

# Worked example: launch film for a football-gaming web app (75 s, 16:9 + 9:16)

The film is cut on a **120 BPM grid in 4/4**: 1 beat = 0.5 s, 1 bar = 2 s. The song needs:

1. **Upbeat and groovy, steady 120 BPM, four-on-the-floor.** A kick on every beat means every cut
   in the film lands on a drum hit. No tempo changes, no half-time, no heavy bass "drop".
2. **A clear moment where the full groove kicks in.** A short build, then everything comes in. I
   place that moment exactly on 0:14, the "Every match. On the record." moment.
3. **Instrumental.** No vocals, because the voice-over goes on top.

Everything else (the exact section lengths, the ending) I fix in the edit: I trim, loop bars and add
the final hit and the fade-out.

> v1 of this brief produced dubstep. "Trap drums", "sub bass", "drop", "impacts", "risers" and
> "A minor" all push Suno into heavy EDM. This version uses feel-good, groove words and a major key,
> and bans the heavy styles.

---

## Settings (Suno v6, Advanced)

| Setting | Value |
|---|---|
| Model | v6 (or newest) · **Advanced** tab |
| Lyrics box | the **Structure** block below (don't press the ✨ under it) |
| Styles | one style from below. Don't tap the suggestion chips; switch off the magic wand if it's on (blue) |
| Exclude styles | `dubstep, brostep, wobble bass, growl bass, trap, 808, heavy drop, riddim, drum and bass, metal, distorted, dark, aggressive, horror, cinematic trailer, vocals, singing, rap, lo-fi, slow tempo, half-time, long intro` |
| Vocal Gender | leave both unselected |
| Duration | **1:30** |
| Max Mode | On for real takes (if your credits allow) |
| Weirdness | **25 %** (predictable, catchy structure) |
| Style Influence | **80 %** |
| Variety | Normal |
| Personalize | Off |
| Title | `<Brand> - Launch` |

Press Create 2–3 times per style. Try **A** first, then **B**.

---

## Style: pick one

**A. Feel-good funky house (sports-ad energy; recommended)**
```
instrumental, upbeat funky house, 120 BPM, C major, four-on-the-floor, feel-good and energetic, groovy bouncy bassline, bright piano chord stabs, disco strings, rhythmic funk guitar, big handclaps, crisp open hi-hats, catchy synth hook, sunny, confident, modern sports commercial, clean polished mix, no vocals
```

**B. Indie dance with guitars (football-game soundtrack feel)**
```
instrumental, energetic indie dance, 120 BPM, D major, four-on-the-floor drums, driving bass, bright jangly rhythmic electric guitars, catchy synth lead hook, stadium handclaps, uplifting, youthful, festival energy, feel-good football highlights, clean punchy mix, no vocals
```

**C. Afro house (warm, bouncy, celebration)**
```
instrumental, upbeat afro house, 120 BPM, G major, four-on-the-floor kick, rolling percussion, shakers and congas, bouncy warm bassline, bright marimba and synth hook, joyful celebration, football party energy, sunny, clean modern mix, no vocals
```

**D. Nu-disco / electro-pop (glossy, premium tech launch)**
```
instrumental, nu-disco electro pop, 120 BPM, E major, four-on-the-floor, funky slap bass, shiny analog synth chords, sparkly arpeggio, snappy claps, upbeat and stylish, premium tech product launch, confident, bright, polished mix, no vocals
```

---

## Structure (paste into the Lyrics box)

```
[Intro: bright filtered piano chords, soft claps, very short]
[Hits: five punchy chord stabs in time with the kick]
[Build: drums building, claps doubling, filter opening, excitement rising]
[Hook: full groove kicks in, catchy lead hook, four-on-the-floor, upbeat]
[Groove: bouncy bassline, funky guitar, keep the energy high]
[Groove: variation, new melody, still driving]
[Hits: six punchy chord stabs with the drums]
[Break: piano and claps only, building back up]
[Hook: last big chorus, strongest energy]
[End: clean stop on the downbeat]
```

---

## What the music should do on each part of the film

| Time | Bars (120 BPM) | On screen | Music |
|---|---|---|---|
| 0:00–0:03 | 1–1.5 | Glass pill types "Everything your club needs" | Short bright intro |
| 0:03–0:08 | 2–4 | Word slams STATS / RESULTS / RANKINGS / TOURNAMENTS / TRANSFERS, one per second | **Stab on every 2nd beat** (0:03, 0:04, 0:05, 0:06, 0:07) |
| 0:08–0:14 | 5–7 | Chaos counter to 5,000, everything pulled into the logo | **Build**: energy rising, claps doubling |
| **0:14** | **8** | Green flood: "Every match. On the record." | **Full groove kicks in (the hook)** |
| 0:14–0:20 | 8–10 | Result card, VERIFIED, "Stop tracking. Start competing." | Full energy |
| 0:20–0:26 | 11–13 | Liquid logo, Play → Sync → Verify → Rank | Groove, a little lighter (filtered is fine) |
| 0:26–0:56 | 14–28 | Six product pages (club, stats, card, AI scout, tactics, transfers) | Main groove, steady and driving; page changes at 0:31.5, 0:36, 0:40, 0:47, 0:50.5 |
| 0:56–1:03 | 29–32 | LEAGUES / CUPS / FRIENDLIES / CONTRACTS / PRIZE POOLS / BALLON D'OR | **Stab on every 2nd beat** (0:57 … 1:02), peak energy |
| 1:03–1:08 | 32–34 | 500+ players, 200+ clubs, "In just 3 months." | Short break, building back up |
| **1:08** | **35** | White end card: logo, the launch line | **Last big hook**, clean stop (I can add the final hit) |
| 1:08–1:15 | 35–38 | CTA button click, the URL | Tail and fade (I can do the fade) |

Suno won't hit these exact seconds, and it doesn't need to. As long as the tempo is steady at 120
and it has a clear moment where the groove kicks in, I slide the song so that moment lands on 0:14. If needed I also loop or cut
whole bars so the second stab section lands on 0:57 and the last hit on 1:08. Cuts land on bar
lines, so they're inaudible.

---

## Picking the best take (listen with the video in mind)

- [ ] No vocals, no vocal chops that sound like words
- [ ] Feels **upbeat and happy-energetic**, not dark, heavy or wobbly
- [ ] The full groove kicks in within the first ~25 seconds (a long intro is harder to use)
- [ ] The tempo feels steady (tap along: 2 taps per second)
- [ ] No quiet, sleepy passage between 0:25 and 1:05 of the song
- [ ] The mix sounds clean on phone speakers (punchy kick, bass not muddy)

If a take is great except the ending, use **Extend** (or **Replace section** in the editor, if your
plan has it) on only the last part.

---

## Send it back

Download the take as **WAV** (MP3 320 is OK) and send it to me in this chat. If your plan can export
**stems** (drums / bass / melody), send those too; they give me more control around the voice-over.

What I do with it:
1. Measure its exact tempo and beat grid (`tools/beats.py`).
2. Line up the moment the groove kicks in with 0:14. Loop or cut bars so the second stab section and the final hit land
   on 0:57 and 1:08. If the tempo is a hair off (118–122), stretch it to exactly 120. Under 2% is
   inaudible.
3. Mix it under the SFX (music ducks slightly under clicks and hits) and later under the Voicebox
   voice-over, at -14 LUFS for Instagram/YouTube.
4. Same song for the 16:9 and the 9:16 versions (they share one timeline).
