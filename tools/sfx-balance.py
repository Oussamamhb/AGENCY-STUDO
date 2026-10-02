"""How loud should the SFX stem sit under/over the music?

  python3 tools/sfx-balance.py music.wav sfx.wav cues.json [--target 6.5]

For every UI cue (click, pop, tick, key, success) it compares the SFX peak with the music's RMS
around that moment, and prints the gain in dB (one number) that puts the median UI transient
--target dB above the music. +6.5 dB reads as crisp but part of the mix (FC 27 launch, funky house).
Also prints the result per sound type, so outliers (a boom or stamp that pokes out) are easy to
spot and fix in the cue file.
"""

import argparse
import json
from collections import defaultdict

import numpy as np
import soundfile as sf

ap = argparse.ArgumentParser()
ap.add_argument("music")
ap.add_argument("sfx")
ap.add_argument("cues")
ap.add_argument("--target", type=float, default=6.5)
ap.add_argument("--quiet", action="store_true", help="print only the gain")
a = ap.parse_args()

m, sr = sf.read(a.music, always_2d=True)
x, _ = sf.read(a.sfx, always_2d=True)
m, x = m.mean(1), x.mean(1)
rel = defaultdict(list)
for c in json.load(open(a.cues)):
    i, w = int(c["t"] * sr), int(0.2 * sr)
    if i - w < 0 or i + w > min(len(m), len(x)):
        continue
    L = int((c.get("dur") or 0.5) * sr) if c["type"] in ("whoosh", "liquid", "swipe") else int(0.08 * sr)
    mr = np.sqrt(np.mean(m[i - w:i + w] ** 2)) + 1e-9
    rel[c["type"]].append(20 * np.log10(np.abs(x[i:i + L]).max() / mr + 1e-9))
ui = [v for k in ("click", "pop", "tick", "key", "success") for v in rel[k]]
gain = a.target - float(np.median(ui)) if ui else 0.0
if a.quiet:
    print(f"{gain:.2f}")
else:
    print(f"SFX stem gain {gain:+.1f} dB (median UI transient -> {a.target:+.1f} dB over the music)")
    for k, v in sorted(rel.items()):
        print(f"  {k:8s} n={len(v):3d}  {np.median(v) + gain:+5.1f} dB")
