-- Sprint #17 — supporting tables for the remaining agent implementations.

-- Tracks the SHA of every eCFR section we monitor so the regulatory-scanner
-- can detect changes between runs.
create table if not exists compass_cfr_versions (
  id              uuid primary key default uuid_generate_v4(),
  cfr_anchor      text not null unique,
  content_hash    text not null,
  content_length  int  not null,
  first_seen      timestamptz not null default now(),
  last_checked    timestamptz not null default now(),
  last_changed    timestamptz not null default now()
);

-- FMCSA carrier snapshots — one row per (DOT, snapshot_at)
create table if not exists compass_fmcsa_snapshots (
  id               uuid primary key default uuid_generate_v4(),
  dot_number       text not null,
  legal_name       text,
  safety_rating    text,
  power_units      int,
  drivers          int,
  state            text,
  registered_date  date,
  first_seen_at    timestamptz not null default now(),
  snapshot_at      timestamptz not null default now(),
  raw              jsonb
);
create index if not exists compass_fmcsa_snapshots_dot_idx on compass_fmcsa_snapshots (dot_number, snapshot_at desc);

-- Per-carrier ops snapshots (the "Google Sheets mirror" replacement).
-- One row per agent-ops-sheet-mirror run.
create table if not exists compass_ops_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  taken_at        timestamptz not null default now(),
  carrier_count   int not null,
  driver_count    int not null,
  vehicle_count   int not null,
  open_alerts     int not null,
  job_count       int not null,
  by_carrier      jsonb
);

-- CSA baselines and monitoring snapshots
create table if not exists compass_csa_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  carrier_id      uuid not null,
  taken_at        timestamptz not null default now(),
  unsafe_driving  numeric,
  crash_indicator numeric,
  hos_compliance  numeric,
  vehicle_maint   numeric,
  hazmat          numeric,
  driver_fitness  numeric,
  ctrl_substances numeric,
  source          text not null default 'computed_from_inspections',
  raw             jsonb
);

-- Onboarding tasks queued for new carriers
create table if not exists compass_onboarding_tasks (
  id          uuid primary key default uuid_generate_v4(),
  carrier_id  uuid not null,
  task_key    text not null,
  title       text not null,
  due_at      timestamptz,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  unique (carrier_id, task_key)
);

-- Topic-discovery candidates surfaced from low-confidence Ask Compass questions
create table if not exists compass_topic_candidates (
  id            uuid primary key default uuid_generate_v4(),
  cluster_label text not null,
  example_q     text,
  hit_count     int  not null default 1,
  first_seen    timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  promoted_to_skill boolean not null default false
);

-- RLS — same model as the other admin tables: super-admin only
alter table compass_cfr_versions         enable row level security;
alter table compass_fmcsa_snapshots      enable row level security;
alter table compass_ops_snapshots        enable row level security;
alter table compass_csa_snapshots        enable row level security;
alter table compass_onboarding_tasks     enable row level security;
alter table compass_topic_candidates     enable row level security;

create policy "super_read_cfr"      on compass_cfr_versions      for select using (is_super_admin());
create policy "super_write_cfr"     on compass_cfr_versions      for all    using (is_super_admin()) with check (is_super_admin());
create policy "super_read_fmcsa"    on compass_fmcsa_snapshots   for select using (is_super_admin());
create policy "super_write_fmcsa"   on compass_fmcsa_snapshots   for all    using (is_super_admin()) with check (is_super_admin());
create policy "super_read_ops"      on compass_ops_snapshots     for select using (is_super_admin());
create policy "super_write_ops"     on compass_ops_snapshots     for all    using (is_super_admin()) with check (is_super_admin());
create policy "super_read_csa"      on compass_csa_snapshots     for select using (is_super_admin());
create policy "super_write_csa"     on compass_csa_snapshots     for all    using (is_super_admin()) with check (is_super_admin());
create policy "super_read_onbrd"    on compass_onboarding_tasks  for select using (is_super_admin());
create policy "super_write_onbrd"   on compass_onboarding_tasks  for all    using (is_super_admin()) with check (is_super_admin());
create policy "super_read_topics"   on compass_topic_candidates  for select using (is_super_admin());
create policy "super_write_topics"  on compass_topic_candidates  for all    using (is_super_admin()) with check (is_super_admin());
