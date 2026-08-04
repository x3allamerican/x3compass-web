# DataQ Challenge Workflow Design

## Scope and authority

Build a tenant-scoped Request for Data Review (RDR) tracker linked to an existing roadside inspection or crash. Compass records carrier-entered facts, evidence references, submission identifiers, and agency-reported status. It does not determine contestability, predict success, submit to FMCSA, or treat an internal status as an agency decision. Every surface carries a decision-support and human-review guardrail.

## Chosen architecture

Use dedicated `compass_dataq_challenges` and `compass_dataq_evidence` tables rather than adding mutable columns to inspection or accident records. This preserves case history, supports multiple challenges per source record, and keeps evidence metadata independently auditable. A pure domain module validates target type, status transitions, required narrative fields, and evidence metadata before any persistence call.

One authenticated Pages Function handles list/create/update operations at `/api/dataq/challenges`. Tenant identity always comes from `requireTenant`; the client never chooses the effective carrier. Create verifies the linked inspection or accident belongs to the tenant before inserting. Update first loads the tenant-owned challenge and permits only the documented state transitions. List returns bounded projections and joined evidence metadata without signed download URLs or secret storage details.

## Data model

`compass_dataq_challenges` stores carrier, target type (`inspection` or `crash`), target UUID, issue summary, requested correction, status (`submitted`, `under_review`, `approved`, `denied`), DataQs tracking number, submitted date, agency response date, agency response notes, creator, timestamps, and optimistic `version`. The database enforces enums, nonblank narratives, tenant indexes, unique tracking numbers within a carrier, and row-level tenant policies.

`compass_dataq_evidence` stores carrier, challenge, label, original filename, object key, MIME type, byte size, creator, and timestamp. Evidence is metadata for objects uploaded through the existing authenticated upload flow; this feature never creates public URLs and never accepts inline file contents. A trigger rejects evidence whose carrier differs from its challenge.

## Workflow and UI

The inspections page adds a DataQ action on real inspection rows and a challenge workspace below the register. A create modal requires an issue summary and requested correction; optional evidence entries require label, filename, object key, MIME type, and byte size together. The workspace shows source record, tracking number, evidence count, status, dates, and the allowed next status. Status updates require explicit confirmation and agency response notes for terminal outcomes.

The existing demo inspection fallback is not eligible for DataQ creation. Empty challenge data renders an honest empty state. API failures remain visible and do not alter local status optimistically.

## Errors and security

Malformed UUIDs, invalid states, missing narratives, incomplete evidence metadata, and illegal transitions return opaque 400/409 errors. Missing tenant-owned target or challenge returns 404 without revealing cross-tenant existence. Service failures return a correlation ID and contain no secrets or record contents in logs. The route is explicitly classified as authenticated and covered by the shared-guard test.

## Verification

Tests cover the state machine, migration constraints and RLS, unauthenticated and cross-tenant negatives, inspection-linked creation, evidence persistence, list projection, allowed and forbidden transitions, terminal-note requirements, page authentication, real-data-only behavior, and route classification. Final gates are the full Node contract suite, focused Playwright API/security suite, TypeScript, production build, and `git diff --check`.

## Deployment handoff

The migration is source-only and marked `NEEDS CLAUDE TO APPLY`. No migration, upload, DataQs submission, database write, deployment, or live infrastructure action occurs in this task.
