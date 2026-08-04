# DataQ Challenge API

The DataQ Challenge API records a carrier's Request for Data Review workflow. It is decision-support infrastructure: X3 Compass does not submit a request to FMCSA DataQs, decide whether a record is contestable, predict an outcome, or replace agency confirmation.

## Authentication and tenancy

All methods require `Authorization: Bearer <Supabase access token>`. The handler derives the effective carrier from the authenticated user's `compass_carrier_users` membership through `requireTenant`. A client-supplied carrier identifier is neither required nor trusted.

Responses use `Cache-Control: private, no-store`. Cross-tenant and missing resources both return the same opaque `404 resource_not_found` response.

## GET `/api/dataq/challenges`

Returns up to 1,000 carrier-owned challenges, newest submitted date first, and up to 5,000 carrier-owned evidence metadata rows joined by challenge. The projection excludes evidence object keys and public download URLs.

```json
{
  "ok": true,
  "challenges": [{
    "id": "uuid",
    "target_type": "inspection",
    "target_id": "uuid",
    "issue_summary": "Specific carrier-entered facts",
    "requested_correction": "Specific requested correction",
    "status": "submitted",
    "tracking_number": null,
    "submitted_on": "2026-08-04",
    "agency_response_on": null,
    "agency_response_notes": null,
    "version": 1,
    "evidence": []
  }]
}
```

## POST `/api/dataq/challenges`

Creates a challenge only after verifying the target inspection or crash belongs to the authenticated carrier. `issue_summary`, `requested_correction`, and `submitted_on` are required. A request begins in `submitted`; the client cannot choose its initial status.

Evidence must first be uploaded through `POST /api/uploads/sign` and the returned authenticated `PUT /api/uploads/put` relay. The evidence metadata supplied here must use an object key under `carriers/<authenticated-carrier-id>/dataq/`, must be no larger than 25 MB, and never makes the object public.

```json
{
  "target_type": "inspection",
  "target_id": "uuid",
  "issue_summary": "The report associates the wrong vehicle with this inspection.",
  "requested_correction": "Correct the vehicle association.",
  "submitted_on": "2026-08-04",
  "tracking_number": "RDR-12345",
  "evidence": [{
    "label": "Dispatch record",
    "file_name": "dispatch.pdf",
    "object_key": "carriers/<carrier-uuid>/dataq/<generated-key>-dispatch.pdf",
    "content_type": "application/pdf",
    "size_bytes": 4200
  }]
}
```

A successful create returns `201` with the inserted challenge and evidence metadata.

## PATCH `/api/dataq/challenges`

Records an agency-reported status. The caller must provide the current `version`; the update query matches the challenge UUID, carrier UUID, and version to prevent stale overwrites.

```json
{
  "id": "uuid",
  "version": 2,
  "status": "approved",
  "tracking_number": "RDR-12345",
  "agency_response_on": "2026-08-21",
  "agency_response_notes": "Agency corrected the vehicle association."
}
```

Allowed transitions are:

- `submitted` → `under_review`, `approved`, or `denied`
- `under_review` → `approved` or `denied`
- `approved` and `denied` are terminal

`approved` and `denied` require both `agency_response_on` and nonblank `agency_response_notes`. Every successful update increments `version`.

## Error contract

- `400`: invalid JSON, UUID, narrative, evidence metadata, date, or update payload
- `401`: missing or invalid authentication
- `403`: authenticated user lacks carrier membership
- `404`: target or challenge is absent from the authenticated tenant
- `409`: illegal state transition or optimistic-version conflict
- `503`: authorization, migration, or persistence dependency unavailable

Security errors include a correlation ID and do not return database details, secret values, record contents, or cross-tenant existence.

## Activation handoff

The source-only migration is `supabase/migrations/20260804_dataq_challenges.sql` and is marked **NEEDS CLAUDE TO APPLY**. Until it is reviewed and applied, the endpoint fails closed with `503 dataq_unavailable`. This repository task does not apply the migration, upload an object, submit a DataQs request, write live data, or deploy the application.
