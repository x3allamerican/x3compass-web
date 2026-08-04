# Compliance Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tenant-isolated, evidence-backed FMCSA compliance calendar from current Compass records.

**Architecture:** A pure JavaScript date engine turns a normalized evidence bundle into calendar items. A Pages Function authenticates and loads carrier data; one native app page renders the results and honest missing-evidence states.

**Tech Stack:** Next.js 16, React, Cloudflare Pages Functions, TypeScript, JavaScript ESM, Supabase REST, Node test runner, Playwright.

## Global Constraints

- Branch and PR only; no merge, deployment, migration application, database write, vendor call, or secret output.
- Every API read derives carrier identity through `requireTenant`.
- Missing dates and applicability facts remain explicit; never fabricate a deadline or determination.
- All dates use ISO `YYYY-MM-DD` and UTC calendar arithmetic.

---

### Task 1: Pure calendar engine

**Files:**
- Create: `src/lib/complianceCalendar.mjs`
- Test: `tests/compliance-calendar.test.mjs`

**Interfaces:**
- Consumes: `buildComplianceCalendar({ asOf, carrier, drivers, mvrRecords, daTests, vehicles, iftaReturns, safer })`.
- Produces: `{ items, counts }`, where every item has `id`, `rule`, `title`, `subject`, `citation`, `dueDate`, `status`, `evidence`, and `guardrail`.

- [ ] Write failing fixtures for annual MVR +1 year, MEC direct expiry, D&A evidence review, four IFTA deadlines, UCR December 31, USDOT-digit MCS-150 schedule, and vehicle inspection dates.
- [ ] Run `node --test tests/compliance-calendar.test.mjs`; confirm module-not-found failure.
- [ ] Implement strict ISO parsing, UTC add-year/end-of-month helpers, inclusive 30-day status classification, and the seven rule builders.
- [ ] Run the focused test and confirm every rule and missing-evidence fixture passes.

### Task 2: Carrier-scoped evidence endpoint

**Files:**
- Create: `functions/api/compliance-calendar.ts`
- Modify: `functions/_shared/api-route-classification.ts`
- Modify: `tests/api-route-classification.spec.ts`
- Test: `tests/compliance-calendar-api.spec.ts`

**Interfaces:**
- Consumes: bearer JWT and `SecurityEnv`.
- Produces: `{ ok: true, evidence: { carrier, drivers, mvrRecords, daTests, vehicles, iftaReturns, safer } }`.

- [ ] Write handler tests that expect 401 without a JWT and assert every operational query contains the authenticated membership carrier UUID.
- [ ] Run the focused Playwright tests and confirm the missing-handler failure.
- [ ] Implement `GET /api/compliance-calendar` with `requireTenant`, bounded explicit select lists, parallel reads, and `tenantJson`.
- [ ] Add the route to `AUTHENTICATED` and the shared-guard regression list.
- [ ] Re-run handler and classification tests; require all pass.

### Task 3: Native calendar page

**Files:**
- Create: `src/app/app/calendar/page.tsx`
- Modify: `src/components/AppShell.tsx`

**Interfaces:**
- Consumes: the evidence endpoint and `buildComplianceCalendar`.
- Produces: native `/app/calendar` summary counts, status filters, chronological list, and setup/error states.

- [ ] Add a source contract test asserting authenticated fetch, engine use, filters, citations, and no demo fallback.
- [ ] Run the test and confirm it fails before the page exists.
- [ ] Implement bearer-token loading, summary tiles, status chips, chronological item cards, citations, evidence text, and decision-support copy.
- [ ] Add “Compliance Calendar” to the Compliance Trackers navigation group.
- [ ] Re-run the page contract and TypeScript checks.

### Task 4: Full verification and delivery

**Files:**
- Modify: tracking issue #79 through GitHub after the PR opens.

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: one reviewable Batch 6 Task 2 PR based on the appropriate non-duplicating dependency branch.

- [ ] Run `node --test tests/*.test.mjs`.
- [ ] Run the focused Playwright API/classification tests with Chromium desktop and one worker.
- [ ] Run `npx tsc --noEmit --incremental false`.
- [ ] Run `npm run build` and confirm 73 routes including `/app/calendar`.
- [ ] Run `git diff --check`.
- [ ] Commit logical source changes, push the task branch, open the PR, and update issue #79 with tests and owner boundaries.
