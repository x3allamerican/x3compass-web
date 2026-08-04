# Fleet Safety Batch 6 — Acceptance Matrix

| Task | Shipped capability | Primary evidence |
|---|---|---|
| 1 | Native carrier CSA snapshots, thresholds, and trends | `/api/csa/snapshots`, `/app/csa` |
| 2 | Evidence-backed recurring compliance calendar | `/api/compliance-calendar`, `/app/calendar` |
| 3 | Per-carrier expiration sweep and digest | `agent-expiration-sweep` |
| 4 | DataQ challenge lifecycle and evidence | `/api/dataq/challenges` |
| 5 | Clearinghouse query/consent/flag tracking | `/api/clearinghouse/status` |
| 6 | §390.15 accident register and retention | `/api/accident-register` |
| 7 | Tenant-scoped DQ, D&A, and accident PDFs | `/api/audit/pdf` |
| 8 | Roadside report parse, review, and BASIC mapping | `/api/inspections/parse` |
| 9 | Idempotent Samsara vehicle/driver/HOS sync | `/api/vendors/samsara/sync` |
| 10 | Notification feed, unread state, and producers | `/api/notifications` |
| 11 | Read-only monthly Stripe usage reconciliation | `/api/billing/usage-reconciliation` |
| 12 | Unit, contract, tenant-security, TypeScript, build, a11y/SEO CI, and API docs | `tests/`, `.github/workflows/` |

All derived regulatory and vendor outputs remain decision support. Unknown evidence is empty, unmapped, or human-review-required; it is never fabricated.

## Deployment handoff

The stacked PRs contain source only. Migrations marked `NEEDS CLAUDE TO APPLY` require deployment-owner review and application. Environment bindings, agent schedules, vendor credentials, webhooks, Cloudflare deployment, and live Stripe behavior remain untouched.

## Verification contract

- `npm run test:unit`
- `npm run test:security`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npx playwright test`

The Playwright workflow now runs the fast Node contract suite before browser tests, using the existing job and dependency install to avoid another billable CI job.
