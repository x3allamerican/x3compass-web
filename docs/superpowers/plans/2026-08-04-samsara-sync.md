# Samsara Sync Depth — Implementation Plan

1. Specify mapping, pagination, idempotency, tenant, and Settings contracts with failing tests.
2. Add pure driver and HOS normalization that preserves absent evidence.
3. Add additive source provenance and tenant-scoped unique indexes.
4. Expand the Samsara route to cursor-fetch and reconcile vehicles, drivers, and HOS.
5. Resolve HOS driver foreign keys exclusively through tenant source-ID mappings.
6. Surface last-sync state and a customer-controlled sync action in Settings.
7. Run mocked endpoint tests, security suites, TypeScript, production build, and hygiene checks before opening the stacked draft PR.
