# X3 Compass — Anti-Slop Design Rules

Synthesized from four community frontend-design skills cloned 2026-05-27:
impeccable (pbakaus), huashu-design (alchaincyf), ui-ux-pro-max
(nextlevelbuilder), and taste-skill (Leonxlnx). Where the four overlapped,
the rule was elevated to Tier 1. Where they conflicted, the X3 Compass
brand and B2B-compliance context decided.

This document is read every time a new page, component, or visual
edit lands in /app/* or the marketing site. It exists because the
X3 Compass palette (cyan-on-dark) is itself flagged by impeccable's
deterministic detector as an AI-design tell. We keep the brand. We
compensate by being deliberate about everything else.

---

## Tier 1 — Cardinal sins (never ship these)

1. Pure `#000` background. Use a near-black tinted toward the brand
   hue. For X3 Compass dark mode that is roughly `oklch(13% 0.012 215)`
   (a cyan-leaning charcoal), not `#000000` and not `#0A0A0A`.

2. Cyan outer-glow box-shadows on cards, buttons, links, or borders.
   `boxShadow: "0 6px 24px rgba(34, 211, 238, 0.42)"` is the
   default AI "control center" look. Replace with either no shadow,
   or a tinted shadow on the page background hue
   (`rgba(0, 12, 22, 0.35)`).

3. Side-stripe accent border on cards. `border-left: 3-4px solid
   var(--accent)` on a card or row is the single most reliable AI
   tell — impeccable, huashu, and taste-skill all name it as the #1
   slop signature. Use full 1px borders, leading icons in flow, or a
   background tint shift instead.

4. Emoji as structural icons in product chrome (sidebar, nav, page
   tiles). Reserve emoji for chat, social, and marketing copy. In
   /app/* and the marketing site, use one consistent stroke-SVG set
   at one stroke width.

5. Em-dashes (—, –) anywhere visible: headlines, body, captions,
   buttons. They are the strongest single AI-prose tell in copy.
   Use commas, periods, parentheses, or simple hyphens (-). Code
   comments and internal docs (including this file) are exempt.

6. Mixing icon families. Lucide + Heroicons + emoji in the same
   surface = chaos. Pick one set per project and lock the stroke
   width globally. X3 Compass uses the hand-rolled SidebarIcons.tsx
   set (24x24, stroke-width 1.75, currentColor) for chrome, and the
   official DOT placard SVGs for Hazmat-specific iconography.

7. Inter, Roboto, Geist, Plus Jakarta Sans, Space Grotesk, Fraunces,
   Instrument Serif for display copy. Body in the system stack is
   fine. Headlines need a face with personality — for X3 Compass
   that is the JetBrains Mono callout for CFR citations + a stronger
   sans for headers (the AppShell already uses heavier weights of
   the system stack for h1).

8. Centered-hero + tracked uppercase eyebrow + oversized gradient
   headline. impeccable, taste-skill, and huashu all flag this as
   the "AI startup landing page" template. The Hazmat Center hero
   currently has all three. Acceptable for one marketing page; not
   acceptable as a repeated section pattern.

9. Card-in-card-in-card. The X3 Compass shell already nests cards
   in some places. Flatten with spacing + dividers + typography
   instead.

10. Animating `width`, `height`, `top`, `left`, `padding`, `margin`.
    Use `transform` and `opacity` only. The browser repaints layout
    on the former. Container queries handle responsiveness.


## Tier 2 — Strong defaults

11. Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. No
    arbitrary values. Token names are semantic (`--space-md`), not
    numeric. Use `gap` over `margin` for sibling spacing.

12. Type scale: 12 / 14 / 16 / 18 / 24 / 32 / 48 with a minimum
    1.25 ratio between steps used in the same hierarchy. Body text
    16px on the marketing site, 14px in /app/* density tables only.
    Line height 1.5 to 1.7 for body, 1.05 to 1.15 for headlines.
    Cap line length at 65 to 75 characters.

13. Touch targets >= 44x44px. Focus ring visible via
    `:focus-visible` only, 2 to 3px, 3:1 contrast minimum, offset
    from the element edge.

14. Animation duration ladder: 100 to 150ms for state feedback
    (hover, press), 200 to 300ms for component state changes, 300
    to 500ms for layout changes, 500 to 800ms for entrances.
    Easing default `cubic-bezier(0.25, 1, 0.5, 1)` (quart-out).
    Exits at ~70% of the entry duration. Honor
    `prefers-reduced-motion: reduce`.

15. Color tokens are semantic, not raw. `var(--accent)`,
    `var(--surface)`, `var(--fg)`, `var(--fg-muted)`, `var(--bg)`,
    `var(--border)`, `var(--success)`, `var(--warning)`,
    `var(--danger)`. No raw hex in component code except in
    one-off marketing illustrations.

16. Numeric data in tables uses `font-variant-numeric: tabular-nums`.
    Already wired into TenantTable; do not regress.

17. Empty states always include a guidance line and an action. The
    demo-data fallback covers most empty cases already; for the
    rest, write the copy.

18. Forms: label above input, helper below, error below in red with
    icon + text (never color alone). Validate on blur, never on
    keystroke. Required marker. Autocomplete attribute. Focus
    jumps to first invalid field on submit.

19. Status communicated with color + icon + text. Never color
    alone (fails WCAG and is unreadable to ~5% of users).

20. Dark + light shipped together. Dark mode is not "invert all
    colors" — it is a separate set of surface lightness steps with
    desaturated tonal variants of the accent.


## Tier 3 — Compass-specific patterns

21. The /app/* shell topbar height is locked at 134px. The sidebar
    logo cell shares that height via `position: sticky; top: 0`.
    Do not change this without also editing AppShell + AppTopbar.

22. Every /app/* page that has an empty Supabase state uses
    `withDemoFallback(real, demo)` from `src/lib/demoFallback.ts`.
    When demo data is in play, disable row-click into edit modals
    and surface a small DEMO marker.

23. Every /app/* surface gets the EducationHubCard pattern with
    three audiences (For Drivers cyan, For Employers violet, For
    C/TPAs amber) plus an Ask AI Concierge CTA. The audiences
    must always be in that order. The CTA always uses the same
    cyan-gradient pill style.

24. The Hazmat-specific iconography uses the official DOT placard
    SVGs at `/public/hazmat/placards/`. Never recreate a placard
    with CSS or inline SVG; always reference the real file.

25. Every CFR citation gets the JetBrains Mono pill treatment:
    `font-family: 'JetBrains Mono', ui-monospace, monospace`,
    `color: var(--accent)`, accent-tinted background, 1px tinted
    border, 3-10px padding, 10.5px font size.

26. Marketing-site footers + headers use SiteShell, not raw layout.
    Maintains semantic landmarks and consistent links.

27. The cyan brand color is reserved for: brand chrome (logo
    retint, topbar accent), primary CTAs (always gradient
    accent -> accent-2), data emphasis (status="ok"), and links.
    It is NOT a surface color. Do not bathe sections in cyan.


## Copy voice

- No "Elevate", "Seamless", "Unleash", "Next-Gen", "Delve",
  "Supercharge", "Unlock", "10x" verbs.
- State the noun, then the verb.
- Real numbers only. Never invented stats like "99.99%" or "4.1x"
  without source data.
- Real names only ("Marcus Reyes", "Khalil Saunders" - already
  in demoFallback). Never "John Doe" or "Acme".
- Use typographic quotes (" ") not straight quotes (").
- Sentence case in body. Title case in product nav. ALL CAPS only
  for tiny eyebrow labels with letter-spacing 0.05 to 0.12em.


## Pre-flight checklist

Before committing a new page:

1. Does it pass impeccable's deterministic rules?
   Run mentally: side-stripe? glow shadow? gradient text? mixed
   icons? em-dashes? center-everything? nested cards?
2. Does it have visible focus rings on all interactive elements?
3. Does it have a working empty state (or demo fallback)?
4. Does data communicate with color + icon + text (not color alone)?
5. Is contrast at WCAG AA (4.5:1 body, 3:1 large text and UI)?
6. Does it work with `prefers-reduced-motion: reduce`?
7. Does it ship with both light and dark mode validated?
8. Run `npx playwright test` locally before pushing. The visual
   regression suite at `tests/visual.spec.ts` will catch most
   layout regressions before they hit production.


## When in doubt

The four repos these rules came from converge on one principle:

> "Pick the right place to be precise. Everything else stays at 80%
> of the polish. Don't make everything precious; nothing stands out
> when everything is."

Translation for X3 Compass: the cyan brand pill, the AI Concierge
CTA, the placard artwork, and one carefully chosen hero headline
per page are the precise moments. The rest is restrained navy,
tinted neutrals, generous whitespace, and tabular-num data.

---

Sources (cloned to /external-repos/):
- impeccable      - github.com/pbakaus/impeccable (27 deterministic rules + 7 references)
- huashu-design   - github.com/alchaincyf/huashu-design (5 schools x 20 vocabularies)
- ui-ux-pro-max   - github.com/nextlevelbuilder/ui-ux-pro-max-skill (161 reasoning rules + 67 styles)
- taste-skill     - github.com/Leonxlnx/taste-skill (anti-slop framework + GSAP skeletons)
