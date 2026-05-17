# Doctor Agent — Playbook

This is the doctor agent's curated knowledge base. The agent consults this file every time it's invoked. Add patterns + fixes here as they're learned.

## Format

Each pattern entry:

```
## <symptom>
**Codes:** <list of HTTP codes / error signatures>
**Probable cause:** <plain English>
**Auto-fix:** <what the doctor should try>
**Escalate if:** <when to give up + tag a human>
**Last seen:** <date>
**Notes:** <anything operator-specific>
```

---

## Pattern: Cloudflare deploy swap window
**Codes:** 522, 523, 524 on multiple probes simultaneously, lasting < 30s
**Probable cause:** Cloudflare Pages is swapping to a new deployment. Edge briefly can't reach the new origin.
**Auto-fix:** Wait 30s and re-probe. If now green, mark `auto-resolved`. If still red, retry workflow.
**Escalate if:** Persists > 2 minutes across 3 re-checks.
**Last seen:** 2026-05-17 (very common during heavy push days)
**Notes:** Most common false-positive. Build retry into all probes (3 attempts × 10s spacing).

## Pattern: Stripe webhook signing-secret mismatch
**Codes:** 401 on `/api/stripe/webhook` with "Invalid signature" in body, every event from Stripe
**Probable cause:** STRIPE_WEBHOOK_SECRET env var doesn't match the secret Stripe is signing with. Often happens after rotating webhook endpoints.
**Auto-fix:** Cannot auto-fix — secret is rotated only in Stripe dashboard.
**Escalate if:** Detected — always escalate (P1).
**Last seen:** never (so far)
**Notes:** Cloudflare Pages env vars need redeploy to take effect.

## Pattern: Supabase RLS infinite recursion
**Codes:** 500 from any compass_* table query, with body `infinite recursion detected in policy`
**Probable cause:** RLS policy references its own table in a subquery. Classic foot-gun.
**Auto-fix:** Cannot auto-fix (DDL change).
**Escalate if:** Detected — always escalate.
**Last seen:** 2026-05-16 (caught + fixed in compass_fix_rls_recursion migration)

## Pattern: Anthropic rate limit
**Codes:** 429 on `/api/ask` with `rate_limit_error` body
**Probable cause:** Customer is hammering Ask Compass, or our org-level rate limit is hit.
**Auto-fix:** In-code rate limiter (30 req/min/IP) should handle most cases.
**Escalate if:** Sustained > 5 minutes across multiple IPs.

## Pattern: Supabase Postgres connection exhaustion
**Codes:** 500 or 502 on app pages with `too many connections` in logs
**Probable cause:** Connection-pool saturation, often during heavy onboarding flows or import jobs.
**Auto-fix:** Cannot — needs pool/PgBouncer config change on Supabase side.
**Escalate if:** Detected — P1.

## Pattern: Cookie banner JS error
**Codes:** /api/errors entries with `localStorage is not defined` or similar SSR/CSR mismatch
**Probable cause:** Component using browser API in a way that runs during static prerender.
**Auto-fix:** None.
**Escalate if:** > 5 unique IPs report the same error in 1 hour.

---

## Maintenance

When a new symptom appears that isn't covered here, the doctor escalates to a human with `needs-human` label. The human (Joshua, eventually a Compass Safety Advisor) appends a new pattern to this file. Over weeks/months the playbook grows and the doctor handles more cases autonomously.

## What the doctor will NEVER do without a human

- Rotate any production secret
- Modify Stripe / Supabase / Cloudflare account-level settings
- Apply Supabase migrations
- Push code to main
- Create or delete billing records
- Send emails to customers
