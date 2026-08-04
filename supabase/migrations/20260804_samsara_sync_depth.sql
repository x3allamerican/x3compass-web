-- SOURCE-ONLY MIGRATION — NEEDS CLAUDE TO APPLY. Do not run from Codex.
create table if not exists public.compass_hos_logs (
  id uuid primary key default gen_random_uuid(), carrier_id uuid not null references public.compass_carriers(id) on delete cascade,
  driver_id uuid not null references public.compass_drivers(id) on delete cascade, log_date date not null,
  total_drive_minutes integer, total_on_duty_minutes integer, violations jsonb not null default '[]'::jsonb,
  eld_source text, certified boolean not null default false, created_at timestamptz not null default now()
);
alter table public.compass_drivers add column if not exists source_vendor text, add column if not exists source_id text;
alter table public.compass_vehicles add column if not exists source_vendor text, add column if not exists source_id text;
alter table public.compass_hos_logs add column if not exists source_vendor text, add column if not exists source_id text, add column if not exists source_driver_id text, add column if not exists total_on_duty_minutes integer, add column if not exists distance_miles numeric;

create unique index if not exists compass_drivers_vendor_entity_uidx on public.compass_drivers(carrier_id,source_vendor,source_id) where source_vendor is not null and source_id is not null;
create unique index if not exists compass_vehicles_vendor_entity_uidx on public.compass_vehicles(carrier_id,source_vendor,source_id) where source_vendor is not null and source_id is not null;
create unique index if not exists compass_hos_logs_vendor_entity_uidx on public.compass_hos_logs(carrier_id,source_vendor,source_id) where source_vendor is not null and source_id is not null;
