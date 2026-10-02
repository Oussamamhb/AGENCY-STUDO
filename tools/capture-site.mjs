// Capture a website's real assets for a video: screenshots of every page (desktop + mobile,
// viewport and full page), the brand's colors, fonts, logos and icons.
//   node tools/capture-site.mjs https://example.com public/<name>/site [--pages /,/pricing] [--max 20] [--png]
// Writes: <out>/desktop/*.webp, <out>/mobile/*.webp (PNG with --png), <out>/assets/*,
// <out>/brand.json, <out>/pages.json. Pop-ups and cookie banners are closed first.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const [base, out] = process.argv.slice(2);
if (!base || !out) {
  console.error("Usage: node tools/capture-site.mjs <url> <out-dir> [--pages /a,/b] [--max 20]");
  process.exit(1);
}
const opt = (k) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const MAX = Number(opt("max") ?? 20);
const origin = new URL(base).origin;
for (const d of ["desktop", "mobile", "assets"]) mkdirSync(join(out, d), { recursive: true });

const browser = await chromium.launch();
const slug = (path) => (path === "/" ? "home" : path.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-"));

// Close "what's new" modals, cookie banners and similar overlays so screenshots show the page.
async function dismissOverlays(page) {
  for (let round = 0; round < 3; round++) {
    const closed = await page.evaluate(() => {
      const visible = (el) => el.offsetWidth * el.offsetHeight > 0 && getComputedStyle(el).visibility !== "hidden";
      const scopes = [...document.querySelectorAll("[role=dialog], [aria-modal=true], [data-state=open], .modal, [class*=cookie i], [id*=cookie i]")]
        .filter(visible);
      for (const scope of scopes) {
        const btn = [...scope.querySelectorAll("button, [role=button], a")].find((b) => visible(b) && (
          /close|dismiss|fermer|skip/i.test(b.getAttribute("aria-label") ?? "") ||
          /^(×|✕|x|close|dismiss|skip|got it|accept( all)?|ok|no thanks)$/i.test(b.innerText.trim())));
        if (btn) { btn.click(); return true; }
      }
      return false;
    });
    if (!closed) break;
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(500);
  }
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(300);
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200); // modals often open a moment after load
  await dismissOverlays(page);
  // Scroll through once so lazy content and scroll-triggered animations appear.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  await dismissOverlays(page);
}

// 1. Discover pages from the home page's internal links.
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const home = await desktop.newPage();
await home.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
await settle(home);
let paths = opt("pages")?.split(",") ?? [
  "/",
  ...(await home.evaluate((origin) =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => new URL(a.getAttribute("href"), location.href))
      .filter((u) => u.origin === origin && !u.hash && !/\.(pdf|png|jpe?g|zip)$/i.test(u.pathname))
      .map((u) => u.pathname), origin)),
];
paths = [...new Set(paths.map((p) => (p.length > 1 ? p.replace(/\/$/, "") : p)))].slice(0, MAX);

// 2. Brand: CSS variables, most used colors and fonts, logo/icon files.
const brand = await home.evaluate(() => {
  const count = (m, k) => k && m.set(k, (m.get(k) ?? 0) + 1);
  const colors = new Map(), bgs = new Map(), fonts = new Map();
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    if (el.offsetWidth * el.offsetHeight === 0) continue;
    count(colors, s.color);
    if (s.backgroundColor !== "rgba(0, 0, 0, 0)") count(bgs, s.backgroundColor);
    if (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      count(fonts, `${s.fontFamily} | ${s.fontWeight}`);
  }
  const top = (m, n = 12) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
  const vars = {};
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.selectorText === ":root" || r.selectorText === ".dark" || r.selectorText === "html") {
        for (const p of r.style) if (p.startsWith("--")) vars[`${r.selectorText} ${p}`] = r.style.getPropertyValue(p).trim();
      }
    }
  }
  const fontFaces = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) if (r.type === 5) fontFaces.push({ family: r.style.fontFamily, weight: r.style.fontWeight, src: r.style.src });
  }
  const icons = [...document.querySelectorAll("link[rel*=icon], link[rel=apple-touch-icon], meta[property='og:image']")]
    .map((l) => new URL(l.href || l.content, location.href).href);
  const logos = [...document.querySelectorAll("header img, nav img, a[href='/'] img, img[alt*=logo i], img[src*=logo i]")]
    .map((i) => i.currentSrc || i.src);
  const svgLogos = [...document.querySelectorAll("header svg, nav svg, a[href='/'] svg")].slice(0, 5).map((s) => s.outerHTML);
  return {
    title: document.title,
    description: document.querySelector("meta[name=description]")?.content,
    themeColor: document.querySelector("meta[name=theme-color]")?.content,
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    textColors: top(colors), backgroundColors: top(bgs), fonts: top(fonts, 10),
    cssVariables: vars, fontFaces, icons: [...new Set(icons)], logos: [...new Set(logos)], svgLogos,
  };
});

