# FMCSA Accident Register Design

## Purpose

Upgrade the existing X3 Compass accident page into an audit-ready register aligned to 49 CFR 390.15(b)(1). The register presents stored accident facts for the authenticated carrier, identifies missing required evidence, and shows the three-year retention lifecycle. It does not decide whether an accident was recordable, whether post-accident testing was required, or whether a crash was preventable.

## Data contract

The existing `compass_accidents` row remains the system of record. A source-only migration adds nullable `city`, `state`, and `hazmat_released` columns. Null means not documented; it never means “no.” Existing `location` remains available for legacy rows but is not parsed into city/state because free text cannot be separated reliably.

A pure module normalizes each accident plus driver evidence into a register record containing:

- accident date;
- city and state;
- driver name;
- fatalities;
- injuries;
- whether hazardous materials other than fuel spilled from vehicle fuel tanks were released;
- retention-through date, three calendar years after the accident date;
- retention status (`retain`, `retention_complete`, or `date_missing`);
- missing required fields;
- source record ID and decision-support guardrail.

Zero fatalities and zero injuries are valid evidence. A null hazmat-release value is a missing field, not false. Invalid dates remain `date_missing`. Retention dates use UTC calendar arithmetic and clamp leap-day anniversaries.

## API and tenant boundary

`GET /api/accident-register` derives the carrier through `requireTenant`; it accepts no client-supplied carrier identity. It reads explicit, bounded columns from `compass_accidents` and active/inactive driver names from `compass_drivers`, with every operational query scoped to the authenticated carrier. The response contains normalized register records and summary counts. The route is classified `authenticated-user` and uses `tenantJson`.

If the migration has not been applied, the endpoint returns an opaque `register_unavailable` response rather than falling back to incomplete or sample data.

## Native page

The existing `/app/accidents` operational log and edit workflow remain. A new “DOT register” view on the same page loads the authenticated endpoint and provides:

- total, complete, missing-evidence, and retention-complete counts;
- search and retention-status filters;
- the exact §390.15(b)(1) fields in a horizontally scrollable table;
- visible missing-evidence badges;
- retention-through dates and current retention state;
- honest empty and endpoint-unavailable states.

The existing accident form gains city, state, and a three-state hazmat-release selector (`not documented`, `no`, `yes`). This preserves the difference between missing evidence and a recorded negative answer.

## Tests and delivery

Tests cover required-field handling, valid zero values, leap-day retention, tenant-scoped queries, unauthenticated rejection, route classification, authenticated page fetch, and no demo fallback. Full Node, Playwright security contracts, TypeScript, production build, and diff checks are required.

Delivery is branch and PR only. Codex does not apply the migration, deploy, call a vendor, write a live database, send email, or expose secrets. Claude must apply the migration after review.
