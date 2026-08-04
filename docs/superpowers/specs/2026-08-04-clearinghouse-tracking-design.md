# Clearinghouse Tracking Design

## Scope and authority

Build the missing durable foundation for 49 CFR Part 382 Subpart G tracking and surface a real per-driver status rollup on the Drug & Alcohol page. Compass records query, consent, and violation evidence entered by the carrier or a future connected C/TPA. It does not contact the FMCSA Clearinghouse in this source-only task, determine that a driver is eligible for safety-sensitive work, or infer a compliant result from missing data.

## Chosen architecture

Create the three tables already named by the existing Clearinghouse page: `compass_clearinghouse_queries`, `compass_clearinghouse_consents`, and `compass_clearinghouse_violations`. This avoids inventing a parallel model and makes the existing page loadable once the migration is applied. Add strict enums, carrier/driver ownership guards, RLS, indexes, and audit timestamps.

A pure `clearinghouseStatus` engine accepts active/pending-hire driver rows plus recorded queries, consents, and violations. It produces per-driver annual-query status, pre-employment-full-query evidence, consent state, prohibited-status evidence, due date when grounded in a completed query, and explicit `missing_evidence` when no safe date can be derived. A full or limited completed query is annual coverage under §382.701(b); a pre-employment full query is separately tracked under §382.701(a).

One authenticated `/api/clearinghouse/status` Pages Function loads bounded tenant projections, calls the pure engine, and returns the rollup. POST records a completed/pending query only after verifying the driver belongs to the tenant and validating query type/result/date/consent evidence. It does not call FMCSA or manufacture an FMCSA query identifier.

## Status rules

Annual status uses the latest completed `annual_limited`, `pre_employment_full`, or `triggered_full` query. The next due date is one calendar year later with leap-day clamping. `overdue` means the grounded next date is before `as_of`; `due` means it falls within 30 inclusive days; `current` means later; `missing_evidence` means no completed query is recorded.

Pre-employment full-query status is `recorded` when a completed `pre_employment_full` query exists, otherwise `missing_evidence`. Compass does not decide whether a historical query was timely for a particular duty assignment. Consent is `received`, `pending`, `expired`, `revoked`, or `not_recorded` based only on stored evidence. An active violation flag is surfaced as `prohibited_status_recorded` with a human-review guardrail, never as an autonomous eligibility decision.

## UI

The real-tenant Drug & Alcohol page always renders a Clearinghouse status panel, including when no D&A tests exist. It shows total drivers, annual current/due/overdue/missing counts, prohibited-status evidence count, and a filterable per-driver table. A manual record form captures query type, run/request date, result, optional FMCSA query ID, and consent received date. Errors remain visible; no demo rows or fabricated dates appear in the real panel.

## Verification and handoff

Tests cover date math and leap-day clamping, full-query annual coverage, missing evidence, consent states, prohibited flags, schema constraints/RLS/ownership triggers, authentication/cross-tenant negatives, bounded reads, query creation, route classification, and real-page wiring. Final gates are full Node tests, focused Playwright security/API tests, TypeScript, 73-route production build, and diff check.

The migration is marked `NEEDS CLAUDE TO APPLY`. No migration, database write, FMCSA call, email, deployment, secret use, or live infrastructure mutation occurs here.
