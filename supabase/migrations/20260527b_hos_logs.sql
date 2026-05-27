-- ============================================================
-- HOS / ELD audit ledger
-- 49 CFR Part 395 · Records of Duty Status
-- ============================================================
-- Idempotent: CREATE IF NOT EXISTS + ALTER guarded with IF NOT
-- EXISTS where Postgres allows. Safe to run on top of any
-- prior ad-hoc compass_hos_logs schema.
-- ============================================================

create table if not exists public.compass_hos_logs (
  id                        uuid primary key default gen_random_uuid(),
  carrier_id                uuid not null references public.carriers(id) on delete cascade,
  driver_id                 uuid not null references public.compass_drivers(id) on delete cascade,

  log_date                  date not null,
  total_drive_minutes       integer not null default 0,
  total_on_duty_minutes     integer not null default 0,
  hours_70_8                numeric(5,2),                  -- running 8-day total
  violations                jsonb not null default '[]'::jsonb,
  --   shape: [{ "cfr": "§395.3(a)(1)", "label": "...", "severity": "violation" }, ...]

  eld_source                text,                          -- motive | samsara | geotab | keeptruckin | null (manual)
  eld_serial_no             text,
  certified                 boolean not null default false,
  certified_at              timestamptz,

  raw_log_url               text,                          -- pointer to original ELD output file in storage
  ingested_via              text not null default 'eld_api', -- eld_api | csv_upload | manual_entry
  ingested_at               timestamptz not null default now(),

  unique (carrier_id, driver_id, log_date)
);

create index if not exists idx_hos_logs_carrier_date  on public.compass_hos_logs (carrier_id, log_date desc);
create index if not exists idx_hos_logs_driver_date   on public.compass_hos_logs (driver_id, log_date desc);
create index if not exists idx_hos_logs_violations    on public.compass_hos_logs using gin (violations) where jsonb_array_length(violations) > 0;

-- RLS · tenant isolation
alter table public.compass_hos_logs enable row level security;

drop policy if exists hos_logs_tenant_isolation on public.compass_hos_logs;
create policy hos_logs_tenant_isolation on public.compass_hos_logs
  using (
    carrier_id in (
      select carrier_id from public.carrier_members where user_id = auth.uid()
    )
  )
  with check (
    carrier_id in (
      select carrier_id from public.carrier_members where user_id = auth.uid()
    )
  );

-- Comment for downstream agents
comment on table public.compass_hos_logs is
  'HOS daily Records of Duty Status · 49 CFR §395.8 + ELD ingest via §395.30 output file. 6-month retention required per §395.8(k).';
