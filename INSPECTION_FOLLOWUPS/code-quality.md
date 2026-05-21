# Code Quality Follow-up — 8.6 → 9.5+ Path

Date: 2026-05-19 · Scope: `src/app/app/**` + `functions/api/**` + `functions/_shared/agent-registry.ts`

---

## 1. Backend wiring — 4 pages still demo-only (−0.5)

| Page | File | Status | Should pull from |
|---|---|---|---|
| HOS | `src/app/app/hos/page.tsx:20` `HOS_DATA: DriverHOS[] = [...]` | 100% static, no Supabase import | `compass_hos_status` (driver_id, duty14_used, drive11_used, cycle70_used, break_required, updated_at) — backed by ELD ingest or manual entry |
| MVR | `src/app/app/mvr/page.tsx:21` `MVR_DATA: MVR[] = [...]` | 100% static | `compass_mvr_records` (driver_id, state, license_no, pulled_at, pulled_by, points, violations_count, status) |
| IFTA | `src/app/app/ifta/page.tsx` | static | `compass_ifta_trips` + `compass_ifta_quarters` (gallons, miles per state, totals) |
| Drug & Alcohol | `src/app/app/drug-alcohol/page.tsx` | static (no `getSupabase`/`from(` calls) | `compass_da_tests` (driver_id, test_type, result, collection_date, mro_signed_at, clearinghouse_query_id) |

Patch shape (per page, ~120 LOC each):
- `"use client"` + `useEffect` → `getSupabase().from("compass_hos_status").select("*").eq("carrier_id", carrier.id)`
- Fall back to `DEMO_*` array when no rows returned, mirroring Sprint #21 pattern in `prospects/page.tsx`.

**Effort:** 4 × ~90 min = 6h. **Score impact:** +0.4 (functionality criterion).

---

## 2. Error handling — 5 silent swallows + 21 pages without user-visible error (−0.3)

**Silent swallows** (`grep -rEn "catch\\s*\\(\\s*\\(\\s*\\)\\s*=>\\s*\\{\\s*\\}"`):
1. `src/app/app/settings/page.tsx:165` audit/build fire-and-forget
2. `src/app/app/audit-export/page.tsx:74` audit/build
3. `src/app/app/audit-export/page.tsx:204` audit/build
4. `functions/api/auth/invite.ts:65`
5. `functions/api/auth/invite.ts:119` sendInviteEmail

These 5 are arguably intentional (background fire-and-forget). **Patch:** wrap with `.catch(e => console.warn("[non-fatal]", e))` so they show in dashboards but don't break flow.

**Pages without `setError`** — only 7 of 28 `/app/*` pages surface a fetch failure: `settings`, `settings/billing`, `onboarding`, `accidents`, `inspections`, `integrations`, `audit-export`. The other **21** silently keep showing previous (or demo) data. Missing: dashboard, drivers, vehicles, dq-files, training, mvr, hos, ifta, drug-alcohol, da-concierge, background, background-checks, driver-invites, scorecards, finance, finance-team, marketing, notifications, prospects, audit-log, ask.

**Patch** to each page:
```tsx
const [err, setErr] = useState<string|null>(null);
// in fetch catch:
setErr(e instanceof Error ? e.message : "Load failed");
// in JSX (near top of content):
{err && <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200 px-4 py-3 text-[13px] font-medium">{err} <button onClick={()=>load()} className="underline ml-2">Retry</button></div>}
```

**Effort:** 21 × 10 min = 3.5h. **Score impact:** +0.3.

---

## 3. Code duplication — 14 distinct pill implementations (−0.4)

`grep -rEn "function (Status|Type|Rating|Outreach|Run|Channel|Action|Severity|Tier)Pill"`:

| File | Pill defined |
|---|---|
| `prospects/page.tsx:68` | `RatingPill` |
| `prospects/page.tsx:84` | `OutreachPill` |
| `prospects/page.tsx:97` | `RunPill` |
| `accidents/page.tsx:46` | generic `Pill` |
| `audit-log/page.tsx:51` | `ActionPill` |
| `inspections/page.tsx:33` | generic `Pill` |
| `audit-export/page.tsx:29` | `StatusPill` |
| `marketing/page.tsx:49` | `StatusPill` (different impl) |
| `finance/page.tsx:40` | `TypePill` |
| `finance/page.tsx:52` | `StatusPill` (third impl) |
| `notifications/page.tsx:60` | `StatusPill` (fourth impl) |
| `notifications/page.tsx:67` | `ChannelPill` |
| `scorecards/page.tsx:52` | `Pill` (tier-based) |
| `finance-team/page.tsx:113` | `RunStatusPill` |

