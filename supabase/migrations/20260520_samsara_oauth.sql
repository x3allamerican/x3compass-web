-- Samsara OAuth 2.0 — extend compass_vendor_integrations to hold OAuth state.
-- Per https://developers.samsara.com/docs/oauth-20 — standard Authorization Code grant.
--
-- Stored per (carrier_id, vendor='samsara'):
--   oauth_access_token_enc   : Bearer access token (rotates on refresh; encrypted at rest)
--   oauth_refresh_token_enc  : long-lived refresh token (highest-value secret; encrypted)
--   oauth_expires_at         : when the access token expires (UTC). Refresh ~5 min before.
--   oauth_scopes             : granted scopes (e.g. ['read:vehicles','read:drivers','read:hours-of-service'])
--   external_org_id          : Samsara organization id (every customer has one)
--   external_org_name        : human-friendly Samsara org name for UI display

alter table compass_vendor_integrations
  add column if not exists oauth_access_token_enc  text,
  add column if not exists oauth_refresh_token_enc text,
  add column if not exists oauth_expires_at        timestamptz,
  add column if not exists oauth_scopes            text[],
  add column if not exists external_org_id         text,
  add column if not exists external_org_name       text;

create index if not exists idx_compass_vendor_integrations_expires
  on compass_vendor_integrations (oauth_expires_at)
  where oauth_expires_at is not null;

comment on column compass_vendor_integrations.oauth_access_token_enc  is 'Encrypted Samsara/OAuth access token. Refresh ~5min before oauth_expires_at.';
comment on column compass_vendor_integrations.oauth_refresh_token_enc is 'Encrypted Samsara/OAuth refresh token. Long-lived; only delete on disconnect.';
comment on column compass_vendor_integrations.external_org_id        is 'Samsara organization id (returned by /me endpoint after token exchange).';
