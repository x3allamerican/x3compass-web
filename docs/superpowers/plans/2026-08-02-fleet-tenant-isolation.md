# Fleet Tenant Isolation Remediation Implementation Plan

> **For agentic workers:** Execute inline with strict red-green-refactor cycles. Do not deploy or merge.

**Goal:** Eliminate unauthenticated and cross-tenant service-role access in X3 Fleet Safety.

**Architecture:** Shared request-security functions establish a verified principal and authorized carrier before route business logic executes. Each API route declares one auth class; public routes cannot touch tenant tables.

**Tech stack:** Cloudflare Pages Functions, TypeScript, Supabase Auth/PostgREST, Playwright test runner.

## Global constraints

- Never print or commit secrets or PII.
- Containment is the first commit.
- Caller-provided tenant identifiers are assertions to verify, never authority.
- No deployment and no automatic merge.

### Task 1: Contain exposed routes

- [ ] Add direct handler tests expecting scorecards and driver import to return 503 without data or wildcard CORS.
- [ ] Run the tests and confirm they fail against the exposed handlers.
- [ ] Replace both handlers with temporary fail-closed responses and rerun the tests.
- [ ] Commit only containment, its tests, and these approved design documents.

### Task 2: Establish shared request security

- [ ] Add failing tests for missing/invalid JWT, malformed UUID, cross-tenant carrier assertion, allowed membership, origin allowlist, and opaque correlation errors.
- [ ] Implement UUID validation, bearer verification, membership resolution, origin policy, and safe error helpers.
- [ ] Run the focused suite and refactor only after it passes.

### Task 3: Migrate tenant and admin routes

- [ ] Inventory every `functions/api/**/*.ts` route in a machine-readable classification document.
- [ ] Add failing negative tests for every tenant-data route family.
- [ ] Update routes so service-role tenant access consumes the resolved carrier ID.
- [ ] Replace partner-admin URL/localStorage keys with bearer super-admin authentication.
- [ ] Replace Stripe/provider client details with opaque correlation errors.

### Task 4: Verify and publish

- [ ] Run focused security tests, existing API tests, TypeScript/build, and a changed-file lint check.
- [ ] Confirm no wildcard CORS remains on tenant routes and no URL admin key remains.
- [ ] Commit the full remediation, push the branch, and open a ready-for-review PR.
- [ ] Include route classifications and the access-log incident-review recommendation in the PR body.