That's **14 implementations** (4 distinct `StatusPill`s alone) plus duplicate `LEVEL_COLORS`/`OUTCOME_COLORS` palettes inlined in `inspections` + `accidents`.

**Patch — create `src/components/Pill.tsx`:**
```tsx
"use client";
import { ReactNode } from "react";
export type PillTone = "green"|"emerald"|"amber"|"rose"|"red"|"blue"|"cyan"|"violet"|"slate"|"black";
export type PillSize = "sm"|"md"|"lg";
const TONE: Record<PillTone,string> = {
  green:   "bg-green-700 text-white border-green-800 dark:bg-emerald-500/45 dark:text-emerald-50 dark:border-emerald-300/80",
  emerald: "bg-emerald-700 text-white border-emerald-800 dark:bg-emerald-500/45 dark:text-emerald-50 dark:border-emerald-300/80",
  amber:   "bg-amber-600 text-white border-amber-700 dark:bg-amber-500/45 dark:text-amber-50 dark:border-amber-300/80",
  rose:    "bg-rose-700 text-white border-rose-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
  red:     "bg-red-700 text-white border-red-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
  blue:    "bg-blue-700 text-white border-blue-800 dark:bg-blue-500/45 dark:text-blue-50 dark:border-blue-300/80",
  cyan:    "bg-cyan-700 text-white border-cyan-800 dark:bg-cyan-500/45 dark:text-cyan-50 dark:border-cyan-300/80",
  violet:  "bg-violet-700 text-white border-violet-800 dark:bg-violet-500/45 dark:text-violet-50 dark:border-violet-300/80",
  slate:   "bg-slate-600 text-white border-slate-700 dark:bg-slate-500/45 dark:text-slate-50 dark:border-slate-300/80",
  black:   "bg-black text-white border-black dark:bg-black dark:text-white dark:border-white/60",
};
const SIZE: Record<PillSize,string> = { sm: "min-w-[110px] px-2.5 py-1 text-[10px]", md: "min-w-[130px] px-3 py-1.5 text-[11px]", lg: "min-w-[150px] px-3.5 py-2 text-[12px]" };
export function Pill({ tone="slate", size="md", children }: { tone?: PillTone; size?: PillSize; children: ReactNode }) {
  return <span className={`inline-block rounded-full font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${SIZE[size]} ${TONE[tone]}`}>{children}</span>;
}
export const statusTone = (s: string): PillTone => ({ active:"emerald", ok:"emerald", pending:"amber", warning:"amber", failed:"rose", error:"rose", canceled:"slate", paused:"slate" }[s.toLowerCase()] ?? "slate");
export const tierTone   = (t: string): PillTone => ({ platinum:"violet", gold:"amber", silver:"slate", bronze:"amber", at_risk:"rose" }[t.toLowerCase()] ?? "slate");
```

Then sweep all 14 sites: `<StatusPill status={x}/>` → `<Pill tone={statusTone(x)}>{x}</Pill>`. Removes ~280 LOC of duplication.

**Effort:** 4h (1h component + 3h sweep). **Score impact:** +0.4 (consistency + maintainability).

---

## 4. Agent reliability — sampled 5, all conform

Sampled `agentBillingWatchdog` (L126), `agentFinancialAggregator` (L149), `agentFmcsaScraper` (L398), `agentRevenueManager` (L701), `agentPricingMargin` (L1177).

Counts across the 1,274-line registry: `return { status: "skipped"` × **18**, `return { status: "error"` × **17**, `throw new Error` × **4** (all in helpers `stripeGet`/`askClaude` — bubble up to the per-agent `try/catch` in `runAgent` at L1232).

