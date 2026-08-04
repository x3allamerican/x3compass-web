-- Continuous-MVR usage ledger. Source only; NEEDS CLAUDE TO APPLY.
-- One deduplicated event becomes one customer invoice item and contributes to
-- the period's Checkr vendor invoice reconciliation.
create table if not exists compass_mvr_billing_events (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references compass_carriers(id) on delete cascade,
  monitor_id uuid not null,
  event_type text not null check (event_type in ('monthly_monitor', 'triggered_report')),
  service_period text not null check (service_period ~ '^\d{4}-\d{2}$'),
  vendor_report_id text,
  vendor_cost_cents integer not null check (vendor_cost_cents >= 0),
  retail_cents integer not null check (retail_cents >= 0),
  dedupe_key text not null unique,
  status text not null default 'pending' check (status in ('pending', 'invoiced', 'error')),
  stripe_invoice_item_id text,
  last_error text,
  invoiced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compass_mvr_billing_pending_idx
  on compass_mvr_billing_events (service_period, status, carrier_id);

alter table compass_mvr_billing_events enable row level security;
create policy "super_admin_all_mvr_billing" on compass_mvr_billing_events
  for all to authenticated using (is_super_admin()) with check (is_super_admin());

insert into compass_agents (name, kind, cadence, cron_expr, description, enabled)
values (
  'agent-mvr-monthly-billing', 'scheduled', 'Monthly · schedule pending owner approval', null,
  'Stages active-monitor and triggered-report usage, reconciles Checkr cost, and creates Stripe invoice items idempotently.',
  false
)
on conflict (name) do update set
  kind = excluded.kind, cadence = excluded.cadence, cron_expr = null,
  description = excluded.description, enabled = false;
