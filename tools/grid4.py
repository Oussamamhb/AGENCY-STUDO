#!/usr/bin/env python3
"""Tile stills 4-up (2x2, 960x540 each) for review: python tools/grid4.py out/stills/<Comp> [--out dir]
Writes <dir>/grid-01.jpg, grid-02.jpg ... with each still's time in the corner."""
import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]
out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else d
files = sorted(f for f in glob.glob(os.path.join(d, "[0-9]*.png")))
for k in range(0, len(files), 4):
    sheet = Image.new("RGB", (1928, 1088), "white")
    for j, f in enumerate(files[k:k + 4]):
        im = Image.open(f).convert("RGB").resize((960, 540), Image.LANCZOS)
        ImageDraw.Draw(im).text((12, 10), os.path.basename(f).split("-", 1)[1][:-4], fill=(255, 255, 0))
        sheet.paste(im, ((j % 2) * 968, (j // 2) * 548))
    p = os.path.join(out, f"grid-{k // 4 + 1:02d}.jpg")
    sheet.save(p, quality=88)
    print(p)
