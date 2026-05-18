-- Sprint #18 — Finance ledger
-- One table to hold every dollar in or out: subscriptions, vendor pass-throughs,
-- software/overhead, refunds, and "owed to us" pending billables.

create table if not exists compass_finance_entries (
  id            uuid primary key default uuid_generate_v4(),
  entry_date    date not null default current_date,
  type          text not null check (type in ('money_in','vendor','overhead','refund','owed')),
  carrier_id    uuid,
  carrier_name  text,                              -- denormalized for filtering + reporting
  vendor        text,                              -- 'Stripe', 'Checkr', 'Anthropic', 'Cloudflare', etc.
  category      text,                              -- 'Subscription', 'Background check', 'AI inference', etc.
  description   text,
  amount_cents  bigint not null,                   -- always positive; the sign is implicit from `type`
  paid          boolean not null default false,
  stripe_id     text unique,                       -- if sourced from Stripe (charge/invoice id) — used for dedup
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists compass_finance_entries_date_idx   on compass_finance_entries (entry_date desc);
create index if not exists compass_finance_entries_type_idx   on compass_finance_entries (type);
create index if not exists compass_finance_entries_carrier_idx on compass_finance_entries (carrier_name);
create index if not exists compass_finance_entries_vendor_idx on compass_finance_entries (vendor);

alter table compass_finance_entries enable row level security;
create policy "super_read_finance"  on compass_finance_entries for select using (is_super_admin());
create policy "super_write_finance" on compass_finance_entries for all    using (is_super_admin()) with check (is_super_admin());

drop trigger if exists compass_finance_entries_touch on compass_finance_entries;
create trigger compass_finance_entries_touch before update on compass_finance_entries for each row execute function touch_updated_at();
