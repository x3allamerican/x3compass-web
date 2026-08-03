# X3 Compass · Deploy Guide

What's needed to go from GitHub `main` to a paying-customer-accepting production site at `x3compass.com`.

## 1 · Cloudflare Pages env vars (Settings → Environment variables)

### Production (branch: main)

- `NEXT_PUBLIC_SITE_URL` = `https://x3compass.com`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE` (secret)
- `STRIPE_SECRET_KEY` (sk_live_), `STRIPE_WEBHOOK_SECRET` (whsec_)
- `STRIPE_PRICE_DIY_DRIVER`, `STRIPE_PRICE_DFY_DRIVER`, `STRIPE_PRICE_HAZMAT_ADDON`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_)
- `RESEND_API_KEY`, `EMAIL_FROM_NO_REPLY`, `EMAIL_FROM_SUPPORT`
- `CHECKR_ENV` (staging then live), `CHECKR_API_BASE`
- `CHECKR_STAGING_API_KEY`, `CHECKR_STAGING_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CHECKR_PUBLISHABLE_KEY`
- `APP_ALLOWED_ORIGINS` = `https://x3compass.com,https://www.x3compass.com`
- `SUPER_ADMIN_EMAILS` = comma-separated, server-owned allowlist of verified administrator emails
- `UPLOAD_TOKEN_SECRET` = dedicated high-entropy secret used only for short-lived upload grants
- `NEXT_PUBLIC_CF_BEACON_TOKEN` (optional, Cloudflare Web Analytics)

### Preview branches
Preview deployments must never inherit production service-role, payment, email, screening, or upload-token credentials. Use a separate non-production Supabase project, Stripe test-mode credentials and prices, test webhook endpoints, a dedicated preview `UPLOAD_TOKEN_SECRET`, and exact preview origins in `APP_ALLOWED_ORIGINS`. If isolated preview credentials are unavailable, leave privileged bindings unset so tenant routes fail closed.

## 2 · Supabase

1. Create project (free tier)
2. SQL editor → run `supabase/migrations/20260516_compass_core.sql`
3. Auth → Providers → enable Email/Password + Magic Link (Email OTP)
4. Auth → URL Configuration:
   - Site URL: `https://x3compass.com`
   - Redirect URLs: `https://x3compass.com/auth/callback`, `https://x3compass-web.pages.dev/auth/callback`, `http://localhost:3000/auth/callback`
5. (Optional) Customize email templates with Compass branding

## 3 · Stripe

1. Live mode. Create products + prices:
   - DIY → recurring monthly $25 (`STRIPE_PRICE_DIY_DRIVER`)
   - DFY → recurring monthly $50 (`STRIPE_PRICE_DFY_DRIVER`)
   - Hazmat → recurring monthly $99 flat (`STRIPE_PRICE_HAZMAT_ADDON`)
2. Webhooks → add `https://x3compass.com/api/stripe/webhook`
3. Subscribe to: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed/payment_succeeded`
4. Customer Portal → enable; configure: update card, cancel, invoices, plan up/down-grade
5. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## 4 · Resend

1. Verify `x3compass.com` (SPF/DKIM/DMARC)
2. Verify `no-reply@x3compass.com`, `support@x3compass.com` senders
3. Generate API key → `RESEND_API_KEY`

## 5 · DNS

1. Cloudflare Pages → x3compass-web → Custom domains → add `x3compass.com` + `www.x3compass.com`
2. Wait for SSL provision (5–15 min)

## 6 · Cloudflare Web Analytics (free)

1. Analytics & Logs → Web Analytics → add a site → copy beacon token → `NEXT_PUBLIC_CF_BEACON_TOKEN`

## 7 · Smoke test post-deploy

1. `/` loads
2. `/pricing` loads
3. `/signup` → fill form → either confirms instantly or shows "check email"
4. Supabase Auth → Users shows your test user
5. Supabase Tables → `carriers` shows your test carrier
6. `/app/onboarding` → step through to "Continue to billing" → Stripe Checkout opens
7. Test card 4242 4242 4242 4242 → success
8. Stripe webhook fires → carriers.subscription_status flips to `active`
9. `/app/settings/billing` → "Manage subscription" → Stripe Portal opens

## 8 · Post-launch backlog

- Wire 14 non-Checkr app pages to real per-carrier data (currently placeholder)
- Move the server-owned super-admin email allowlist to immutable identity-provider claims or a dedicated authorization table after the first reviewed admin-role migration.
- `og-image.png`, `favicon.ico`, `apple-touch-icon.png` (currently placeholder)
- News-monitor scheduled task (Cowork agent)
- Skill-Builder scheduled tasks (Cowork agents)
- Cookie banner (Cloudflare Pages doesn't drop tracking cookies by default)
