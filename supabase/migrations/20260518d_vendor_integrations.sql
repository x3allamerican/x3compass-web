-- Vendor integration tracking — one row per (carrier, vendor) pair.
-- Stores ATS/MVR/D&A/clearinghouse/etc. connector state so the Drivers page
-- (and other pages) can render Connect/Sync UI without env-sniffing on the client.
--
-- Encryption notes:
--  - sensitive fields (subdomain, encrypted_api_key) live ONLY in this table
--  - decryption happens server-side in functions/_shared/vendor-mapper.ts
--    using a base64+XOR-with-VENDOR_SECRET stub for v1; rotate to pgsodium
--    or Cloudflare Secrets once we have >1 customer with vendor creds.
create table if not exists compass_vendor_integrations (
  id                uuid          primary key default gen_random_uuid(),
  carrier_id        uuid          not null references compass_carriers(id) on delete cascade,

  vendor            text          not null,        -- 'tenstreet' | 'hireright' | 'driverreach' | 'samba_safety' | 'checkr' | 'manual_api'
  category          text          not null,        -- 'ats' | 'mvr' | 'd_and_a' | 'clearinghouse' | 'eld' | 'other'
  status            text          not null default 'available',  -- 'available' | 'configured' | 'syncing' | 'connected' | 'error'

  subdomain         text          null,            -- e.g. 'acme.tenstreetapp.com' subdomain
  encrypted_api_key text          null,            -- vendor API key, encrypted (see notes above)
  config_json       jsonb         not null default '{}'::jsonb,

  last_sync_at      timestamptz   null,
  last_sync_count   int           null,
  last_error_at     timestamptz   null,
  last_error_text   text          null,

  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),

  unique (carrier_id, vendor)
);

create index if not exists idx_compass_vendor_integrations_carrier on compass_vendor_integrations (carrier_id);
create index if not exists idx_compass_vendor_integrations_status  on compass_vendor_integrations (status);

-- RLS: super-admin only for v1; tighten once per-carrier auth is wired.
alter table compass_vendor_integrations enable row level security;

drop policy if exists vendor_integrations_super_admin_all on compass_vendor_integrations;
create policy vendor_integrations_super_admin_all on compass_vendor_integrations
  for all to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- Trigger to bump updated_at
create or replace function _bump_vendor_integration_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_vendor_integration_updated on compass_vendor_integrations;
create trigger trg_vendor_integration_updated
  before update on compass_vendor_integrations
  for each row execute function _bump_vendor_integration_updated_at();

-- Seed the supported vendors for the test-seed carrier so the UI shows them as Available
-- (only inserts if there's at least one carrier and no existing rows for that vendor).
do $$
declare _cid uuid;
begin
  select id into _cid from compass_carriers order by created_at desc limit 1;
  if _cid is null then return; end if;

  insert into compass_vendor_integrations (carrier_id, vendor, category, status, config_json) values
    (_cid, 'tenstreet',    'ats',           'available', '{"docs":"https://tenstreet.com/api"}'),
    (_cid, 'driverreach',  'ats',           'available', '{"docs":"https://driverreach.com/api"}'),
    (_cid, 'hireright',    'mvr',           'available', '{"docs":"https://www.hireright.com/api"}'),
    (_cid, 'samba_safety', 'mvr',           'available', '{"docs":"https://www.sambasafety.com/api"}'),
    (_cid, 'checkr',       'background',    'available', '{"docs":"https://docs.checkr.com"}'),
    (_cid, 'manual_api',   'other',         'available', '{"docs":"/api/drivers/import"}')
  on conflict (carrier_id, vendor) do nothing;
end$$;
