-- Continuous MVR monitoring via Checkr Continuous Checks API (type: "mvr")
-- Per Checkr doc (May 19, 2026): https://help.checkr.com/.../continuous-motor-vehicle-record-mvr-reports-us-only
--
-- Pricing model (per Joshua's decision 5/19/26):
--   X3 retail: $5.00/driver/month + passthrough state fees (at-cost)
--   Checkr cost: $2.50/driver/month + $9.50 per triggered MVR report + state passthrough
--   Margin: $2.50/driver/month on base, $0 on per-hit fees (passed through at cost)
--
-- Prerequisite: candidate must have a completed baseline MVR (vendor_orders row,
-- result=clear, before they can be enrolled in continuous).

create extension if not exists pgcrypto;

-- ============================================================
-- compass_continuous_checks: one row per driver-enrollment
-- ============================================================
create table if not exists compass_continuous_checks (
  id                          uuid primary key default gen_random_uuid(),
  carrier_id                  uuid not null references compass_carriers(id) on delete cascade,
  driver_id                   uuid references compass_drivers(id) on delete set null,
  vendor                      text not null default 'checkr',
  type                        text not null default 'mvr'  check (type in ('mvr', 'criminal', 'sex_offender')),

  -- Checkr identifiers
  checkr_candidate_id         text not null,
  checkr_continuous_check_id  text unique,
  baseline_vendor_order_id    uuid references vendor_orders(id) on delete set null,

  -- Lifecycle
  status                      text not null default 'pending'
                              check (status in ('pending', 'active', 'canceled', 'failed', 'paused')),
  enrolled_at                 timestamptz,
  canceled_at                 timestamptz,
  failed_reason               text,

  -- Hit tracking (denormalized from continuous_check_events for fast UI)
  last_hit_at                 timestamptz,
  last_hit_report_id          text,
  last_hit_assessment         text,         -- 'eligible' | 'review' | etc.
  hit_count_total             int not null default 0,
  hit_count_30d               int not null default 0,

  -- Billing — passthrough fees we charge the carrier (at cost)
  enrollment_fee_cents        int default 0,   -- state-specific enrollment fee
  monthly_fee_cents           int not null default 500,  -- X3 retail $5.00
  per_report_fee_cents        int not null default 950,  -- Checkr at-cost passthrough $9.50

  -- Metadata
  work_state                  text,
  package                     text,
  metadata                    jsonb default '{}'::jsonb,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  -- One active enrollment per driver per type
  constraint compass_continuous_checks_unique_active
    unique (carrier_id, driver_id, type, status) deferrable initially deferred
);

create index if not exists compass_continuous_checks_carrier_idx
  on compass_continuous_checks (carrier_id);

create index if not exists compass_continuous_checks_driver_idx
  on compass_continuous_checks (driver_id);

create index if not exists compass_continuous_checks_status_idx
  on compass_continuous_checks (status) where status in ('active', 'pending');

create index if not exists compass_continuous_checks_candidate_idx
  on compass_continuous_checks (checkr_candidate_id);

create index if not exists compass_continuous_checks_checkr_id_idx
  on compass_continuous_checks (checkr_continuous_check_id);

create index if not exists compass_continuous_checks_recent_hit_idx
  on compass_continuous_checks (carrier_id, last_hit_at desc nulls last);

-- ============================================================
-- compass_continuous_check_events: every webhook for the enrollment
-- ============================================================
create table if not exists compass_continuous_check_events (
  id                          uuid primary key default gen_random_uuid(),
  continuous_check_id         uuid references compass_continuous_checks(id) on delete cascade,
  checkr_continuous_check_id  text,
  checkr_candidate_id         text,

  event_type                  text not null,  -- 'continuous_check.created'|'continuous_check.canceled'|'mvr_report.created'|...
  event_id                    text unique,    -- Checkr's event id for idempotency
  report_id                   text,
  assessment                  text,           -- 'eligible' | 'review' | etc.
  result                      text,           -- 'clear' | 'consider' | etc.

  payload                     jsonb,
  raw_event                   jsonb,

  received_at                 timestamptz not null default now()
);

create index if not exists compass_cc_events_cc_idx
  on compass_continuous_check_events (continuous_check_id, received_at desc);

create index if not exists compass_cc_events_type_idx
  on compass_continuous_check_events (event_type, received_at desc);

create index if not exists compass_cc_events_candidate_idx
  on compass_continuous_check_events (checkr_candidate_id);

-- ============================================================
-- RLS — carrier-scoped reads, service-role only for writes
-- ============================================================
alter table compass_continuous_checks enable row level security;
alter table compass_continuous_check_events enable row level security;

drop policy if exists compass_cc_carrier_read on compass_continuous_checks;
create policy compass_cc_carrier_read on compass_continuous_checks
  for select
  using (
    carrier_id in (
      select carrier_id from compass_user_carriers where user_id = auth.uid()
    )
  );

drop policy if exists compass_cc_events_carrier_read on compass_continuous_check_events;
create policy compass_cc_events_carrier_read on compass_continuous_check_events
  for select
  using (
    continuous_check_id in (
      select id from compass_continuous_checks where carrier_id in (
        select carrier_id from compass_user_carriers where user_id = auth.uid()
      )
    )
  );

-- updated_at trigger
create or replace function compass_continuous_checks_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tg_compass_continuous_checks_updated_at on compass_continuous_checks;
create trigger tg_compass_continuous_checks_updated_at
  before update on compass_continuous_checks
  for each row execute function compass_continuous_checks_set_updated_at();

comment on table compass_continuous_checks is
  'Continuous monitoring enrollments (Checkr Continuous Checks). MVR-first; criminal + sex_offender supported by schema for future use.';
comment on column compass_continuous_checks.monthly_fee_cents is
  'X3 retail per-driver-per-month price (default $5.00). Customer-facing rate.';
comment on column compass_continuous_checks.per_report_fee_cents is
  'Passthrough at-cost per Checkr-generated MVR report when a hit fires (default $9.50).';
comment on table compass_continuous_check_events is
  'Audit log of every continuous_check.* and mvr_report.* webhook from Checkr.';
