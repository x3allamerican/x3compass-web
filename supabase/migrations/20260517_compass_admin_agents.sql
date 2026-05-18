-- X3 Admin Control Center — agents, runs, carrier preferences
-- Phase 2: make the Control Center workflows real.
--
-- Tables:
--   compass_agents          — the catalog of every X3 automation (scheduled + on-demand + stub)
--   compass_agent_runs      — one row per fire (manual or cron). The Activity tab reads this.
--   compass_carrier_prefs   — per-carrier alert preferences (mode + send hour + 7 toggles)
--
-- Auth model:
--   These are X3-internal tables. RLS is enabled and only super-admins (whose
--   profile.role = 'super_admin') can read or write. The Pages Functions use
--   the service-role key to bypass RLS after manually checking the JWT.

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- compass_agents — agent catalog
-- ----------------------------------------------------------------------------
create table if not exists compass_agents (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null unique,
  kind            text not null check (kind in ('scheduled', 'on_demand', 'stub')),
  cadence         text,                -- human-readable, e.g. 'Every 6 hours' or 'Queued inputs' for on-demand
  cron_expr       text,                -- machine-readable cron (UTC) for scheduled. null for on-demand/stub.
  description     text not null,
  enabled         boolean not null default true,
  last_run_at     timestamptz,
  last_result     text check (last_result in ('ok','partial','error','skipped','never')) default 'never',
  next_run_at     timestamptz,         -- when the cron dispatcher should fire this next; updated after each run
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists compass_agents_next_run_idx on compass_agents (next_run_at) where enabled = true and kind = 'scheduled';

-- ----------------------------------------------------------------------------
-- compass_agent_runs — every execution
-- ----------------------------------------------------------------------------
create table if not exists compass_agent_runs (
  id              uuid primary key default uuid_generate_v4(),
  agent_name      text not null references compass_agents(name) on delete cascade,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  duration_ms     int,
  status          text not null check (status in ('ok','partial','error','skipped','running')),
  summary         text,
  log             text,                -- captured stdout/stderr for the Logs modal
  triggered_by    text not null default 'cron' check (triggered_by in ('cron','manual','webhook')),
  triggered_by_user uuid              -- references auth.users(id); set when triggered_by='manual'
);

create index if not exists compass_agent_runs_agent_idx on compass_agent_runs (agent_name, started_at desc);
create index if not exists compass_agent_runs_recent_idx on compass_agent_runs (started_at desc);

-- ----------------------------------------------------------------------------
-- compass_carrier_prefs — per-carrier notification preferences
-- ----------------------------------------------------------------------------
create table if not exists compass_carrier_prefs (
  carrier_id      uuid primary key,    -- references compass_carriers(id) when in place
  dot_number      text not null unique,
  carrier_name    text not null,
  mode            text not null default 'Realtime' check (mode in ('Realtime','Digest')),
  send_hour       text not null default '8am',
  monthly         boolean not null default true,
  reg             boolean not null default true,
  qbr             boolean not null default true,
  expiry          boolean not null default true,
  csa             boolean not null default true,
  ifta            boolean not null default true,
  inspect         boolean not null default true,
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- RLS — super-admin only at the DB layer
-- ----------------------------------------------------------------------------
alter table compass_agents          enable row level security;
alter table compass_agent_runs      enable row level security;
alter table compass_carrier_prefs   enable row level security;

-- Helper: is current user a super-admin?
create or replace function is_super_admin() returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() ->> 'role') = 'super_admin'
              or  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
              or  (auth.jwt() ->> 'email') in (
                    'joshua@x3compass.com',
                    'joshua@x3fleetsafety.com',
                    'joshuakovarik@yahoo.com'
                  ), false);
$$;

create policy "super_admin_read_agents"      on compass_agents          for select using (is_super_admin());
create policy "super_admin_write_agents"     on compass_agents          for all    using (is_super_admin()) with check (is_super_admin());
create policy "super_admin_read_runs"        on compass_agent_runs      for select using (is_super_admin());
create policy "super_admin_write_runs"       on compass_agent_runs      for all    using (is_super_admin()) with check (is_super_admin());
create policy "super_admin_read_prefs"       on compass_carrier_prefs   for select using (is_super_admin());
create policy "super_admin_write_prefs"      on compass_carrier_prefs   for all    using (is_super_admin()) with check (is_super_admin());

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists compass_agents_touch on compass_agents;
create trigger compass_agents_touch         before update on compass_agents         for each row execute function touch_updated_at();
drop trigger if exists compass_carrier_prefs_touch on compass_carrier_prefs;
create trigger compass_carrier_prefs_touch  before update on compass_carrier_prefs  for each row execute function touch_updated_at();

