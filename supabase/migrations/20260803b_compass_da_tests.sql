-- compass_da_tests — DOT drug & alcohol test records (49 CFR Part 382). Carrier-scoped,
-- RLS-isolated like compass_drivers. REVIEW-ONLY: apply via the normal migration flow.
create table if not exists public.compass_da_tests (
  id          uuid primary key default gen_random_uuid(),
  carrier_id  uuid not null references public.compass_carriers(id) on delete cascade,
  driver_id   uuid references public.compass_drivers(id) on delete set null,
  driver_name text,                              -- denormalized for display
  test_date   date not null,
  test_type   text not null,                     -- Pre-employment | Random | Post-accident | Reasonable-suspicion | Return-to-duty | Follow-up
  panel       text,                              -- e.g. "DOT 5-panel + ETOH"
  mro         text,
  result      text not null default 'Pending'
              check (result in ('Negative','Negative-dilute','Positive','Refusal','Pending')),
  created_at  timestamptz not null default now()
);
create index if not exists idx_da_tests_carrier on public.compass_da_tests(carrier_id, test_date desc);
alter table public.compass_da_tests enable row level security;
create policy "da_tests_carrier_scope" on public.compass_da_tests for all
  using (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()))
  with check (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()));
