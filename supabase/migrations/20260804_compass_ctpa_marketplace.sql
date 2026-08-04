-- X3 Compass · C/TPA marketplace schema and verified provider seed · 2026-08-04
--
-- Provider identity and website values were verified against each provider's
-- public site on 2026-08-03. FMCSA does not publish an authoritative public
-- C/TPA directory with registration names, so those values remain NULL rather
-- than inferring that a marketing or legal name is the Clearinghouse name.

create table if not exists public.compass_ctpas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  legal_name text not null,
  fmcsa_clearinghouse_name text,
  primary_phone text,
  primary_email text,
  website_url text,
  api_capable boolean not null default false,
  api_connector_status text not null default 'none'
    check (api_connector_status in ('none', 'planned', 'beta', 'live')),
  is_recommended boolean not null default false,
  is_active boolean not null default true,
  verification_source_url text,
  verified_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.compass_ctpas enable row level security;

drop policy if exists "ctpas_read_active" on public.compass_ctpas;
create policy "ctpas_read_active"
  on public.compass_ctpas
  for select
  to anon, authenticated
  using (is_active);

insert into public.compass_ctpas (
  slug,
  legal_name,
  website_url,
  api_capable,
  api_connector_status,
  is_recommended,
  is_active,
  verification_source_url,
  verified_on,
  fmcsa_clearinghouse_name
) values
  (
    'procom',
    'PROCOM LLC',
    'https://procomtesting.com',
    false,
    'none',
    true,
    true,
    'https://procomtesting.com/consortium-tpa-services/',
    date '2026-08-03',
    null
  ),
  (
    'disa',
    'DISA Global Solutions, Inc.',
    'https://disa.com',
    false,
    'none',
    false,
    true,
    'https://disa.com',
    date '2026-08-03',
    null
  ),
  (
    'national-drug-screening',
    'National Drug Screening, Inc.',
    'https://www.nationaldrugscreening.com',
    false,
    'none',
    false,
    true,
    'https://www.nationaldrugscreening.com/3rd-party',
    date '2026-08-03',
    null
  ),
  (
    'foley',
    'Foley Carrier Services, LLC',
    'https://www.foleyservices.com',
    false,
    'none',
    false,
    true,
    'https://www.foleyservices.com/fmcsa-compliance/',
    date '2026-08-03',
    null
  ),
  (
    'other',
    'Other C/TPA (manual entry)',
    null,
    false,
    'none',
    false,
    true,
    null,
    null,
    null
  )
on conflict (slug) do update set
  legal_name = excluded.legal_name,
  fmcsa_clearinghouse_name = excluded.fmcsa_clearinghouse_name,
  website_url = excluded.website_url,
  is_recommended = excluded.is_recommended,
  is_active = excluded.is_active,
  verification_source_url = excluded.verification_source_url,
  verified_on = excluded.verified_on,
  updated_at = now();

comment on table public.compass_ctpas is
  'Verified C/TPA marketplace identities. Listing is decision support and does not constitute FMCSA endorsement.';
comment on column public.compass_ctpas.fmcsa_clearinghouse_name is
  'Exact provider name shown in the FMCSA Clearinghouse, when independently verified; NULL means unknown.';
