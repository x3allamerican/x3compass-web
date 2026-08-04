# X3 Compass Fleet Pre-Launch Checklist

Status as of 2026-08-03. This is the go/no-go record for exposing X3 Compass to
paying carrier tenants. A checked box requires linked, reproducible evidence; a
merged pull request alone does not prove a production control is active.

## Decision rule

Launch is **NO-GO** while any P0 item is open. P1 items may be waived only by a
written founder decision that states the customer impact, mitigation, owner, and
expiration date. Security, tenant isolation, billing integrity, and destructive
data behavior cannot be waived.

Current decision: **NO-GO**. Tenant isolation is merged, but the secret gate,
coherent tenant-data verification, billing-path walkthrough, and healthy
production release evidence have not completed the full
merge → approved deploy → production verification chain. The production health
endpoint returned `503 degraded` during the 2026-08-03 merge-train smoke test;
that condition must be diagnosed and cleared before launch approval.

## Evidence states

- **SOURCE** — implemented and verified on a branch or pull request.
- **MERGED** — reviewed and present on `main`.
- **DEPLOYED** — released through the approved production process.
- **VERIFIED** — post-deploy probe or operator walkthrough confirms behavior.

An item is complete only when it reaches the state named in its acceptance line.

## P0 — security and tenant boundaries

- [ ] Tenant isolation is MERGED, DEPLOYED, and VERIFIED for every carrier-owned
  table and API route. Evidence: Fleet PR #50 was merged as `d4a69a95` on
  2026-08-03 with negative cross-tenant source tests. Deployment and production
  boundary verification still require recorded evidence before this box closes.
- [ ] Authentication rejects missing, expired, malformed, wrong-audience, and
  wrong-tenant credentials with opaque client errors.
- [ ] Service-role access is server-only. Browser bundles, HTML, logs, and API
  responses contain no service-role or provider secret.
- [ ] The full-history secret gate is MERGED and active on pull requests and
  protected branches. Evidence: Fleet PR #51 is currently an open draft.
- [ ] Secret findings are dispositioned by location and credential type without
  placing any secret value in an issue, log, artifact, or pull request.
- [ ] Stripe webhooks verify the signature against the raw request body before
  parsing or provisioning a plan. Source evidence: Fleet PR #55 merged as
  `61456f51` with signature-contract tests passing.
- [ ] Replayed or duplicate Stripe events are idempotent and cannot provision or
  charge twice. Source evidence: Fleet PR #55 covers the retry-safe event ledger;
  production verification remains outstanding.
- [ ] Client-visible billing failures are opaque; provider response bodies,
  signatures, request IDs, and stack traces stay server-side.
- [ ] Destructive account or carrier operations require explicit authorization,
  audit logging, and a tested recovery path.

Acceptance: all P0 boxes checked with pull-request, deployment, and post-deploy
evidence linked in the launch decision record.

## P0 — coherent tenant data

- [ ] Drivers KPI totals use the exact tenant-scoped dataset rendered in the
  roster; total and “By Class” subtotals reconcile in tests.
- [ ] Drug & Alcohol KPI totals use the exact tenant-scoped case dataset rendered
  in the list.
- [ ] DQ Files completeness and expiring-within-30-days counts recompute from the
  tenant document set and the CFR-backed requirement checklist.
- [ ] A seeded test tenant renders its own driver roster end to end through the
  production-shaped API contract.
- [ ] A new tenant with zero records renders zero counts and an actionable empty
  state on every list page; no demo number or ghost row appears.
- [ ] Production tenant views contain no hardcoded sample dates, carrier names,
  driver names, document counts, or compliance outcomes.
- [ ] The cross-page stat-versus-table audit covers every application route and
  the ten highest-impact contradictions have regression tests.

Acceptance: data-consistency suite passes on `main`, the approved release is
deployed, and a new-tenant plus seeded-tenant walkthrough is VERIFIED.

## P0 — billing and provisioning

- [ ] Published price ladder, checkout line items, Stripe product/price mapping,
  invoice math, and in-app billing copy agree for 1, 50, 51, 75, 76, 100, and
  101+ drivers.
- [ ] Checkout creates a server-owned session tied to the authenticated tenant;
  client input cannot select another carrier or an unauthorized price.
