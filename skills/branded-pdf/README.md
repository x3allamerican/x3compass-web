# branded-pdf · Claude skill

Battle-tested three-stack pattern for branded PDF generation in a Next.js + Cloudflare Pages SaaS. Extracted from the X3 Compass DOT-compliance platform · MIT licensed.

## The pattern in one diagram

```
                   Input?
                     │
       ┌─────────────┼─────────────┐
     HTML       Existing PDF    Legal doc
       │             │             │
       ▼             ▼             ▼
   STACK 1       STACK 2        STACK 3
   Cloudflare    pdf-lib in     WeasyPrint
   Browser       Worker         on Render
   Rendering     (no cost)      ($7/mo)
   ($0.015/100)
```

One shared template registry feeds all three. One audit log captures every generation.

## What you get

- Working Pages Function for HTML → PDF via Cloudflare Browser Rendering
- Working pdf-lib helpers for stamping + merging existing PDFs
- Flask service + Render.com one-click deploy spec for WeasyPrint
- Supabase migration for the `compass_pdf_generated` audit ledger
- 3 production templates (letterhead, audit checklist, training certificate)
- The 7 gotchas that bite every first-time builder

## Install

```bash
# Copy this skill into your Claude skills directory
cp -r branded-pdf ~/.claude/skills/

# Then ask Claude something like:
#   "Add branded PDF generation to my Next.js + Cloudflare SaaS"
#   "Help me set up Cloudflare Browser Rendering for letterhead PDFs"
#   "Build me an audit-packet merger using pdf-lib"
```

Claude will read SKILL.md to decide when to load the skill, then dive into REFERENCE.md + examples/ for the implementation.

## Why this skill exists

As of May 2026, the Claude skill ecosystem had no polished branded-letterhead PDF skill. Anthropic's official `pdf` skill is read/manipulate-focused (pypdf + reportlab) and doesn't cover Cloudflare Workers. There was a gap. This fills it.

## Provenance

Built and battle-tested at [x3compass.com](https://x3compass.com), the AI Safety Director for FMCSA-regulated motor carriers. Every detail in this skill — the env-var failure modes, the Chromium CSS sandboxing trap, the deploy-stage `node_modules` gotcha, the lowercase-format Zod fix — was something we hit in production, debugged in real time, and codified.

If you're building DOT compliance or fleet safety software, X3 Compass also publishes 300+ FMCSA-cited skills. See [x3compass.com](https://x3compass.com).

## License

MIT · attribution appreciated.
