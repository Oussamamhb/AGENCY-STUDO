#!/usr/bin/env bash
# Deliver a film: render every format, build the SFX, balance them against the music, mix to
# -14 LUFS, make chat-sized share copies (<30 MB) and review sheets. One command, same result
# every time.
#
#   tools/deliver.sh <Name> <slug> [options]
#     --formats "16x9 9x16"      compositions <Name>-<format> registered in src/Root.tsx
#     --music  public/<slug>/track-edit.wav   (from tools/music-bars.py; omit for SFX-only)
#     --cues   videos/<slug>/sfx.json         (tools/sfx.mjs cue list, times in film seconds)
#     --vo     out/<slug>/vo.wav              (optional voice-over; music ducks under it)
#     --skip-render                           reuse out/<slug>/silent-<format>.mp4
#     --mb                                    motion blur: 4 sub-frames per frame (films that wrap
#                                             themselves in <MotionBlur on={mb}>); ~4x render time
#     --props '<json>'                        extra input props for the render (e.g. '{"captions":true}')
#     --no-share                              skip the <30 MB share copy (owner default: one ready-to-post master)
#
# Output (out/ is not committed):
#   out/<slug>/<Name>-<format>.mp4        master (H.264 CRF 16, 60 fps, -14 LUFS)
#   out/<slug>/<Name>-<format>-share.mp4  same film re-encoded to fit the 30 MB chat limit
#   out/<slug>/<Name>-<format>-contact.jpg one frame every 3 s, for review
set -euo pipefail
cd "$(dirname "$0")/.."

name="$1"; slug="$2"; shift 2
formats="16x9 9x16"; music=""; cues="videos/$slug/sfx.json"; vo=""; render=1; mb=0; props="{}"; share=1
while [ $# -gt 0 ]; do
  case "$1" in
    --mb) mb=1; shift ;;
    --no-share) share=0; shift ;;
    --props) props="$2"; shift 2 ;;
    --formats) formats="$2"; shift 2 ;;
    --music) music="$2"; shift 2 ;;
    --cues) cues="$2"; shift 2 ;;
    --vo) vo="$2"; shift 2 ;;
    --skip-render) render=0; shift ;;
    *) echo "unknown option $1"; exit 1 ;;
  esac
done
out="out/$slug"; mkdir -p "$out"

# 1. SFX stem, balanced against the music when there is music
sfx=""
if [ -f "$cues" ]; then
  node tools/sfx.mjs "$cues" "$out/sfx.wav"
  sfx="$out/sfx.wav"
  if [ -n "$music" ]; then
    gain=$(python3 tools/sfx-balance.py "$music" "$out/sfx.wav" "$cues" --quiet 2>/dev/null)
    python3 tools/sfx-balance.py "$music" "$out/sfx.wav" "$cues" 2>/dev/null
    ffmpeg -loglevel error -y -i "$out/sfx.wav" -af "volume=${gain}dB" -c:a pcm_s24le "$out/sfx-lev.wav"
    sfx="$out/sfx-lev.wav"
  fi
fi

for f in $formats; do
  id="$name-$f"
  # 2. silent render
  if [ "$render" = 1 ] || [ ! -f "$out/silent-$f.mp4" ]; then
    echo "rendering $id ..."
    p="$props"
    if [ "$mb" = 1 ]; then p=$(python3 -c 'import json,sys; d=json.loads(sys.argv[1]); d["mb"]=True; print(json.dumps(d))' "$props"); fi
    npx remotion render "$id" "$out/silent-$f.mp4" --props="$p" --log=error
  fi
  # 3. mix (-14 LUFS with music; -16 for SFX alone so it doesn't feel slammed)
  if [ -z "$music" ] && [ -z "$vo" ]; then export LUFS=-16 LRA=20; else unset LUFS LRA || true; fi
  tools/mix.sh "$out/silent-$f.mp4" "$out/$id.mp4" "$music" "$sfx" "$vo"
  # 4. share copy under 30 MB
  for crf in $([ "$share" = 1 ] && echo 21 23 25 27); do
    ffmpeg -loglevel error -y -i "$out/$id.mp4" -c:v libx264 -crf $crf -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart "$out/$id-share.mp4"
    [ "$(stat -c %s "$out/$id-share.mp4")" -lt 29000000 ] && break
  done
  # 5. review sheet
  w=$([ "$f" = "9x16" ] && echo 216 || echo 384)
  ffmpeg -loglevel error -y -i "$out/$id.mp4" -vf "fps=1/3,scale=$w:-1,tile=8x4:padding=4:color=white" -frames:v 1 "$out/$id-contact.jpg"
  lufs=$(ffmpeg -hide_banner -nostats -i "$out/$id.mp4" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
  echo "✓ $out/$id.mp4  ($lufs LUFS, $(du -m "$out/$id.mp4" | cut -f1) MB)"
done
