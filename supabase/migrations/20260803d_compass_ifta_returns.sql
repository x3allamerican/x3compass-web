-- compass_ifta_returns — quarterly IFTA returns. Carrier-scoped, RLS.
-- REVIEW-ONLY: apply via the normal migration flow.
create table if not exists public.compass_ifta_returns (
  id          uuid primary key default gen_random_uuid(),
  carrier_id  uuid not null references public.compass_carriers(id) on delete cascade,
  quarter     text not null,                  -- e.g. "Q1 2026"
  due_date    date,
  filed_date  date,
  tax_owed_cents   integer,
  refund_cents     integer,
  status      text not null default 'Awaiting data'
              check (status in ('Filed','Ready to submit','Awaiting data','Overdue')),
  created_at  timestamptz not null default now(),
  unique (carrier_id, quarter)
);
create index if not exists idx_ifta_carrier on public.compass_ifta_returns(carrier_id);
alter table public.compass_ifta_returns enable row level security;
create policy "ifta_carrier_scope" on public.compass_ifta_returns for all
  using (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()))
  with check (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()));