- [ ] Successful signed webhook provisions the intended plan exactly once.
- [ ] Invalid signature, wrong event type, missing metadata, unknown tenant, and
  provider failure paths are covered by automated tests.
- [ ] Cancellation, payment failure, plan change, and retry behavior preserve an
  auditable subscription state.
- [ ] A test-mode checkout walkthrough records checkout creation, verified
  webhook receipt, plan activation, customer-visible confirmation, and rollback.

Acceptance: automated billing suite passes and the complete test-mode walkthrough
is attached to the launch record. No live charge is required for source review.

## P1 — onboarding and first run

- [ ] A newly created carrier lands on a coherent empty dashboard, never a demo
  tenant or populated sample screen.
- [ ] The primary first-run action is “Import your drivers,” with supported file
  format, validation behavior, and recovery guidance visible before upload.
- [ ] Import preview separates accepted rows from rejected rows and performs no
  partial write until the carrier confirms.
- [ ] First-run progress survives refresh and can be resumed by an authorized
  user in the same tenant.
- [ ] The walkthrough covers account creation, tenant creation, driver import,
  roster verification, DQ gap calculation, and first compliance action.
- [ ] Keyboard-only and mobile onboarding smoke tests pass.

Acceptance: onboarding smoke test and human walkthrough are VERIFIED on the
release candidate.

## P1 — trust, legal, accessibility, and communications

- [ ] `/trust/` renders data protection, infrastructure, grounded-AI limitations,
  reliability, customer data control, and responsible disclosure content.
  Evidence: the current trust center shipped through Fleet PR #59; the older
  Fleet PR #53 was closed because it was superseded. `/trust/` returned HTTP 200
  during the 2026-08-03 production smoke test.
- [ ] Privacy, terms, cookies, accessibility, and privacy-choice links return 200
  and identify X3 Fleet Safety, LLC consistently.
- [ ] Decision-support pages do not promise an audit rating, enforcement result,
  DataQ removal, legal conclusion, or agency determination.
- [ ] WCAG 2.1 AA automated checks report no serious or critical issue on launch
  journeys at mobile and desktop viewports.
- [ ] Canonical, robots, sitemap, Open Graph, and Twitter metadata represent the
  same product name, domain, and commercial offer.
- [ ] Transactional sender identities and support/security contact addresses are
  verified and monitored.

Acceptance: route/link/metadata/a11y suites pass on the deployed release candidate.

## P1 — monitoring and operations

- [ ] Uptime checks cover marketing, sign-in, authenticated dashboard health,
  checkout creation, webhook health, and critical vendor dependencies without
  using customer data. Current evidence gap: `/api/health` returned HTTP 503 with
  a redacted `degraded` response during the 2026-08-03 production smoke test.
- [ ] Journey probes exercise new-tenant onboarding and a seeded-tenant roster at
  polite frequency with synthetic identities only.
- [ ] Client exception aggregation produces a redacted, actionable incident and
  never logs authorization headers, tokens, raw PII, or provider secret material.
- [ ] Alert delivery is tested for page exceptions, elevated 5xx rate, failed
  deploy, failed billing webhook, and database unavailability.
- [ ] Rollback procedure names the last known-good deployment and the operator
  responsible for authorizing rollback.
- [ ] Backup/restore evidence covers tenant records and required compliance
  documents within the documented recovery objectives.
- [ ] `RUNBOOK.md`, `DEPLOY.md`, and `.doctor/playbook.md` match the actual release
  and incident process.

Acceptance: monitoring is green for 24 continuous hours on the release candidate,
and one simulated alert plus one rollback rehearsal are recorded.

## Current launch approval record

| Field | Current value |
|---|---|
| Release commit | None approved |
| Approved deployment | None |
| P0 evidence | Incomplete; tenant isolation PR #50 and billing hardening PR #55 are merged, while secret-gate PR #51 and production verification remain open |
| P1 evidence | Incomplete; the current trust center is merged through PR #59 and responds in production, but remaining route, accessibility, and communications evidence is incomplete |
| Known non-blocking limitations | None adjudicated; the degraded production health response and open evidence items are blocking |
| Rollback target | Not selected because no release is approved |
| Deployment approver | No approval issued |
| Verification operator | Not assigned because no release is approved |
| Verification completed at | Not completed |
| Decision | **NO-GO** |

The release pull request must replace these values with real commit, evidence,
approver, rollback, and verification records before changing the decision to GO.
