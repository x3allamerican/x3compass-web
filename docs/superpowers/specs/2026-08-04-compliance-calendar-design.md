# X3 Compass compliance calendar design

## Outcome

Build a carrier-scoped compliance calendar that converts existing, attributable dates into current, due-soon, overdue, or evidence-missing items. It covers annual MVR review, medical certificate expiry, D&A program evidence, IFTA quarters, UCR renewal, MCS-150 biennial updates, and annual vehicle inspections without presenting decision support as a compliance determination.

## Architecture

The feature has three bounded units:

1. `complianceCalendar.mjs` is a pure UTC date engine. It accepts a normalized carrier evidence bundle plus an `asOf` date and emits calendar items. It has no network, UI, or tenant logic.
2. `/api/compliance-calendar` authenticates with `requireTenant`, reads only the authenticated carrier's rows, and returns the normalized evidence bundle. It never accepts a client carrier ID.
3. `/app/calendar` fetches the endpoint with the user's bearer token, runs the pure engine, and renders summary counts plus filterable chronological items.

## Evidence and applicability rules

- Annual MVR review: latest `compass_mvr_records.pulled_on` per active driver plus one calendar year. No MVR produces `evidence_missing`, not an invented date.
- Medical certificate: `compass_drivers.medical_card_expires_on` is the due date. Missing expiry produces `evidence_missing`.
- D&A: existing `compass_da_tests` rows prove completed tests but do not establish a universal next-test cadence. The calendar emits a carrier-level D&A program-review evidence item with `confirm_applicability`; it does not derive a driver deadline from random or post-accident tests.
- IFTA: statutory quarter-end filing dates are generated, but the item remains `confirm_applicability` unless an existing IFTA return establishes participation. A matching filed period may mark it current.
- UCR: December 31 is shown as the standard renewal planning date with `confirm_applicability`, because interstate/UCR applicability facts are not stored canonically.
- MCS-150: due month and odd/even year derive from USDOT-number terminal digits. Missing/malformed USDOT produces `evidence_missing`. `last_mcs150_filed` is displayed as evidence but never changes the statutory schedule.
- Annual vehicle inspection: `compass_vehicles.next_dot_inspection_due` is authoritative for the calendar. Missing dates produce `evidence_missing`.

Fixed dates include a review warning because weekends, holidays, filing portals, exemptions, and carrier facts can change operational treatment.

## Status model

- `overdue`: known due date precedes `asOf`.
- `due`: known due date is from `asOf` through 30 calendar days inclusive.
- `current`: known due date is more than 30 days away, or a matching filing proves the period complete.
- `confirm_applicability`: a planning date is computable but triggering facts are absent.
- `evidence_missing`: the rule applies to a represented object but its source date is absent.

Items include rule key, title, subject, CFR/authority citation, due date or null, evidence text, status, and a decision-support note.

## Error and empty behavior

Authorization and upstream failures use opaque server errors. A carrier with no drivers, vehicles, filings, or regulatory evidence receives an honest setup state plus carrier-level applicability-review items; no sample dates or records appear.

## Verification

Unit fixtures cover each rule and all status boundaries, including leap years, MCS-150 parity, IFTA year rollover, missing evidence, and unknown applicability. Handler tests prove unauthenticated denial and server-derived carrier filtering. The full Node suite, security classification suite, TypeScript, production build, and diff check must pass before the PR opens.
