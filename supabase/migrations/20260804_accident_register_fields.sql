-- X3 Compass · Batch 6 Task 6 · 49 CFR 390.15 accident-register evidence
-- NEEDS CLAUDE TO APPLY. Codex commits source only and does not run migrations.

alter table public.compass_accidents
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists hazmat_released boolean;

comment on column public.compass_accidents.hazmat_released is
  'Whether hazardous materials other than fuel spilled from vehicle fuel tanks were released. NULL means not documented.';
