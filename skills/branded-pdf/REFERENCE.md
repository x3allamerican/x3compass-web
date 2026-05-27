# Branded PDF · technical reference

Deep reference for the three-stack pattern. Reads top-to-bottom. The 4 sections that matter most: the three stacks (each ~150 lines of explanation) and the gotchas section at the end.

## Architecture · why three stacks instead of one

We tried to ship branded PDFs with a single tool first. Three months in, here's what didn't work:

| Single-stack attempt | Why it failed |
|---|---|
| `@sparticuz/chromium` in Workers | Chromium is 63 MB · Pages Function bundle cap is 25 MB |
| pdf-lib for everything | Can't render arbitrary HTML · coordinate math for tables is brutal |
| WeasyPrint for everything | Can't stamp existing PDFs · adding the X3 logo to a PHMSA template is awkward |
| Browser Rendering for everything | Can't operate on existing PDFs · stamping + merging require pdf-lib |
| External SaaS (DocRaptor, PDFShift) | $15/mo for 125 docs · breaks the $0-marginal-cost model |

The three-stack split emerged because each tool has a niche it dominates and a niche it can't do at all. Trying to force one tool to do all three made every doc worse.

## Stack 1 · Cloudflare Browser Rendering

**Use for:** New PDFs rendered from HTML. Letterhead docs, audit checklists, training certificates, anything that looks like a web page.

**Cost:** ~$0.015 per 100 PDFs at our scale. The Workers Paid plan ($5/mo) includes 10 hours of browser-time per month, which works out to ~12,000–36,000 PDFs depending on render complexity.

**Setup:**

```bash
# 1. Create CF API token at https://dash.cloudflare.com/profile/api-tokens
#    Permission: Account · Browser Rendering · Edit
#    Scope: your specific account

# 2. Add both env vars to your Pages project (Settings → Environment variables → Production)
#    CF_ACCOUNT_ID = your account ID (plaintext)
#    CF_BROWSER_RENDERING_TOKEN = the token (encrypted)

# 3. Trigger a redeploy so the new vars get baked in
```

**The Pages Function** (full file at `examples/01-browser-rendering/render.ts`):

```typescript
// POST /api/pdf/render
import { TEMPLATES, buildHeaderTemplate, buildFooterTemplate, wrapBody } from "../../_shared/pdfTemplates";

interface Env {
  CF_ACCOUNT_ID?: string;
  CF_BROWSER_RENDERING_TOKEN?: string;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const body = await request.json() as { template?: string; data?: Record<string, unknown> };
  const fn = TEMPLATES[body.template || "letterhead-test"];
  if (!fn) return json({ ok: false, error: "Unknown template" }, 400);

  if (!env.CF_ACCOUNT_ID || !env.CF_BROWSER_RENDERING_TOKEN) {
    return json({ ok: false, error: "Browser Rendering not configured" }, 503);
  }

  const out = fn(body.data || {});
  const html = wrapBody(out.title, out.bodyHTML);
  const headerTemplate = buildHeaderTemplate(out.headerSubtitle);
  const footerTemplate = buildFooterTemplate();

  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/pdf`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${env.CF_BROWSER_RENDERING_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        pdfOptions: {
          format: "letter",       // ← LOWERCASE · Zod schema rejects "Letter"
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate,
          footerTemplate,
          margin: { top: "1.55in", bottom: "0.85in", left: "0.6in", right: "0.6in" },
        },
      }),
    }
  );
  if (!r.ok) return json({ ok: false, error: `Browser Rendering ${r.status}` }, 502);
  const pdfBuf = await r.arrayBuffer();
  return new Response(pdfBuf, { headers: { "Content-Type": "application/pdf" } });
}
```

**The header template** (the part Chromium runs in its sandbox · this is where everyone gets stuck):

```typescript
export function buildHeaderTemplate(subtitle?: string): string {
  // CRITICAL: Chromium's headerTemplate CSS does NOT cascade from your app
  // stylesheet. Inline EVERY style. Default font size is microscopic ·
  // explicitly set font-size: 9-10pt+.
  //
  // CRITICAL: -webkit-print-color-adjust: exact forces backgrounds to
  // render in print mode · without it your colored band disappears.
  return `
<div style="
  width: 100%;
  padding: 18px 0.6in 20px;
  background: linear-gradient(135deg, #0A1929 0%, #0E2438 100%);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 10pt;
  color: #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 3px solid #16C7FF;
  box-sizing: border-box;
">
  <div style="display: flex; align-items: center; gap: 14px;">
    <img src="${LOGO_DATA_URI}" alt="Your Brand" style="height: 64px; width: auto;" />
    <span style="font-weight: 800; letter-spacing: 0.6px; color: #FFFFFF; font-size: 19pt; line-height: 1;">Your Brand</span>
  </div>
  ${subtitle ? `<div style="font-size: 10pt; color: #16C7FF; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;">${subtitle}</div>` : ""}
  <div style="font-size: 10pt; color: #94A3B8; font-weight: 600;"><span class="date"></span></div>
</div>`.trim();
}
```

**Why base64-embed the logo:** Chromium's headerTemplate runs in a sandboxed context. External fetches (CORS, auth gates, cold-domain failures) are fragile. A ~17KB inline base64 PNG is the most reliable path. Use a CDN URL later only if footprint becomes a problem.

## Stack 2 · pdf-lib (in the Pages Function)

**Use for:** (a) Stamping the brand band onto an existing PDF you didn't generate (PHMSA template, Checkr report, 3rd-party manifest). (b) Merging multiple PDFs into one bundle (audit packets).

**Cost:** $0. pdf-lib is a 344 KB pure-JS library that runs natively in Cloudflare Pages Functions.

**Install:**

```bash
npm install pdf-lib@1.17.1
```

**Critical CI fix** — wrangler bundles Pages Functions at deploy time and needs `node_modules`. Add to your GitLab CI / GitHub Actions deploy job:

```yaml
deploy:
  script:
    - npm ci --no-audit --no-fund    # ← needed so wrangler can resolve pdf-lib
    - npx --yes wrangler@latest pages deploy out
