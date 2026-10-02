#!/usr/bin/env python3
"""Word times for a VO take: faster-whisper word timestamps, onsets refined on the loudness envelope.

  python tools/vo-words.py public/<slug>/vo/vo-full.wav --out videos/<slug>/docs/vo-words.json [--model small.en]

Writes [{i, w, start, end}] (seconds in the WAV) and prints a numbered word list. Whisper's word starts
can be early or late by ~50-120 ms; each start is snapped to the steepest loudness rise within
±0.12 s (the consonant attack), never past the word's end. Lock film events to these `start`s.
"""
import argparse, json, subprocess, sys
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("wav")
ap.add_argument("--out", required=True)
ap.add_argument("--model", default="small.en")
a = ap.parse_args()

from faster_whisper import WhisperModel

# decode with ffmpeg (16 kHz mono float), passed to whisper as an array (avoids PyAV version clashes)
sr = 16000
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", a.wav, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0

model = WhisperModel(a.model, device="cpu", compute_type="int8")
segs, _ = model.transcribe(x, language="en", word_timestamps=True, vad_filter=False, beam_size=5)
words = [{"w": w.word.strip(), "start": float(w.start), "end": float(w.end)} for s in segs for w in s.words]

# loudness envelope (5 ms hop)
hop, win = int(sr * 0.005), int(sr * 0.02)
n = max(1, (len(x) - win) // hop)
rms = np.array([np.sqrt(np.mean(x[k * hop:k * hop + win] ** 2) + 1e-12) for k in range(n)])
db = 20 * np.log10(rms)
rise = np.diff(db, prepend=db[0])

for w in words:
    lo = max(0, int((w["start"] - 0.12) / 0.005))
    hi = min(len(rise) - 1, int(min(w["start"] + 0.12, w["end"] - 0.02) / 0.005))
    if hi > lo:
        seg = rise[lo:hi]
        k = lo + int(np.argmax(seg))
        # only snap onto a real attack (louder than the room by a margin)
        if db[min(k + 4, len(db) - 1)] > np.percentile(db, 30) + 6:
            w["start"] = round(k * 0.005 + 0.01, 3)
    w["start"], w["end"] = round(w["start"], 3), round(w["end"], 3)

for i, w in enumerate(words):
    w["i"] = i
with open(a.out, "w", encoding="utf8") as f:
    json.dump(words, f, indent=0)
for w in words:
    print(f'{w["i"]:4d} {w["start"]:7.3f} {w["end"]:7.3f}  {w["w"]}')
print(f"{len(words)} words -> {a.out}", file=sys.stderr)
