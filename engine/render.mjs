// Route A renderer: walks time through a page's window.seek(t), screenshots every
// sub-frame in headless Chromium and pipes them into ffmpeg (tmix = motion blur).
//
//   node engine/render.mjs --page videos/demo/index.html --fps 60 --dur 15 --sub 4
//   node engine/render.mjs --page videos/demo/index.html --stills 0,0.5,1,1.5
//
// Options (defaults come from window.VIDEO = { width, height, duration } on the page):
//   --page   path to the HTML file, relative to the repo root (required)
//   --out    output file (default out/<video>-silent.mp4)
//   --fps    frames per second (60)      --sub   sub-frames per frame for motion blur (4)
//   --dur    seconds to render           --start first second to render (0)
//   --w/--h  size override               --stills comma list of seconds -> PNGs in out/stills/
//   --beats  beats.json -> one still per beat (for the contact sheet before a full render)
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, normalize, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLOUD_CHROMIUM =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf("--" + k);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d;
};
const page_ = opt("page");
if (!page_) {
  console.error("Missing --page <path/to/index.html>");
  process.exit(1);
}
const videoName = basename(dirname(resolve(ROOT, page_)));

// Serve the repo over http so pages can import ../../lib/motion.js (file:// blocks modules).
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm", ".wav": "audio/wav",
  ".mp3": "audio/mpeg", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".otf": "font/otf",
};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/${page_}`;

const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ executablePath: CLOUD_CHROMIUM }));
const ready = (p) => p.waitForFunction(() => typeof window.seek === "function", null, { timeout: 60000 });
const probe = await browser.newPage();
await probe.goto(url);
await ready(probe);
const meta = await probe.evaluate(() => window.VIDEO ?? {});
await probe.close();

const W = Number(opt("w", meta.width ?? 1920));
const H = Number(opt("h", meta.height ?? 1080));
const FPS = Number(opt("fps", 60));
const SUB = Math.max(1, Number(opt("sub", 4)));
const START = Number(opt("start", 0));
const DUR = Number(opt("dur", (meta.duration ?? 15) - START));

const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.addInitScript(() => (window.__RENDER__ = true));
await page.goto(url);
await ready(page);
await page.evaluate(() => document.fonts.ready);
const seek = (t) => page.evaluate(async (t) => {
  await window.seek(t);
  await new Promise((r) => requestAnimationFrame(() => r()));
}, t);

const stills = opt("beats")
  ? JSON.parse(readFileSync(resolve(ROOT, opt("beats")), "utf8")).beats.join(",")
  : opt("stills");
if (stills) {
  const dir = join(ROOT, "out", "stills", videoName);
  mkdirSync(dir, { recursive: true });
  for (const s of stills.split(",").map(Number)) {
    await seek(s);
    const file = join(dir, `${s.toFixed(2).padStart(6, "0")}s.png`);
    writeFileSync(file, await page.screenshot({ type: "png" }));
    console.log("still", file);
  }
} else {
  const out = resolve(ROOT, opt("out", `out/${videoName}-silent.mp4`));
  mkdirSync(dirname(out), { recursive: true });
  const vf = SUB > 1
    ? `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/${FPS}/TB`
    : "null";
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS * SUB), "-i", "-",
    "-vf", vf, "-r", String(FPS), "-c:v", "libx264", "-crf", "16", "-preset", "slow",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });

  const total = Math.round(DUR * FPS * SUB);
  for (let i = 0; i < total; i++) {
    await seek(START + i / (FPS * SUB));
    const png = await page.screenshot({ type: "png" });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % (FPS * SUB) === 0) console.log(`rendered ${(i / (FPS * SUB)).toFixed(0)}s / ${DUR}s`);
  }
  ff.stdin.end();
  const code = await new Promise((r) => ff.on("close", r));
  console.log(code === 0 ? `done -> ${out}` : `ffmpeg exited with ${code}`);
}

await browser.close();
server.close();