Verdict: pattern is solid. Two soft callouts:
- `agentPricingMargin:1186-1189` correctly skips when `compass_usage_events` missing — but doesn't surface to operator. Add `log.warn("telemetry table not deployed yet")` + a `compass_agent_alerts` row so Control Center sees it.
- `agentBillingWatchdog:140` swallows per-carrier errors into the log only; doesn't tag result as `partial` when some Stripe calls fail:
  ```ts
  let stripeFailed = 0;
  ... } catch (e) { stripeFailed++; log.warn(...); }
  return { status: stripeFailed === carriers.length ? "error" : (issues.length || stripeFailed) ? "partial" : "ok", ... };
  ```

**Effort:** 2h. **Score impact:** +0.1.

---

## 5. Auth + rate limit — 2 admin endpoints unsafe (−0.4)

`functions/api/admin/*.ts` (4 total):

| File | Auth | Rate-limit |
|---|---|---|
| `admin/finance-team.ts` | `requireSuperAdmin(ctx)` at L23 | NO |
| `admin/integrations.ts` | `requireSuperAdmin(ctx)` at L62 | NO |
| `admin/partners.ts` | **`?key=ADMIN_KEY` shared-secret in URL** (L32, L65) — leaks to access logs/Referer | NO |
| `admin/social/publish.ts` | **NO AUTH AT ALL** — any POST publishes to Postiz | NO |

Plus several `_shared/*` files are **imported but missing from the synced tree**: `admin-auth.ts`, `supabase-admin.ts`, `rate-limit.ts`, `emails.ts`, `finance-team.ts` (referenced from `agent-registry.ts` L13-15, L64, L705 and from `admin/finance-team.ts`, `admin/integrations.ts`, `auth/invite.ts`). Only `vendor-mapper.ts` + `agent-registry.ts` are on disk. Either the workspace mirror is partial (most likely — production still works) or these will explode at deploy. **Verify before patching anything else.**

Only 1 of 19 endpoints uses `rateLimit` (`auth/invite.ts:15`). Need it on: `partners/apply.ts`, `screenings/order.ts`, `screenings/webhook.ts`, `drivers/import.ts`, `checkr/session-token.ts`, `prospects/outreach.ts`, `audit-log.ts`, `dashboard.ts`, `marketing.ts`, `notifications.ts`, `scorecards.ts`, `prospects.ts`, `vendors/tenstreet/sync.ts`, `admin/social/publish.ts`.

**Patches:**
1. `admin/social/publish.ts` — prepend `const g = await requireSuperAdmin(ctx); if (!g.ok) return unauthorized();`.
2. `admin/partners.ts` — replace `?key=` gate with JWT `requireSuperAdmin`; keep `ADMIN_KEY` as break-glass only via header `x-admin-key`, never query string.
3. Add `rateLimit(ctx, { key: "ip:" + ip, limit: 30, window: 60 })` to the 14 endpoints above.
4. Confirm the 5 missing `_shared/*` files exist in the live deploy (tail a `/api/admin/finance-team` request — if it 500s on missing module, ship those files first).

**Effort:** 5h. **Score impact:** +0.4 (security + risk).

---

## Bonus

- **No `functions/api/health.ts`** — `https://x3compass.com/api/health` would 404. Add 6 lines: `export const onRequest: PagesFunction = async () => new Response(JSON.stringify({ ok: true, ts: Date.now() }), { headers: { "Content-Type": "application/json" } });`.
- **TypeScript hygiene clean:** 0 occurrences of `any[]` in `src/`.
- **`recordUsage` telemetry:** referenced via `_shared/finance-team.ts` import from `agentRevenueManager:705` — confirm it's wired on prod. If `compass_usage_events` is empty after a billing run, the import path is broken.
- **RLS bypass via service-role:** `admin/partners.ts:23` uses service-role correctly (super-admin-only data) — *but* combined with URL shared-secret it's the weakest auth path in the codebase. Fix #5.2 above resolves it.

---

## Summary by criterion

| Criterion | Current | After patches | Δ |
|---|---|---|---|
| Backend wiring | 8.6 | 9.0 | +0.4 |
| Error handling | 8.0 | 9.0 | +0.3 |
| Code duplication | 7.5 | 9.5 | +0.4 |
| Agent reliability | 9.0 | 9.2 | +0.1 |
| Auth + rate limit | 7.0 | 9.5 | +0.4 |

**Total queued effort:** ~20h (1 focused day + change-review).

Estimated path 8.6 → 9.6.
