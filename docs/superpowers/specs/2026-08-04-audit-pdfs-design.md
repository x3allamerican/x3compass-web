# Audit PDF Exports Design

## Purpose

Add three human-readable, carrier-scoped PDF exports to X3 Compass: a driver's DQ file summary, the carrier's D&A program summary, and the §390.15 accident register. These exports are evidence packets for audit preparation, not compliance determinations.

## Architecture

`functions/_shared/audit-pdf.ts` is a pure PDF renderer built on the repository's existing `pdf-lib` dependency. It accepts a title, carrier metadata, sections, and generated date; it returns valid PDF bytes. It handles page breaks, line wrapping, X3 branding, citations, missing-evidence labels, page numbers, and a decision-support footer.

`GET /api/audit/pdf?type=<dq-file|drug-alcohol|accident-register>&driver_id=<uuid>` authenticates with `requireTenant` and accepts no carrier identifier. The DQ export requires a canonical driver UUID and verifies that the driver belongs to the authenticated carrier before reading related records. Each document type has an explicit query plan:

- DQ file: one driver, DQ document index, MVR history, and training history.
- D&A summary: carrier-wide D&A test records and driver names.
- Accident register: register evidence and driver names, normalized through the existing `buildAccidentRegister` engine.

Every operational query carries the authenticated carrier ID and an explicit select list and limit. Missing tables or unapplied dependent migrations fail closed with an opaque response. After a PDF is successfully rendered, the route appends an `audit_log` row containing only export type, optional driver ID, record count, and generation timestamp. It never logs document contents, test results, license numbers, or secrets.

The response streams `application/pdf` with `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, and a safe attachment filename.

## User experience

The existing Audit Packet Generator page gains an “Audit-ready PDFs” panel. It loads real driver options and offers:

- Driver DQ file: choose a driver, then download.
- D&A program summary: download carrier-wide summary.
- Accident register: download the current §390.15 register.

The client obtains the current session token, fetches the PDF, and downloads the returned blob. Errors are visible and no sample PDF is substituted.

## Safety and tests

- No cross-tenant lookup, client-supplied carrier, wildcard select, or public caching.
- No new migration, R2 write, deployment, live database write during development, or secret output.
- The endpoint performs only the normal append-only audit-log write after successful generation.
- Tests validate actual PDF magic bytes and page count, authentication failure, driver ownership, query scoping, content headers, audit-log minimization, page wiring, and route classification.

Delivery is one stacked branch and PR. No merge or deployment is performed.
