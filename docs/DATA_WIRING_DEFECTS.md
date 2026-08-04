# X3 Compass data-wiring audit

Audit date: 2026-08-04  
Scope: all 45 `src/app/app/**/page.tsx` routes on `main` at `34f7ac3`  
Rule: authenticated tenant surfaces must render real carrier-scoped data or an honest empty state. A KPI and the list it summarizes must be derived from the same effective row set and time window.

## Executive result

The sweep found 10 fix tranches across 9 pages. Four are high-risk because authenticated or administrative views can substitute fabricated data when the real response is absent or empty. Six are medium-risk because a label, denominator, time window, or secondary source can disagree with the visible rows.

Preview-only examples are not classified as tenant defects when the component explicitly gates them on `!carrier`. They remain listed in the inventory so the boundary cannot be mistaken for production data.

## Findings

| ID | Priority | Surface | Evidence | Defect | Required correction |
|---|---|---|---|---|---|
| DW-001 | P0 | Marketing | `src/app/app/marketing/page.tsx:127-130` | Missing or empty API fields are replaced with `DEMO_KPIS`, `DEMO_FUNNEL`, `DEMO_TRAFFIC`, and named demo leads without a carrier/preview guard. Tiles and tables can therefore display fabricated activity to an authenticated operator. | Use zero/empty values for authenticated users, keep any showcase dataset behind an explicit preview mode, and derive KPIs from the same returned funnel/leads window. |
| DW-002 | P0 | Prospects | `src/app/app/prospects/page.tsx:154-170` | Empty API arrays fall through to demo carriers and distributions; KPIs independently fall through to fixed demo totals. A zero-result search can show named fabricated prospects and unrelated counts. | Preserve empty arrays, show a no-results state, and compute tab counts/distributions from the same returned row sets. |
| DW-003 | P0 | Integrations | `src/app/app/integrations/page.tsx:110-120` | An empty/error response is replaced with `DEMO_VENDORS`, and the summary is then computed from those rows. The page can claim integrations are live/configured when the probe returned no real vendors. | Render an error or empty registry state; never use catalog examples as operational health. Summary must reduce the displayed vendor rows. |
| DW-004 | P0 | Notifications | `src/app/app/notifications/page.tsx:94-100` | Tenant KPI fallback is mostly zero-safe, but `RULES` and `CHANNELS` unconditionally fall back to demo rule/channel rows when real arrays are empty. The active-rule KPI can also use `DEMO_RULES.length`, so tiles and tables can claim configured notification paths that do not exist. | Use tenant empty arrays and zero counts; allow demo rows only when `!carrier`; calculate active/critical counts from displayed real rules. |
| DW-005 | P1 | Drivers | `src/app/app/drivers/page.tsx:95-106,202-205` | “New this month” displays the `pending` status count rather than drivers whose creation/hire date is in the current month. “Inactive / Terminated” uses total minus active while its subtitle says “Last 90 days,” with no 90-day predicate. | Compute each labeled window from dates/status explicitly and use that same filtered set in the corresponding table/filter. |
| DW-006 | P1 | Dashboard | `src/app/app/page.tsx:359-361` | Alert legend hardcodes Info to `0` while urgent and warning are derived from the dashboard response. The legend can disagree with the alerts list and total. | Return or derive informational alerts from the same alert rows and assert urgent + warning + info equals the displayed total. |
| DW-007 | P1 | Background checks | `src/app/app/background-checks/page.tsx:168-174,364-367` | “Completed” counts only `status === completed` but its subtitle says “clear or eligible results”; engaged/adjudicated completed reports can be omitted. “Consider / adverse” mixes report result/assessment and workflow status, so duplicate semantic paths need one canonical predicate. | Define shared lifecycle predicates used by tiles, filters, and rows; test all Checkr states. (Lifecycle/ETA presentation is addressed separately in Batch 5 Task 3.) |
| DW-008 | P1 | MVR | `src/app/app/mvr/page.tsx:398-405` | Page KPIs are calculated from MVR record rows while continuous-monitor status is fetched separately. Labels that imply monitored-driver state can diverge from the monitor list, particularly pending/paused/canceled enrollments. | Keep record-health KPIs explicitly record-based and add monitor KPIs from the exact `monitors` array returned by `/continuous-mvr/list`. |
| DW-009 | P1 | Finance | `src/app/app/finance/page.tsx:200-205,333-337` | The KPI strip combines ledger KPIs and independently fetched client totals; the table is filterable by month/vendor/carrier, but tiles remain based on the unfiltered response. The same page can show a filtered table with unrelated totals. | Label tiles as global or recompute them from the filtered ledger rows; do not imply that filters affect totals unless they do. |
| DW-010 | P1 | Finance team | `src/app/app/finance-team/page.tsx:220-223` | “Live agents” comes from the displayed registry, but 30-day runs/success rate come from a separate summary. With filtering or partial API responses the visible run list and KPIs can use different populations. | Define the KPI scope in the UI and derive both tiles and run table from one response/window contract. |

