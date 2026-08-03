-- ============================================================================
-- compass_driver_documents — per-driver DQ file documents (49 CFR § 391.51)
-- ----------------------------------------------------------------------------
-- Backs /app/dq-files. One row per (driver, document_type). document_type is a
-- DQ_REQUIREMENTS.key (see src/lib/dqRequirements.ts). Carrier-scoped and
-- RLS-isolated exactly like compass_drivers so a carrier can only ever read or
-- write its own drivers' documents. Files themselves live in object storage;
-- this table holds the pointer + status + expiry.
--
-- REVIEW-ONLY: not applied by the agent. Apply via the normal Supabase
-- migration flow after review, ideally after the tenant-isolation PR lands.
-- Column set matches the DataSourceCard CSV template already in the page:
--   driver_id, document_type, document_url, issued_date, expires_date, verified_by
-- ============================================================================

create table if not exists public.compass_driver_documents (
  id            uuid primary key default gen_random_uuid(),
  carrier_id    uuid not null references public.compass_carriers(id) on delete cascade,
  driver_id     uuid not null references public.compass_drivers(id) on delete cascade,
  document_type text not null,                 -- DQ_REQUIREMENTS.key
  cfr           text,                          -- governing citation, denormalized for display
  status        text not null default 'missing'
                check (status in ('missing','pending','complete','expiring','expired')),
  document_url  text,                          -- object-storage pointer (nullable until uploaded)
  issued_date   date,
  expires_date  date,
  verified_by   text,
  verified_at   timestamptz,
  version       integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (driver_id, document_type)
);

create index if not exists idx_driver_docs_carrier on public.compass_driver_documents(carrier_id);
create index if not exists idx_driver_docs_driver  on public.compass_driver_documents(driver_id);
create index if not exists idx_driver_docs_expiry  on public.compass_driver_documents(carrier_id, expires_date);

alter table public.compass_driver_documents enable row level security;

-- Carrier-scoped access, mirroring the compass_drivers policy exactly.
create policy "driver_documents_carrier_scope" on public.compass_driver_documents for all
  using (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()))
  with check (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()));
