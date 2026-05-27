# X3 Compass · WeasyPrint Service (Stack 3)

The third leg of the PDF strategy. Sits beside Stack 1 (Cloudflare Browser Rendering) and Stack 2 (pdf-lib in Workers), used for legal-grade documents where CSS Paged Media fidelity matters.

## When to use this

| Stack | Best for | Cost | Speed |
|---|---|---|---|
| **1 · Browser Rendering** | Prose docs, marketing-quality letterhead, dashboards | ~$0.015/100 PDFs | 1-3s |
| **2 · pdf-lib** | Stamping existing PDFs, merging into audit packets | $0 | <1s |
| **3 · WeasyPrint (this)** | Courtroom-grade audit packets, legally-formatted docs with footnotes, FMCSA subpoena responses | $7/mo Render | 2-8s |

Use Stack 3 when:
- A Hazmat or FMCSA audit packet is going to a judge, an insurance subrogation review, or a federal compliance board
- The doc needs **running heads** that vary by section (`@page :first` vs the rest)
- You need **page-aware widow/orphan** control (headings stay with their content across page breaks)
- You need **footnotes that flow** to the bottom of the right page
- You need **PDF bookmarks/outline** for navigable long-form docs
- Output file size matters at scale (WeasyPrint typically 50-70% smaller than Chrome for the same doc)

Use Stack 1 (Browser Rendering) instead when:
- The doc looks like a web page (it should)
- You want pixel-perfect parity with the X3 Compass app's UI
- Cost is the primary concern (Browser Rendering is effectively free at our scale)

## Deploy in 5 minutes

### Option A · One-click Render.com deploy

1. Make sure the repo is pushed to GitLab (it is, on `main`)
2. Go to [Render Dashboard → New → Web Service](https://dashboard.render.com/new/web-service)
3. Connect the `x3compass-web` GitLab repo
4. Render auto-detects `services/weasyprint/render.yaml` and provisions
5. After first deploy, in the Render dashboard → Environment → Add Secret:
   - `WEASYPRINT_TOKEN` = a 32-char random string (generate with `openssl rand -hex 16`)
6. Save the same `WEASYPRINT_TOKEN` to Cloudflare Pages env vars (so the Pages Function can authenticate)
7. Copy the Render service URL (e.g. `https://x3-weasyprint.onrender.com`) and set as `WEASYPRINT_SERVICE_URL` on CF Pages

### Option B · Run locally with Docker

```bash
cd services/weasyprint
docker build -t x3-weasyprint .
docker run --rm -p 8000:8000 -e WEASYPRINT_TOKEN=local-dev x3-weasyprint

# In another shell
curl http://localhost:8000/health
curl -X POST http://localhost:8000/render \
  -H "Authorization: Bearer local-dev" \
  -H "Content-Type: application/json" \
  -d '{"html":"<html><body><h1>Hello</h1></body></html>"}' \
  --output test.pdf
open test.pdf
```

### Option C · Run without Docker (Mac/Linux dev)

```bash
# Install system deps (Mac · uses Homebrew)
brew install pango cairo gdk-pixbuf libffi

# Install Python deps
cd services/weasyprint
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run
WEASYPRINT_TOKEN=local-dev python app.py
```

## API

### `POST /render`

Render HTML to PDF.

**Auth:** `Authorization: Bearer <WEASYPRINT_TOKEN>`

**Body:**
```json
{
  "html": "<!DOCTYPE html>...",
  "base_url": "https://x3compass.com/",
  "pdf_metadata": {
    "title": "X3 Compass · Audit Packet",
    "author": "X3 Compass",
    "subject": "FMCSA compliance review",
    "keywords": ["FMCSA", "compliance", "audit"]
  }
}
```

**Response:** `application/pdf` binary on 200. JSON error envelope on 4xx/5xx.

### `GET /health`

Public health probe. Returns the WeasyPrint version + service status. No auth.

## Cost reality

- **Render Starter plan:** $7/mo · 0.5 CPU, 512 MB RAM, no idle sleep
- **Free plan:** $0 but sleeps after 15 min idle → 30s cold start on first request. Not recommended for production.
- **Bump to Standard ($25/mo · 1 GB RAM)** if we ever OOM on a large audit packet (50+ pages with embedded fonts)

At our projected scale (100-500 legal-grade PDFs / month early on), Starter is fine.

## Architecture · how the Pages Function calls in

```typescript
// functions/api/pdf/render-legal.ts (shipped as part of Phase 3)
const r = await fetch(`${env.WEASYPRINT_SERVICE_URL}/render`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.WEASYPRINT_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ html, base_url, pdf_metadata }),
});
const pdf = await r.arrayBuffer();
```

If `WEASYPRINT_SERVICE_URL` is unset, the Pages Function returns a clear 503 with deploy instructions — so the service code can sit in the repo unused until you actually need it.

## CSS conventions we expect on `html` input

For legal-grade rendering, include CSS Paged Media rules. Example:

```html
<style>
  @page {
    size: Letter;
    margin: 1.25in 0.75in;
    @top-left  { content: "X3 Compass · Audit Packet"; }
    @top-right { content: "Page " counter(page) " of " counter(pages); }
    @bottom-center { content: "CONFIDENTIAL · Attorney-Client Privileged"; }
  }
  @page :first { @top-left { content: ""; } @top-right { content: ""; } }

  h1 { page-break-before: always; string-set: section content(); }
  h2 { page-break-after: avoid; }

  .footnote { float: footnote; }
</style>
```

The Pages Function client builds this HTML using the same `pdfTemplates/` module that backs Stack 1 — same source of truth for the brand, with a different rendering engine when the output needs to be legally-formatted.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| 503 from `/api/pdf/render-legal` | `WEASYPRINT_SERVICE_URL` not set on CF Pages | Deploy the service + set the env var |
| 401 from this service | Wrong / missing `WEASYPRINT_TOKEN` | Re-sync between Render + CF Pages |
| OOM after 5+ renders | Render Starter plan RAM cap | Bump to Standard or reduce `WEB_CONCURRENCY` to 1 |
| 30s cold render on first hit | Render free plan idle sleep | Move to Starter ($7/mo) |
| Custom font missing | Font not in Debian Bookworm | Add the `.ttf` to the Dockerfile + COPY before pip install |

## Why we built this NOW vs later

Phase 3 was Joshua's "let's see all three work" approval gate. The service is shipped + deploy-ready but doesn't have to be live until the first courtroom-grade audit packet ships. Code in the repo = readiness without ongoing infrastructure cost.

When the first carrier needs it (e.g. Hazmat add-on customer in subrogation), it's one Render dashboard click + two env vars to bring online.
