# Clearinghouse Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable, tenant-isolated Clearinghouse query/consent/violation tracking and a real per-driver D&A rollup.

**Architecture:** Pure status computation stays independent of persistence; source-only SQL owns record integrity/RLS; one authenticated API owns reads and manual query recording; a focused D&A component consumes the API.

**Tech Stack:** JavaScript ESM, TypeScript, PostgreSQL/Supabase migration SQL, Cloudflare Pages Functions, React/Next.js, Node test runner, Playwright.

## Global Constraints

- Real-data-or-empty and decision support only.
- `requireTenant` derives carrier authority; all driver ownership is server-verified.
- No FMCSA call, migration execution, deployment, database write, secret, or live infrastructure action.
- Missing evidence remains explicit and never becomes a compliant/eligible determination.

---

### Task 1: Status engine and schema

**Files:** Create `src/lib/clearinghouseStatus.mjs`, `tests/clearinghouse-status.test.mjs`, `supabase/migrations/20260804_clearinghouse_tracking.sql`, and `tests/clearinghouse-schema.test.mjs`.

**Interfaces:** `buildClearinghouseStatus({ asOf, drivers, queries, consents, violations })` returns `{ drivers, summary, citations, guardrail }`; schema produces the three canonical `compass_clearinghouse_*` tables.

- [ ] Write failing tests for annual/full coverage, leap day, due boundaries, missing evidence, consent states, active violation evidence, schema enums, RLS, indexes, and carrier/driver guards.
- [ ] Run focused Node tests and confirm missing implementation failures.
- [ ] Implement the pure engine and source-only migration.
- [ ] Re-run focused tests and diff check; commit `feat(clearinghouse): add tracking engine and schema`.

### Task 2: Tenant-scoped status API

**Files:** Create `functions/api/clearinghouse/status.ts` and `tests/clearinghouse-api.spec.ts`; modify route classification and its test.

**Interfaces:** GET returns computed tenant status; POST accepts `{ driver_id, query_type, requested_at, query_run_at?, result, consent_received_at?, fmcsa_query_id? }` after ownership validation.

- [ ] Write failing auth, cross-tenant, bounded-read, truthful-empty, computed-rollup, validated-insert, and route-classification tests.
- [ ] Run focused Playwright and confirm handler/classification failures.
- [ ] Implement shared-guarded GET/POST with opaque errors and no external calls.
- [ ] Re-run focused Playwright, TypeScript, and diff check; commit `feat(clearinghouse): add tenant status API`.

### Task 3: Real D&A rollup and documentation

**Files:** Create `src/components/app/ClearinghouseStatusPanel.tsx`, `tests/clearinghouse-page.test.mjs`, and `docs/api/clearinghouse-status.md`; modify `src/app/app/drug-alcohol/page.tsx`.

**Interfaces:** Panel loads `/api/clearinghouse/status`, filters per-driver states, and records a manual query through POST; it renders in both real D&A empty and populated states.

- [ ] Write failing page and documentation contracts for authentication, real data, all statuses, manual recording, visible errors, citations, and activation handoff.
- [ ] Run focused Node tests and confirm missing panel/docs failures.
- [ ] Implement the panel, wire both real D&A branches, and document exact contracts and limits.
- [ ] Run full Node, focused Playwright security/API, TypeScript, build, and diff checks.
- [ ] Commit `feat(clearinghouse): surface per-driver query status`, push, open a draft PR based on `codex-b6-dataq-workflow`, and update issue #79.
