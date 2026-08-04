# X3 Compass first-run walkthrough

## Customer journey

1. A verified user is routed from `/signup` to `/app/onboarding`.
2. The user confirms the carrier name, USDOT number, power-unit count, city, and state. The existing carrier record is updated; onboarding never creates a second carrier.
3. The primary next action is **Import driver roster**. It opens the production driver CSV flow, which provides a template, previews the submitted rows, and reports inserted, updated, skipped, and rejected rows.
4. A successful import closes the dialog and advances to the plan screen. A very small carrier may instead add one driver manually. The user may also skip driver setup without seeing fabricated drivers.
5. The plan screen shows the same graduated driver-count calculation used by checkout. The user can remain on the seven-day trial or continue to billing.

## Empty-account behavior

Onboarding contains no demo carrier or driver fallback. A real carrier with no imported drivers remains an honest empty carrier. Portfolio-wide removal of authenticated demo fallbacks is tracked separately in Fleet PR #52; that PR remains a launch dependency because it covers downstream dashboard and list pages outside this onboarding route.

## Safety boundaries

- Import uses the existing `/api/drivers/import` contract and does not create a second ingestion path.
- The carrier identifier comes from the authenticated `useUser` carrier context, not URL or form input.
- Tenant-isolation enforcement in Fleet PR #50 remains a required launch dependency and must be deployed before customer onboarding is enabled.
- This change performs no live import, account creation, checkout, database migration, or deployment.

## Verification

The native source contract test asserts that roster import is the primary second step, successful import advances the wizard, no demo-driver fallback is introduced, and manual entry remains available. The Playwright app-gate inventory now includes `/app/onboarding`, so the clean preview build must serve the route successfully.

No automated test creates a customer account or writes carrier data.
