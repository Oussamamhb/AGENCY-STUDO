#!/usr/bin/env bash
# Start a new film in one command.
#   tools/new-video.sh <Name> <slug>        e.g.  tools/new-video.sh LaunchTeaser launch-teaser
# Creates
#   src/videos/<Name>/<Name>.tsx     copy of the Template film (kit, formats, tempo prop wired)
#   videos/<slug>/                   brief.md, script.md, sfx.mjs, music.json, docs/{shotlist,review_log}.md
#   public/<slug>/                   assets for this film (captures, Suno song, VO)
# and registers <Name>-16x9 / <Name>-9x16 in src/Root.tsx.
set -euo pipefail
cd "$(dirname "$0")/.."
name="$1"; slug="$2"
[[ "$name" =~ ^[A-Z][A-Za-z0-9]*$ ]] || { echo "Name must be PascalCase, e.g. AIScout"; exit 1; }
[ -e "src/videos/$name" ] && { echo "src/videos/$name already exists"; exit 1; }
upper=$(echo "$name" | sed -E 's/([a-z0-9])([A-Z])/\1_\2/g' | tr '[:lower:]' '[:upper:]')

mkdir -p "src/videos/$name" "videos/$slug/docs" "public/$slug"
sed -e "s/TEMPLATE_DURATION/${upper}_DURATION/g" -e "s/export const Template:/export const $name:/" \
    -e "s|// Starting point for a new video (copied by tools/new-video.sh).|// $name ($slug). Started from the Template film.|" \
    src/videos/Template/Template.tsx > "src/videos/$name/$name.tsx"
touch "public/$slug/.gitkeep"

python3 - "$name" "$upper" <<'EOF'
import sys
name, upper = sys.argv[1], sys.argv[2]
p = "src/Root.tsx"
s = open(p).read()
s = s.replace("// @new-video:import", f'import {{ {upper}_DURATION, {name} }} from "./videos/{name}/{name}";\n// @new-video:import')
s = s.replace("    {/* @new-video:register */}", f'    {{film("{name}", {name}, {upper}_DURATION)}}\n    {{/* @new-video:register */}}')
open(p, "w").write(s)
EOF

cat > "videos/$slug/brief.md" <<EOF
# $name: brief

Read \`videos/BRAND.md\` (product, brand, owner decisions) first.

- **Goal:** (what should the viewer do after watching?)
- **Audience:** (who is this for?)
- **Formats:** 16:9 (YouTube) + 9:16 (Reels/Shorts), same timeline
- **Length:** (e.g. 45-75 s)
- **Voice-over:** yes/no. VO explains features in natural full sentences (not hype one-liners)
- **Music:** owner's Suno track, see \`prompts/studio/suno-music.md\`
- **Real UI to show:** (pages / states; capture with tools/capture-site.mjs, never invent screens)
- **Tone:** (e.g. confident, premium, playful)
- **CTA:** (button text · url)
EOF
cat > "videos/$slug/script.md" <<EOF
# $name: script (owner approves this before anything is built)

Timeline on the 120 BPM grid (1 bar = 2 s). One row per beat of the story.

| Time | On screen | VO (if any) | Sound |
|---|---|---|---|
| 0:00 | hook | | |
EOF
cat > "videos/$slug/docs/shotlist.md" <<EOF
# $name: shot list

| Scene | Start (120 grid) | Layout 16:9 | Layout 9:16 | Real assets |
|---|---|---|---|---|
EOF
cat > "videos/$slug/docs/review_log.md" <<EOF
# $name: review log

Every round: contact sheet of stills, score 1-10 on hook (first 2 s), phone readability, motion,
variety, brand accuracy, sound sync. Fix the 3 worst problems. Minimum 3 rounds; all scores 8+.
EOF
cat > "videos/$slug/sfx.mjs" <<'EOF'
// Sound-effect cue sheet for this film -> sfx.json (node videos/<slug>/sfx.mjs).
// Times are film seconds on the 120 BPM grid; when the film runs at another tempo (music),
// set TEMPO and every time is scaled by 120/TEMPO. Voices: see tools/sfx.mjs.
import { writeFileSync } from "node:fs";
const TEMPO = 120;
const out = [];
const c = (t, type, gain = 0.5, extra = {}) => out.push({ t: +((t * 120) / TEMPO).toFixed(4), type, gain, ...extra });
const typing = (at, text, cps = 24) => [...text].forEach((ch, i) => ch !== " " && c(at + i / cps, "key", 0.2, { pitch: 0.85 + ((i * 7) % 5) * 0.07 }));

// Hook: the pill types itself
c(0.15, "pop", 0.4); typing(0.7, "Everything your team needs");
// Liquid wipe into the feature page
c(2.35, "liquid", 0.6, { dur: 1.1 });
// Feature: rows rise, the cursor clicks, the container morphs, stats count
[3.45, 3.55, 3.65].forEach((t) => c(t, "tick", 0.3));
c(4.4, "click", 0.55); c(4.6, "swipe", 0.4); c(4.9, "success", 0.5);
// Scene change + end card
c(8.72, "swipe", 0.45); c(8.92, "whoosh", 0.5, { dur: 0.45 });
c(11.4, "click", 0.55); c(11.55, "success", 0.55);

out.sort((a, b) => a.t - b.t);
writeFileSync(new URL("./sfx.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(out.length, "cues");
EOF
cat > "videos/$slug/music.json" <<EOF
{
  "src": "public/$slug/song.wav",
  "out": "public/$slug/track-edit.wav",
  "tempo": 124,
  "bars": ["0-15"]
}
EOF

echo "Created $name ($slug). Registered $name-16x9 / $name-9x16 in src/Root.tsx."
echo "Next: fill videos/$slug/brief.md + script.md with the owner, then build src/videos/$name/$name.tsx."
