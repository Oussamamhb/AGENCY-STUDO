#!/usr/bin/env bash
# Normalise Gemini generations (prompts/studio/gemini.md) for Remotion.
#   tools/gen-prep.sh <slug> <file> [<file> ...]   (files from the owner, e.g. public/<slug>/gen/raw/*)
# Clips  -> public/<slug>/gen/<name>.mp4  : 60 fps H.264 with motion-interpolated in-between frames
#           (Veo delivers 24 fps: plain frame repeats judder under a camera drift), keyframe every
#           12 frames (fast exact seeks, small enough for git), no audio, and a contact sheet.
#           SLOW=0.64 tools/gen-prep.sh ... also slows the clip (8 s -> 12.5 s) without stutter;
#           never slow a clip with OffthreadVideo playbackRate (it repeats frames).
# Images -> public/<slug>/gen/<name>.webp : quality 92, longest side <= 3840
# Then record prompt / tool / date / picked variant in public/<slug>/gen/gen.json.
set -euo pipefail
cd "$(dirname "$0")/.."
slug="$1"; shift
dst="public/$slug/gen"; mkdir -p "$dst"
for f in "$@"; do
  name=$(basename "${f%.*}")
  case "${f,,}" in
    *.mp4|*.mov|*.webm|*.mkv)
      ffmpeg -loglevel error -y -i "$f" -an -vf "setpts=PTS/${SLOW:-1},minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,format=yuv420p" -c:v libx264 -crf 20 -g 12 -preset slow "$dst/$name.mp4"
      ffmpeg -loglevel error -y -i "$dst/$name.mp4" -vf "fps=1,scale=480:-1,tile=4x2:padding=4:color=white" -frames:v 1 "$dst/$name-sheet.jpg"
      echo "clip  -> $dst/$name.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$dst/$name.mp4") s)"
      ;;
    *.png|*.jpg|*.jpeg|*.webp)
      ffmpeg -loglevel error -y -i "$f" -vf "scale='min(3840,iw)':-2" -c:v libwebp -quality 92 "$dst/$name.webp"
      echo "image -> $dst/$name.webp"
      ;;
    *) echo "skip $f (unknown type)" ;;
  esac
done
