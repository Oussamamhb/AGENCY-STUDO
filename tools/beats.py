"""Measure a song's beat grid so cuts and sound hits land on the music.

Usage: python3 tools/beats.py public/<video>/track.wav > public/<video>/beats.json
The animation reads this file:
  beats      -> state changes go here
  downbeats  -> big moments go here (every 4th beat)
  hits       -> sound effects go here (measured onset peaks)
"""

import json
import sys

import librosa
import numpy as np

y, sr = librosa.load(sys.argv[1], sr=None, mono=True)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
beats = librosa.frames_to_time(frames, sr=sr).round(3).tolist()

onset = librosa.onset.onset_strength(y=y, sr=sr)
peaks = librosa.util.peak_pick(onset, pre_max=3, post_max=3, pre_avg=3,
                               post_avg=5, delta=0.5, wait=10)
json.dump({
    "bpm": float(np.atleast_1d(tempo)[0]),
    "duration": round(len(y) / sr, 3),
    "beats": beats,
    "downbeats": beats[::4],
    "hits": librosa.frames_to_time(peaks, sr=sr).round(3).tolist(),
}, sys.stdout, indent=1)
