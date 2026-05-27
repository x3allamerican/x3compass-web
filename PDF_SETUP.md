# PDF Setup · Cloudflare Browser Rendering

5-minute setup to enable branded PDF generation in X3 Compass.

## What you're enabling

`POST /api/pdf/render` calls Cloudflare's Browser Rendering API to convert HTML templates into branded PDFs with the X3 Compass logo as letterhead. Used by:

- Hazmat Center audit checklists
- Training certificates
- Audit-export bundles
- (Future) shipping papers, driver consent receipts, monthly client reports

## Two env vars needed

| Variable | Where | What |
|---|---|---|
| `CF_ACCOUNT_ID` | Cloudflare dashboard → Right sidebar → Account ID | Cloudflare account ID, already used by Wrangler + other tools |
| `CF_BROWSER_RENDERING_TOKEN` | New API token, see below | Scoped token with `Browser Rendering - Edit` permission |

## Step 1 · Create the API token (3 minutes)

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token** → **Create Custom Token**
3. Name: `x3compass-browser-rendering`
4. Permissions: **Account · Browser Rendering · Edit**
5. Account Resources: **Include · Specific account · (your account)**
6. (Optional) Client IP filtering: leave empty unless you want to restrict to specific IPs
7. (Optional) TTL: 1 year is reasonable
8. Click **Continue to summary** → **Create Token**
9. Copy the token shown (starts with a long string · you'll only see it ONCE)

## Step 2 · Add both env vars to Cloudflare Pages

1. Go to https://dash.cloudflare.com → Workers & Pages → `x3compass-web` (or your Pages project name)
2. **Settings** → **Environment variables**
3. Add **Production** variable:
   - Name: `CF_ACCOUNT_ID`
   - Value: (the Account ID from your dashboard sidebar)
   - Type: Plaintext is fine (account IDs aren't secret)
4. Add **Production** variable:
   - Name: `CF_BROWSER_RENDERING_TOKEN`
   - Value: (the token from Step 1)
   - Type: **Encrypted** (this IS a secret)
5. Click **Save**
6. Trigger a redeploy (push any commit, or in CF Pages settings → Deployments → re-deploy latest)

## Step 3 · Verify

1. Once the deploy lands, sign into X3 Compass and go to `/app/pdf-test`
2. Click any "Generate PDF →" button
3. A PDF should download · open it and confirm:
   - X3 Compass logo top-left on every page
   - Cyan accent line under the header
   - Page X of Y footer
   - Brand line in footer
   - All content rendered cleanly

If you get a 503 error with `Browser Rendering not configured`, recheck the env vars are in **Production** scope (not Preview) and the deploy went through.

## Pricing reality

- **Free** on Workers Free plan: 10 minutes/day of browser time
- **Workers Paid** ($5/mo): includes 10 hours/month of browser time at no extra cost
- **Beyond that:** $0.09 per browser-hour

A typical PDF render = 1-3 seconds of browser time. So 10 hours/month = roughly **12,000 to 36,000 PDFs/month** before incurring any usage cost.

At our projected scale (100-1000 PDFs/month early on), the entire bill is effectively $0.

## What if Cloudflare Browser Rendering is down?

The `/api/pdf/render` endpoint will return a 502 with the upstream error. We have two fallback options ready to wire if it ever becomes a problem:

1. **pdf-lib stamping** (Phase 2) — generates simpler PDFs server-side without external dependencies
2. **WeasyPrint on a separate Render.com service** (Phase 3) — Python service for complex legal-formatted docs

Both will be documented as we ship them.

## Local development

Browser Rendering is a Cloudflare-managed service, so it works the same locally (via `wrangler pages dev`) as in production. Just set the same two env vars in your `.dev.vars` file at the repo root:

```
CF_ACCOUNT_ID=your-account-id
CF_BROWSER_RENDERING_TOKEN=your-token
```

`.dev.vars` is in `.gitignore` so it won't be committed.

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Browser Rendering not configured` (503) | Env vars missing | Steps 1-3 above |
| `Browser Rendering returned 401` | Token doesn't have `Browser Rendering - Edit` permission | Re-create the token with the right scope |
| `Browser Rendering returned 403` | Token scoped to wrong account | Re-create scoped to the correct account |
| `Browser Rendering returned 429` | Hit the per-minute rate limit | CF limits are 60 req/min default; back off |
| Logo missing on rendered PDF | Base64 string corrupted | Re-run `base64 -w0 public/x3-compass-logo-alpha.png` and regenerate `/src/lib/pdfTemplates/logo.ts` |
| Header CSS not applying | Chromium sandboxes headerTemplate CSS | Inline all styles in `buildHeaderTemplate()` — don't reference app stylesheets |
