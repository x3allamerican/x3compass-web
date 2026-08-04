-- SOURCE-ONLY MIGRATION — NEEDS CLAUDE TO APPLY. Do not run from Codex.
-- Adds provenance and human-review state for roadside inspection report intake.
alter table public.compass_inspections
  add column if not exists report_filename text,
  add column if not exists report_mime_type text,
  add column if not exists parse_status text not null default 'manual'
    check (parse_status in ('manual', 'needs_human_review', 'reviewed')),
  add column if not exists parser_warnings jsonb not null default '[]'::jsonb,
  add column if not exists parsed_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id);

comment on column public.compass_inspections.parse_status is
  'Decision-support extraction state. Parsed reports always require human review before reliance.';
