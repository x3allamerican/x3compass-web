-- ============================================================
-- C/TPA marketplace + per-carrier selection
-- 49 CFR §382.705 · employer may designate a C/TPA in the
--                   FMCSA Clearinghouse
-- ============================================================
-- X3 Compass methodology: every carrier picks ONE C/TPA. Procom
-- (via ADTC) is the recommended default for carriers without one,
-- but carriers with an existing C/TPA relationship can keep it.
-- Three modes:
--   procom_referral   · X3 referred them to Procom · Option 3
--   byo_connected     · They have a C/TPA we have an API
--                       connector for (DISA, Quest, LabCorp, etc.)
--   byo_manual        · They have a C/TPA · no integration ·
--                       carrier uploads results CSVs themselves
-- ============================================================

-- ------------------------------------------------------------
-- 1. The marketplace · seed table of nationally-recognized C/TPAs
-- ------------------------------------------------------------
create table if not exists public.compass_ctpas (
  id                          uuid primary key default gen_random_uuid(),
  slug                        text not null unique,         -- procom, disa, quest, labcorp, ...
  legal_name                  text not null,                -- "PROCOM"
  fmcsa_clearinghouse_name    text not null,                -- EXACT string carriers search in the Clearinghouse C/TPA picker
  primary_phone               text,
  after_hours_phone           text,
  primary_email               text,
  results_email               text,                         -- where lab results come from
  mailing_address             text,
  website_url                 text,
  api_capable                 boolean not null default false,
  api_connector_status        text not null default 'none', -- none | planned | beta | live
  is_recommended              boolean not null default false,
  referral_terms              text,                         -- "5% test rev kickback · monthly" · null if N/A
  notes                       text,
  created_at                  timestamptz not null default now()
);

-- Seed the major national C/TPAs · carriers can pick from these or
-- type a custom name (which routes to byo_manual w/ NULL ctpa_id).
insert into public.compass_ctpas
  (slug, legal_name, fmcsa_clearinghouse_name, primary_phone, after_hours_phone, primary_email, results_email, mailing_address, website_url, api_capable, api_connector_status, is_recommended, notes)
values
  ('procom',     'PROCOM',                         'PROCOM',                          '719-295-1911', '719-671-5251', 'admin@procomtesting.com', 'results@procomtesting.com', '1805 Fortino Blvd, Pueblo, CO 81008', 'https://drugtestingconsortium.com',  false, 'planned', true,  'X3-recommended default · ADTC consortium · $75/drug $50/BAT · annual fees per Option 3'),
  ('disa',       'DISA Global Solutions',          'DISA Global Solutions, Inc.',     '281-673-2400', null,           'support@disa.com',         null,                         '12222 Merit Drive, Suite 1250, Dallas, TX 75251', 'https://disa.com',                 true,  'planned', false, 'National TPA · ~30% market share · has REST API'),
  ('quest',      'Quest Diagnostics Employer Solutions','Quest Diagnostics, Inc.',    '866-825-3633', null,           'employer.solutions@questdiagnostics.com', null,         '500 Plaza Drive, Secaucus, NJ 07094',             'https://employersolutions.com',    true,  'planned', false, 'eCCF + national PSC footprint'),
  ('labcorp',    'LabCorp Occupational Testing',   'Laboratory Corporation of America','800-833-3984',null,           'occtest@labcorp.com',      null,                         '358 South Main Street, Burlington, NC 27215',     'https://www.labcorp.com/employers',true,  'planned', false, 'eCCF · ~3,200 collection sites'),
  ('concentra',  'Concentra Health Services',      'Concentra Health Services, Inc.', '800-232-3550', null,           'employerservices@concentra.com', null,                    '5080 Spectrum Drive, Suite 1200W, Addison, TX 75001','https://www.concentra.com/employers', false, 'none',    false, 'Largest occ health network · 500+ centers'),
  ('element',    'Element Drug Testing Services',  'Element Drug Testing Services, LLC','800-330-9943',null,           'support@elementdts.com',   null,                         '12707 N. Freeway, Suite 555, Houston, TX 77060',  'https://elementdts.com',           false, 'none',    false, 'Mid-market Texas-based TPA · trucking focus'),
  ('betterrehab','Better Rehab',                   'Better Rehab DOT Services',       '800-461-3168', null,           'info@betterrehab.com',     null,                         null,                                              'https://betterrehab.com',          false, 'none',    false, 'Owner-operator + small-fleet focus · SAP services'),
  ('escreen',    'eScreen (Alere/Abbott)',         'eScreen, Inc.',                   '800-881-0722', null,           null,                       null,                         '10901 W 84th Terrace, Lenexa, KS 66214',          'https://escreen.com',              true,  'planned', false, 'Now part of Abbott Toxicology · electronic CCF leader'),
  ('foley',      'Foley Carrier Services',         'Foley Carrier Services, LLC',     '800-253-5506', null,           'support@foleyservices.com',null,                         '20 Batterson Park Road, Farmington, CT 06032',    'https://foleyservices.com',        false, 'none',    false, 'Bundles DQF + D&A + MVR · CDL-focused'),
  ('jjkeller',   'J. J. Keller & Associates',      'J.J. Keller & Associates, Inc.',  '877-564-2333', null,           'sales@jjkeller.com',       null,                         '3003 W Breezewood Lane, Neenah, WI 54957',        'https://www.jjkeller.com',         true,  'planned', false, 'Largest fleet compliance vendor · has DrugClick API'),
  ('drugfree',   'DrugFreeBusiness',               'DrugFreeBusiness',                '800-227-7848', null,           'info@dfbusiness.com',      null,                         'Spokane Valley, WA',                              'https://dfbusiness.com',           false, 'none',    false, 'PNW + nat. footprint · small-business focus'),
  ('usdt',       'US Drug Test Centers',           'US Drug Test Centers',            '866-566-0261', null,           'info@usdrugtestcenters.com',null,                        null,                                              'https://www.usdrugtestcenters.com',false, 'none',    false, 'On-demand testing · 20,000+ locations'),
  ('other',      'Other (specify in notes)',       'OTHER',                            null,          null,           null,                       null,                         null,                                              null,                                false, 'none',    false, 'Catch-all when the carrier’s C/TPA is not in our seed list · routes to byo_manual')
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 2. Per-carrier C/TPA selection
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'carriers' and column_name = 'ctpa_id') then
    alter table public.carriers add column ctpa_id uuid references public.compass_ctpas(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'carriers' and column_name = 'ctpa_mode') then
    alter table public.carriers add column ctpa_mode text;
    alter table public.carriers add constraint carriers_ctpa_mode_check
      check (ctpa_mode is null or ctpa_mode in ('procom_referral','byo_connected','byo_manual'));
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'carriers' and column_name = 'ctpa_custom_name') then
    alter table public.carriers add column ctpa_custom_name text;
    -- only populated when ctpa_id points to the 'other' row · holds the free-text name the carrier typed
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'carriers' and column_name = 'ctpa_selected_at') then
    alter table public.carriers add column ctpa_selected_at timestamptz;
  end if;
