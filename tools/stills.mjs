// Render stills from a Remotion composition (one per beat, or at given times) and tile
// them into a contact sheet, without rendering the whole video.
//   node tools/stills.mjs <CompositionId> --beats public/<video>/beats.json
//   node tools/stills.mjs <CompositionId> --times 0,0.5,1,2.5
//   node tools/stills.mjs <CompositionId> --every 0.5
// Output: out/stills/<CompositionId>/*.png and out/stills/<CompositionId>/contact.png
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLOUD_CHROMIUM =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const argv = process.argv.slice(2);
const id = argv[0];
const opt = (k) => {
  const i = argv.indexOf("--" + k);
  return i >= 0 ? argv[i + 1] : undefined;
};
if (!id) {
  console.error("Usage: node tools/stills.mjs <CompositionId> [--beats file | --times a,b | --every s]");
  process.exit(1);
}

const browserExecutable = existsSync(CLOUD_CHROMIUM) ? CLOUD_CHROMIUM : null;
const serveUrl = await bundle({ entryPoint: join(ROOT, "src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
const { fps, durationInFrames } = composition;
const duration = durationInFrames / fps;

let times;
if (opt("beats")) times = JSON.parse(readFileSync(resolve(opt("beats")), "utf8")).beats;
else if (opt("times")) times = opt("times").split(",").map(Number);
else {
  const every = Number(opt("every") ?? 0.5);
  times = Array.from({ length: Math.floor(duration / every) + 1 }, (_, i) => i * every);
}
times = times.filter((t) => t < duration);

const dir = join(ROOT, "out", "stills", id);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
for (const [i, t] of times.entries()) {
  const frame = Math.min(durationInFrames - 1, Math.round(t * fps));
  await renderStill({
    composition, serveUrl, frame, browserExecutable,
    output: join(dir, `${String(i).padStart(3, "0")}-${t.toFixed(2)}s.png`),
  });
}

const cols = Math.min(6, times.length);
const rows = Math.ceil(times.length / cols);
// concat list instead of -pattern_type glob (Windows ffmpeg builds have no glob support)
const list = join(dir, "frames.txt");
writeFileSync(list, times.map((t, i) => `file '${String(i).padStart(3, "0")}-${t.toFixed(2)}s.png'\nduration 1`).join("\n") + "\n");
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list,
  "-vf", `scale=320:-1,tile=${cols}x${rows}:padding=4:color=white`, "-frames:v", "1", "-update", "1", join(dir, "contact.png"),
]);
console.log(`${times.length} stills + contact sheet -> ${dir}`);
