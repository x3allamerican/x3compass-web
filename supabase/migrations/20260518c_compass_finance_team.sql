-- ============================================================================
-- Sprint #20: AI Finance Team — foundational schema
-- Replaces QBO by giving Compass agents a real chart of accounts,
-- double-entry journal, per-carrier COGS, bank/CC reconciliation, and
-- vendor-invoice ingestion.
-- ============================================================================

-- 1) CHART OF ACCOUNTS ──────────────────────────────────────────────────────
create table if not exists compass_chart_of_accounts (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,
  name            text not null,
  type            text not null check (type in ('asset','liability','equity','revenue','cogs','opex')),
  subtype         text,
  tax_line        text,
  parent_code     text,
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_coa_type on compass_chart_of_accounts(type);

insert into compass_chart_of_accounts (code, name, type, subtype, tax_line) values
  ('1000', 'Cash — Operating',                     'asset',     'current_asset',     'bs_cash'),
  ('1010', 'Cash — Reserve',                       'asset',     'current_asset',     'bs_cash'),
  ('1100', 'Accounts Receivable',                  'asset',     'current_asset',     'bs_ar'),
  ('1200', 'Stripe Pending',                       'asset',     'current_asset',     'bs_ar'),
  ('1300', 'Prepaid Expenses',                     'asset',     'current_asset',     'bs_prepaid'),
  ('1500', 'Computer & Office Equipment',          'asset',     'fixed_asset',       'sch_c_depreciable'),
  ('1510', 'Accumulated Depreciation',             'asset',     'fixed_asset',       'sch_c_depreciation'),
  ('2000', 'Accounts Payable',                     'liability', 'current_liability', 'bs_ap'),
  ('2100', 'Credit Card — Capital One',            'liability', 'current_liability', 'bs_cc'),
  ('2110', 'Credit Card — Chase',                  'liability', 'current_liability', 'bs_cc'),
  ('2200', 'Deferred Revenue',                     'liability', 'current_liability', 'bs_deferred_rev'),
  ('2300', 'Sales Tax Payable',                    'liability', 'current_liability', 'bs_tax_payable'),
  ('3000', 'Owner Contributions',                  'equity',    'equity',            'owner_contributions'),
  ('3100', 'Owner Distributions',                  'equity',    'equity',            'owner_draws'),
  ('3900', 'Retained Earnings',                    'equity',    'equity',            'retained_earnings'),
  ('4000', 'Subscription Revenue — DIY',           'revenue',   'subscription',      'sch_c_gross_receipts'),
  ('4010', 'Subscription Revenue — DFY',           'revenue',   'subscription',      'sch_c_gross_receipts'),
  ('4020', 'Subscription Revenue — Enterprise',    'revenue',   'subscription',      'sch_c_gross_receipts'),
  ('4030', 'Hazmat Add-on Revenue',                'revenue',   'subscription',      'sch_c_gross_receipts'),
  ('4100', 'One-time / Setup Fees',                'revenue',   'other',             'sch_c_gross_receipts'),
  ('4200', 'Service Revenue — X3 Fleet Safety',    'revenue',   'service',           'sch_c_gross_receipts'),
  ('4900', 'Refunds & Discounts (contra)',         'revenue',   'contra',            'sch_c_returns'),
  ('5000', 'Stripe Processing Fees',               'cogs',      'processor',         'sch_c_commissions'),
  ('5010', 'Anthropic API Costs',                  'cogs',      'ai',                'sch_c_supplies'),
  ('5020', 'Checkr Background Check Costs',        'cogs',      'passthrough',       'sch_c_supplies'),
  ('5030', 'Resend Email Costs',                   'cogs',      'comms',             'sch_c_supplies'),
  ('5040', 'Twilio SMS Costs',                     'cogs',      'comms',             'sch_c_supplies'),
  ('5050', 'MVR / D&A Vendor Passthrough',         'cogs',      'passthrough',       'sch_c_supplies'),
  ('6000', 'Cloudflare Hosting',                   'opex',      'hosting',           'sch_c_office'),
  ('6010', 'Supabase Database',                    'opex',      'hosting',           'sch_c_office'),
  ('6020', 'GitHub Actions / Source Hosting',      'opex',      'hosting',           'sch_c_office'),
  ('6100', 'Software Subscriptions',               'opex',      'software',          'sch_c_office'),
  ('6200', 'Legal & Professional',                 'opex',      'pro',               'sch_c_legal_pro'),
  ('6210', 'CPA / Bookkeeping',                    'opex',      'pro',               'sch_c_legal_pro'),
  ('6300', 'Marketing & Advertising',              'opex',      'marketing',         'sch_c_advertising'),
  ('6310', 'Trade Shows & Conferences',            'opex',      'marketing',         'sch_c_travel'),
  ('6400', 'Travel — Air/Ground/Lodging',          'opex',      'travel',            'sch_c_travel'),
  ('6410', 'Meals (50%% deductible)',              'opex',      'meals',             'sch_c_meals'),
  ('6500', 'Office Supplies',                      'opex',      'office',            'sch_c_office'),
  ('6600', 'Insurance — Business',                 'opex',      'insurance',         'sch_c_insurance'),
  ('6700', 'Bank Fees',                            'opex',      'bank',              'sch_c_office'),
  ('6900', 'Other Operating Expenses',             'opex',      'other',             'sch_c_other')
on conflict (code) do nothing;

-- 2) JOURNAL ENTRIES + LINES (double-entry ledger) ──────────────────────────
create table if not exists compass_journal_entries (
  id              uuid primary key default uuid_generate_v4(),
  entry_date      date not null default current_date,
  period          text not null,
  reference       text,
  source          text not null,
  description     text,
  carrier_id      uuid,
  agent_name      text,
  agent_run_id    uuid,
  posted          boolean not null default true,
  locked          boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now(),
  created_by      text
);

