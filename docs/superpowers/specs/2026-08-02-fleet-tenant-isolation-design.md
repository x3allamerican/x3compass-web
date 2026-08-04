# Fleet Tenant Isolation Remediation Design

## Scope and authority

This change closes confirmed cross-tenant PII read/write paths in X3 Fleet Safety. It does not deploy, migrate data, rotate secrets, inspect live records, or merge to production. Human review remains the production gate.

## Security model

Every API route has an explicit auth class: public, authenticated tenant user, admin, signed webhook, or internal service. Public routes may not access tenant data. Tenant routes verify a Supabase access token, resolve memberships server-side with the service role, validate UUIDs, reject requested carriers outside those memberships, and use only the resolved carrier ID. Admin routes use authenticated super-admin or internal-service principals; shared secrets never travel in URLs or browser storage.

Tenant responses use an origin allowlist and never wildcard CORS. Client errors are opaque and carry a correlation ID; provider/database details remain in sanitized server logs. Route handlers return only fields needed by their caller.

## Delivery sequence

The first commit fails closed on scorecards and driver import and removes wildcard CORS. The second commit introduces shared enforcement, migrates the remaining service-role tenant routes, removes URL/localStorage admin secrets, makes Stripe errors opaque, and documents every route classification. No PR is auto-merged.

## Verification

Direct handler tests prove unauthenticated rejection, cross-tenant rejection, malformed UUID rejection before data access, allowed/disallowed origin behavior, server-derived carrier selection, containment behavior, and opaque errors. Existing API smoke tests remain. The PR recommends a privacy-incident review of Supabase and Cloudflare access logs without logging PII.
