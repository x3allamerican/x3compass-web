-- ============================================================
-- compass_pdf_generated · audit ledger for branded-PDF generation
-- ============================================================
-- Every PDF produced by /api/pdf/render, /stamp, or /merge writes one
-- row here. Surfaced in the audit-export bundle so carriers can prove
-- to FMCSA exactly when they generated which compliance documents.
--
-- Why not reuse compass_audit_log: that table captures business-action
-- events (signups, billing, status changes). PDF generation is a
-- finer-grained event we want to query independently · 'how many
-- audit packets did we generate for carrier X in Q4'.
-- ============================================================

create table if not exists public.compass_pdf_generated (
  id             uuid primary key default gen_random_uuid(),
  carrier_id     uuid not null references public.carriers(id) on delete cascade,
  user_id        uuid not null,
  source         text not null check (source in ('render','stamp','merge')),
  template_slug  text not null,
  byte_size      integer not null check (byte_size > 0),
  generated_at   timestamptz not null default now()
);

create index if not exists idx_pdf_gen_carrier_date
  on public.compass_pdf_generated (carrier_id, generated_at desc);
create index if not exists idx_pdf_gen_user_date
  on public.compass_pdf_generated (user_id, generated_at desc);
create index if not exists idx_pdf_gen_source
  on public.compass_pdf_generated (source);

-- RLS · tenant isolation · carriers see only their own rows
alter table public.compass_pdf_generated enable row level security;

drop policy if exists pdf_gen_tenant_isolation on public.compass_pdf_generated;
create policy pdf_gen_tenant_isolation on public.compass_pdf_generated
  for select using (
    carrier_id in (select carrier_id from public.carrier_members where user_id = auth.uid())
  );

comment on table public.compass_pdf_generated is
  'Audit ledger for X3 Compass-branded PDF generation (render/stamp/merge). Surfaced in audit-export bundles.';
