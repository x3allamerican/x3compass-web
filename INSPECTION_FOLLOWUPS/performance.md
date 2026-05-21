# Performance Follow-Up — 2026-05-19

Senior perf engineer pass. Goal: 8.2 → 9.5+.

## 1. Live measurements (curl, two passes)

| Route | TTFB (cold) | TTFB (warm) | HTML bytes |
|---|---:|---:|---:|
| `/` | 163ms | 105ms | 189,504 |
| `/skills/` | 115ms | 107ms | 279,751 |
| `/pricing/` | 137ms | 102ms | 62,239 |
| `/app/` | 1,115ms first hit, 100ms after | 115ms | 33,981 |

TTFB is excellent on the marketing routes. The "1089ms /app" number is a **cold-edge miss on Cloudflare**, not a server problem — five sequential runs: `1.114s, 0.121s, 0.108s, 0.119s, 0.126s`. Only the first request paid that cost; subsequent requests are warm at ~120ms. This is a static export — there is no auth check at the edge.

## 2. Root cause: the `/skills` 273KB is real, and skills.json IS in the client bundle

- `src/data/skills.json` = **63,928 bytes, 300 skills**.
- `src/app/skills/page.tsx` line 6: `import catalog from "@/data/skills.json";` — **static import inside a `"use client"` file**.
- Verified on production: searched for the literal skill id `accident-register-format` across all chunks loaded by `/skills/` → **found in `_next/static/chunks/173tkypgmmy8p.js` (74,384 bytes)**. Every visitor downloads all 300 skills, gzipped, even though the page renders ~20 at a time and the data is fully static.

## 3. /app cold-start root cause = JS bundle, not auth, not TTFB

- `/app/` shell HTML is only 34KB with **one script tag**, but it pulls in two giant chunks: `02y449i31zrl8.js` = **224,309 bytes** (Supabase client + useUser + dashboard) and `0m_p1bxtorv5i.js` = **226,355 bytes** (shared framework chunk).
- The 224KB app chunk contains the full `@supabase/supabase-js` client, even though /app's first paint shows demo data. `useEffect` then auth-fetches → `compass_carrier_users` query → re-render.
- **No `loading.tsx`** exists anywhere under `src/app/app/` — verified with `find`. The Skeleton component shipped today is imported per-page, not as a route-level loading boundary, so first paint waits for the 224KB to parse before any skeleton renders.

## 4. Lighthouse CI history

`.github/workflows/lighthouse.yml` audits **only `/`, `/pricing/`, `/trust/`** (skips `/skills/` and `/app/` — the two heaviest routes). Thresholds: Perf ≥80, A11y ≥90, BP ≥85, SEO ≥90. Since these are the light routes, CI green-lights even when /skills regresses. **CI is blind to the bloat.**

## 5. Other findings

- `next.config.ts` is **3 effective lines** — no `experimental.optimizePackageImports`, no `compress`, no per-route headers. With `output: "export"` most experimental flags are no-ops, but `optimizePackageImports: ["@supabase/supabase-js"]` would tree-shake.
- Fonts: Inter loads **6 weights (400/500/600/700/800/900)**, Playfair loads **4 weights × 2 styles = 8 variants**. Marketing uses ~2 weights of each.
- Images: hero photos are uncompressed JPEG. `pricing-yard.jpg` = 439KB, `brain-ifta.jpg` = 349KB, `brain-vehicles.jpg` = 231KB. `next/image` is `unoptimized: true` (required for static export) — no AVIF/WebP fallback served.
- `src/lib/demoData.ts` = 27KB inlined into the /app chunk; could be split.
- 60 Pages Functions, all behind `/api/*` — these are fine; not on the critical path.

## 6. Top 5 fixes — file · effort · score impact

| # | Fix | File | Effort | Perf impact |
|---|---|---|---|---|
| 1 | **Dynamic-import skills.json** — change `import catalog from "@/data/skills.json"` to `const catalog = (await import("@/data/skills.json")).default` inside a `useEffect`, render Skeleton until loaded. Cuts /skills initial JS by ~74KB. | `src/app/skills/page.tsx` | 20 min | **+0.6** (Perf 80 → 86 on /skills) |
| 2 | **Add `src/app/app/loading.tsx`** that renders the Skeleton dashboard. Route-level loading fires before the 224KB Supabase chunk parses — eliminates the perceived 1s cold-start. | new file | 15 min | **+0.4** (LCP/FCP on /app) |
| 3 | **Trim font weights**: Inter to `["400","600","700"]` (drops 800/900/500), Playfair to `["400","700"]` italic only where used. Cuts ~80KB of woff2. | `src/app/layout.tsx` | 10 min | **+0.3** (FCP, render-blocking) |
| 4 | **Compress hero JPEGs to WebP @ 75%** — `pricing-yard.jpg` 439KB → ~80KB WebP; ship `.webp` and keep `.jpg` fallback in `<picture>`. Run `cwebp -q 75` on the 8 largest. | `public/photos/*.jpg` | 30 min | **+0.3** (LCP on marketing) |
| 5 | **Expand Lighthouse CI to /skills and /app** so the gate actually catches the bloat. Add `https://x3compass-web.pages.dev/skills/` and `/app/` to the URL loop, bump Perf threshold to **90** so the next regression auto-files an issue. | `.github/workflows/lighthouse.yml` | 5 min | (Guardrail — locks in 1-4) |

Bonus (under 1h total): add `experimental.optimizePackageImports: ["@supabase/supabase-js"]` to `next.config.ts`; lazy-load `getSupabase()` only when `useUser()` actually fires (gate behind a `requireAuth` flag so dashboard's first paint doesn't pull Supabase at all).

## 7. Constraints / queue note

GitHub is suspended (task #199). All 5 patches queue locally. Order them in `INSPECTION_FOLLOWUPS/` so they can be pushed in one batch when GH is restored — fixes 1, 2, 3 are zero-risk and can ship together; fix 4 needs a quick visual check; fix 5 is the CI gate update and should land **last** so it doesn't fail-close on the unfixed build.

---

**Estimated path 8.2 → 9.6**
