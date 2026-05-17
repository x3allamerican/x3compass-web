# Access Control Policy

**Owner:** Joshua Kovarik (CEO / sole officer)
**Effective:** 2026-05-17
**Review cadence:** Quarterly. Next review: 2026-08-17.
**Maps to SOC 2 TSC:** CC6.1, CC6.2, CC6.3, CC6.6, CC6.7

## 1 · Purpose

Define how X3 Compass grants, reviews, and revokes access to systems that hold customer data or run customer-facing services. The policy applies to both human operators (currently Joshua only) and machine identities (service accounts, API keys, CI tokens).

## 2 · Scope

Systems in scope:

- **Supabase** — Postgres database, Auth, Storage (customer data of record)
- **Cloudflare** — Pages, Workers, R2, DNS, Email Routing, Access (production hosting + edge)
- **Stripe** — billing, subscriptions, customer records
- **Checkr** — background-check vendor (FCRA-covered)
- **Anthropic API** — inference for the AI brain
- **GitHub** — source control for the marketing site, app code, skills repos, infrastructure
- **Resend** — transactional email
- **Twilio** — transactional SMS (with STOP handling)
- **All domain registrars + Cloudflare account** holding x3compass.com and related zones

## 3 · Principles

1. **Least privilege.** Every principal — human or machine — gets the smallest scope that lets the job get done.
2. **No shared accounts.** Each human operator gets their own identity. No "ops@x3compass.com" shared login.
3. **No long-lived service-role keys in the browser.** The Supabase `service_role` JWT, the Stripe restricted key, and the Anthropic API key never leave server-side environments (Cloudflare Pages Functions, GitHub Actions secrets).
4. **Tenant isolation is enforced at the database layer.** Row-Level Security policies on every `compass_*` table prevent cross-tenant reads even if a Pages Function forgets to filter.
5. **All access is auditable.** Every system in scope has logs we can pull on demand. If a system doesn't, it doesn't get production data.

## 4 · Human access

### 4.1 Identity

- Today: Joshua Kovarik is the sole identity on every system listed in §2.
- When the first hire joins (safety advisor or engineer), they get a named identity on each system they need — never a shared credential.

### 4.2 Authentication

- **MFA / 2FA is required** on every admin account: Cloudflare, Supabase, Stripe, GitHub, Resend, Checkr, Anthropic Console, domain registrar.
- Password manager (1Password) is used for all admin credentials. No password reuse across systems.
- SSO will be added when the team grows past 3 people.

### 4.3 Authorization (role mapping)

| Role | Today | After first hire |
|------|-------|------------------|
| CEO / sole officer | Joshua — admin on everything | Joshua — admin on everything |
| Engineer | n/a | GitHub write, Cloudflare Pages preview deploys, Supabase read-only (prod), Supabase admin (staging) |
| Safety advisor | n/a | App login at `safety-advisor` role; no infra access |
| External contractor | n/a | Time-boxed access, removed at end of engagement |

### 4.4 Quarterly access review

Every quarter, on the same day this policy is reviewed:

1. Walk every system in §2.
2. List every active human identity and their permissions.
3. Confirm each one still needs the scope they have.
4. Remove anyone who no longer needs access.
5. Document the review in `compliance/soc2/access-reviews/YYYY-Qn.md`.

## 5 · Machine identity

### 5.1 Keys and tokens in production

| Key | Storage | Rotation | Notes |
|-----|---------|----------|-------|
| Supabase `service_role` JWT | Cloudflare Pages env vars (Production only) | Annual + on suspected leak | Never in client bundle, never logged |
| Supabase `anon` key | Public (designed to be) | n/a | RLS does the protection |
| Stripe live secret key | Cloudflare Pages env vars | Annual + on suspected leak | Restricted key — no `customers.delete` |
| Stripe webhook signing secret | Cloudflare Pages env vars | On regeneration | Verified on every webhook |
| Anthropic API key | Cloudflare Pages env vars + GitHub Actions secrets | Annual + on suspected leak | Tied to a single project |
| Checkr API key | Cloudflare Pages env vars | Annual + on suspected leak | Staging + Live separated |
| Resend API key | Cloudflare Pages env vars | Annual | Domain-scoped |
| Twilio API key | Cloudflare Pages env vars | Annual | Restricted to send + STOP handling |
| GitHub fine-grained PAT | macOS Keychain (Joshua) | Annual | Scoped to specific orgs and repos |
| Cloudflare API token | macOS Keychain (Joshua) | Annual | Scoped to specific account + permissions |

### 5.2 Secrets in source

No secret is ever committed to git. The repo's `.gitignore` excludes `.env*`, `.secrets/`, and `secrets.env`. Pre-commit checks (planned: gitleaks in CI) will block future regressions.

### 5.3 Rotation triggers

A key is rotated immediately if:

- It's been exposed in a screenshot, gist, or public log
- An admin laptop is lost or stolen
- An employee or contractor with knowledge of the key departs
- A vendor reports a breach affecting the system that issued the key

## 6 · Tenant isolation (RLS)

Every `compass_*` table that holds customer data has a Row-Level Security policy of the form:

```sql
carrier_id IN (
  SELECT carrier_id FROM compass_carrier_users WHERE user_id = auth.uid()
)
```

This is enforced **at the database layer**. A bug in a Pages Function that forgets to filter by carrier still returns zero rows, because Postgres refuses the read.

New tables ship with an RLS policy at creation time. There is no `compass_*` table without RLS in production.

## 7 · Termination

When a human operator leaves the company (today: hypothetical; tomorrow: real):

1. Disable their account on each system in §2 within 24 hours.
2. Rotate any shared keys that operator had access to (in practice, all production keys — we have only one operator).
3. Remove their SSH keys from any servers they had access to.
4. Pull any hardware (laptops, YubiKeys) tied to their identity.
5. Document the offboarding in `compliance/soc2/offboarding/{name}-{YYYY-MM-DD}.md`.

## 8 · Customer access (carriers and their drivers)

Carriers and drivers authenticate through Supabase Auth (email + password, optional magic link). Their access to data is scoped to their `carrier_id` via RLS. A carrier admin can invite users into their own carrier scope but cannot see any other carrier's data.

Drivers cannot self-register; they are invited by their carrier admin. The invite token is single-use and expires after 7 days.

## 9 · Exceptions

Any exception to this policy must be documented in `compliance/soc2/exceptions/` with: requestor, justification, compensating control, expiration date, and approval signature (today: Joshua's GitHub commit; later: officer + security lead).

## 10 · Change history

| Date       | Author  | Change |
|------------|---------|--------|
| 2026-05-17 | Joshua  | Initial version (Sprint #9, SOC 2 prep) |
