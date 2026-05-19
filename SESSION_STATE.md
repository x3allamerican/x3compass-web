# X3 Compass — Session State

**Source of truth.** This file is the canonical "where we left off" record across every Claude session, every Cowork window, every machine. Chat compacts; agentmemory has phantoms; `main` is permanent. Read this first at session start. Update at session end.

Last updated: 2026-05-19 by Claude (Audit Export polished).

---

## Live status — what's wired, what's blocked

### Production deploys
- **app.x3compass.com / x3compass.com/app** — auto-deploys from `main` via Cloudflare Pages.
- **Repo:** github.com/x3fleetsafety/x3compass-web
- **Latest commit before this:** `b31a080` — inspections + accidents uniform pill column.

### Sprint #21 (current) — page-by-page audit of /app/
Already wired & polished:
- /app (Compliance Command Center) — 11-query parallel Supabase backend
- /app/drivers + /app/dq-files — visual DQ grid, real Supabase Storage, bulk import
- /app/vehicles
- /app/accidents — Definitions reference, severity/citation/D&A columns, uniform pills, dark-mode legibility
- /app/inspections — Levels I–VI Definitions card mirroring X3FS, uniform pills, grid-aligned legend
- /app/scorecards — composite score backend (90-day window) + tier filter + Definitions card with formula
- /app/audit-export — KPI cards + Quick-full-audit button + Scope definitions w/ CFR cites + uniform status pills + retry on failed
- /admin/social — Social Media Manager (Anthropic-backed generate + Postiz publish, env wired on CF Pages)

Remaining to audit in Sprint #21:
- /app/settings
- /app/marketing
- /app/notifications
- /app/prospects
- /app/audit-log
- /app/finance + /app/finance-team
- /app/integrations

### Sprint #21 Postiz integration
- User: Postiz Cloud, $49/mo plan.
- `POSTIZ_BASE_URL` defaults to `https://app.postiz.com` in `publish.ts` (this commit).
- `POSTIZ_API_KEY` set on Cloudflare Pages production + preview (deploy 49660eac).
- Smoke test status (pre-Postiz):
  - GET /api/admin/social/list → 200
  - POST /api/admin/social/generate → 200 (Anthropic post generated successfully)
  - POST /api/admin/social/bulk → 200
  - PATCH /api/admin/social/update → 200
  - POST /api/admin/social/publish → 503 (needs POSTIZ_API_KEY)

### Active blocked items
- **#127** CarrierOk Dev tier signup + Joe Parley discovery call — replaces seeded `compass_carrier_safer` with live FMCSA data.
- **#133** Checkr API Authorization Review Checklist — Joshua submits.
- **#136** Checkr ReportsOverview embed "Could not load" — investigate scope/cookie auth.
- **#138** 3 parallel skill-builder agents (FMCSA · Hazmat · Procedural).
- **#139** 2,400+ skill corpus build (1,800 FMCSA mandate).
- **#116** Book first attorney review ($1.5-2.5k).
- **#186** Joshua needs to `kill 35088 35076 35075 35025 35006 35004` and restart Claude — phantom agentmemory MCP processes are accepting saves into a void. Other sessions report "memory files disappeared" because of this.

### Persistent secrets location
- File: `/Users/joshuakovarik/Documents/Claude/Projects/X3 All-American/X3 Fleet Safety/secrets.env` (gitignored)
- Known keys present: GITHUB_PAT, CLOUDFLARE_API_TOKEN, POSTIZ_API_KEY, ANTHROPIC_API_KEY, BRIGHT_DATA_API_TOKEN, SUPABASE_API_KEY, RESEND_API_KEY, TWILIO_*, X3FS_STRIPE_*, X3EC_STRIPE_*, NIMBLE_API_KEY, PEXELS_API_KEY, UNSPLASH_*, ELEVENLABS_API_KEY, GEMINI_API_KEY, GOOGLE_MAPS_API_KEY, PIXABAY_API_KEY, YOUTUBE_API_KEY, D1_DATABASE_ID, KV_NAMESPACE_ID.

### Supabase tables added this sprint chain
- `compass_carrier_safer` — sidecar for FMCSA SAFER fields
- `compass_accidents` — extended w/ severity, citation, occurred_time, alc_test_status, drug_test_status
- `compass_social_posts` — platform, status, body, image_url, hashtags, scheduled_at, posted_at, postiz_id, ai_generated, ai_prompt_used
- `compass_vendor_integrations` — carrier_id + vendor unique
- RLS WITH CHECK added to compass_drivers, compass_vehicles, compass_dq_documents

### Seeded demo data (for the XPO test carrier)
- 10 drivers · 10 vehicles · 101 DQ docs · 25 inspections · 5 accidents · 30 D&A tests · 110 HOS logs · 67 training records · 1 CSA snapshot
- ⚠️ The 101 DQ docs have placeholder URLs at https://files.x3compass.com/demo/*.pdf — 404s.

---

## Persistence protocol (don't break this)

**Rule 1.** Anything you want to survive across sessions goes in a tracked file on `main`. Not chat. Not agentmemory. Not local memory.

**Rule 2.** Update this file (`SESSION_STATE.md`) at every meaningful checkpoint:
- Before ending a session
- After completing a sprint
- When status of any [in_progress] task changes
- When Joshua hands over a new blocker

**Rule 3.** Commit messages on `main` are the audit log. Always commit with a meaningful message; no `wip` or `update` commits.

**Rule 4.** The task list (#1–~186 currently) is the canonical "what we've done" log. Use TaskCreate/TaskUpdate every sprint.

**Rule 5.** If a new session asks "where did we leave off?" — point them to this file + `git log --oneline -20`.

---

## Reading order for a fresh session
1. This file (SESSION_STATE.md) — current sprint, blockers, status
2. `git log --oneline -30` — actual commits to date
3. TaskList() — pending + in_progress tasks
4. `/Users/joshuakovarik/Documents/Claude/Projects/X3 All-American/X3 Fleet Safety/X3 Compass/X3_COMPASS_LAUNCH_HANDOFF.md` — overall product context

That's it. Don't trust memory. Trust the repo.
