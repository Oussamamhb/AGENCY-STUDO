#!/usr/bin/env python3
"""Moving-frame ranges for tools/mb-render.py, from a no-blur render.

  python3 tools/mb-ranges.py out/<slug>/silent-nomb-16x9.mp4 videos/<slug>/mb-ranges.json [--thresh 20]

A frame "moves" when some 8x8 block (quarter-res) changes by more than --thresh; ranges are padded
by a few frames and merged when closer than 30 frames. Frames outside the ranges look the same with
or without motion blur, so they are rendered without it.
"""
import argparse, json, subprocess
import numpy as np
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("out"); ap.add_argument("--thresh", type=float, default=20)
a = ap.parse_args()
W, H = 384, 216
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(f, axis=0))
b = d.reshape(len(d), H // 8, 8, W // 8, 8).mean(axis=(2, 4)).max(axis=(1, 2))
n = len(f)
mov = np.zeros(n, bool)
for i, v in enumerate(b):
    if v > a.thresh:
        mov[max(0, i - 4):min(n, i + 6)] = True
r, i = [], 0
while i < n:
    if mov[i]:
        j = i
        while j < n and mov[j]:
            j += 1
        r.append([i, j - 1]); i = j
    else:
        i += 1
m = []
for s, e in r:
    if m and s - m[-1][1] < 30:
        m[-1][1] = e
    else:
        m.append([s, e])
json.dump(m, open(a.out, "w"))
print(f"{n} frames, {sum(e - s + 1 for s, e in m)} moving in {len(m)} ranges -> {a.out}")
