-- compass_training_records — per-driver training/ELDT completions. Carrier-scoped, RLS.
-- REVIEW-ONLY: apply via the normal migration flow.
create table if not exists public.compass_training_records (
  id           uuid primary key default gen_random_uuid(),
  carrier_id   uuid not null references public.compass_carriers(id) on delete cascade,
  driver_id    uuid references public.compass_drivers(id) on delete set null,
  driver_name  text,
  course       text not null,
  cfr          text,
  provider     text,
  completed_on date,
  expires_on   date,
  status       text not null default 'current'
               check (status in ('current','due','overdue','missing')),
  created_at   timestamptz not null default now()
);
create index if not exists idx_training_carrier on public.compass_training_records(carrier_id);
alter table public.compass_training_records enable row level security;
drop trigger if exists enforce_training_carrier on public.compass_training_records;
create trigger enforce_training_carrier
  before insert or update of carrier_id, driver_id on public.compass_training_records
  for each row execute function public.enforce_compass_driver_carrier();
drop policy if exists "training_carrier_scope" on public.compass_training_records;
create policy "training_carrier_scope" on public.compass_training_records for all
  using (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()))
  with check (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()));
