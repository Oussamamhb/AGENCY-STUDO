#!/usr/bin/env python3
"""Find single-frame pops (and loop seams) in a rendered film.

A pop is a frame whose change from the previous frame is >= 3x the typical change of its
neighbours: a layer that blinks in or out for one frame, a jump in a spring, a cut that lands
a frame early. Scene cuts and slams are real jumps too, so the report lists the time of each
spike: check them against the timeline (a slam on a beat is fine, a pop mid-move is a bug).

  python3 tools/pops.py out/<slug>/silent-16x9.mp4 [--ratio 3] [--loop]

--loop also measures the jump from the last frame to the first against a normal frame step
(for seamless loops it must be no bigger).
"""
import argparse
import subprocess
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--ratio", type=float, default=3.0, help="spike / neighbour median to report")
ap.add_argument("--floor", type=float, default=1.5, help="ignore changes below this (0-255 mean abs diff)")
ap.add_argument("--loop", action="store_true")
a = ap.parse_args()

W, H = 192, 108
probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", a.video], capture_output=True, text=True).stdout.strip()
num, den = (probe.split(",")[0].split("/") + ["1"])[:2]
fps = float(num) / float(den or 1)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
diff = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))  # diff[i] = change from frame i to i+1
print(f"{len(frames)} frames at {fps:g} fps, median change {np.median(diff):.2f}")

hits = []
for i, d in enumerate(diff):
    lo, hi = max(0, i - 4), min(len(diff), i + 5)
    nb = np.concatenate([diff[lo:i], diff[i + 1:hi]])
    ref = max(np.median(nb) if len(nb) else 0, 0.25)
    if d >= a.floor and d / ref >= a.ratio:
        hits.append((i + 1, d, d / ref))

# a pop that goes in and straight back out shows as two spikes one frame apart
for f, d, r in hits:
    back = any(h[0] == f + 1 for h in hits)
    t = f / fps
    beat = abs(t * 2 - round(t * 2)) / 2 <= 1.01 / fps  # on the 120 BPM grid (0.5 s)
    kind = "BLINK (in and out in one frame): bug" if back else ("cut on a beat (check it is meant)" if beat else "jump off the grid: check")
    print(f"  {t:7.3f}s  frame {f:5d}  change {d:6.2f}  x{r:4.1f}  {kind}")
if not hits:
    print("no single-frame pops")

if a.loop:
    seam = np.abs(frames[-1] - frames[0]).mean()
    step = np.median(diff)
    print(f"loop seam {seam:.2f} vs normal step {step:.2f}: {'OK' if seam <= step * 1.5 else 'STUTTERS'}")
