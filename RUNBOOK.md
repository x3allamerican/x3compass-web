# X3 Compass · Production Runbook

Last updated: 2026-05-16

## Reliability posture

- **Marketing site** (`/`, `/pricing`, `/faq`, `/hazmat`, `/partners`, `/skills`) — pure static HTML on Cloudflare Pages CDN. Multi-region. Can survive any single point of failure short of Cloudflare-global outage.
- **App pages** (`/app/*`) — static shell + client-side Supabase + Pages Functions. Depends on Supabase + Cloudflare being up.
- **Stripe Checkout** — depends on Stripe + our webhook endpoint. Stripe retries failed webhooks for 3 days.
- **Background Checks (Checkr Embeds)** — depends on Checkr + Cloudflare + our session-token endpoint.

## Critical dependencies

| Service | Used for | Failure impact | Mitigation |
|---|---|---|---|
| Cloudflare Pages | Static + Functions | Everything down | Pages Status page + multi-region; rollback via dashboard |
| Supabase (Auth + DB) | Sign-in, multi-tenant data | App pages don't load | 7-day automated backups; status.supabase.com |
| Stripe (Checkout + Webhook) | Billing | New customers can't pay; existing keep working | Stripe retries webhook 3 days; manual reconciliation possible |
| Resend | Email | Welcome / trial / payment-failed emails | Non-blocking via ctx.waitUntil; doesn't break signups |
| Checkr (Embeds + API) | Background checks | BG check page broken | Checkr's own status page |
| GitHub | Source control / auto-deploy | Can't push new code | Recover from existing deploy + local clone |

## Health check

```bash
curl https://x3compass-web.pages.dev/api/health
```

Returns operational status of Supabase + Stripe with response times. Use this for uptime monitoring.

## Rollback procedure

If a bad deploy ships:

1. **Cloudflare Pages dashboard** → x3compass-web → Deployments
2. Find the last known-good deploy (e.g. `019e4fd2`)
3. Click "Rollback to this deployment"
4. Confirm — propagates in ~30 seconds

Alternatively via GitHub:
```bash
git revert HEAD --no-edit
git push origin main
```
Cloudflare auto-builds the revert.

## Incident response

### "Customer can't sign in"
1. Hit `/api/health` — confirm Supabase is up
2. Supabase dashboard → Authentication → Users — confirm user exists + email_confirmed_at is set
3. If user can sign in via password but the app loads blank → check browser console + `compass_carrier_users` for their link
4. If carrier_users link missing → manually insert with role=owner (admin SQL)

### "Stripe webhook not firing"
1. Stripe dashboard → Developers → Webhooks → x3compass-web endpoint
2. Check "Recent deliveries" — failed events show response code + body
3. Common causes:
   - `STRIPE_WEBHOOK_SECRET` env var rotation drift → re-copy from Stripe dashboard, set in Cloudflare
   - Pages Function exception → check Cloudflare Worker logs
4. Stripe retries automatically for 3 days. Manual replay button in dashboard.

### "Checkout returns Stripe error"
1. Hit `/api/health` — confirm Stripe key is valid
2. Verify `STRIPE_PRICE_*` env vars match prices actually in your live account
3. Stripe dashboard → Logs → find the failed `/v1/checkout/sessions` POST

### "All app pages blank / loading forever"
1. Hit `/api/health` — Supabase up?
2. Check browser console for client error
3. If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` rotated → update Cloudflare env vars + retrigger deploy
4. Worst case: rollback last deploy

### "Carrier sees wrong data / cross-tenant leak"
**Critical security incident.** Immediately:
1. Lock `/app/*` access by adding a temporary banner / disabling sign-up
2. Pull SQL from Supabase, check RLS policies on the affected table
3. Verify `auth.uid()` returns the correct user inside the policy
4. Patch policy + redeploy
5. Audit access logs (Supabase → Logs)

## Backup + restore

- Supabase: automated daily backups, 7-day retention (free) / 14-30 day (paid). Point-in-time recovery on Pro tier.
- To trigger manual backup: Supabase dashboard → Database → Backups → "Create backup"
- To restore: Supabase dashboard → Database → Backups → pick timestamp → restore

## Things that ARE NOT YET in place (next-sprint items)

- Error monitoring (Sentry or Cloudflare Logpush) — currently you'd hear about bugs from customers
- Automated tests (Playwright/Vitest) — every push is shipped on trust
- Staging environment — preview branches exist but unused as test bed
- Rate limiting on public endpoints — `/api/partners/apply` could be spammed
- Multi-region database — Supabase free is single region (us-east-1)
- Cookie banner — no GDPR consent banner yet
- Web Vitals monitoring — Cloudflare Web Analytics token slot exists but not wired

---

## Reliability v2 (added 2026-05-17)

### Architecture
1. **Synthetic monitoring** (`.github/workflows/uptime.yml`) runs every 5 min.
   Hits 14 probes across P1 (signup/checkout/health), P2 (app pages), P3 (marketing).
   Each probe gets 3 attempts × 10s spacing to survive deploy windows.
2. **Workflow itself never fails** (`continue-on-error: true` on the monitor step).
   Only the issue-create job posts when a P1 actually fails.
   This means **no more GitHub default workflow-failure emails for transient blips**.
3. **Doctor agent** (`.github/workflows/doctor.yml`) fires automatically on every
   new `uptime-alert` issue. It:
   - Reads the failure pattern from the issue body
   - Consults `.doctor/playbook.md` for known fixes
   - Checks upstream status pages (Cloudflare, Supabase, Stripe)
   - Does a live recheck — if recovered, auto-closes the issue
   - If still down: tries any auto-fix recipes from the playbook
   - Last resort: tags `needs-human` + summarizes its work
4. **Severity routing:**
   - P1 (customer-blocking) → opens GitHub issue, doctor fires, you get one email per incident
   - P2 (app degradation) → logs only, no issue
   - P3 (nice-to-have) → silent

### Alert noise budget
- 0 emails for transient deploy swaps (handled by retries)
- 0 emails for P2/P3 failures (logged only)
- 1 email per P1 incident, with doctor diagnosis attached
- 0 emails when doctor auto-resolves

### Growing the doctor
Edit `.doctor/playbook.md`. Each pattern entry teaches the doctor a new fix.
Over time the doctor handles more cases without escalation.
