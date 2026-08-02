# API security classification

This inventory is the security contract for every Cloudflare Pages Function under `functions/api`. The API middleware fails closed when a route is absent from the executable classification in `functions/_shared/api-route-classification.ts`.

## Classes

- **Public or signed:** no user session is required. Public handlers may accept non-tenant intake or telemetry only. Signed callbacks must verify the provider signature before privileged work.
- **Authenticated user:** a valid Supabase access token is required. Tenant handlers additionally resolve `compass_carrier_users` server-side and reject a caller-supplied carrier mismatch.
- **Admin:** a verified Supabase session whose email appears in the server-owned super-admin allowlist, or the existing internal automation credential where explicitly supported.

## Route inventory

| Route | Class | Tenant or privilege boundary |
|---|---|---|
| `/api/accidents/import` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/admin/agents/*` | Admin | Super-admin or authorized internal dispatcher |
| `/api/admin/carrier-prefs` | Admin | Super-admin |
| `/api/admin/dispatch` | Admin | Super-admin or authorized internal dispatcher |
| `/api/admin/finance` | Admin | Super-admin |
| `/api/admin/finance/export` | Admin | Super-admin |
| `/api/admin/finance/sync-stripe` | Admin | Super-admin |
| `/api/admin/partners` | Admin | Super-admin; compatibility endpoint |
| `/api/admin/v1/partners` | Admin | Super-admin; canonical versioned endpoint |
| `/api/admin/social/bulk` | Admin | Super-admin; UUID-validated post IDs |
| `/api/admin/social/generate` | Admin | Super-admin; UUID-validated carrier ID |
| `/api/admin/social/list` | Admin | Super-admin; UUID-validated optional carrier ID |
| `/api/admin/social/publish` | Admin | Super-admin; UUID-validated post ID |
| `/api/admin/social/update` | Admin | Super-admin; UUID-validated post ID |
| `/api/ask-demo` | Public or signed | Public demo; no tenant data |
| `/api/ask` | Authenticated user | User-scoped AI request |
| `/api/audit/build` | Authenticated user | Membership-derived carrier; export ownership check |
| `/api/auth/invite` | Authenticated user | Carrier membership plus owner/admin role |
| `/api/auth/post-signup` | Authenticated user | Verified user; creates or reuses own membership |
| `/api/checkr/session-token` | Authenticated user | JWT only; URL/admin shared-secret paths removed |
| `/api/dashboard` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/drivers/import` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/errors` | Public or signed | Sanitized client telemetry; no tenant response data |
| `/api/health` | Public or signed | Health state only |
| `/api/inspections/import` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/marketing` | Admin | Company-wide privileged reporting |
| `/api/notifications` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/partners/apply` | Public or signed | Public partner application intake |
| `/api/prospects` | Admin | Company-wide prospect records |
| `/api/prospects/outreach` | Admin | Privileged prospect outreach mutation |
| `/api/scorecards` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/screenings/order` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/screenings/webhook` | Public or signed | Checkr HMAC signature required; bypass removed |
| `/api/stripe/create-checkout-session` | Authenticated user | Membership-derived Stripe customer |
| `/api/stripe/portal-session` | Authenticated user | Membership-derived Stripe customer |
| `/api/stripe/webhook` | Public or signed | Stripe signature required |
| `/api/uploads/get` | Authenticated user | Carrier ID parsed from object key and membership-verified |
| `/api/uploads/put` | Public or signed | Short-lived HMAC token binds object path to carrier |
| `/api/uploads/sign` | Authenticated user | Membership-derived carrier and UUID-validated driver ID |
| `/api/vehicles/import` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/vendors/list` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/vendors/motive/sync` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/vendors/samsara/sync` | Authenticated user | Carrier membership; server-derived carrier ID |
| `/api/vendors/tenstreet/sync` | Authenticated user | Carrier membership; server-derived carrier ID |

## Operational requirements

- Configure `APP_ALLOWED_ORIGINS` as a comma-separated exact-origin allowlist. The secure default is `https://x3compass.com,https://www.x3compass.com`.
- Configure `UPLOAD_TOKEN_SECRET` as a dedicated high-entropy server secret before re-enabling uploads. Unsigned legacy upload tokens are intentionally rejected.
- Keep upstream error bodies server-side. Client errors use an opaque code and correlation ID and must never include tenant data, credentials, or provider response bodies.
- Review Supabase and Cloudflare access logs for anomalous `carrier_id` enumeration against `/api/scorecards` and `/api/drivers/import`. Treat findings under the privacy-incident process and do not place affected PII in tickets or logs.
