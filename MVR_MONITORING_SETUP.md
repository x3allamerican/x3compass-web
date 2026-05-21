# MVR Monitoring — Go-Live Checklist

**Status as of 2026-05-19 19:30:** Code complete (commit `6d93727`), waiting on two human-side steps to flip live.

---

## What's already done (in code, queued for push)

- ✅ Database schema (`supabase/migrations/20260520_continuous_checks.sql`)
- ✅ Enroll endpoint (`POST /api/screenings/continuous-mvr/enroll`)
- ✅ List endpoint (`GET /api/screenings/continuous-mvr/list`)
- ✅ Cancel endpoint (`POST /api/screenings/continuous-mvr/cancel`)
- ✅ Webhook handler extended for `continuous_check.*` + `mvr_report.*` events
- ✅ `/app/mvr` UI — Continuous MVR Monitoring card with KPIs, enroll modal, cancel flow
- ✅ Notifications wired — every MVR hit creates a `compass_notifications` row
- ✅ Pricing constants baked in: $5/driver/mo retail, $9.50/hit + state fees at-cost passthrough

## What Joshua needs to do (3 steps, ~5 min total)

### Step 1 — Apply the Supabase migration (60 seconds)

The migration creates two tables: `compass_continuous_checks` (enrollments) and `compass_continuous_check_events` (audit log of every Checkr webhook).

**Option A — Supabase Studio (easiest):**
1. Open https://supabase.com/dashboard/project/<your-project>/sql/new
2. Paste the contents of `supabase/migrations/20260520_continuous_checks.sql`
3. Click "Run"
4. Verify the success message — should see `Success. No rows returned`

**Option B — Supabase CLI (if linked):**
```bash
cd ~/Documents/Claude/Projects/X3\ All-American/X3\ Fleet\ Safety/X3\ Compass/x3compass-redesign/web
supabase db push
```

**The migration is idempotent** — safe to run multiple times. Uses `if not exists` on every CREATE, `drop policy if exists` before each RLS rule, and `create or replace` on the trigger function.

### Step 2 — Verify Checkr webhook captures the new event types (90 seconds)

Open the Checkr Dashboard → Account → Webhooks. Confirm the existing webhook (the one pointed at `https://x3compass-web.pages.dev/api/screenings/webhook?vendor=checkr`) is subscribed to:

- `continuous_check.created`
- `continuous_check.canceled`
- `continuous_check.completed`
- `mvr_report.created`
- `report.created` (already subscribed — used for baseline MVRs, also used for continuous hits)

If any of these aren't checked, click into the webhook → Edit → tick them → Save. Same signing secret keeps working — no env var changes needed.

### Step 3 — Wait for Checkr's qualification approval email

You submitted the Continuous MVR Add-On Request earlier today. Checkr will email when it's approved. Until then:
- Enroll attempts return `ACCOUNT_NOT_APPROVED` with a friendly message on the UI
- Once approved, **everything starts working automatically** — no code changes needed

---

## How to test the moment Checkr approves

1. Go to https://x3compass-web.pages.dev/app/background-checks
2. Send a Checkr invitation to a test driver (you can use yourself — Checkr's test mode accepts staging credentials)
3. After the baseline MVR comes back with `result=clear`, head to https://x3compass-web.pages.dev/app/mvr
4. Click "+ Enroll driver" on the Continuous MVR Monitoring card
5. Pick the driver from the dropdown → Submit
6. Verify a row appears in the enrollments table with status `active`

**To simulate a hit (staging):** Checkr's staging API has a method for triggering test MVR events. If we want to verify the full hit path before going live, ask me to write a test trigger script.

---

## What you'll see in production

**Where MVR hits surface:**
1. **`/app/mvr`** — Hit count increments in the enrollment row, `last_hit_at` updates
2. **`/app/notifications`** — A new `continuous_mvr_hit` notification with severity=warn appears
3. **Email** — If you've configured the `continuous_mvr_hit` notification rule to email
4. **Driver-reminders agent** — Surfaces the hit on the next agent run (every 6 hours)

**Where pricing surfaces:**
- Per-enrollment billing fields stored on the row: `monthly_fee_cents=500`, `per_report_fee_cents=950`
- These will feed into the finance/billing aggregator (next task: extend `agent-financial-aggregator` to bill continuous-MVR seats monthly)

---

## State fees to add to the carrier invoice (passthrough at cost)

These are per-enrollment one-time fees Checkr passes through. Pull from `compass_continuous_checks.enrollment_fee_cents`:

| State | Fee | Notes |
|---|---|---|
| California | varies | See Checkr's State-specific continuous MVR fees doc for the current number |
| Colorado | varies | " |
| New Hampshire | varies | " |
| Utah | varies | " |
| All other states | $0 | " |

Checkr will report the exact fee in the `continuous_check.created` webhook payload — we capture it in `enrollment_fee_cents` automatically.

---

## When GitHub is restored — push order

Commits in the queue (in chronological order — oldest first):

```
efa2ce5  audit-log: real compass_audit_log backend
04a48a6  finance: CHAMPION rebuild
aa60c78  finance-team: 5→9 agents
feb8e9e  Integrations live probes + 4 Finance Team agents
e8f4890  a11y: --fg-faint slate-600
d5f03ca  seo: /pricing title + per-page metadata
bf0651d  /pricing migrate to SiteShell
37265e8  perf: skeleton loaders
b0cc884  security + funnel
71add7b  perf (Batch B)
4efeae9  a11y (Batch C)
4b28113  perf+sec (Batch D)
67be824  trust (Batch E)
857d10a  checkr: smoke + webhook fix + backfill
f67b7ab  background-checks: AppShell + X3 fallback
e381346  checkr: ReportsOverview scope fix
1bd6bd0  a11y contrast: 9 marketing files
0106261  a11y contrast: 26 files site-wide
6d93727  mvr-continuous: full vertical  ← this commit
```

19 commits total, all already mirrored to this workspace folder.

---

*Last updated: 2026-05-19 19:30 by Claude*
