# Notifications center API

## Read feed

`GET /api/notifications?carrier_id=<uuid>` requires a bearer session and verifies carrier membership with `requireTenant`. It returns carrier-scoped delivery metrics, rules, the latest 100 notification rows, and `unread_count`. Empty tenants receive an empty real feed; demo content is limited to signed-out preview rendering.

## Mark read

`PATCH /api/notifications` accepts either `{carrier_id, id}` or `{carrier_id, all:true}`. Both forms derive authority from the bearer session and include the authorized carrier in the update predicate. The response reports the number of rows updated.

## Producers

The expiration sweep writes one deduplicated `document_expiration_digest` in-app record per carrier and as-of date before attempting email. The continuous-MVR webhook writes one deduplicated `mvr_change_detected` record per completed change report. Neither producer makes a compliance determination.

The source-only migration `20260804_notification_center.sql` adds `read_at`, a dedupe key, and supporting indexes. It is marked **NEEDS CLAUDE TO APPLY** and was not applied by Codex.