```

This bit us in production — Phase 1 deploy worked because nothing in `functions/` imported a runtime npm package; Phase 2 (which added pdf-lib) failed deploy because the deploy job had no `node_modules` to bundle. Add the `npm ci` line BEFORE you push pdf-lib code.

**The stamp helper** (full file at `examples/02-pdf-lib-stamp/pdfStamp.ts`):

```typescript
import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";

const NAVY  = rgb(0.039, 0.098, 0.161); // #0A1929
const CYAN  = rgb(0.086, 0.780, 1.000); // #16C7FF
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0.580, 0.639, 0.722); // #94A3B8

export async function stampPdf(
  sourceBuffer: ArrayBuffer | Uint8Array,
  opts: { subtitle?: string; footerBrand?: string } = {}
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });

  const logo = await pdf.embedPng(base64ToBytes(LOGO_PNG_BASE64));
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);

  const totalPages = pdf.getPageCount();
  pdf.getPages().forEach((page, idx) => {
    stampPage(page, { logo, helvBold, helv, idx, totalPages, ...opts });
  });

  return await pdf.save({ useObjectStreams: true });
}

function stampPage(page: PDFPage, ctx: any) {
  const { width, height } = page.getSize();
  const BAND = 56;  // pt
  // 1. Navy band along the top
  page.drawRectangle({ x: 0, y: height - BAND, width, height: BAND, color: NAVY });
  // 2. Cyan accent stripe
  page.drawRectangle({ x: 0, y: height - BAND - 2, width, height: 2, color: CYAN });
  // 3. Logo + wordmark, vertically centered on the band
  const logoH = 32;
  const dims = ctx.logo.scale(logoH / ctx.logo.height);
  page.drawImage(ctx.logo, { x: 32, y: height - BAND/2 - dims.height/2, width: dims.width, height: dims.height });
  page.drawText("Your Brand", { x: 32 + dims.width + 10, y: height - BAND/2 - 6, size: 16, font: ctx.helvBold, color: WHITE });
  // 4. Subtitle on the right, if provided
  if (ctx.subtitle) {
    const w = ctx.helvBold.widthOfTextAtSize(ctx.subtitle.toUpperCase(), 9);
    page.drawText(ctx.subtitle.toUpperCase(), { x: width - 32 - w - 140, y: height - BAND/2 - 3, size: 9, font: ctx.helvBold, color: CYAN });
  }
  // 5. Footer · brand line + Page X of Y
  page.drawText(ctx.footerBrand || "Your Brand · powered by you", { x: 32, y: 16, size: 8, font: ctx.helv, color: MUTED });
  const pageLabel = `Page ${ctx.idx + 1} of ${ctx.totalPages}`;
  const w = ctx.helv.widthOfTextAtSize(pageLabel, 8);
  page.drawText(pageLabel, { x: width - 32 - w, y: 16, size: 8, font: ctx.helv, color: MUTED });
}
```

**The merge helper** is the same idea: load each source PDF, copy its pages into a new document, optionally add a cover page, optionally stamp every page. See `examples/02-pdf-lib-stamp/mergePdfs.ts`.

**Known constraint** · `@pdf-lib/fontkit` is broken on Cloudflare Workers (workers-sdk issue #8140). You CANNOT embed custom fonts via `pdf.registerFontkit()`. Stick to the 14 Standard Fonts (Helvetica/Times/Courier family). If you need a custom font for the stamped text, use Stack 1 (Browser Rendering) instead — it has access to Cloudflare's full font set and supports `@font-face` via `addStyleTag`.

## Stack 3 · WeasyPrint (separate service)

**Use for:** Legal-grade documents. Court filings, FMCSA subpoena responses, insurance subrogation reviews. Anything where CSS Paged Media features matter: running heads that vary per page, footnotes that flow to the bottom of the right page, page-aware widow/orphan control, PDF bookmarks/outline.

**Cost:** $7/mo Render.com Starter plan. (Free plan sleeps after 15min idle; the 30-second cold start kills production reliability.)

**Why not just use Browser Rendering for legal docs:** Chrome's headerTemplate is a sandboxed snippet; it can't reference a counter that knows about sections, can't do running heads that vary by section, can't anchor footnotes. WeasyPrint implements CSS Paged Media properly — that's the difference between a Chrome-printed page and a typeset legal document.

**Service code** (Flask + WeasyPrint, full file at `examples/03-weasyprint-service/app.py`):

```python
from flask import Flask, request, jsonify, Response
from weasyprint import HTML
import io, os

