-- SOURCE-ONLY MIGRATION — NEEDS CLAUDE TO APPLY. Do not run from Codex.
alter table public.notification_log
  add column if not exists read_at timestamptz,
  add column if not exists dedupe_key text;

create unique index if not exists notification_log_carrier_dedupe_uidx
  on public.notification_log (carrier_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists notification_log_carrier_unread_idx
  on public.notification_log (carrier_id, created_at desc)
  where read_at is null;
