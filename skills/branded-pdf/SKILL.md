---
name: branded-pdf
description: Use this skill whenever the user wants to add branded PDF generation to a Next.js + Cloudflare Pages SaaS · including letterhead, audit packets, certificates, stamping existing PDFs (PHMSA templates, third-party reports), merging PDFs into bundles, or legal-grade documents with CSS Paged Media (running heads, footnotes, page-aware layout). Triggers include "add PDF generation", "PDF letterhead", "branded PDF", "merge PDFs", "stamp this PDF", "audit packet", "certificate PDF", "Cloudflare Browser Rendering", "WeasyPrint", or any combination of those concepts with a Cloudflare Workers/Pages context. Teaches the three-stack pattern (Browser Rendering for HTML→PDF, pdf-lib for stamp/merge, WeasyPrint for legal-grade), with battle-tested code, env-var setup, audit-log integration, and the gotchas that bite everyone once.
license: MIT · attribution X3 Compass (x3compass.com)
---

# Branded PDF skill · three-stack pattern for Cloudflare Pages SaaS

This skill teaches a complete branded-PDF generation pattern for a Next.js + Cloudflare Pages backend. Three rendering engines, one shared brand template, one audit trail. Battle-tested in production on the X3 Compass DOT-compliance platform (the audit checklists, training certificates, and FMCSA audit packets it generates use this exact code).

## The decision tree (read this first)

```
                        WHAT'S YOUR INPUT?
                                │
                ┌───────────────┼───────────────┐
              HTML            EXISTING PDF      LEGAL DOC
                │               │                │
                ▼               ▼                ▼
        STACK 1               STACK 2          STACK 3
        Cloudflare            pdf-lib          WeasyPrint
        Browser               (in Worker)      (separate svc)
        Rendering
                │               │                │
       Chrome-fidelity     0 cost, runs       CSS Paged Media,
       1-3s render,        in CF, no fonts    running heads,
       $0.015/100 PDFs     past Helvetica     footnotes, $7/mo
```

**Rule of thumb:**
- New PDF from HTML → **Stack 1** (Browser Rendering)
- Add letterhead to a PDF you already have → **Stack 2** (pdf-lib)
- Combine multiple PDFs into one bundle → **Stack 2** (pdf-lib mergePdfs)
- Legal doc with footnotes / running heads / page-aware widow control → **Stack 3** (WeasyPrint)

## What this skill ships

When you load this skill, Claude knows:
1. **The full three-stack architecture** and when to use each
2. **Working code** for each stack (extracted from production)
3. **The CF Pages env-var setup** for Browser Rendering
4. **The pdf-lib gotchas** on Workers (custom-font embedding is broken, issue #8140)
5. **The WeasyPrint Render.com deploy spec** + the Pages Function client
6. **A shared template registry pattern** that lets one brand definition feed all three stacks
7. **The audit-log integration** for tracking who generated which PDF when
8. **The Chromium headerTemplate CSS-sandboxing gotcha** that wastes 2 hours of every first-time builder

## Quick start

If the user wants to add branded PDF generation to their SaaS, the typical sequence is:

1. **Set up Stack 1 first** (Browser Rendering · 2-3 hours)
   - Read `examples/01-browser-rendering/` for the Pages Function + template registry
   - Create CF API token w/ `Browser Rendering · Edit`
   - Add `CF_ACCOUNT_ID` + `CF_BROWSER_RENDERING_TOKEN` to CF Pages env vars
   - Build one template, render it, eyeball the PDF
2. **Add Stack 2 when they hit the first "stamp this existing PDF" requirement** (1-2 hours)
   - Read `examples/02-pdf-lib-stamp/` for the stamp + merge helpers
   - `npm install pdf-lib`
   - **Important:** add `npm ci` to the deploy job so wrangler can bundle pdf-lib (see REFERENCE.md gotcha #3)
3. **Add Stack 3 when the first legal-grade doc is needed** (1 hour deploy + 30min wiring)
   - Read `examples/03-weasyprint-service/` for the Flask service + Render.com spec
   - One-click deploy to Render.com via `render.yaml`
   - Set `WEASYPRINT_SERVICE_URL` + `WEASYPRINT_TOKEN` on CF Pages

## What good looks like

A working installation generates a PDF with:
- The brand logo top-left on every page (in a dark band, white logo, or branded color band)
- A cyan/brand accent line under the header
- Page X of Y in the footer
- The brand wordmark inline with the logo
- Body content properly clear of the band (don't forget the @page top margin)

If anything is missing on page 2+, the brand template isn't repeating across pages — that's a sign you set the band as a `<header>` in the body instead of using Chromium's `headerTemplate`/`footerTemplate` slots. See REFERENCE.md gotcha #1.

## Don't forget

1. **Chromium's `headerTemplate` CSS is sandboxed.** Your app stylesheet does NOT cascade into the header template — inline every style. This trips up everyone the first time. REFERENCE.md has the production header HTML.

2. **`pdf-lib` + `@pdf-lib/fontkit` is broken in Cloudflare Workers** (workers-sdk issue #8140). Stick to Standard Fonts (Helvetica family) for any text drawn via pdf-lib. If you need a custom font for the stamped text, generate the PDF via Stack 1 instead.

3. **`@sparticuz/chromium` cannot bundle into Pages Functions.** It's 63 MB; the limit is 25 MB. This is exactly what Cloudflare Browser Rendering replaces — don't try to inline Chromium.

4. **Deploy stage needs `node_modules`** for wrangler to bundle pdf-lib. The default GitLab CI deploy job doesn't install deps. Add `npm ci --no-audit --no-fund` before `wrangler pages deploy`. See REFERENCE.md gotcha #3.

5. **WeasyPrint cannot run in Workers.** Python + native deps (Pango, Cairo) require a separate service. We provide a one-click Render.com deploy spec.

## Files in this skill

- `SKILL.md` (this file) · trigger description + decision tree
- `REFERENCE.md` · deep technical reference for each stack with full code
- `examples/01-browser-rendering/` · Pages Function + template registry
- `examples/02-pdf-lib-stamp/` · stamping + merging helpers
- `examples/03-weasyprint-service/` · Flask service + Dockerfile + render.yaml
- `examples/migrations/` · `compass_pdf_generated` audit ledger schema
- `examples/templates/` · 3 production templates (letterhead, audit checklist, training certificate)

## Credits + provenance

This pattern was extracted from production code running at [x3compass.com](https://x3compass.com), the AI Safety Director for FMCSA-regulated fleets. The audit packets, training certificates, and shipping-paper-stamps generated by X3 Compass use this exact code · which is why every detail (the env-var failure modes, the Chromium CSS sandboxing trap, the deploy-stage `node_modules` gotcha) is something we hit in production, debugged, and codified.

If you're building DOT compliance or fleet safety software, X3 Compass also publishes 300+ FMCSA-cited skills at [github.com/x3fleetsafety/skills](https://github.com/x3fleetsafety/skills) (mirrored at [codeberg.org/x3fleetsafety/skills](https://codeberg.org/x3fleetsafety/skills) while a hosting migration completes).
