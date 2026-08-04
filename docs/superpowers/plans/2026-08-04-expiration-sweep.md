# Document Expiration Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tenant-bounded carrier digest agent for CDL, MEC, annual MVR, and dated insurance expirations within 60 days.

**Architecture:** A pure TypeScript module calculates and renders deterministic expiration digests. The existing agent registry performs carrier-scoped reads and sends at most one email per carrier; a source-only migration registers the agent with no cron schedule.

**Tech Stack:** Cloudflare Pages Functions, TypeScript, Supabase REST, Resend adapter, Node test runner, Playwright source contracts.

## Global Constraints

- Branch and PR only; no merge, deploy, migration application, cron change, live email, live database write, vendor call, or secret output.
- Real-data-or-empty: only stored valid dates create alert items.
- Every operational read is carrier-scoped.
- `cron_expr` remains null for Claude to schedule.
- Existing `agent-driver-reminders` behavior remains unchanged.

---

### Task 1: Pure expiration planner

**Files:**
- Create: `functions/_shared/expiration-sweep.mjs`
- Test: `tests/expiration-sweep.test.mjs`

**Interfaces:**
- Consumes: `buildExpirationDigest({ asOf, carrier, drivers, mvrRecords, insuranceDocuments })`.
- Produces: `{ carrier, items, counts }`, `renderExpirationDigestHtml(digest)`, and `renderExpirationDigestText(digest)`.

- [ ] Write failing tests for overdue, inclusive 30/60-day boundaries, latest annual MVR +1 year, leap-day clamping, conservative insurance types, missing dates, inactive drivers, deterministic order, and HTML escaping.
- [ ] Run `node --test tests/expiration-sweep.test.mjs`; confirm the missing-module failure.
- [ ] Implement strict ISO parsing, UTC date math, normalized records, count aggregation, and escaped HTML/text rendering.
- [ ] Re-run the focused test and require all cases to pass.
- [ ] Commit the planner and tests as `feat(agents): add expiration digest planner`.

### Task 2: Carrier sweep orchestration

**Files:**
- Modify: `functions/_shared/agent-registry.ts`
- Test: `tests/expiration-agent.spec.ts`

**Interfaces:**
- Consumes: `runAgent("agent-expiration-sweep", env, { carrier_id?, dry_run?, as_of? })`.
- Produces: one carrier-scoped digest email per carrier with alert items; a dry-run result with exact grouped evidence and zero sends.

- [ ] Write failing handler tests with mocked Supabase/Resend adapters that assert all operational URLs include the swept carrier UUID and that multiple items produce exactly one email.
- [ ] Add a dry-run test proving the returned log lists categories, subjects, dates, and urgency without a Resend call.
- [ ] Run `npx playwright test tests/expiration-agent.spec.ts --project=chromium-desktop --workers=1`; confirm the unknown-agent failure.
- [ ] Implement active-carrier and single-carrier modes, bounded explicit selects, per-carrier error isolation, dry-run suppression, and the registry switch entry.
- [ ] Re-run the focused agent tests and pure planner tests.
- [ ] Commit orchestration as `feat(agents): add carrier expiration sweep`.

### Task 3: Source-only agent registration

**Files:**
- Create: `supabase/migrations/20260804_agent_expiration_sweep.sql`
- Test: `tests/expiration-agent-registration.test.mjs`

**Interfaces:**
- Consumes: existing `compass_agents` catalog.
- Produces: idempotent `agent-expiration-sweep` registration with `kind = scheduled`, `enabled = true`, and `cron_expr = null`.

- [ ] Write a failing source-contract test asserting the exact agent name, null cron, no scheduler mutation, and a Claude-apply marker.
- [ ] Run the test and confirm the migration-not-found failure.
- [ ] Add an idempotent insert/upsert that leaves `cron_expr` null and documents `NEEDS CLAUDE TO APPLY`.
- [ ] Re-run the registration contract and ensure no existing agent seed is edited.
- [ ] Commit as `chore(agents): register expiration sweep without schedule`.

### Task 4: Full verification and PR

**Files:**
- Update: GitHub issue `#79` after opening the PR.

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: one stacked Batch 6 Task 3 PR with verification evidence and deployment handoff.

- [ ] Run `node --test tests/*.test.mjs`.
- [ ] Run `npx playwright test tests/expiration-agent.spec.ts tests/api-route-classification.spec.ts tests/screenings-contract.spec.ts --project=chromium-desktop --workers=1`.
- [ ] Run `npx tsc --noEmit --incremental false`.
- [ ] Run `npm run build` and confirm all static routes succeed.
- [ ] Run `git diff --check` and confirm a clean tracked tree.
- [ ] Push `codex-b6-expiration-sweep`, open a PR against `codex-b6-compliance-calendar`, and state that Claude must apply the migration and choose the cron.
- [ ] Comment on issue `#79` with the PR, tests, and handoff boundaries.