-- ----------------------------------------------------------------------------
-- Seed the 26 agents — kept idempotent via ON CONFLICT DO NOTHING
-- ----------------------------------------------------------------------------
insert into compass_agents (name, kind, cadence, cron_expr, description, enabled) values
  ('agent-billing-watchdog',          'scheduled', 'Every 6 hours',                                          '0 */6 * * *',     'Polls Stripe for failed payments, near-expirations, and reconciliation drift. Pages Joshua on past-due >7d.', true),
  ('agent-csa-snapshot-reminder',     'scheduled', 'Monthly · 1st · 1pm UTC',                                '0 13 1 * *',      'Reminds carriers their monthly CSA snapshot is ready and pulls the latest CarrierOk feed (when live).', true),
  ('agent-data-retention-purge',      'scheduled', 'Quarterly · 1st of Jan/Apr/Jul/Oct · 2pm UTC',           '0 14 1 1,4,7,10 *','Honors GDPR/CCPA + DPA retention windows: purges expired driver PII, old MVR pulls, archived D&A results.', true),
  ('agent-driver-doc-ingest',         'scheduled', 'Every 10 minutes',                                       '*/10 * * * *',    'Watches each carrier connected Drive/Box folder for new DQ documents and routes them to the right driver record.', true),
  ('agent-driver-reminders',          'scheduled', 'Daily · 11am UTC',                                       '0 11 * * *',      'Sends CDL/MEC/MVR/D&A reminders to drivers via email + SMS following the carrier notification rules.', true),
  ('agent-email-result-catcher',      'scheduled', 'Every 15 minutes',                                       '*/15 * * * *',    'Polls a shared inbox for inbound vendor results (lab reports, MVR PDFs, BG check artifacts) and attaches them.', true),
  ('agent-financial-aggregator',      'scheduled', 'Daily · 3am UTC',                                        '0 3 * * *',       'Rolls Stripe + Checkr + MVR + D&A vendor charges into the daily Finance ledger.', true),
  ('agent-financial-dunning',         'scheduled', 'Daily · 1pm UTC',                                        '0 13 * * *',      'Dunning workflow for overdue customer invoices: reminder → escalation → service-pause warning.', true),
  ('agent-financial-monthly-close',   'scheduled', 'Monthly · 1st · 5am UTC',                                '0 5 1 * *',       'Closes the prior month: tallies revenue, vendor pass-thru, overhead; locks the ledger; emails Joshua.', true),
  ('agent-fmcsa-outreach',            'scheduled', 'Weekly · Mon–Fri · 2pm UTC',                             '0 14 * * 1-5',    'Sends the prospect outreach email (new-entrant-intro or conditional-help) Tue/Wed/Thu, capped 50/day.', true),
  ('agent-fmcsa-scraper',             'scheduled', 'Weekly · Mon · 9am UTC',                                 '0 9 * * 1',       'Pulls the FMCSA SAFER bulk census + Carrier Snapshot for the 5-state region (MI/OH/IN/IL/WI).', true),
  ('agent-ifta-quarterly-reminder',   'scheduled', 'Daily · 1pm UTC',                                        '0 13 * * *',      '30-day, 14-day, 7-day reminders before each IFTA filing deadline.', true),
  ('agent-inbox-triage',              'scheduled', 'Every 15 minutes',                                       '*/15 * * * *',    'Triages incoming support@x3compass.com email: auto-replies, files driver-portal questions, escalates RED.', true),
  ('agent-keepalive',                 'scheduled', 'Daily · 12pm UTC',                                       '0 12 * * *',      'Heartbeat that pings every connected vendor — sanity check that creds still work.', true),
  ('agent-monthly-client-report',     'scheduled', 'Monthly · 1st · 6am UTC',                                '0 6 1 * *',       'Generates each carrier monthly compliance report PDF + emails the carrier admin.', true),
  ('agent-ops-sheet-mirror',          'scheduled', 'Every 5 minutes',                                        '*/5 * * * *',     'Mirrors carrier/driver/alert/job counts from Supabase to the X3 Operations Google Sheet.', true),
  ('agent-portfolio-brief',           'scheduled', 'Daily · 10am UTC',                                       '0 10 * * *',      'Generates the daily portfolio brief (across all carriers) and emails Joshua + Mike.', true),
  ('agent-regulatory-scanner',        'scheduled', 'Weekly · Mon · 9am UTC',                                 '0 9 * * 1',       'Scans FMCSA + eCFR + Federal Register for changes affecting our skills.', true),
  ('agent-topic-discovery',           'scheduled', 'Weekly · Tue · 9am UTC',                                 '0 9 * * 2',       'Surfaces new skill topics from /api/ask logs + customer questions.', true),
  ('agent-csa-baseline',              'on_demand', 'Queued inputs', null, 'Computes a carrier CSA baseline (last 24mo of inspections + crashes) on initial onboarding.', true),
  ('agent-csa-monitor',               'on_demand', 'Queued inputs', null, 'Watches SAFER + CarrierOk for any BASIC percentile crossing the carrier threshold.', true),
  ('agent-dataq-drafter',             'on_demand', 'Queued inputs', null, 'Drafts the FMCSA DataQ challenge form when a non-preventable accident is flagged.', true),
  ('agent-research-topic',            'on_demand', 'Queued inputs', null, 'Researches a new compliance topic surfaced by topic-discovery.', true),
  ('agent-synthesize-form',           'on_demand', 'Queued inputs', null, 'Generates a new auto-fillable CFR-anchored form template.', true),
  ('agent-synthesize-training',       'on_demand', 'Queued inputs', null, 'Generates a new ELDT-style training module.', true),
  ('agent-onboarding-concierge',      'stub',      null, null, 'STUB — needs auth trigger wiring. Will run on every new carrier signup.', true)
on conflict (name) do nothing;
