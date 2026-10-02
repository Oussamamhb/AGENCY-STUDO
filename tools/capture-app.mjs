// Capture logged-in pages of the product (dashboard, settings...) with the owner's session.
//   node tools/capture-app.mjs <out-dir> --base https://yourproduct.com --pages /dashboard,/settings [--login /login]
// Opens a visible Chromium with a persistent profile (out/.app-profile, never committed). It opens
// the login page and waits (up to 10 min) until the window has left the login/auth pages, then screenshots
// every page: desktop 1440x900 @2x and mobile 390x844 @2x, viewport + full page, as WebP.
// Read-only: it navigates and scrolls, it never clicks.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2];
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i >= 0 ? process.argv[i + 1] : d; };
if (!out || !arg("pages") || !arg("base")) {
  console.error("Usage: node tools/capture-app.mjs <out-dir> --base https://yourproduct.com --pages /a,/b [--login /login]");
  process.exit(1);
}
const base = arg("base").replace(/\/$/, "");
const pages = arg("pages").split(",").map((p) => p.trim()).filter(Boolean);
const name = (p) => p.replace(/^\//, "").replace(/[?&=/]+/g, "-").replace(/-+$/, "") || "home";

const ctx = await chromium.launchPersistentContext("out/.app-profile", {
  headless: false, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2,
});
const page = ctx.pages()[0] || (await ctx.newPage());

// Signed in = the login tab is back on the site, off every login/auth page, for a few seconds.
// (Already signed in? Most sites redirect straight away from the login page.)
const onSite = () => page.url().startsWith(base) && !/\/(login|signin|sign-in|auth|register|connecting)/.test(new URL(page.url()).pathname);
const signedIn = async () => onSite() && (await page.waitForTimeout(3000), onSite());
await page.goto(base + arg("login", "/login"));
{
  console.log("WAITING: sign in to the product in the opened window...");
  const until = Date.now() + 10 * 60_000;
  while (!(await signedIn())) {
    if (Date.now() > until) { console.error("Timed out waiting for sign-in"); await ctx.close(); process.exit(2); }
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(3000);
  console.log("Signed in.");
}
// Capture in a fresh tab so the login tab is never navigated away from under the owner.
const shot = await ctx.newPage();
await shot.goto(base + pages[0], { waitUntil: "domcontentloaded" });
await shot.waitForTimeout(2500);
if (/\/(login|signin|sign-in)/.test(shot.url())) { console.error("Not signed in (redirected to login)"); await ctx.close(); process.exit(3); }

async function settle(p) {
  await p.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  // Close "what's new" style modals with Escape (a key press, never a click on the account).
  for (let i = 0; i < 3; i++) { await p.keyboard.press("Escape"); await p.waitForTimeout(250); }
  // Scroll through once so lazy images load, then back to the top.
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(1200);
}

function webp(png) {
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-c:v", "libwebp", "-quality", "92", png.replace(/\.png$/, ".webp")]);
  rmSync(png);
}

for (const dir of ["desktop", "mobile"]) mkdirSync(join(out, dir), { recursive: true });
for (const p of pages) {
  try {
    await shot.setViewportSize({ width: 1440, height: 900 });
    await shot.goto(base + p, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await settle(shot);
    const d = join(out, "desktop", name(p));
    await shot.screenshot({ path: d + ".png" }); webp(d + ".png");
    await shot.screenshot({ path: d + "-full.png", fullPage: true }); webp(d + "-full.png");
    await shot.setViewportSize({ width: 390, height: 844 });
    await settle(shot);
    const m = join(out, "mobile", name(p));
    await shot.screenshot({ path: m + ".png" }); webp(m + ".png");
    await shot.screenshot({ path: m + "-full.png", fullPage: true }); webp(m + "-full.png");
    console.log("✓", p);
  } catch (e) {
    console.log("✗", p, e.message.split("\n")[0]);
  }
}
await ctx.close();
