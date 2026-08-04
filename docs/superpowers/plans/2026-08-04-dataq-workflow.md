# DataQ Challenge Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a tenant-isolated DataQ RDR tracker with inspection/crash links, evidence uploads, agency-status history, and an honest app workflow.

**Architecture:** A pure module owns validation and allowed transitions; source-only SQL owns durable constraints/RLS; one authenticated Pages Function owns list/create/update persistence; a focused React panel integrates with the inspection register and existing signed-upload flow.

**Tech Stack:** TypeScript, JavaScript ESM, Cloudflare Pages Functions, Supabase REST/RLS migration SQL, React/Next.js, Node test runner, Playwright.

## Global Constraints

- Source only: no migration execution, deployment, database write, R2 write, DataQs submission, or live infrastructure call.
- Tenant authority comes only from `requireTenant`; no caller-selected effective carrier.
- Real-data-or-empty; no sample challenges, evidence, or agency outcomes.
- Decision support only; no contestability or approval determination.
- New API routes require explicit classification and shared-guard coverage.

---

### Task 1: Domain state machine and durable schema

**Files:**
- Create: `src/lib/dataqWorkflow.mjs`
- Create: `tests/dataq-workflow.test.mjs`
- Create: `supabase/migrations/20260804_dataq_challenges.sql`
- Create: `tests/dataq-schema.test.mjs`

**Interfaces:**
- Produces `validateChallengeCreate(input)`, `validateStatusTransition(current, next, notes)`, and `normalizeEvidence(input)`.
- Produces `compass_dataq_challenges` and `compass_dataq_evidence` with carrier ownership, target/status checks, indexes, RLS, and cross-table carrier enforcement.

- [ ] Write failing tests for accepted/rejected narratives, complete evidence metadata, every allowed transition, skipped/terminal transition rejection, migration checks, tenant indexes, RLS, and the `NEEDS CLAUDE TO APPLY` marker.
- [ ] Run `node --test tests/dataq-workflow.test.mjs tests/dataq-schema.test.mjs` and confirm failures are caused by missing module/migration.
- [ ] Implement the minimal pure validators and migration satisfying those contracts.
- [ ] Re-run the focused tests and `git diff --check`; require zero failures.
- [ ] Commit with `feat(dataq): add challenge domain and schema`.

### Task 2: Tenant-scoped challenge API

**Files:**
- Create: `functions/api/dataq/challenges.ts`
- Modify: `functions/_shared/api-route-classification.ts`
- Modify: `tests/api-route-classification.spec.ts`
- Create: `tests/dataq-api.spec.ts`

**Interfaces:**
- `GET /api/dataq/challenges` returns bounded tenant-owned challenge/evidence projections.
- `POST /api/dataq/challenges` accepts `{ target_type, target_id, issue_summary, requested_correction, submitted_on, tracking_number?, evidence? }`.
- `PATCH /api/dataq/challenges` accepts `{ id, status, tracking_number?, agency_response_on?, agency_response_notes?, version }` and uses optimistic version matching.

- [ ] Write failing tests for authentication, route classification, cross-tenant target rejection, creation/evidence inserts, bounded list filtering, allowed update, illegal transition, terminal notes, and stale-version conflict.
- [ ] Run the focused Playwright tests and confirm the new handler/classification failures.
- [ ] Implement the handler with `requireTenant`, UUID validation, ownership reads before writes, pure domain validation, bounded projections, and opaque errors.
- [ ] Re-run focused Playwright, TypeScript, and diff checks; require zero failures.
- [ ] Commit with `feat(dataq): add tenant-scoped challenge API`.

### Task 3: Evidence upload helper and inspection-linked UI

**Files:**
- Create: `src/lib/dataqUpload.ts`
- Create: `src/components/app/DataqChallengePanel.tsx`
- Modify: `src/app/app/inspections/page.tsx`
- Create: `tests/dataq-page.test.mjs`
- Create: `tests/dataq-upload.test.mjs`

**Interfaces:**
- `uploadDataqEvidence(file, token)` signs folder `dataq`, uploads through the returned authenticated relay URL, and returns `{ objectKey, fileName, contentType, sizeBytes }` without public URLs.
- `DataqChallengePanel` receives `{ inspections, accidents?, onChanged? }`, loads real challenges with the session token, and creates/updates cases through the API.

- [ ] Write failing source/behavior contracts for bearer-authenticated list/create/update, explicit source selection, real-data-only empty state, visible errors, upload sign/PUT flow, evidence metadata, and inspection-row DataQ action.
- [ ] Run the focused Node tests and confirm failures reflect missing helper/panel.
- [ ] Implement the upload helper and panel, integrate real inspection selection, and render the decision-support guardrail.
- [ ] Re-run focused Node tests, TypeScript, and diff checks; require zero failures.
- [ ] Commit with `feat(dataq): add inspection-linked challenge workspace`.

### Task 4: API documentation and release verification

**Files:**
- Create: `docs/api/dataq-challenges.md`
- Modify: `tests/dataq-page.test.mjs`

**Interfaces:**
- Documents auth, request/response projections, state transitions, evidence upload dependency, error codes, audit limitations, migration handoff, and non-submission boundary.

- [ ] Add a failing documentation contract for all three methods, route path, statuses, error codes, and `NEEDS CLAUDE TO APPLY` handoff.
- [ ] Write the source-matched API document and make the contract green.
- [ ] Run `node --test tests/*.test.mjs`, focused Playwright API/security suites, `npx tsc --noEmit --incremental false`, `npm run build`, and `git diff --check` separately; require all exits zero.
- [ ] Commit with `docs(dataq): document challenge workflow API`.
- [ ] Push `codex-b6-dataq-workflow`, open a draft PR based on `codex-b6-audit-pdfs`, and update issue #79 with validation and the migration/deploy handoff.