app = Flask(__name__)
WEASYPRINT_TOKEN = os.environ.get("WEASYPRINT_TOKEN", "")

@app.before_request
def auth_gate():
    if request.method == "GET":
        return None
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer ") or auth.split(" ", 1)[1] != WEASYPRINT_TOKEN:
        return jsonify({"ok": False, "error": "Unauthorized"}), 401

@app.get("/health")
def health():
    import weasyprint
    return jsonify({"ok": True, "weasyprint_version": weasyprint.__version__})

@app.post("/render")
def render():
    payload = request.get_json(silent=True) or {}
    html_str = payload.get("html") or ""
    if not html_str:
        return jsonify({"ok": False, "error": "html field required"}), 400
    base_url = payload.get("base_url") or "https://example.com/"

    buf = io.BytesIO()
    HTML(string=html_str, base_url=base_url).write_pdf(target=buf)
    return Response(buf.getvalue(), content_type="application/pdf")
```

**Deploy** via the included `render.yaml`:

```yaml
services:
  - type: web
    name: my-weasyprint
    runtime: docker
    rootDir: services/weasyprint
    dockerfilePath: Dockerfile
    plan: starter
    region: oregon
    autoDeploy: true
    healthCheckPath: /health
    envVars:
      - key: WEASYPRINT_TOKEN
        sync: false        # set in Render dashboard
```

**Pages Function client** (calls the service when env vars are set, returns 503 with setup instructions otherwise · graceful degradation):

```typescript
export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.WEASYPRINT_SERVICE_URL || !env.WEASYPRINT_TOKEN) {
    return json({ ok: false, error: "WeasyPrint not deployed yet", deploy_doc: "/services/weasyprint/README.md" }, 503);
  }
  const body = await request.json();
  const out = TEMPLATES[body.template](body.data);
  const html = wrapBody(out.title, out.bodyHTML);
  const r = await fetch(`${env.WEASYPRINT_SERVICE_URL}/render`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WEASYPRINT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ html, base_url: "https://example.com/", pdf_metadata: { title: out.title } }),
  });
  return new Response(await r.arrayBuffer(), { headers: { "Content-Type": "application/pdf" } });
}
```

**CSS Paged Media patterns that earn WeasyPrint its keep:**

```css
@page {
  size: Letter;
  margin: 1.25in 0.75in;
  @top-left  { content: "Audit Packet · " counter(page) " of " counter(pages); }
  @top-right { content: string(section); }
  @bottom-center { content: "CONFIDENTIAL · Attorney-Client Privileged"; }
}
@page :first { @top-left { content: ""; } @top-right { content: ""; } }