create index if not exists idx_je_period  on compass_journal_entries(period);
create index if not exists idx_je_date    on compass_journal_entries(entry_date);
create index if not exists idx_je_carrier on compass_journal_entries(carrier_id);
create index if not exists idx_je_ref     on compass_journal_entries(reference);

create table if not exists compass_journal_lines (
  id              uuid primary key default uuid_generate_v4(),
  entry_id        uuid not null references compass_journal_entries(id) on delete cascade,
  account_code    text not null references compass_chart_of_accounts(code),
  debit_cents     bigint not null default 0,
  credit_cents    bigint not null default 0,
  memo            text,
  created_at      timestamptz not null default now(),
  check (debit_cents >= 0 and credit_cents >= 0),
  check ((debit_cents = 0 and credit_cents > 0) or (debit_cents > 0 and credit_cents = 0))
);

create index if not exists idx_jl_entry   on compass_journal_lines(entry_id);
create index if not exists idx_jl_account on compass_journal_lines(account_code);

-- 3) USAGE EVENTS (per-carrier COGS) ────────────────────────────────────────
create table if not exists compass_usage_events (
  id              uuid primary key default uuid_generate_v4(),
  ts              timestamptz not null default now(),
  carrier_id      uuid,
  vendor          text not null,
  service         text not null,
  units_in        bigint default 0,
  units_out       bigint default 0,
  cost_cents      bigint not null default 0,
  agent_name      text,
  agent_run_id    uuid,
  request_id      text,
  metadata        jsonb
);

create index if not exists idx_usage_carrier on compass_usage_events(carrier_id);
create index if not exists idx_usage_ts      on compass_usage_events(ts desc);
create index if not exists idx_usage_vendor  on compass_usage_events(vendor);

-- 4) BANK / CC TRANSACTIONS ─────────────────────────────────────────────────
create table if not exists compass_bank_transactions (
  id              uuid primary key default uuid_generate_v4(),
  account_code    text not null references compass_chart_of_accounts(code),
  source          text not null,
  external_id     text not null,
  posted_date     date not null,
  description     text,
  amount_cents    bigint not null,
  raw             jsonb,
  matched_entry_id uuid references compass_journal_entries(id) on delete set null,
  reconciled      boolean not null default false,
  reconciled_at   timestamptz,
  reconciled_by   text,
  created_at      timestamptz not null default now(),
  unique(source, external_id)
);

