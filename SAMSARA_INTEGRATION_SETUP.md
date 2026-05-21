# Samsara Integration — Phase 1 Setup Checklist

## Code shipped in this commit

- `supabase/migrations/20260520_samsara_oauth.sql` — adds OAuth columns to `compass_vendor_integrations`
- `functions/_shared/samsara.ts` — constants, scopes, token-exchange helpers, XOR-stub encryption
- `functions/api/integrations/samsara/oauth-start.ts` — kicks off OAuth flow
- `functions/api/integrations/samsara/oauth-callback.ts` — receives code, exchanges, stores
- `functions/api/integrations/samsara/disconnect.ts` — clears tokens

## What you do (3 steps, ~10 minutes once partner credentials arrive)

### Step 1 — Get partner credentials from Samsara

1. Log into the [Samsara Partner Developer Portal](https://developers.samsara.com/docs/partner-developer-portal)
2. Create a new app (name: `X3 Compass`)
3. Configure the app:
   - **Redirect URI:** `https://x3compass-web.pages.dev/api/integrations/samsara/oauth-callback`
     (after custom domain ships: `https://app.x3compass.com/api/integrations/samsara/oauth-callback`)
   - **Requested scopes:** read:vehicles, read:drivers, read:hours-of-service, read:vehicle-stats, read:dvirs, read:safety-events, read:maintenance, read:trips
   - **App description:** "DOT compliance command center. Mirrors Samsara HOS, DVIRs, driver/vehicle roster, and safety events into audit-ready compliance artifacts."
4. Copy the issued `client_id` and `client_secret`

### Step 2 — Set Cloudflare Pages env vars

In the Cloudflare dashboard, under Pages → `x3compass-web` → Settings → Environment variables (Production):

| Variable | Value |
|---|---|
| `SAMSARA_CLIENT_ID` | (from Partner Portal) |
| `SAMSARA_CLIENT_SECRET` | (from Partner Portal, mark as Encrypted) |
| `SAMSARA_REDIRECT_URI` | `https://x3compass-web.pages.dev/api/integrations/samsara/oauth-callback` |
| `SAMSARA_API_BASE` | `https://api.samsara.com` *(use `https://api.eu.samsara.com` if you're onboarding EU customers)* |
| `SAMSARA_ENC_SECRET` | Random 64-char string for token-at-rest encryption (use `openssl rand -hex 32` to generate) |

### Step 3 — Apply the migration to Supabase

Either:
- **Studio paste**: open `supabase/migrations/20260520_samsara_oauth.sql` → paste into Supabase Studio SQL editor → Run
- **CLI**: `supabase db push` if you have the project linked locally

Idempotent — every statement uses `add column if not exists` / `create index if not exists`. Safe to re-run.

## How it'll work end-to-end

```
User clicks "Connect Samsara" on /app/integrations
        ↓
Browser opens /api/integrations/samsara/oauth-start
        ↓
Compass verifies user JWT + sets CSRF state cookie
        ↓
302 → https://api.samsara.com/oauth2/authorize?client_id=...&scope=...
        ↓
User sees Samsara consent screen, clicks Allow
        ↓
Samsara 302s → /api/integrations/samsara/oauth-callback?code=...&state=...
        ↓
Compass verifies state matches cookie (CSRF)
        ↓
Compass POSTs to https://api.samsara.com/oauth2/token to exchange code → tokens
        ↓
Compass GETs https://api.samsara.com/me to learn org name/id
        ↓
Compass encrypts tokens + upserts into compass_vendor_integrations (carrier_id, vendor='samsara')
        ↓
302 → /app/integrations?samsara=connected&org=<Samsara Org Name>
```

Tokens are XOR-encrypted at rest (v1 stub). Phase 7 work: rotate to pgsodium or Cloudflare Secrets-derived AES-GCM once we have >1 customer or before SOC 2 cert.

## Phase 2 preview (next sprint after this lands)

After Phase 1 is live and tested:
- `functions/api/integrations/samsara/sync-hos.ts` — hourly cron pulls daily duty status summaries → upserts `compass_hos_logs`
- `functions/api/integrations/samsara/sync-roster.ts` — daily cron syncs drivers + vehicles
- `functions/api/integrations/samsara/webhook.ts` — receives DvirSubmitted, AlertIncident, SevereSpeeding events
- UI badge on `/app/hos`, `/app/drivers`, `/app/vehicles` showing "Synced from Samsara · last sync 2 min ago"

## Security notes

- `SAMSARA_ENC_SECRET` MUST be ≥ 32 chars and unique per environment
- Never log tokens — the helper functions throw on missing env vars rather than fall through to plaintext
- State cookies are `HttpOnly + Secure + SameSite=Lax` with 10-min max-age
- CSRF check is strict equality between callback `state` param and the cookie
- `compass_vendor_integrations` has RLS — super-admin only for v1. Tighten to per-carrier once auth is fully wired