h1 { page-break-before: always; string-set: section content(); }
h2 { page-break-after: avoid; }

.footnote { float: footnote; }
```

Try doing that in Chromium's headerTemplate. (You can't.)

## Shared template registry (the bit that ties it all together)

The win is that you have ONE module defining your brand templates, used by all three stacks. The `pdfTemplates/index.ts` module exports a registry like:

```typescript
export const TEMPLATES: Record<string, TemplateFn> = {
  "letterhead-test": letterheadTest,
  "audit-checklist": auditChecklist,
  "training-certificate": trainingCertificate,
};

export type TemplateFn<T = Record<string, unknown>> = (data: T) => TemplateOutput;

export type TemplateOutput = {
  title: string;
  bodyHTML: string;
  headerSubtitle?: string;
  pdfOptions?: { format?: string; landscape?: boolean; printBackground?: boolean; margin?: { top?: string; right?: string; bottom?: string; left?: string } };
};
```

Stack 1 calls a template function, builds HTML via `wrapBody()`, sends to Browser Rendering.
Stack 3 calls the SAME template function, builds the SAME HTML, sends to WeasyPrint instead.
Stack 2 operates on bytes, doesn't use templates · but the brand band code in `pdfStamp.ts` uses the SAME colors as the templates so the visual output stays consistent.

That's the whole pattern.

## Audit log

Every PDF generated by any of the three stacks writes one row to `compass_pdf_generated` (or whatever you name it). Schema:

```sql
create table public.compass_pdf_generated (
  id             uuid primary key default gen_random_uuid(),
  carrier_id     uuid not null references public.carriers(id) on delete cascade,
  user_id        uuid not null,
  source         text not null check (source in ('render','stamp','merge')),
  template_slug  text not null,
  byte_size      integer not null check (byte_size > 0),
  generated_at   timestamptz not null default now()
);
create index on public.compass_pdf_generated (carrier_id, generated_at desc);
alter table public.compass_pdf_generated enable row level security;
create policy tenant_isolation on public.compass_pdf_generated
  for select using (carrier_id in (select carrier_id from carrier_members where user_id = auth.uid()));
```

Logging is best-effort · failures NEVER block PDF delivery:

```typescript
try {
  const user = await verifySupabaseJwt(env, bearerFromRequest(request)) ?? null;
  if (user) await logPdfGenerated(env, { user_id: user.sub, source, template_slug, byte_size });
} catch { /* swallow · audit gap is okay; failed PDF delivery is not */ }
```

## Gotchas · the things that bite everyone exactly once

1. **Chromium `headerTemplate` CSS is sandboxed.** Your app's stylesheet does NOT cascade in. Inline every style. Font sizes default to microscopic — explicitly set `font-size: 9pt+`. Use `-webkit-print-color-adjust: exact` to force colored backgrounds to render in print mode.

2. **`pdfOptions.format` is strict-lowercase.** `"Letter"` fails the Zod validation with `invalid_enum_value`. Use `"letter"`. Same for `"a4"` etc.

3. **Deploy stage needs `node_modules`.** wrangler bundles Pages Functions at deploy time. If your deploy job doesn't install deps, pdf-lib won't resolve. Add `npm ci --no-audit --no-fund` before `wrangler pages deploy`.

4. **pdf-lib custom-font embedding is broken on Workers** (workers-sdk issue #8140). Use Standard Fonts (Helvetica family). Need a custom font for stamped text? Render via Stack 1 instead.

5. **CF Pages env vars are snapshot at deploy time.** Setting an env var on a Pages project does NOT update existing deployments — only future ones. Set env vars BEFORE the deploy, or trigger a fresh deploy after setting them.

6. **Render.com free-tier sleep kills production reliability.** 15min idle → 30sec cold start on the next request. Pay for Starter ($7/mo) if WeasyPrint is in the critical path of any user-facing flow.

7. **`@sparticuz/chromium` cannot bundle into Pages Functions.** 63 MB. Don't try. Browser Rendering is exactly the replacement.

## Versioning your skill

When you adapt this skill to your brand, bump `disclosure_version` (or a similar tag) in your migration when the brand colors change. Track which version each PDF was generated against — useful for "regenerate everything from 2024 with the new brand."

## Credits

Pattern extracted from production code at [x3compass.com](https://x3compass.com). MIT-licensed · attribution appreciated.
