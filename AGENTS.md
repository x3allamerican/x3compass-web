# X3 Admin Control Center — Agent Backend Runbook

This documents the real backend that the `/app/control-center` workflows use.
Sprint #15 stopped pretending — every button now hits a Pages Function backed
by Supabase tables and a GitHub Actions cron dispatcher.

## What got built

| Piece | File |
|---|---|
| Database schema + RLS + 26-agent seed | `supabase/migrations/20260517_compass_admin_agents.sql` |
| Super-admin auth helper (JWT or X3_INTERNAL_SECRET) | `functions/_shared/admin-auth.ts` |
| Agent execution registry (real keepalive + 25 stubs) | `functions/_shared/agent-registry.ts` |
| Cron-expression "next run" calculator | `functions/_shared/cron.ts` |
| `GET /api/admin/agents` | `functions/api/admin/agents/index.ts` |
| `PATCH /api/admin/agents/[name]` | `functions/api/admin/agents/[name].ts` |
| `POST /api/admin/agents/[name]/run` | `functions/api/admin/agents/[name]/run.ts` |
| `GET /api/admin/agents/[name]/logs` | `functions/api/admin/agents/[name]/logs.ts` |
| `GET/PATCH /api/admin/carrier-prefs` | `functions/api/admin/carrier-prefs.ts` |
| `POST /api/admin/dispatch` (cron entry) | `functions/api/admin/dispatch.ts` |
| GitHub Actions every-5-min dispatcher | `.github/workflows/agent-dispatcher.yml` |
| Frontend hook (fetches the API) | `src/lib/useAgentState.ts` |
| Logs modal that shows real DB runs | `src/components/AdminModals.tsx` |

## One-time setup

### 1. Apply the migration
```bash
# Local: via supabase CLI
supabase db push

# Remote: paste the SQL into Supabase SQL Editor and run
cat supabase/migrations/20260517_compass_admin_agents.sql
```
This creates `compass_agents`, `compass_agent_runs`, `compass_carrier_prefs`,
RLS policies that gate to super-admins, and inserts all 26 agents.

### 2. Set the Cloudflare Pages env vars
On the x3compass-web Pages project → Settings → Environment variables:

| Var | Value |
|---|---|
| `X3_INTERNAL_SECRET` | A long random string (`openssl rand -hex 32`). Shared with GitHub. |
| `SUPABASE_URL` | Already set |
| `SUPABASE_SERVICE_ROLE` | Already set |
| `ANTHROPIC_API_KEY` | Already set |
| `STRIPE_SECRET_KEY` | Already set |
| `RESEND_API_KEY` | Already set (or add now) |

### 3. Set the GitHub repo secret
On `github.com/x3fleetsafety/x3compass-web` → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `X3_INTERNAL_SECRET` | **The same string as Cloudflare** |

Without this, the dispatcher workflow fails fast with a clear error.

### 4. (Optional) Backfill carrier preferences
For each carrier you want in the Carrier Preferences tab:
```sql
insert into compass_carrier_prefs (carrier_id, dot_number, carrier_name)
values (gen_random_uuid(), '8001247', 'DEMO · Apex');
```
The 8 demo rows already exist in the seed; add more as you onboard real carriers.

## How a run actually executes

1. GitHub Actions cron fires `agent-dispatcher.yml` every 5 minutes.
2. The workflow POSTs to `https://x3compass.com/api/admin/dispatch` with the
   `X-X3-Internal-Secret` header.
3. `functions/api/admin/dispatch.ts` selects every scheduled+enabled agent
   whose `next_run_at` ≤ now (or null).
4. For each due agent, it POSTs to `/api/admin/agents/[name]/run` (also
   internal-secret authenticated).
5. The run handler:
   - Inserts a `running` row in `compass_agent_runs`
   - Calls `runAgent(name, env)` from the registry
   - Updates the run row with status + duration + summary + log
   - Updates `compass_agents.last_run_at` / `last_result`
6. The dispatcher updates `compass_agents.next_run_at` from `cron_expr` so
   the same agent isn't re-fired on the next 5-minute tick.

The "Run now" button in the UI hits step 4 directly (with the user's
super-admin JWT, not the internal secret).

## How to implement an agent

Today exactly one agent is real: `agent-keepalive` (the reference). It pings
Supabase / Anthropic / Stripe / Resend and reports the count of healthy
vendors. Every other agent returns `status='skipped'` with a TODO summary.

To implement a new one — say `agent-driver-reminders`:

1. Open `functions/_shared/agent-registry.ts`.
2. Add a new function:
   ```ts
   async function agentDriverReminders(env: Env): Promise<AgentResult> {
     const lines: string[] = [];
     // 1. query compass_drivers for CDL expiring in 30/14/7/1 days
     // 2. for each, render the right email/SMS template
     // 3. send via Resend / Twilio (env.RESEND_API_KEY / TWILIO_*)
     // 4. log every send to compass_notification_log
     return { status: "ok", summary: "Sent 12 reminders · 0 failures", log: lines.join("\n") };
   }
   ```
3. Update the dispatcher:
   ```ts
   if (name === "agent-driver-reminders") return agentDriverReminders(env);
   ```
4. Remove the agent name from `STUBBED_AGENTS`.

Deploy. Next time the dispatcher fires it (or you click Run now), the real
implementation runs. The Activity tab updates automatically.

## Authorization model

There are exactly two ways to authorize a request to the admin Pages Functions:

1. **Super-admin user JWT** — the Supabase access token of a user whose email
   is in `SUPER_ADMIN_EMAILS` (joshua@x3compass.com, joshua@x3fleetsafety.com,
   joshuakovarik@yahoo.com) OR whose `user_metadata.role === 'super_admin'`.
   The browser sends this on every fetch in `useAgentState.ts`.

2. **`X-X3-Internal-Secret` header** — used by the GitHub Actions dispatcher
   to fire scheduled runs. The secret must match `env.X3_INTERNAL_SECRET`.

The RLS policies on the Supabase tables are belt-and-suspenders — they check
`is_super_admin()` against the JWT independently. Pages Functions use the
service-role key (bypassing RLS) only AFTER `requireSuperAdmin` succeeds.

## Cleanup

If you ever need to wipe the prototype state from a browser:
```js
['x3-agent-state-v2', 'x3-carrier-prefs-v2', 'x3-activity-log-v2'].forEach(k => localStorage.removeItem(k));
```
Or click the `↺ Reset` button in `/app/control-center`.
