-- X3 Compass · Core Schema · 2026-05-16
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create table if not exists public.carriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  usdot_number text unique,
  mc_number text, legal_entity text, ein text,
  primary_contact_email text, primary_contact_phone text,
  street_address text, city text, state text, zip text,
  power_units_count integer default 0,
  drivers_count integer default 0,
  service_tier text default 'diy' check (service_tier in ('diy','dfy','enterprise','trial')),
  hazmat_addon boolean default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text default 'trialing' check (subscription_status in ('trialing','active','past_due','canceled','unpaid','paused','incomplete')),
  trial_ends_at timestamptz default (now() + interval '7 days'),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_carriers_usdot on public.carriers(usdot_number);
create index if not exists idx_carriers_stripe_customer on public.carriers(stripe_customer_id);
create index if not exists idx_carriers_stripe_subscription on public.carriers(stripe_subscription_id);

create table if not exists public.carrier_users (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid references public.carriers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','manager','viewer')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz, accepted_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (carrier_id, user_id)
);
create index if not exists idx_carrier_users_user on public.carrier_users(user_id);
create index if not exists idx_carrier_users_carrier on public.carrier_users(carrier_id);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid references public.carriers(id) on delete cascade not null,
  first_name text not null, middle_name text, last_name text not null,
  date_of_birth date, email text, phone text,
  cdl_state text, cdl_number text,
  cdl_class text check (cdl_class in ('A','B','C','none')),
  cdl_endorsements text[], cdl_expires_on date,
  hire_date date, termination_date date,
  status text default 'active' check (status in ('active','inactive','terminated','pending_hire','on_leave')),
  medical_card_expires_on date,
  last_mvr_pulled_on date, last_drug_test_on date, clearinghouse_full_query_on date,
  bg_check_status text,
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists idx_drivers_carrier on public.drivers(carrier_id);
create index if not exists idx_drivers_status on public.drivers(carrier_id, status);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid references public.carriers(id) on delete cascade not null,
  vin text, license_plate text, license_plate_state text,
  year integer, make text, model text, gvwr_lbs integer,
  vehicle_type text check (vehicle_type in ('tractor','straight_truck','trailer','tank','dump','bus','other')),
  fuel_type text, current_odometer integer,
  in_service_date date, out_of_service_date date,
  status text default 'active' check (status in ('active','out_of_service','sold','totaled')),
  last_dot_inspection_on date, next_dot_inspection_due date,
  registered_states text[], custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists idx_vehicles_carrier on public.vehicles(carrier_id);

create table if not exists public.stripe_events (
  id text primary key, type text not null,
  carrier_id uuid references public.carriers(id) on delete set null,
  payload jsonb not null,
  processed_at timestamptz, received_at timestamptz default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid references public.carriers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, entity_type text, entity_id uuid,
  payload jsonb, ip_address inet, user_agent text,
  created_at timestamptz default now()
);
create index if not exists idx_audit_log_carrier on public.audit_log(carrier_id, created_at desc);

alter table public.carriers enable row level security;
alter table public.carrier_users enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.stripe_events enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "carriers_select_own" on public.carriers;
create policy "carriers_select_own" on public.carriers for select
  using (id in (select carrier_id from public.carrier_users where user_id = auth.uid()));
drop policy if exists "carriers_update_own" on public.carriers;
create policy "carriers_update_own" on public.carriers for update
  using (id in (select carrier_id from public.carrier_users where user_id = auth.uid() and role in ('owner','admin')));
drop policy if exists "carrier_users_select_own" on public.carrier_users;
create policy "carrier_users_select_own" on public.carrier_users for select
  using (user_id = auth.uid() or carrier_id in (select carrier_id from public.carrier_users where user_id = auth.uid() and role in ('owner','admin')));
drop policy if exists "drivers_carrier_scope" on public.drivers;
create policy "drivers_carrier_scope" on public.drivers for all
  using (carrier_id in (select carrier_id from public.carrier_users where user_id = auth.uid()));
drop policy if exists "vehicles_carrier_scope" on public.vehicles;
create policy "vehicles_carrier_scope" on public.vehicles for all
  using (carrier_id in (select carrier_id from public.carrier_users where user_id = auth.uid()));
drop policy if exists "stripe_events_carrier_admin" on public.stripe_events;
create policy "stripe_events_carrier_admin" on public.stripe_events for select
  using (carrier_id in (select carrier_id from public.carrier_users where user_id = auth.uid() and role in ('owner','admin')));
drop policy if exists "audit_log_carrier" on public.audit_log;
create policy "audit_log_carrier" on public.audit_log for select
  using (carrier_id in (select carrier_id from public.carrier_users where user_id = auth.uid()));

create or replace function public.tg_set_updated_at() returns trigger as $$
begin new.updated_at := now(); return new; end; $$ language plpgsql;
drop trigger if exists carriers_set_updated_at on public.carriers;
create trigger carriers_set_updated_at before update on public.carriers for each row execute function public.tg_set_updated_at();
drop trigger if exists drivers_set_updated_at on public.drivers;
create trigger drivers_set_updated_at before update on public.drivers for each row execute function public.tg_set_updated_at();
drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at before update on public.vehicles for each row execute function public.tg_set_updated_at();
