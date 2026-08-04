# Roadside Inspection Intake — Design

## Outcome

An authenticated carrier user can upload a PDF or supported image of a roadside inspection report. X3 Compass attempts structured extraction, pre-fills the existing inspection form, maps recognized violation CFR families to CSA BASIC categories, and requires a person to review every field before saving to `compass_inspections`.

## Trust boundary

`POST /api/inspections/parse` is an authenticated-user route. `requireTenant` derives the carrier membership from the bearer token; client-provided `carrier_id` is accepted only for the shared guard's mismatch detection and is never trusted as persistence authority. The endpoint does not write a record. The reviewed form is saved through the existing tenant-RLS-scoped inspection workflow.

## Extraction contract

The parser accepts PDF, PNG, JPEG, and WebP reports up to 20 MB. If the AI credential is absent, the provider fails, or the provider emits invalid JSON, the endpoint returns a valid empty extraction with `needs_manual: true`. No sample or inferred inspection data is substituted.

All successful extractions carry `review_status: needs_human_review`. Invalid dates, levels, states, and violation collections are removed and surfaced as parser warnings. The source-only migration records filename, MIME type, parse status, warnings, parse timestamp, and reviewer provenance.

## BASIC mapping

The mapper categorizes only recognized CFR families: 392/383.51 unsafe driving, 395/392.3 hours of service, 393/396 vehicle maintenance, 382/392.4/392.5 controlled substances and alcohol, 383/391 driver fitness, and Parts 171–180 hazardous materials. Unrecognized codes receive no category and remain human-review items. The mapping is decision support, not an FMCSA scoring determination.

## Operations

The migration is source-only and marked `NEEDS CLAUDE TO APPLY`. This task performs no deployment, database write, object-storage write, or live AI/vendor request.
