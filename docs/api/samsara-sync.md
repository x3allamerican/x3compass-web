# Samsara fleet synchronization

`POST /api/vendors/samsara/sync` requires a bearer session and verifies the requested carrier with `requireTenant`. The service token is read only from `SAMSARA_API_TOKEN`; it is never returned or logged.

The sync follows Samsara's cursor pagination for active drivers and vehicles and requests the prior seven calendar days of HOS daily summaries. Each entity is reconciled by `(carrier_id, source_vendor, source_id)`, making retry and repeated runs idempotent. HOS rows are linked to the carrier's locally reconciled driver; unmatched vendor driver IDs are counted and omitted rather than attached to the wrong person.

Official contracts used:

- `GET /fleet/vehicles`
- `GET /fleet/drivers` with `limit`, `after`, and active-status filtering
- `GET /fleet/hos/daily-logs` with `startDate` and `endDate`

The response gives fetched and reconciled counts by domain plus the HOS time window. `compass_vendor_integrations` receives success/error and last-sync metadata. No compliance status is inferred from missing HOS values.

The source-only migration `20260804_samsara_sync_depth.sql` is marked **NEEDS CLAUDE TO APPLY**. Codex did not apply it or call Samsara.