end$$;

create index if not exists idx_carriers_ctpa on public.carriers (ctpa_id) where ctpa_id is not null;

-- ------------------------------------------------------------
-- 3. Public RLS · everyone can READ the marketplace, only the
--    service-role can WRITE to it (we curate the seed list).
-- ------------------------------------------------------------
alter table public.compass_ctpas enable row level security;

drop policy if exists ctpas_public_read on public.compass_ctpas;
create policy ctpas_public_read on public.compass_ctpas
  for select using (true);

-- ------------------------------------------------------------
-- 4. D&A test results · ingest target for byo_manual + future
--    api_connector path. Mirrors compass_hos_logs shape.
-- ------------------------------------------------------------
create table if not exists public.compass_drug_tests (
  id                  uuid primary key default gen_random_uuid(),
  carrier_id          uuid not null references public.carriers(id) on delete cascade,
  driver_id           uuid not null references public.compass_drivers(id) on delete cascade,

  test_date           date not null,
  test_type           text not null check (test_type in ('pre_employment','random','reasonable_suspicion','post_accident','return_to_duty','follow_up')),
  panel               text not null default 'DOT_5_panel',   -- DOT_5_panel | DOT_BAT | non_DOT_panel | other
  result              text not null check (result in ('negative','negative_dilute','positive','adulterated','substituted','refusal','cancelled','pending')),
  result_detail       text,                                  -- "amphetamines + cocaine" etc.
  mro_verified_at     timestamptz,
  ctpa_id             uuid references public.compass_ctpas(id),  -- which TPA administered it
  ccf_specimen_id     text,                                  -- chain-of-custody form number
  raw_result_url      text,                                  -- storage pointer to original PDF/eCCF

  ingested_via        text not null default 'csv_upload',    -- csv_upload | api | manual_entry
  ingested_at         timestamptz not null default now(),
  unique (carrier_id, driver_id, test_date, test_type)
);

create index if not exists idx_drugtests_carrier_date on public.compass_drug_tests (carrier_id, test_date desc);
create index if not exists idx_drugtests_driver_date  on public.compass_drug_tests (driver_id, test_date desc);
create index if not exists idx_drugtests_result       on public.compass_drug_tests (result) where result <> 'negative';

alter table public.compass_drug_tests enable row level security;

drop policy if exists drugtests_tenant_isolation on public.compass_drug_tests;
create policy drugtests_tenant_isolation on public.compass_drug_tests
  using (
    carrier_id in (select carrier_id from public.carrier_members where user_id = auth.uid())
  )
  with check (
    carrier_id in (select carrier_id from public.carrier_members where user_id = auth.uid())
  );

comment on table public.compass_ctpas      is 'Marketplace of nationally-recognized C/TPAs · carriers pick one in /app/drug-alcohol. Procom is the X3-recommended default per task #304.';
comment on table public.compass_drug_tests is 'DOT drug + alcohol test results · 49 CFR §382 · 5-year retention for positives + refusals (§382.401(b)(1)).';
comment on column public.carriers.ctpa_mode is 'How this carrier connects to their C/TPA: procom_referral (X3 referred them to Procom · Option 3) · byo_connected (existing C/TPA + we have an API connector) · byo_manual (existing C/TPA · carrier uploads results CSVs themselves)';
