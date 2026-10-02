#!/usr/bin/env bash
# Make the review images Claude looks at before showing anything (course step 11).
#   tools/critique.sh <video.mp4> [strip-start-seconds]
# Writes next to the video: contact.png (2 fps, 6 across), phone.png (360 px wide, 1 fps),
# strip.png (12 consecutive frames from strip-start), poster.png, loop_check.mp4.
# Then run the prompt in prompts/critique-pass.txt.
set -euo pipefail
video="$1"; strip_at="${2:-}"
dir="$(dirname "$video")"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$video")
rows=$(python3 -c "import math; print(max(1, math.ceil($dur * 2 / 6)))")
phone_rows=$(python3 -c "import math; print(max(1, math.ceil($dur / 5)))")
strip_at="${strip_at:-$(python3 -c "print(round($dur / 2, 2))")}"

ffmpeg -y -loglevel error -i "$video" -vf "fps=2,scale=270:-1,tile=6x$rows" -frames:v 1 "$dir/contact.png"
ffmpeg -y -loglevel error -i "$video" -vf "fps=1,scale=360:-1,tile=5x$phone_rows" -frames:v 1 "$dir/phone.png"
ffmpeg -y -loglevel error -ss "$strip_at" -i "$video" -vf "scale=320:-1,tile=12x1" -frames:v 1 "$dir/strip.png"
ffmpeg -y -loglevel error -ss "$(python3 -c "print(round($dur * 0.7, 2))")" -i "$video" -frames:v 1 "$dir/poster.png"
ffmpeg -y -loglevel error -stream_loop 1 -i "$video" -c copy "$dir/loop_check.mp4"
echo "review images in $dir: contact.png phone.png strip.png (from ${strip_at}s) poster.png loop_check.mp4"
