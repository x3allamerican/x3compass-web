-- X3 Compass · Batch 6 Task 5 · Clearinghouse query, consent, and violation evidence
-- NEEDS CLAUDE TO APPLY. Source only: Codex does not run migrations or call FMCSA.

create table if not exists public.compass_clearinghouse_queries (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.compass_carriers(id) on delete cascade,
  driver_id uuid not null references public.compass_drivers(id) on delete cascade,
  query_type text not null check (query_type in ('annual_limited', 'pre_employment_full', 'triggered_full')),
  requested_at timestamptz not null default now(),
  query_run_at timestamptz,
  result text not null default 'pending' check (result in ('pending', 'no_information', 'information', 'error')),
  consent_received_at timestamptz,
  fmcsa_query_id text,
  cost_cents integer check (cost_cents is null or cost_cents >= 0),
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (carrier_id, fmcsa_query_id)
);

create index if not exists compass_clearinghouse_queries_carrier_id_idx
  on public.compass_clearinghouse_queries (carrier_id, query_run_at desc);
create index if not exists compass_clearinghouse_queries_driver_idx
  on public.compass_clearinghouse_queries (carrier_id, driver_id, query_run_at desc);

create table if not exists public.compass_clearinghouse_consents (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.compass_carriers(id) on delete cascade,
  driver_id uuid not null references public.compass_drivers(id) on delete cascade,
  consent_type text not null check (consent_type in ('limited_general', 'pre_employment_full', 'triggered_full')),
  consent_requested_at timestamptz not null,
  consent_deadline_at timestamptz,
  consent_received_at timestamptz,
  consent_expires_on date,
  consent_revoked_at timestamptz,
  evidence_object_key text check (evidence_object_key is null or (evidence_object_key like 'carriers/%/clearinghouse/%' and position('..' in evidence_object_key) = 0)),
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compass_clearinghouse_consents_carrier_id_idx
  on public.compass_clearinghouse_consents (carrier_id, driver_id, consent_requested_at desc);

create table if not exists public.compass_clearinghouse_violations (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.compass_carriers(id) on delete cascade,
  driver_id uuid not null references public.compass_drivers(id) on delete cascade,
  violation_type text not null check (violation_type in ('positive_drug_test', 'positive_alcohol_test', 'test_refusal', 'actual_knowledge', 'pre_employment_positive')),
  violation_date date not null,
  reported_by text,
  prohibited_status_active boolean not null default true,
  sap_evaluation_complete boolean not null default false,
  return_to_duty_complete boolean not null default false,
  notes text,
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compass_clearinghouse_violations_carrier_id_idx
  on public.compass_clearinghouse_violations (carrier_id, driver_id, violation_date desc);

create or replace function public.clearinghouse_driver_carrier_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.compass_drivers driver where driver.id = new.driver_id and driver.carrier_id = new.carrier_id) then
    raise exception 'Clearinghouse driver must belong to the same carrier';
  end if;
  return new;
end;
$$;

drop trigger if exists clearinghouse_queries_driver_carrier_guard on public.compass_clearinghouse_queries;
create trigger clearinghouse_queries_driver_carrier_guard before insert or update on public.compass_clearinghouse_queries for each row execute function public.clearinghouse_driver_carrier_guard();
drop trigger if exists clearinghouse_consents_driver_carrier_guard on public.compass_clearinghouse_consents;
create trigger clearinghouse_consents_driver_carrier_guard before insert or update on public.compass_clearinghouse_consents for each row execute function public.clearinghouse_driver_carrier_guard();
drop trigger if exists clearinghouse_violations_driver_carrier_guard on public.compass_clearinghouse_violations;
create trigger clearinghouse_violations_driver_carrier_guard before insert or update on public.compass_clearinghouse_violations for each row execute function public.clearinghouse_driver_carrier_guard();

alter table public.compass_clearinghouse_queries enable row level security;
alter table public.compass_clearinghouse_consents enable row level security;
alter table public.compass_clearinghouse_violations enable row level security;

drop policy if exists compass_clearinghouse_queries_tenant on public.compass_clearinghouse_queries;
create policy compass_clearinghouse_queries_tenant on public.compass_clearinghouse_queries for all
  using (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()))
  with check (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()));
drop policy if exists compass_clearinghouse_consents_tenant on public.compass_clearinghouse_consents;
create policy compass_clearinghouse_consents_tenant on public.compass_clearinghouse_consents for all
  using (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()))
  with check (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()));
drop policy if exists compass_clearinghouse_violations_tenant on public.compass_clearinghouse_violations;
create policy compass_clearinghouse_violations_tenant on public.compass_clearinghouse_violations for all
  using (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()))
  with check (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()));

comment on table public.compass_clearinghouse_queries is 'Evidence tracking only; a row does not establish driver eligibility or an FMCSA determination.';
