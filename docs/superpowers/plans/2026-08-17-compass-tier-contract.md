# Compass Tier Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Compass onboarding and Stripe webhook `compass` tier with the database constraint in the isolated Preview schema.

**Architecture:** Add an append-only Supabase migration that replaces the existing `service_tier` check constraint with the same allowed values plus `compass`. Add a source contract test that proves both onboarding and webhook use the allowed Compass vocabulary. Apply the migration only to the G5 Preview database and rerun the synthetic onboarding and signed-webhook proof.

**Tech Stack:** Supabase PostgreSQL migrations, TypeScript Pages Functions, Node test runner.

**Spec:** Focused G5 Preview repair approved by Joshua on 2026-08-17.

## Global Constraints

- Preview-only database change; do not apply to production.
- No live Stripe, customer email, secret rotation, or production deployment.
- Keep the migration append-only and reversible by a follow-up migration.
- Never print secret values.

### Task 1: Add the tier constraint migration and regression contract

**Files:**
- Create: `supabase/migrations/20260817_compass_service_tier.sql`
- Create: `tests/compass-tier-contract.test.mjs`

**Interfaces:**
- The migration preserves `diy`, `dfy`, `enterprise`, and `trial`, and adds `compass`.
- The test reads the migration, `functions/api/auth/post-signup.ts`, and `functions/api/stripe/webhook.ts` and fails if `compass` is absent from the allowed set or either handler stops using it.

- [ ] **Step 1: Write the failing contract test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Compass onboarding and webhook share the compass tier", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260817_compass_service_tier.sql", import.meta.url), "utf8");
  const signup = await readFile(new URL("../functions/api/auth/post-signup.ts", import.meta.url), "utf8");
  const webhook = await readFile(new URL("../functions/api/stripe/webhook.ts", import.meta.url), "utf8");
  assert.match(migration, /service_tier.*compass/i);
  assert.match(signup, /service_tier:\s*["']compass["']/);
  assert.match(webhook, /updates\.service_tier\s*=\s*["']compass["']/);
});
```

- [ ] **Step 2: Run the test and confirm it fails because the migration is absent**

Run: `node --test tests/compass-tier-contract.test.mjs`

Expected: FAIL with an `ENOENT` error for `20260817_compass_service_tier.sql`.

- [ ] **Step 3: Add the append-only migration**

```sql
-- Keep onboarding/webhook Compass provisioning aligned with the application contract.
ALTER TABLE public.compass_carriers
  DROP CONSTRAINT IF EXISTS carriers_service_tier_check;

ALTER TABLE public.compass_carriers
  ADD CONSTRAINT carriers_service_tier_check
  CHECK (service_tier IN ('diy', 'dfy', 'enterprise', 'trial', 'compass'));
```

- [ ] **Step 4: Run the focused contract and syntax checks**

Run: `node --test tests/compass-tier-contract.test.mjs`

Expected: PASS.

Run: `node --check tests/compass-tier-contract.test.mjs`

Expected: exit 0.

- [ ] **Step 5: Commit the source change**

```bash
git add supabase/migrations/20260817_compass_service_tier.sql tests/compass-tier-contract.test.mjs docs/superpowers/plans/2026-08-17-compass-tier-contract.md
git commit -m "fix(compass): align preview tier constraint with onboarding"
```

### Task 2: Apply and verify the isolated Preview migration

**Files:**
- Use: `supabase/migrations/20260817_compass_service_tier.sql`
- Update: `/Volumes/Founders_Vault/Documents-Claude/Projects/X3 All-American/X3 Fleet Safety/PROGRESS.md`
- Update: `/Volumes/Founders_Vault/Documents-Claude/Projects/X3 All-American/X3 Fleet Safety/BLOCKERS.md`

**Interfaces:**
- Apply the SQL only to Supabase project `xjzncllzgsmtdgpeuwnd`.
- Re-run signup with a synthetic `@x3fleetsafety.com` address, create checkout in Stripe Test mode, send a signed webhook, verify `/api/dashboard`, then remove all disposable rows and deactivate test catalog objects.

- [ ] **Step 1: Apply the migration through the isolated Supabase SQL path**

Run the SQL in the Preview project only and record the execution result without printing credentials.

- [ ] **Step 2: Verify onboarding accepts `service_tier: compass`**

Create one synthetic Preview user and call `/api/auth/post-signup` with a numeric synthetic USDOT. Expect HTTP 200 and a carrier id.

- [ ] **Step 3: Verify the signed webhook and entitlement**

Create a Stripe Test checkout session, sign a `checkout.session.completed` event with the Preview webhook secret, post it to `/api/stripe/webhook`, and confirm `/api/dashboard` reports the carrier active.

- [ ] **Step 4: Tear down Preview-only artifacts**

Expire the test Checkout Session, deactivate the test Price/Product, delete the synthetic membership/carrier/event/user, and confirm no production endpoint was called.

- [ ] **Step 5: Record evidence**

Append the migration, onboarding, webhook, dashboard, and cleanup statuses to both ledgers without secrets.