## Verified real-data-or-empty boundaries

These pages contain showcase constants but explicitly route signed-in carriers to real components or gate examples on `!carrier`; they do not currently leak demo counts into a tenant view:

- Audit log: preview rows gated by `allowDemo = !carrier`; tenant KPIs use the API/zero state (`audit-log/page.tsx:85-100`).
- Scorecards: demo fleet and rows gated by `allowDemo = !carrier` (`scorecards/page.tsx:108-117`).
- DQ files, Drug & Alcohol, IFTA, and Training: signed-in carriers branch to `RealDqFiles`, `RealDrugAlcohol`, `RealIfta`, and `RealTraining` respectively (`dq-files/page.tsx:67`, `drug-alcohol/page.tsx:58`, `ifta/page.tsx:40`, `training/page.tsx:67`).
- HOS, Inspections, and Vehicles: `withDemoFallback` is enabled only when there is no carrier (`hos/page.tsx:105`, `inspections/page.tsx:146`, `vehicles/page.tsx:73`).
- Accidents, audit export, clearinghouse, and inspections calculate their visible totals from their effective displayed rows; no independent hardcoded tenant KPI was found.

Preview copy still contains fixed dates/counts. It is not production tenant data, but should eventually be moved into an explicitly labeled showcase route to reduce future regression risk.

## Route inventory

Every app route inspected is accounted for below.

| Disposition | Routes |
|---|---|
| Finding | `/app`, `background-checks`, `drivers`, `finance`, `finance-team`, `integrations`, `marketing`, `mvr`, `notifications`, `prospects` |
| Preview-gated examples, tenant path safe | `audit-log`, `clearinghouse`, `dq-files`, `drug-alcohol`, `hos`, `ifta`, `inspections`, `scorecards`, `training`, `vehicles` |
| Same-row-set / no numeric KPI defect found | `accidents`, `ask`, `audit-export`, `background`, `control-center`, `csa`, `da-concierge`, `document-lookup`, `driver-invites`, `forms`, `hazmat`, `hazmat/audit`, `hazmat/emergency-response`, `hazmat/exemptions`, `hazmat/lithium`, `hazmat/placard-wizard`, `hazmat/security-plan`, `hazmat/shipping-papers`, `hazmat/substances`, `hazmat/training`, `import`, `onboarding`, `pdf-test`, `settings`, `settings/billing` |

## Fix order and acceptance invariant

Batch 5 Task 7 should fix DW-001 through DW-010 in that order, grouping only changes that share a page. Each regression test must supply a row fixture, run the page's exported/shared reducer, and prove the rendered tile value equals the count or sum of the visible rows for the same scope. Empty fixtures must yield zero/empty UI—never demo data.

This is a source audit only. It made no live request, database write, migration, deployment, vendor call, or secret access.