create index if not exists idx_bank_acct    on compass_bank_transactions(account_code);
create index if not exists idx_bank_date    on compass_bank_transactions(posted_date desc);
create index if not exists idx_bank_unrecon on compass_bank_transactions(reconciled) where reconciled = false;

-- 5) VENDOR INVOICES ────────────────────────────────────────────────────────
create table if not exists compass_vendor_invoices (
  id              uuid primary key default uuid_generate_v4(),
  vendor          text not null,
  invoice_number  text,
  invoice_date    date not null,
  due_date        date,
  amount_cents    bigint not null,
  account_code    text references compass_chart_of_accounts(code),
  source          text not null,
  source_message_id text,
  pdf_url         text,
  status          text not null default 'pending' check (status in ('pending','paid','overdue','disputed')),
  paid_entry_id   uuid references compass_journal_entries(id) on delete set null,
  raw             jsonb,
  created_at      timestamptz not null default now(),
  unique(vendor, invoice_number)
);

create index if not exists idx_vinv_due    on compass_vendor_invoices(due_date) where status = 'pending';
create index if not exists idx_vinv_vendor on compass_vendor_invoices(vendor);

-- 6) PERIOD CLOSE LOG ────────────────────────────────────────────────────────
create table if not exists compass_period_closes (
  period              text primary key,
  closed_at           timestamptz not null default now(),
  closed_by           text not null,
  je_count            int not null default 0,
  total_revenue_cents bigint not null default 0,
  total_cogs_cents    bigint not null default 0,
  total_opex_cents    bigint not null default 0,
  net_income_cents    bigint not null default 0,
  notes               text,
  pdf_statements_url  text
);

-- RLS ────────────────────────────────────────────────────────────────────────
alter table compass_chart_of_accounts enable row level security;
alter table compass_journal_entries   enable row level security;
alter table compass_journal_lines     enable row level security;
alter table compass_usage_events      enable row level security;
alter table compass_bank_transactions enable row level security;
alter table compass_vendor_invoices   enable row level security;
alter table compass_period_closes     enable row level security;

create policy "super_admin_all_coa"   on compass_chart_of_accounts for all using (is_super_admin());
create policy "super_admin_all_je"    on compass_journal_entries   for all using (is_super_admin());
create policy "super_admin_all_jl"    on compass_journal_lines     for all using (is_super_admin());
create policy "super_admin_all_usage" on compass_usage_events      for all using (is_super_admin());
create policy "super_admin_all_bank"  on compass_bank_transactions for all using (is_super_admin());
create policy "super_admin_all_vinv"  on compass_vendor_invoices   for all using (is_super_admin());
create policy "super_admin_all_close" on compass_period_closes     for all using (is_super_admin());

-- Seed the 5 AI Finance Team agents ─────────────────────────────────────────
insert into compass_agents (name, kind, cron_expr, enabled, mode, notes) values
  ('agent-control-manager',    'scheduled', '15 2 * * *',   true, 'realtime', 'Daily 02:15 UTC — bank/CC reconciliation + journal balance check'),
  ('agent-revenue-manager',    'scheduled', '*/30 * * * *', true, 'realtime', 'Every 30 min — Stripe sync, dunning, trial conversion, churn risk'),
  ('agent-reporting-manager',  'scheduled', '0 6 1 * *',    true, 'realtime', 'Monthly 1st @ 06:00 UTC — P&L, BS, CF + email statements'),
  ('agent-fpa-manager',        'scheduled', '0 7 * * 1',    true, 'realtime', 'Weekly Mon 07:00 UTC — MRR forecast, variance, cohort retention'),
  ('agent-finance-workflow',   'scheduled', '0 3 * * *',    true, 'realtime', 'Daily 03:00 UTC — orchestrates the other 4 agents, enforces close calendar')
on conflict (name) do update set
  cron_expr = excluded.cron_expr,
  notes     = excluded.notes;
