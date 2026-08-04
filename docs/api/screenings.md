# Screenings API

Source-of-truth documentation for the handlers under `functions/api/screenings/`. Examples omit real credentials and personally identifiable information.

## Security and tenant identity

All endpoints except the vendor webhook require `Authorization: Bearer <Supabase JWT>`. The server resolves carrier membership with `requireTenant`. An optional `carrier_id` is only a requested scope and must match the authenticated user's membership; it never establishes authority.

Common opaque authorization failures are `401 unauthorized`, `403 tenant_forbidden` or `tenant_required`, `400 invalid_tenant_id`, and `503 authorization_unavailable`. Protected routes are classified `authenticated-user`; the webhook is `public-or-signed` and authenticates the exact request body with Checkr HMAC-SHA256.

## Order a Checkr screening

`POST /api/screenings/order`

Creates a Checkr candidate without SSN, date of birth, or driver-license data, creates a hosted-flow invitation, and best-effort records the invitation in `vendor_orders`.

Request:

```json
{
  "first_name": "Alex",
  "middle_name": "Q",
  "last_name": "Driver",
  "email": "alex@example.test",
  "phone": "+15555550100",
  "zip": "48201",
  "custom_id": "internal-reference",
  "carrier_id": "optional-member-carrier-uuid",
  "driver_id": "optional-driver-uuid",
  "package": "account-package-slug",
  "node": "optional-account-node",
  "work_location": { "country": "US", "state": "MI", "city": "Detroit" }
}
```

Success (`200`):

```json
{
  "ok": true,
  "order_id": "uuid-or-null",
  "candidate_id": "checkr-candidate-id",
  "invitation_id": "checkr-invitation-id",
  "invitation_url": "hosted-flow-url-or-null",
  "status": "invited",
  "env": "staging"
}
```

`order_id` can be `null` when the best-effort local insert fails even though Checkr accepted the order. Validation failures return `400` for invalid JSON, a missing required field, missing work-location country/state, invalid email, or an invalid driver UUID. Missing environment credentials return `500`. Candidate or invitation failures return opaque `502 upstream_failed` with a correlation ID.

## Enroll continuous MVR

`POST /api/screenings/continuous-mvr/enroll`

Request: `{ "driver_id": "uuid", "carrier_id": "optional-member-carrier-uuid" }`.

The handler is idempotent for active or pending monitors. It requires a completed clear Checkr MVR baseline associated with the same carrier and driver before opening a continuous check.

- `200 { "ok": true, "monitor": {...} }`: enrolled.
- `200 { "ok": true, "monitor": {...}, "already": true }`: already active or pending.
- `409 { "ok": false, "code": "NEEDS_BASELINE", ... }`: no qualifying baseline.
- `200 { "ok": false, "code": "ACCOUNT_NOT_APPROVED", ... }`: Checkr rejected the account as unauthorized, not enabled, not permitted, or not eligible.
- `400`: invalid JSON or driver UUID.
- `500`: selected Checkr API key is absent.
- `502`: Checkr returned another error or the request failed.

## Unenroll continuous MVR

`POST /api/screenings/continuous-mvr/unenroll`

Request: `{ "driver_id": "uuid", "carrier_id": "optional-member-carrier-uuid" }`.

Success returns `{ "ok": true, "monitor": {...}, "checkr_canceled": true|false, "warning": "optional" }`. An already canceled row returns `already: true`. A missing enrollment returns `404`; invalid JSON or UUID returns `400`.

Checkr cancellation is best-effort. The local monitor is marked canceled even when the API key is absent or Checkr cancellation fails; that condition is returned in `warning` so an operator can verify cancellation in Checkr.

## List continuous MVR monitors

`GET /api/screenings/continuous-mvr/list`

The authenticated carrier is derived entirely from the JWT membership. Success:

```json
{
  "ok": true,
  "kpis": { "total": 0, "active": 0, "pending": 0, "canceled": 0, "failed": 0, "paused": 0 },
  "monitors": []
}
```

