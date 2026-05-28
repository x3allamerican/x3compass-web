-- ============================================================
-- 20260527f_pdf_version_hash.sql
-- ------------------------------------------------------------
-- Extend compass_pdf_generated with template_version + content_hash so the
-- audit ledger can prove which exact version of a template a carrier
-- printed on day X.
--
-- The (template_slug, template_version, content_hash) triple is the
-- tamper-evident fingerprint that also appears in the PDF footer +
-- filename. Auditors can match a printed PDF -> ledger row -> source.
--
-- Backfill is safe: existing rows simply have NULLs in both columns.
-- ============================================================

alter table public.compass_pdf_generated
  add column if not exists template_version text,
  add column if not exists content_hash    text;

create index if not exists compass_pdf_generated_version_hash_idx
  on public.compass_pdf_generated (template_slug, template_version, content_hash);

comment on column public.compass_pdf_generated.template_version is
  'Semver-ish version of the template that produced this PDF (e.g. ''1.0''). NULL for stamp/merge sources.';
comment on column public.compass_pdf_generated.content_hash is
  '8-char prefix of SHA-256(bodyHTML). Appears in the PDF footer + filename. Lets auditors match a printed page to this row.';
