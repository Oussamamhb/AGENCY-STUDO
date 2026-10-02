# BRAND: what we're advertising

**Fill this in before the first film** (Claude can draft it with you from the product's site:
"read https://yourproduct.com and fill in videos/BRAND.md"). Every film reads it first.
Capture the live site into `public/brand/site/`:
`node tools/capture-site.mjs https://yourproduct.com public/brand/site --max 25`.

## What it is
(One paragraph: the product, who makes it, the one-line promise in the product's own words.)
Legal notes: trademarks we must not show, endorsements we must not imply.

## Messages (the product's own words; use these, don't invent claims)
- Hero headline / subline / CTAs:
- Key features (one line each, in the site's words):
- How it works (the 3-5 steps a new user goes through):
- Pricing:
- Proof (real numbers only, with the date you checked them):

## Who it's for
1. (audience 1: what they want, which feature answers it)
2. (audience 2)

## Brand
- Colours (from the site's CSS): accent `#…`, deep accent `#…`, ground `#…` → set them in
  `src/kit/theme.ts` (`BRAND`).
- Fonts: display face …, UI/label face … (self-host the .woff2 in `public/fonts/`, load them in
  `theme.ts`). Starter default: Outfit 800 display + DM Mono labels.
- Logo: white mark in `public/brand/logo-mark-white.svg` (replace the placeholder), full logo
  files next to it.
- Tone of voice: (e.g. confident, playful, premium)

## Assets index
| Path | What |
|---|---|
| `public/brand/site/` | captures of the live product |
| `public/brand/` | logo files, product art |

## Owner decisions (decided, don't re-ask)
Record every decision the owner makes here, with the date, so no session asks again.
- Music: (e.g. Suno, upbeat and groovy, four-on-the-floor; never EDM)
- Voice-over: (which narrator / tool, which films)
- Banned: dot-grid backgrounds, terminal/code prompts, neon circle highlights, static
  screenshots, "everything fades in", generic AI look. (Add your own.)
- Hero data / demo accounts: (real ones only)