// Download icons, logos and font files.
const saved = [];
async function download(url, name) {
  try {
    const r = await desktop.request.get(url, { timeout: 20000 });
    if (!r.ok()) return;
    const file = join(out, "assets", name);
    writeFileSync(file, await r.body());
    saved.push({ url, file });
  } catch {}
}
for (const [i, u] of [...brand.icons, ...brand.logos].entries()) {
  const ext = extname(new URL(u).pathname).split("?")[0] || ".png";
  await download(u, `${i < brand.icons.length ? "icon" : "logo"}-${i}${ext}`);
}
brand.svgLogos.forEach((svg, i) => writeFileSync(join(out, "assets", `inline-svg-${i}.svg`), svg));
for (const [i, f] of brand.fontFaces.entries()) {
  const m = /url\("?([^")]+)"?\)/.exec(f.src ?? "");
  if (m) await download(new URL(m[1], origin).href, `font-${i}-${f.family.replace(/\W+/g, "")}-${f.weight}${extname(new URL(m[1], origin).pathname)}`);
}
brand.downloaded = saved;
writeFileSync(join(out, "brand.json"), JSON.stringify(brand, null, 2));
await home.close();

// 3. Screenshots of every page: desktop (1440 wide) and mobile (390 wide), viewport + full page.
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
});
const pages = [];
for (const path of paths) {
  const entry = { path, url: origin + path };
  for (const [ctx, dir] of [[desktop, "desktop"], [mobile, "mobile"]]) {
    const page = await ctx.newPage();
    try {
      const res = await page.goto(origin + path, { waitUntil: "domcontentloaded", timeout: 45000 });
      entry.status = res?.status();
      await settle(page);
      entry.title ??= await page.title();
      entry.headings ??= await page.evaluate(() =>
        [...document.querySelectorAll("h1,h2,h3")].map((h) => h.innerText.trim()).filter(Boolean).slice(0, 25));
      await page.screenshot({ path: join(out, dir, `${slug(path)}.png`) });
      await page.screenshot({ path: join(out, dir, `${slug(path)}-full.png`), fullPage: true });
    } catch (e) {
      entry.error = e.message.split("\n")[0];
    }
    await page.close();
  }
  pages.push(entry);
  console.log(entry.error ? `✗ ${path} ${entry.error}` : `✓ ${path}`);
}
writeFileSync(join(out, "pages.json"), JSON.stringify(pages, null, 2));
await browser.close();

// 4. PNG -> high-quality WebP (about 4x smaller, visually identical on video).
// WebP tops out at 16383 px, so very tall full-page shots are scaled down to fit.
if (!process.argv.includes("--png")) {
  for (const dir of ["desktop", "mobile"]) {
    for (const f of readdirSync(join(out, dir)).filter((f) => f.endsWith(".png"))) {
      const src = join(out, dir, f);
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", src, "-vf",
        "scale='if(gt(ih,16000),-2,iw)':'if(gt(ih,16000),16000,ih)'",
        "-c:v", "libwebp", "-quality", "95", "-compression_level", "6", src.replace(/\.png$/, ".webp")]);
      rmSync(src);
    }
  }
}
console.log(`captured ${pages.length} pages -> ${out}`);
