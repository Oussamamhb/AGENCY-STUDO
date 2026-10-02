"""Fit a supplied song (e.g. from Suno) onto a film's beat grid, bar by bar.

AI-generated songs drift in tempo (the FC 27 track went 125 -> 129 BPM), so one global stretch
slowly falls out of sync. This tool tracks every beat, lets you re-order whole bars to fit the
film's story, and time-maps every bar line onto the film's grid in one rubberband pass.

1) Analyze: see the song's bars and where sections change.
     python3 tools/music-bars.py analyze public/<slug>/song.wav
   Prints tempo, the suggested downbeat, and low-end energy per beat grouped in bars (a big jump =
   a section starts: groove kicks in, break, drop). Writes public/<slug>/song.bars.json.

2) Edit: write videos/<slug>/music.json, then
     python3 tools/music-bars.py edit videos/<slug>/music.json
   {
     "src": "public/<slug>/song.wav",
     "out": "public/<slug>/track-edit.wav",
     "tempo": 124,                  // film tempo; the film plays at tempo/120 speed (Remotion prop)
     "bars": ["1-7", "8-19", 36],   // song bars in film order; film bar n starts at n * 240/tempo s
     "downbeat": 0,                 // optional: song bar k starts at beat 4k + downbeat
     "duration": 72.58,             // optional: output length in s (default = bars incl. the last one's tail)
     "seed": 9.24, "period": 0.4753 // optional: pin the beat tracker (reproducible edits)
   }
   Prints a grid check (every beat vs the film grid; aim for p90 < 17 ms = one frame at 60 fps).

Needs: librosa, soundfile, rubberband CLI (scripts/setup.sh installs them).
"""

import json
import shutil
import subprocess
import sys
import tempfile

import librosa
import numpy as np
import soundfile as sf

SR = 48000
HOP = 48  # 1 ms onset resolution


def onset_env(mono):
    o = librosa.onset.onset_strength(y=librosa.effects.percussive(mono, margin=2.0), sr=SR, hop_length=HOP, n_fft=2048)
    return o / (o.max() + 1e-12)


