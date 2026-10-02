#!/usr/bin/env bash
# Put music, sound effects and (optionally) a voice-over under a silent render and normalise
# to -14 LUFS (two-pass loudnorm). With a voice-over, the music ducks under the voice.
# Video is copied, not re-encoded.
#   tools/mix.sh <silent.mp4> <final.mp4> [music.wav] [sfx.wav] [vo.wav]
# Missing audio inputs are skipped. Env LUFS / LRA override the -14 LUFS target (e.g. SFX-only stems).
set -euo pipefail
video="$1"; out="$2"; music="${3:-}"; sfx="${4:-}"; vo="${5:-}"

inputs=(-i "$video"); n=0; m=""; x=""; v=""
if [ -n "$music" ] && [ -f "$music" ]; then n=$((n + 1)); inputs+=(-i "$music"); m="[$n:a]"; fi
if [ -n "$sfx" ] && [ -f "$sfx" ]; then n=$((n + 1)); inputs+=(-i "$sfx"); x="[$n:a]"; fi
if [ -n "$vo" ] && [ -f "$vo" ]; then n=$((n + 1)); inputs+=(-i "$vo"); v="[$n:a]"; fi

if [ "$n" -eq 0 ]; then
  cp "$video" "$out"; echo "no audio given, copied video -> $out"; exit 0
fi

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$video")
graph=""; labels=""; count=0
if [ -n "$v" ]; then
  graph+="${v}volume=1.6,asplit=2[vo][key];"
  if [ -n "$m" ]; then
    # music under a voice: carve the voice band (2-4 kHz) out of the music, then duck it (voice ~11 dB
    # over the music while he speaks, back up in his pauses; measured with tools/mix-check.py;
    # env CARVE / DUCK_RATIO / DUCK_THR)
    graph+="${m}volume=0.8,equalizer=f=3000:t=o:w=1.5:g=${CARVE:--5}[mus];[mus][key]sidechaincompress=threshold=${DUCK_THR:-0.05}:ratio=${DUCK_RATIO:-4}:attack=20:release=400:makeup=1[duck];"
    labels+="[duck]"; count=$((count + 1))
  else
    graph+="[key]anullsink;"
  fi
  labels+="[vo]"; count=$((count + 1))
elif [ -n "$m" ]; then
  labels+="$m"; count=$((count + 1))
fi
if [ -n "$x" ]; then
  if [ -n "$v" ]; then graph+="${x}volume=${SFX_GAIN:-1.0}[fx];"; labels+="[fx]"; else labels+="$x"; fi
  count=$((count + 1))
fi
premix="${graph}${labels}amix=inputs=$count:normalize=0:duration=longest,atrim=0:$dur"
target="I=${LUFS:--14}:TP=-1:LRA=${LRA:-11}"

# Pass 1: measure.
stats=$(ffmpeg -hide_banner -nostats "${inputs[@]}" -filter_complex "$premix,loudnorm=$target:print_format=json" \
  -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { python3 -c "import json,sys; print(json.loads(sys.stdin.read())['$1'])" <<<"$stats"; }

# Pass 2: apply with the measured values (linear gain, no pumping), then a 4x-oversampled safety limiter at
# -1.5 dBFS (env PEAK, linear) so no transient can pass -1 dBTP after the AAC encode.
measured="measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true"
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$premix,loudnorm=$target:$measured,aresample=192000,alimiter=limit=${PEAK:-0.84}:attack=1:release=60:level=false,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -movflags +faststart "$out"
echo "mixed -> $out"
