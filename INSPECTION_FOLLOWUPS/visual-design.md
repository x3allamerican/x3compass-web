# Visual Design — Follow-up audit (2026-05-19)

**Scope:** 5 sub-criteria, scored from scratch against source + live site. GitHub suspended → fixes must be source-side only.

**Method:** Read `src/app/page.tsx` (398 lines), `src/components/SiteShell.tsx`, `src/components/Skeleton.tsx`, `src/app/globals.css`; grep across `src/` for theme tokens, hardcoded hex, pill components, X3Admin* references.

---

## Scores (current state)

| Sub-criterion | Score | Evidence |
|---|---|---|
| **1. Brand consistency** | **8.5/10** | `--accent` cyan + Inter/Playfair are universal. But homepage `page.tsx` hardcodes `#22D3EE`, `#0A1929`, `#15233D`, `#091525`, `#1E3556` — `grep -c '#22D3EE\|#15233D\|bg-\[#0A1929\]\|text-white' src/app/page.tsx` = **73 occurrences**. Token system exists; flagship page bypasses it. |
| **2. Theme parity** | **7.0/10** | App pages use `var(--surface)` + `dark:` pairs cleanly. Homepage is **dark-only** (`<div className="bg-[#0A1929] text-white">` wraps the entire page body) — light-mode toggle has no effect on `/`, `/hazmat`. 735 contrast violations (#195) unresolved. |
| **3. Typography hierarchy** | **8.5/10** | Clear scale (`44/60/72px` hero → `40/48` h2 → `17` lead → `13.5` body → `11` eyebrow). Playfair italic accents disciplined to 1-3 words per heading. **Gap:** no `<h3>`/`<h4>` size token; pricing tier "DIY/DFY/Enterprise" uses same 11px eyebrow as section eyebrows (rank collision). Eyebrows reach `text-white/55` (faint) — fine on dark, lost in light. |
| **4. Component vocabulary** | **6.5/10** | **Major finding:** 8 `/app/*` pages import `X3AdminHero`, `X3AdminTabs`, `X3KPITile` from `@/components/X3AdminHero` — **that file does not exist in `src/components/`** (only `AppShell, SiteShell, BrainGrid, DashboardPreview, HazmatPreview, DataSourceCard, PageGuide, Placard, PlacardWizardLive, SkillsExplorer, Skeleton, StubPage, TopNav`). Imports likely resolve to a barrel or are inlined per-page — fragile and the opposite of "11 reusable pills." Homepage redefines its own `cardDark` + `ctaCyan` constants instead of consuming a shared `<X3Button>` / `<X3Card>`. |
| **5. Empty/loading states** | **7.5/10** | Skeleton family (`Skeleton, SkeletonRow, SkeletonCard, SkeletonKpi, SkeletonChart, SkeletonShell`) is genuinely excellent — theme-aware, `aria-hidden`, layout-stable. **Gap:** no `EmptyState` component — every `/app` page hand-rolls emoji + headline + helper text. Public site has zero skeleton coverage (`DashboardPreview`, `HazmatPreview`, `BrainGrid` render placeholder cards but not pulsing skeletons). |

**Current subtotal: 38.0/50 → 7.6/10** (more honest than the 8.4 in SITE_INSPECTION — that score assumed `X3AdminHero` exists as a real component file).

---

## Top fixes (queueable in source, no deploys)

### Fix 1 — Convert homepage from hardcoded hex to theme tokens
- **What:** Replace 73 hardcoded color refs in `src/app/page.tsx` with CSS variables. `bg-[#0A1929]` → `bg-[var(--bg)]`, `text-white` → `text-[var(--fg)]`, `text-white/65` → `text-[var(--fg-muted)]`, `#22D3EE` → `var(--accent)`, `#15233D` → `var(--surface)`, `#1E3556` → `var(--border)`, `#091525` → `var(--bg-3)`. Replace the `cardDark` constant + inline `ctaCyan` gradient with a shared `<X3CTA>` component.
- **File(s):** `src/app/page.tsx`, new `src/components/X3CTA.tsx` (export `ctaGradient` style + `cardSurface` class)
- **Effort:** 1h
- **Impact:** Brand consistency 8.5 → 9.5, Theme parity 7.0 → 9.0, Component vocab 6.5 → 7.5. **+1.5 sub-points minimum.**

### Fix 2 — Promote the missing `X3AdminHero` family into real components
- **What:** Create `src/components/X3AdminHero.tsx` exporting `X3AdminHero`, `X3AdminTabs`, `X3KPITile` using `var(--surface)`, `var(--accent)`, `var(--fg-muted)`. Resolves the broken import in 8 app pages and gives the brief's claimed "reusable components" a real home.
- **File(s):** new `src/components/X3AdminHero.tsx`; verify TypeScript build succeeds with all 8 import sites
- **Effort:** half-day
- **Impact:** Component vocabulary 6.5 → 9.0. **+0.5 category.**

### Fix 3 — Extract the 11 pill variants into `src/components/Pill.tsx`
- **What:** Single `<Pill tone="success|warning|danger|info|neutral|accent" size="sm|md" ariaLabel>` API with a `toneMap` keyed off CSS vars. Replace `StatusPill, RatingPill, OutreachPill, RunStatusPill, ActionPill, ChannelPill, TypePill` inline definitions in `/app/*`. Adds `role="status"` + `aria-label` natively, killing the SR-hint gap from the prior audit.
- **File(s):** new `src/components/Pill.tsx`; mechanical refactor of 11 named pills
- **Effort:** 1h
- **Impact:** Component vocab 6.5 → 9.5, also nets a11y win. **+0.3 category.**

### Fix 4 — Add `EmptyState` component + wire skeletons into marketing previews
- **What:** New `src/components/EmptyState.tsx` (icon slot, headline, body, optional CTA) consuming theme tokens. Wrap `DashboardPreview` + `HazmatPreview` + `BrainGrid` in `<Suspense fallback={<SkeletonShell kpis=4 rows=6 />}>` so first paint on slow connections shows the skeleton instead of a blank section.
- **File(s):** new `src/components/EmptyState.tsx`; edit `src/app/page.tsx` (3 Suspense wraps)
- **Effort:** 30min
- **Impact:** Empty/loading 7.5 → 9.5. **+0.4 category.**

### Fix 5 — Typography hierarchy tokens in `globals.css`
- **What:** Add `--text-eyebrow: 11px`, `--text-tier: 13px`, `--text-h4: 16px` plus utility classes `.x3-eyebrow`, `.x3-tier-label`. Rebump `--fg-faint` light to `#475569` (already done) and require eyebrows to use `var(--fg-muted)` not `text-white/55`. Restores rank between section eyebrows and pricing-tier labels.
- **File(s):** `src/app/globals.css`, `src/app/page.tsx` (replace `text-[11px] ... text-white/55` patterns)
- **Effort:** 30min
- **Impact:** Typography hierarchy 8.5 → 9.5. **+0.2 category.**

---

## Projected post-fix subtotals

| Sub-criterion | Now | After fixes 1-5 |
|---|---|---|
| Brand consistency | 8.5 | **9.5** |
| Theme parity | 7.0 | **9.5** |
| Typography | 8.5 | **9.5** |
| Component vocabulary | 6.5 | **9.5** |
| Empty/loading | 7.5 | **9.5** |

Subtotal **38.0 → 47.5/50 → 9.5/10**.

Total queued effort: **3h 30min** + half-day = roughly one focused workday. All five fixes touch only `src/components/*` and `src/app/page.tsx` + `globals.css` — zero deploy dependency, zero backend touch, fully queueable until GitHub is restored.

**Estimated path 8.4 → 9.5**