KPI values are reduced from the same returned monitor rows. An empty carrier receives zeroes and an empty array, never demo data.

## Parse an uploaded MVR

`POST /api/screenings/mvr/parse`

Request:

```json
{
  "carrier_id": "optional-member-carrier-uuid",
  "driver_id": "optional-driver-uuid",
  "filename": "record.pdf",
  "mime_type": "application/pdf",
  "file_base64": "base64-document-bytes"
}
```

The handler records `mvr_uploads` first. With a configured AI key, it requests structured extraction and returns `{ "ok": true, "upload_id": "uuid", "extracted": {...} }`.

Manual review is a successful degradation, not a fabricated extraction:

```json
{ "ok": true, "upload_id": "uuid", "extracted": null, "needs_manual": true, "reason": "no_ai_key" }
```

Other manual reasons are `ai_error`, `parse_failed`, and `exception`. Invalid JSON, an invalid driver UUID, or absent `file_base64` returns `400`.

## Checkr webhook

`POST /api/screenings/webhook?vendor=checkr`

This is the only public screenings endpoint. It requires `X-Checkr-Signature`, calculated as HMAC-SHA256 over the exact raw request body. The signature may be raw hexadecimal or prefixed with `sha256=`.

- `200 { "ok": true, "eventId": "...", "eventType": "...", "persisted": true }`: accepted, persisted, transitions applied.
- `200 { "ok": true, "duplicate": true, ... }`: the unique vendor/event ID already exists; no side effects replay.
- `200 { "ok": true, "persisted": false, ... }`: database environment is absent; event acknowledged but not persisted.
- `400`: unsupported vendor or invalid JSON.
- `401`: missing or invalid signature.
- `503 service_unavailable`: selected webhook secret is absent.
- `500 request_failed`: event persistence failed.

Invitation and report events update `vendor_orders`. Assessment takes precedence over result for completed reports. Continuous-check lifecycle events update or backfill `compass_mvr_monitors`. A monitored `report.completed` writes `compass_mvr_records`; an unmonitored candidate does not.

## Environment variables

| Variable | Used by | Behavior |
|---|---|---|
| `SUPABASE_URL` | all handlers | Server database/API base. |
| `SUPABASE_SERVICE_ROLE` | all handlers | Server-only authorization and persistence credential. Never expose to clients. |
| `CHECKR_ENV` | order, enroll, unenroll, webhook | `live` selects live credentials; any other or absent value selects staging. |
| `CHECKR_STAGING_API_KEY` | order, enroll, unenroll | Staging Checkr API credential. |
| `CHECKR_LIVE_API_KEY` | order, enroll, unenroll | Live Checkr API credential. |
| `CHECKR_API_BASE` | order, enroll, unenroll | Optional API base; defaults to `https://api.checkr.com`. |
| `CHECKR_CONTINUOUS_MVR_PATH` | enroll | Defaults to `/v1/continuous_checks`. |
| `CHECKR_CONTINUOUS_MVR_TYPE` | enroll | Defaults to `mvr`. |
| `CHECKR_DEFAULT_NODE` | enroll | Optional account-hierarchy node. |
| `CHECKR_CONTINUOUS_MVR_CANCEL_PATH` | unenroll | Defaults to `/v1/continuous_checks/{id}/cancel`. |
| `CHECKR_CONTINUOUS_MVR_CANCEL_METHOD` | unenroll | Defaults to `POST`; normalized to uppercase. |
| `CHECKR_STAGING_WEBHOOK_SECRET` | webhook | Staging HMAC secret. |
| `CHECKR_LIVE_WEBHOOK_SECRET` | webhook | Live HMAC secret. |
| `ANTHROPIC_API_KEY` | MVR parse | Enables extraction; absence yields `needs_manual`. |
| `ANTHROPIC_MODEL` | MVR parse | Optional model override; handler default is `claude-3-5-sonnet-latest`. |

No secret value belongs in requests, responses, logs, tests, or this document.
