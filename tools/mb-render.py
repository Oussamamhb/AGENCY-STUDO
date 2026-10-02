#!/usr/bin/env python3
"""Fast final render with motion blur (see CLAUDE.md gotchas).

The cloud Chromium's GPU process is single-threaded, so one `remotion render` barely uses the
machine on heavy frames. This renders the film as frame chunks in N parallel `remotion render`
processes (one GPU process each), with motion blur (`{"mb": true}`) only on the chunks listed as
moving, and joins them frame-exactly into one silent master.

  python3 tools/mb-render.py <CompositionId> <out.mp4> --ranges moving.json [--workers 4] [--props '{}']

--ranges: JSON [[first, last], ...] frames that need motion blur (e.g. from a no-blur render's
frame differences; the same film in another format has the same moving frames). Everything else
renders without blur. Keep hard cuts on whole frames.
"""
import argparse
import json
import os
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor

ap = argparse.ArgumentParser()
ap.add_argument("comp")
ap.add_argument("out")
ap.add_argument("--ranges", required=True)
ap.add_argument("--workers", type=int, default=4)
ap.add_argument("--props", default="{}")
ap.add_argument("--chunk", type=int, default=120)
a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

tmp = tempfile.mkdtemp(prefix="mbr-")
bundle = f"{tmp}/bundle"
subprocess.run(["npx", "remotion", "bundle", "--out-dir", bundle, "--log=error"], check=True)
meta = subprocess.run(["npx", "remotion", "compositions", bundle], capture_output=True, text=True).stdout
n = None
for line in meta.splitlines():
    p = line.split()
    if p and p[0] == a.comp:
        n = int(p[3])  # id, fps, WxH, frames (seconds)
if n is None:
    raise SystemExit(f"composition {a.comp} not found:\n{meta}")

moving = sorted(json.load(open(a.ranges)))
jobs, pos = [], 0
def add(s, e, mb):
    while s <= e:
        c = min(e, s + (a.chunk if mb else 2 * a.chunk) - 1)
        jobs.append((s, c, mb)); s = c + 1
for s, e in moving:
    s, e = max(0, s), min(n - 1, e)
    if s > pos:
        add(pos, s - 1, False)
    add(s, e, True)
    pos = e + 1
if pos < n:
    add(pos, n - 1, False)

base = json.loads(a.props)
def run(j):
    s, e, mb = j
    f = f"{tmp}/{s:06d}.mp4"
    props = dict(base, **({"mb": True} if mb else {}))
    subprocess.run(["npx", "remotion", "render", bundle, a.comp, f, f"--frames={s}-{e}", "--concurrency=1", f"--props={json.dumps(props)}", "--log=error"], check=True, stdin=subprocess.DEVNULL)
    print(f"  {s}-{e} {'mb' if mb else '  '} done", flush=True)
    return f

print(f"{a.comp}: {n} frames, {len(jobs)} chunks ({sum(e - s + 1 for s, e, mb in jobs if mb)} frames with motion blur), {a.workers} workers")
with ThreadPoolExecutor(a.workers) as ex:
    files = list(ex.map(run, sorted(jobs, key=lambda j: -(j[1] - j[0] + 1) * (6 if j[2] else 1))))
files = sorted(files)
with open(f"{tmp}/list.txt", "w") as fh:
    for f in files:
        fh.write(f"file '{f}'\n")
# decode + re-encode once so every chunk boundary is frame-exact
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{tmp}/list.txt", "-an", "-r", "60",
                "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-preset", "medium", a.out], check=True)
got = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", a.out], capture_output=True, text=True).stdout.strip()
print(f"-> {a.out} ({got} frames, expected {n})")
