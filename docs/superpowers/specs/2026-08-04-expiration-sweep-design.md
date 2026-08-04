# Document Expiration Sweep Design

## Purpose

Add `agent-expiration-sweep`, a carrier-level evidence sweep for active X3 Compass customers. The agent identifies dated CDL, medical certificate, annual MVR-review, and insurance records that are overdue or due within 60 days. It sends at most one digest email per carrier per run. It is decision support: a missing date is not converted into an invented deadline, and insurance records are included only when an existing document explicitly carries an expiration date.

This agent complements rather than replaces `agent-driver-reminders`. The existing agent sends CDL/MEC reminders to individual drivers. The new agent gives the carrier administrator one audit-planning digest spanning drivers and carrier insurance evidence.

## Architecture

### Pure planner

`functions/_shared/expiration-sweep.mjs` owns deterministic date logic and email presentation. Its primary function is:

```ts
buildExpirationDigest({ asOf, carrier, drivers, mvrRecords, insuranceDocuments })
```

It returns a carrier digest with normalized items and counts. Each item contains a stable ID, category, subject, source date, due date, days remaining, urgency band, evidence description, and citation. The module also renders escaped HTML and plain text for the digest email. It performs no network or database work.

Urgency bands are:

- `overdue`: due date before `asOf`.
- `due_30`: due from `asOf` through 30 calendar days, inclusive.
- `due_60`: due 31 through 60 calendar days, inclusive.

Dates beyond 60 days and undated evidence are omitted from the alert digest. Annual MVR due dates are the latest valid `pulled_on` date for each active driver plus one calendar year. Leap-day dates clamp to the final valid day of the target month.

### Registry orchestrator

`agentExpirationSweep` in `functions/_shared/agent-registry.ts` uses the existing Supabase admin and email adapters. With no `carrier_id`, it loads active/trialing carriers and sweeps each carrier independently. With `carrier_id`, it loads only that carrier, enabling a bounded manual run. Every driver, MVR, and document query includes the current carrier ID.

The orchestrator loads:

- active drivers with CDL and medical certificate expiration dates;
- MVR records with `driver_id` and `pulled_on`;
- DQ documents with `doc_type`, `expires_on`, and driver linkage.

Only DQ documents whose normalized `doc_type` contains `insurance`, `bmc-91`, `mcs-90`, `liability`, or `cargo_policy` qualify as insurance evidence. This is deliberately conservative. A SAFER insurance amount or an undated document does not prove an expiration date.

For a dry run, the agent returns the exact carrier/item grouping in its log and sends no email. For a normal run, it calls `sendEmail` once per carrier whose digest contains at least one item and whose primary contact email exists. A carrier with no alert items receives no email. One carrier's read or email failure does not stop the remaining sweep; the final result reports processed, sent, skipped, and failed counts.

### Registration

The registry switch recognizes `agent-expiration-sweep`. A source-only migration inserts or updates the `compass_agents` catalog row with `kind = scheduled`, a descriptive cadence, and `cron_expr = null`. No schedule is invented or applied. Claude must choose and apply the schedule later.

## Evidence and safety rules

- The agent never reads across carriers and never accepts a carrier ID as evidence of authority from a public request.
- It never sends one email per item or per driver; the maximum is one email per carrier per run.
- It never treats a missing CDL, MEC, MVR, or insurance date as a known deadline.
- It never infers an insurance expiration from coverage amounts, authority status, or a policy name.
- Driver, carrier, and document text is HTML-escaped before email rendering.
- Dry-run mode performs reads and planning only. It performs no email or database write.
- The migration is committed as source only and clearly marked for Claude to apply; no live migration or cron change is performed.

## Testing

Pure Node tests verify:

- CDL and MEC classification at overdue, 30-day, and 60-day boundaries;
- latest-MVR selection and calendar-year arithmetic;
- conservative insurance filtering and omission of undated/non-insurance documents;
- active-driver filtering and deterministic ordering;
- HTML escaping;
- one carrier digest rather than one message per item.

Registry contract tests verify sweep registration, no cron expression, dry-run behavior, carrier-scoped queries, one email per carrier, and isolation of per-carrier failures. Full Node, security-contract, TypeScript, build, and diff checks remain required before the PR opens.

## Delivery boundary

This task creates a branch and PR only. It does not merge, deploy, apply the migration, configure a cron, send a live email, call a live vendor, write a live database, or reveal a secret.