def estimate_period(o):
    """Beat period from long-lag autocorrelation (lag of 16 beats) around librosa's estimate."""
    fps = SR / HOP
    coarse = o[: len(o) // 10 * 10].reshape(-1, 10).max(axis=1)  # 10 ms frames for the rough estimate
    tempo = float(np.atleast_1d(librosa.feature.tempo(onset_envelope=coarse, sr=SR, hop_length=HOP * 10))[0])
    while tempo < 90:
        tempo *= 2
    while tempo > 180:
        tempo /= 2
    p0 = 60 / tempo
    x = o - o.mean()
    lags = np.arange(int(16 * p0 * 0.96 * fps), int(16 * p0 * 1.04 * fps))
    lags = lags[lags < len(x) - 1000]
    ac = [np.dot(x[:-L], x[L:]) / (len(x) - L) for L in lags]
    return lags[int(np.argmax(ac))] / fps / 16


def track_beats(o, dur, seed=None, period=None):
    fps = SR / HOP
    period = period or estimate_period(o)
    if seed is None:  # strongest percussive onset early in the song
        a, b = int(2 * fps), int(min(25, dur / 3) * fps)
        seed = (a + int(np.argmax(o[a:b]))) / fps

    def refine(pred, w=0.03, sig=0.012):
        a, b = int((pred - w) * fps), int((pred + w) * fps)
        if a < 0 or b >= len(o):
            return pred, 0.0
        t = np.arange(a, b) / fps
        i = int(np.argmax(o[a:b] * np.exp(-0.5 * ((t - pred) / sig) ** 2)))
        return float(t[i]), float(o[a + i])

    def walk(d):
        out, b, p = [seed], seed, period
        while True:
            pred = b + d * p
            if pred < 0.05 or pred > dur - 0.05:
                return out
            nb, st = refine(pred)
            if st < 0.08:
                nb = pred
            else:
                p = 0.85 * p + 0.15 * abs(nb - b)
            out.append(nb)
            b = nb

    beats = np.array(sorted(set(np.round(walk(-1)[1:] + walk(1), 5))))
    return beats, seed, period


def low_energy_per_beat(mono, beats):
    S = np.abs(librosa.stft(mono, n_fft=2048, hop_length=256))
    f = librosa.fft_frequencies(sr=SR, n_fft=2048)
    ft = librosa.frames_to_time(np.arange(S.shape[1]), sr=SR, hop_length=256)
    low = S[f < 150].sum(0)
    e = np.array([low[(ft >= beats[i]) & (ft < beats[i + 1])].mean() for i in range(len(beats) - 1)])
    return e / (e.max() + 1e-12) * 9


def analyze(path, seed=None, period=None):
    y, _ = librosa.load(path, sr=SR, mono=True)
    o = onset_env(y)
    beats, seed, period = track_beats(o, len(y) / SR, seed, period)
    e = low_energy_per_beat(y, beats)
    # downbeat guess: section changes (energy jumps) usually land on beat 1 of a bar
    # bar-level contrast: mean of the next 4 beats vs the previous 4, at every beat
    jumps = np.array([abs(e[i:i + 4].mean() - e[i - 4:i].mean()) if 4 <= i <= len(e) - 4 else 0.0 for i in range(len(e))])
    downbeat = int(np.argmax([np.sort(jumps[d::4])[-6:].sum() for d in range(4)]))  # the few big section changes decide
    # A new section's first beat is often softer (fill, crash then bass), which pulls the guess one
    # beat late. If most kick-ins already rise on the beat before the chosen downbeat, move back.
    rising = sorted((e[i:i + 4].mean() - e[i - 4:i].mean(), i) for i in range(4 + downbeat, len(e) - 4, 4))[-4:]
    late = [e[i - 1] > e[i - 4:i - 1].mean() + 0.25 * (e[i:i + 4].mean() - e[i - 4:i - 1].mean()) for c, i in rising if c > 2]
    if late and sum(late) / len(late) >= 0.5:
        downbeat = (downbeat - 1) % 4
    info = {"src": path, "bpm_start": round(60 / np.median(np.diff(beats[:16])), 2), "bpm_end": round(60 / np.median(np.diff(beats[-16:])), 2),
            "seed": round(seed, 4), "period": round(period, 5), "downbeat": downbeat, "beats": beats.round(5).tolist(), "low": e.round(2).tolist()}
    return info


def print_bars(info):
    b, e, d = np.array(info["beats"]), info["low"], info["downbeat"]
    print(f"tempo {info['bpm_start']} -> {info['bpm_end']} BPM · downbeat offset {d} · {len(b)} beats")
    print("bar   start   low-end energy per beat (0-9; a jump = new section; it should land in the first column)")
    k = 0
    while 4 * k + d + 4 <= len(e):
        i = 4 * k + d
        vals = e[i:i + 4]
        print(f"{k:3d}  {b[i]:6.2f}s  " + " ".join(f"{x:3.1f}" for x in vals) + "  " + "#" * int(np.mean(vals) * 3))
        k += 1


def expand(bars):
    out = []
    for x in bars:
        if isinstance(x, str) and "-" in x:
            a, c = (int(v) for v in x.split("-"))
            out += list(range(a, c + 1))
        else:
            out.append(int(x))
    return out


def grid_check(path, tempo):
    y, _ = librosa.load(path, sr=SR, mono=True)
    o = onset_env(y)
    fps = SR / HOP
    P = 60 / tempo
    offs = []
    for i in range(int(len(y) / SR / P)):
        a, b = int((i * P - 0.04) * fps), int((i * P + 0.04) * fps)
        if a < 0 or b >= len(o):
            continue
        j = int(np.argmax(o[a:b]))
        if o[a + j] > 0.12:
            offs.append((a + j) / fps - i * P)
    offs = np.array(offs) * 1000
    return {"beats": len(offs), "median_ms": round(float(np.median(offs)), 1), "p90_ms": round(float(np.percentile(np.abs(offs), 90)), 1), "max_ms": round(float(np.abs(offs).max()), 1)}


def stretch_bars_ffmpeg(ed, marks, bar, tail, tmp):
    """Fallback when the rubberband CLI is missing (e.g. Windows): ffmpeg's rubberband filter, one bar at
    a time. Each bar is stretched with 60 ms of real context on both sides, then cut to its exact target
    length, so the joins are sample-continuous (no crossfade needed)."""
    pad = int(0.06 * SR)
    n = ed.shape[1]
    bounds = marks + [n]
    out = []
    for i in range(len(marks)):
        a, b = bounds[i], bounds[i + 1]
        target = int(round((bar if i < len(marks) - 1 else tail) * SR))
        r = (b - a) / target  # tempo factor (>1 = faster)
        lo, hi = max(0, a - pad), min(n, b + pad)
        sf.write(f"{tmp}/b.wav", ed[:, lo:hi].T, SR, subtype="FLOAT")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{tmp}/b.wav", "-af", f"rubberband=tempo={r:.6f}:transients=crisp:detector=compound:phase=laminar:window=standard:pitchq=quality:channels=together", f"{tmp}/bs.wav"], check=True)
        bs, _ = sf.read(f"{tmp}/bs.wav", always_2d=True)
        s0 = int(round((a - lo) / r))
        seg = bs[s0:s0 + target]
        if len(seg) < target:
            seg = np.pad(seg, ((0, target - len(seg)), (0, 0)))
        out.append(seg)
    return np.concatenate(out, axis=0)


def edit(cfg_path):
    cfg = json.load(open(cfg_path))
    tempo = cfg["tempo"]
    bar = 240 / tempo
    y, _ = librosa.load(cfg["src"], sr=SR, mono=False)
    if y.ndim == 1:
        y = np.stack([y, y])
    info = analyze(cfg["src"], cfg.get("seed"), cfg.get("period"))
    beats = np.array(info["beats"])
    d = cfg.get("downbeat", info["downbeat"])
    bars = expand(cfg["bars"])
    start = lambda k: beats[4 * k + d]
    end = lambda k: beats[4 * k + d + 4] if 4 * k + d + 4 < len(beats) else y.shape[1] / SR

    xf = int(cfg.get("xfade", 0.006) * SR)
    pieces, marks, pos = [], [], 0
    for n, k in enumerate(bars):
        a = int(round(start(k) * SR))
        b = y.shape[1] if n == len(bars) - 1 else int(round(end(k) * SR))
        seg = y[:, a:b].copy()
        if n > 0 and bars[n - 1] != k - 1:  # splice: equal-power crossfade with the incoming pre-roll
            f = np.linspace(0, 1, xf)
            pieces[-1][:, -xf:] = pieces[-1][:, -xf:] * np.cos(f * np.pi / 2) + y[:, a - xf:a] * np.sin(f * np.pi / 2)
        marks.append(pos)
        pieces.append(seg)
        pos += seg.shape[1]
    ed = np.concatenate(pieces, axis=1)
    tail = (ed.shape[1] - marks[-1]) / SR * bar / (end(bars[-1]) - start(bars[-1]))
    total = (len(bars) - 1) * bar + tail
    with tempfile.TemporaryDirectory() as tmp:
        sf.write(f"{tmp}/e.wav", ed.T, SR, subtype="FLOAT")
        with open(f"{tmp}/map.txt", "w") as fh:
            for n, m in enumerate(marks[1:], start=1):  # 0 -> 0 is implicit (an explicit line gives NaN)
                fh.write(f"{m} {int(round(n * bar * SR))}\n")
        if shutil.which("rubberband"):
            subprocess.run(["rubberband", "-q", "-3", "-D", f"{total:.6f}", "-M", f"{tmp}/map.txt", f"{tmp}/e.wav", f"{tmp}/s.wav"], check=True)
            st, _ = sf.read(f"{tmp}/s.wav", always_2d=True)
        else:
            st = stretch_bars_ffmpeg(ed, marks, bar, tail, tmp)
    dur = cfg.get("duration", total)
    n = int(round(dur * SR))
    out = np.zeros((n, 2), dtype=np.float32)
    lag = int(round(cfg.get("late", 0.0) * SR))
    m = min(n - lag, len(st))
    out[lag:lag + m] = st[:m]
    fe = int(cfg.get("fade_end", 0.8) * SR)
    out[n - fe:] *= np.linspace(1, 0, fe)[:, None] ** 2
    sf.write(cfg["out"], out, SR, subtype="PCM_24")
    report = {"out": cfg["out"], "tempo": tempo, "duration": round(dur, 3), "bars": len(bars),
              "source_bpm": [info["bpm_start"], info["bpm_end"]], "grid_check": grid_check(cfg["out"], tempo),
              "map": [{"film_bar": i, "film_t": round(i * bar, 3), "song_bar": k, "song_t": round(float(start(k)), 3)} for i, k in enumerate(bars)]}
    json.dump(report, open(cfg["out"].rsplit(".", 1)[0] + ".json", "w"), indent=1)
    print(json.dumps({k: v for k, v in report.items() if k != "map"}, indent=1))


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ("analyze", "edit"):
        print(__doc__)
        sys.exit(1)
    if sys.argv[1] == "analyze":
        info = analyze(sys.argv[2])
        json.dump(info, open(sys.argv[2].rsplit(".", 1)[0] + ".bars.json", "w"))
        print_bars(info)
    else:
        edit(sys.argv[2])
