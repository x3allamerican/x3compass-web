# Doctor Agent — Playbook

This is the doctor agent's curated knowledge base. The agent consults this file every time it's invoked. Add patterns + fixes here as they're learned.

> **Read this first:** `AGENT_SAFETY.md` is the rulebook. This file is just patterns. The doctor obeys the rulebook even if a pattern below says otherwise.

---

## Budget enforcement (mirror of AGENT_SAFETY.md §1)

Per hour the doctor may:
- read anything (unlimited)
- take up to **10 `auto` actions** (redeploy, close issue, comment, label)
- take **0 `human` actions** (rotate secrets, migrate, etc.)

If the doctor's plan would exceed budget, it tags `needs-human` and stops.

## Safe-action whitelist (mirror of AGENT_SAFETY.md §2)

The doctor may only:
- close `uptime-alert` issues with `auto-resolved` label when probes recover
- comment with diagnosis
- add labels from the allowed set
- trigger a Cloudflare Pages redeploy via `workflow_dispatch` to the deploy workflow (max 1 per 30 min per project)
- read status pages + repo files

Anything else → `needs-human`.

---

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
**Auto-fix:** Wait 30s and re-probe. If now green, mark `auto-resolved`. If still red, retry workflow (counts as 1 `auto` action).
**Escalate if:** Persists > 2 minutes across 3 re-checks.
**Last seen:** 2026-05-17 (very common during heavy push days)
**Notes:** Most common false-positive. Build retry into all probes (3 attempts × 10s spacing).

## Pattern: Cloudflare bot-management 403 during deploy
**Codes:** 403 on ALL probes simultaneously, lasting < 60s, then auto-resolves
**Probable cause:** During a Cloudflare Pages deploy swap, Cloudflare's bot management
sometimes blocks GitHub Actions runners (known bot fingerprint) with 403. Differs from
the 522 swap pattern — same root cause (deploy in flight), different rejection layer.
**Auto-fix:** Same as the 522 pattern — wait 60s and re-probe. If now green, comment
on issue with diagnosis + add `auto-resolved` label + close. (Counts as 1 `auto` action.)
**Escalate if:** Persists > 3 minutes, OR if 403s come from real customer IPs (check
/api/errors and Cloudflare WAF event log).
**Last seen:** 2026-05-17 (Issue #2 — caught while monitoring, doctor cascade was
broken at the time; resolved manually). After this, the doctor should auto-handle.
**Notes:** Long-term fix is to whitelist the GitHub Actions IP range in Cloudflare
bot management. Cheaper interim: just retry; symptom is transient by definition.

## Pattern: Stripe webhook signing-secret mismatch
**Codes:** 401 on `/api/stripe/webhook` with "Invalid signature" in body, every event from Stripe
**Probable cause:** STRIPE_WEBHOOK_SECRET env var doesn't match the secret Stripe is signing with. Often happens after rotating webhook endpoints.
**Auto-fix:** Cannot auto-fix — secret rotation is a §3 forbidden action.
**Escalate if:** Detected — always escalate (P1).
**Last seen:** never (so far)
**Notes:** Cloudflare Pages env vars need redeploy to take effect.

## Pattern: Supabase RLS infinite recursion
**Codes:** 500 from any compass_* table query, with body `infinite recursion detected in policy`
**Probable cause:** RLS policy references its own table in a subquery. Classic foot-gun.
**Auto-fix:** Cannot auto-fix — DDL is a §3 forbidden action.
**Escalate if:** Detected — always escalate.
**Last seen:** 2026-05-16 (caught + fixed in compass_fix_rls_recursion migration)

## Pattern: Anthropic rate limit
**Codes:** 429 on `/api/ask` with `rate_limit_error` body
**Probable cause:** Customer is hammering Ask Compass, or our org-level rate limit is hit.
**Auto-fix:** In-code rate limiter (30 req/min/IP) should handle most cases. If sustained, comment on issue noting the spike — do NOT redeploy.
**Escalate if:** Sustained > 5 minutes across multiple IPs.

## Pattern: Supabase Postgres connection exhaustion
**Codes:** 500 or 502 on app pages with `too many connections` in logs
**Probable cause:** Connection-pool saturation, often during heavy onboarding flows or import jobs.
**Auto-fix:** Cannot — pool/PgBouncer config is human-only.
**Escalate if:** Detected — P1.

## Pattern: Cookie banner JS error
**Codes:** /api/errors entries with `localStorage is not defined` or similar SSR/CSR mismatch
**Probable cause:** Component using browser API in a way that runs during static prerender.
**Auto-fix:** None.
**Escalate if:** > 5 unique IPs report the same error in 1 hour.

---

## Pattern: Upstream provider incident (NEW)
**Codes:** Any/all probes failing AND the upstream status page (cloudflarestatus.com, status.supabase.com, status.stripe.com, status.anthropic.com) reports `degraded` or `major outage`
**Probable cause:** Not us.
**Auto-fix:** Comment on issue with the upstream incident link + ETA. Add label `upstream-incident` (allowed). Re-probe every 10 min for up to 1 hour. If green before 1 hour, close with `auto-resolved`.
**Escalate if:** Upstream incident lasts > 1 hour or escalates to `major`.
**Last seen:** never (so far)
**Notes:** Critical — prevents doctor from blaming us for a Cloudflare-side outage.

## Pattern: Suspected agent loop (NEW)
**Codes:** Doctor has been triggered > 5 times in the last hour on the same probe
**Probable cause:** The doctor's auto-fix isn't actually fixing anything (or made it worse).
**Auto-fix:** STOP. Tag `needs-human` + `loop-suspected`. Comment with the action history.
**Escalate if:** Always — this is by definition an escalation.

---

## Maintenance

When a new symptom appears that isn't covered here:
1. Doctor escalates with `needs-human`
2. Human resolves it
3. Human appends a new pattern to this file in the same PR that fixed it
4. If a new safe-action was needed, human updates AGENT_SAFETY.md §2 — never the doctor

Over weeks/months the playbook grows. Patterns over 6 months old without recurrence are pruned quarterly.

## What the doctor will NEVER do without a human (mirror of AGENT_SAFETY.md §3)

- Rotate any production secret
- Modify Stripe / Supabase / Cloudflare account-level settings
- Apply Supabase migrations
- Push code to main
- Create or delete billing records
- Send emails to customers
- Modify this file or AGENT_SAFETY.md
