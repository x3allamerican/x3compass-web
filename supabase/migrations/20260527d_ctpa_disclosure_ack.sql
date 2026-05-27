-- ============================================================
-- C/TPA disclosure acknowledgment · audit trail for Procom
-- (and any future) referral enrollment
-- ------------------------------------------------------------
-- Per X3 Compass methodology: when a carrier picks the Procom
-- Option 3 path, we MUST surface the full program details (fees,
-- enrollment requirements, 8-step enrollment process, ongoing
-- support) BEFORE locking it in, and capture an affirmative
-- acknowledgment that they read it.
--
-- Two columns:
--   ctpa_disclosure_acked_at  · timestamptz of affirmative click
--   ctpa_disclosure_acked_ip  · IP captured at ack time
--   ctpa_disclosure_version   · version of the disclosure they
--                               acked · bump when terms change
-- ============================================================

do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'carriers' and column_name = 'ctpa_disclosure_acked_at') then
    alter table public.carriers add column ctpa_disclosure_acked_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'carriers' and column_name = 'ctpa_disclosure_acked_ip') then
    alter table public.carriers add column ctpa_disclosure_acked_ip inet;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'carriers' and column_name = 'ctpa_disclosure_version') then
    alter table public.carriers add column ctpa_disclosure_version text;
    -- Examples: 'procom-2026-05-v1' (the version Joshua sees in the email Martin sent)
  end if;
end$$;

comment on column public.carriers.ctpa_disclosure_acked_at is
  'Timestamp when the carrier affirmatively acknowledged the C/TPA program disclosure (pricing, enrollment, ongoing support). Required for procom_referral mode. Captured at /app/drug-alcohol when picker locks in.';
