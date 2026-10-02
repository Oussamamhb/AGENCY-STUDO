#!/usr/bin/env python3
"""Check a VO + music + SFX balance before (or after) tools/mix.sh.

Rebuilds the stems exactly as mix.sh treats them (VO x1.6; music x0.8, voice-band carve and
sidechain duck keyed by the VO; SFX x1.0, env SFX_GAIN) and measures, in 400 ms windows:
  - while he speaks: how far the music sits under the voice (aim: median 10-13 dB: clear voice, music still felt)
  - in his pauses: music level vs speech windows (it should come back up)
  - SFX transients vs the music around them (aim ~ +6 dB so clicks/stamps read)

  [DUCK_RATIO=4 DUCK_THR=0.05 CARVE=-4] python3 tools/mix-check.py <music.wav> <sfx.wav> <vo.wav>
(same env vars as mix.sh / deliver.sh, so a balance found here is the one the render gets)
"""
import os
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf

music, sfx, vo = sys.argv[1:4]
SR = 48000
with tempfile.TemporaryDirectory() as d:
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", music, "-i", vo, "-filter_complex",
                    "[1:a]aresample=48000,volume=1.6,asplit=2[v][key];"
                    f"[0:a]aresample=48000,volume=0.8,equalizer=f=3000:t=o:w=1.5:g={os.environ.get('CARVE', '-5')}[m];"
                    f"[m][key]sidechaincompress=threshold={os.environ.get('DUCK_THR', '0.05')}:ratio={os.environ.get('DUCK_RATIO', '4')}:attack=20:release=400:makeup=1[duck]",
                    "-map", "[duck]", "-ac", "1", f"{d}/m.wav", "-map", "[v]", "-ac", "1", f"{d}/v.wav"], check=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", sfx, "-af", f"aresample=48000,volume={os.environ.get('SFX_GAIN', '1.0')}", "-ac", "1", f"{d}/x.wav"], check=True)
    m, _ = sf.read(f"{d}/m.wav"); v, _ = sf.read(f"{d}/v.wav"); x, _ = sf.read(f"{d}/x.wav")
n = min(len(m), len(v), len(x))
W = int(0.4 * SR)
db = lambda a: 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-9)
pk = lambda a: 20 * np.log10(np.max(np.abs(a)) + 1e-9)
speech, gaps, fx = [], [], []
for i in range(0, n - W, W):
    mv, vv, xv = db(m[i:i + W]), db(v[i:i + W]), x[i:i + W]
    if vv > -38:
        speech.append((i / SR, vv - mv, mv))
    else:
        gaps.append(mv)
    if pk(xv) > -30:
        fx.append((i / SR, pk(xv) - pk(m[i:i + W])))
d = np.array([s[1] for s in speech])
print(f"voice over music while he speaks: median {np.median(d):.1f} dB, worst 10% {np.percentile(d, 10):.1f} dB")
worst = sorted(speech, key=lambda s: s[1])[:5]
print("  tightest moments:", ", ".join(f"{t:.1f}s ({g:.1f} dB)" for t, g, _ in worst))
print(f"music level: speaking {np.median([s[2] for s in speech]):.1f} dB, pauses {np.median(gaps):.1f} dB (should be higher)")
f = np.array([q[1] for q in fx])
print(f"SFX peaks over music peaks: median {np.median(f):.1f} dB over {len(f)} windows")
