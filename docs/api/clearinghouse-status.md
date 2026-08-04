# Clearinghouse Status API

This API computes and records carrier-owned Drug and Alcohol Clearinghouse evidence under 49 CFR Part 382 Subpart G. It does not call FMCSA, run a live query, submit a violation, or determine whether a driver may perform safety-sensitive duties.

## Authentication and tenancy

Both methods require a Supabase bearer token. `requireTenant` derives the carrier from authenticated membership. Every read includes a carrier filter; POST verifies the driver belongs to that carrier before inserting. Responses are private and `no-store`.

## GET `/api/clearinghouse/status`

Loads bounded projections for active and pending-hire drivers, queries, consents, and violations, then returns:

- per-driver annual status: `current`, `due`, `overdue`, or `missing_evidence`
- the grounded annual due date when a completed query exists
- pre-employment full-query evidence state
- consent evidence state
- whether an active prohibited-status flag is recorded
- aggregate counts, citations, and the human-review guardrail

Completed annual limited, pre-employment full, and triggered full queries provide annual-query evidence. `pending` and `error` rows do not. The next annual date is one calendar year after the latest completed query; leap day clamps to February 28. Missing history stays `missing_evidence` without an invented due date.

## POST `/api/clearinghouse/status`

Records carrier-entered or C/TPA-provided query evidence:

```json
{
  "driver_id": "uuid",
  "query_type": "annual_limited",
  "requested_at": "2026-08-04T12:00:00Z",
  "query_run_at": "2026-08-04T12:05:00Z",
  "result": "no_information",
  "consent_received_at": "2026-08-04T11:00:00Z",
  "fmcsa_query_id": "CH-123"
}
```

`query_type` accepts `annual_limited`, `pre_employment_full`, or `triggered_full`. `result` accepts `pending`, `no_information`, `information`, or `error`. Completed results require `query_run_at`. X3 never generates an FMCSA query ID.

## Errors

- `400`: malformed JSON, UUID, timestamp, query type, result, or completed record without run time
- `401`: missing or invalid bearer authentication
- `403`: no carrier membership
- `404`: driver is not present in the authenticated carrier
- `503`: authorization, unapplied schema, or persistence dependency unavailable

## Activation handoff

`supabase/migrations/20260804_clearinghouse_tracking.sql` is marked **NEEDS CLAUDE TO APPLY**. Until reviewed and applied, the endpoint fails closed with `503 clearinghouse_unavailable`. This source task does not call FMCSA, apply the migration, write live records, use vendor secrets, or deploy.
