# FMCSA Accident Register Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current accident log into a tenant-isolated, evidence-complete 49 CFR 390.15(b)(1) register with three-year retention tracking.

**Architecture:** A pure JavaScript normalizer owns required-field and retention logic. An authenticated Pages Function loads explicit carrier-scoped evidence, while the existing native page adds a register view and evidence-capture fields.

**Tech Stack:** Next.js 16, React 19, Cloudflare Pages Functions, TypeScript/JavaScript ESM, Supabase REST, Node tests, Playwright.

## Global Constraints

- Branch and PR only; no merge, deployment, migration application, live database write, vendor call, or secret output.
- Real-data-or-empty; null remains unknown and never becomes false.
- No autonomous recordability, testing, or preventability determination.
- Every API read is carrier-scoped through `requireTenant`.

---

### Task 1: Pure register normalizer

**Files:**
- Create: `src/lib/accidentRegister.mjs`
- Test: `tests/accident-register.test.mjs`

- [ ] Write failing tests for required fields, zero outcomes, null hazmat evidence, UTC three-year retention, leap-day clamping, invalid dates, and deterministic newest-first ordering.
- [ ] Run the focused Node test and confirm the missing module failure.
- [ ] Implement `buildAccidentRegister({ asOf, accidents, drivers })` returning `{ records, counts }`.
- [ ] Re-run the focused test and commit the green tranche.

### Task 2: Tenant evidence endpoint

**Files:**
- Create: `functions/api/accident-register.ts`
- Modify: `functions/_shared/api-route-classification.ts`
- Modify: `tests/api-route-classification.spec.ts`
- Test: `tests/accident-register-api.spec.ts`

- [ ] Write failing tests for 401 behavior, carrier-scoped explicit selects, and normalized output.
- [ ] Implement `GET /api/accident-register` with `requireTenant`, bounded reads, opaque failure, and `tenantJson`.
- [ ] Classify the route and add it to the shared-guard regression list.
- [ ] Re-run endpoint and classification tests and commit.

### Task 3: Evidence columns and native register view

**Files:**
- Create: `supabase/migrations/20260804_accident_register_fields.sql`
- Modify: `src/app/app/accidents/page.tsx`
- Test: `tests/accident-register-page.test.mjs`

- [ ] Write failing contracts for the nullable migration fields, authenticated endpoint use, retention filters, missing-evidence display, and absence of demo fallback.
- [ ] Add the idempotent source-only migration with a `NEEDS CLAUDE TO APPLY` marker.
- [ ] Add city/state/hazmat evidence capture and the register summary/filter/table surface without removing the existing operations log.
- [ ] Re-run page contracts and TypeScript; commit.

### Task 4: Verification and PR

- [ ] Run all `tests/*.test.mjs`.
- [ ] Run accident API, route classification, and inherited security contracts with one Chromium worker.
- [ ] Run `npx tsc --noEmit --incremental false`, `npm run build`, and `git diff --check`.
- [ ] Push `codex-b6-accident-register`, open a PR against `codex-b6-expiration-sweep`, and update issue #79 with the migration handoff.
