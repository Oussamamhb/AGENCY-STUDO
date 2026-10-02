# Videos

- `BRAND.md`: the product bible (what the product is, messages, brand, assets, owner decisions).
  Fill it in first.
- `craft/`: the craft rulebook (`motion-craft.md`), theory notes, where to find references.
- One folder per film, `videos/<slug>/` (created by `tools/new-video.sh`):
  - `README.md`: status, story, how to reproduce the finals
  - `brief.md`, `script.md`: what the owner asked for / approved
  - `sfx.mjs` → `sfx.json`: sound-effect cues · `music.json`: bar edit of the Suno song
  - `docs/`: shotlist.md, review_log.md

Assets go in `public/<slug>/`, code in `src/videos/<Name>/`, renders in `out/<slug>/`.
