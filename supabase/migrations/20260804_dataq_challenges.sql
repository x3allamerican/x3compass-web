-- X3 Compass · Batch 6 Task 4 · DataQ RDR challenge tracking
-- NEEDS CLAUDE TO APPLY. Source only: Codex does not run migrations or submit DataQs requests.

create table if not exists public.compass_dataq_challenges (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.compass_carriers(id) on delete cascade,
  target_type text not null check (target_type in ('inspection', 'crash')),
  target_id uuid not null,
  issue_summary text not null check (length(trim(issue_summary)) between 1 and 4000),
  requested_correction text not null check (length(trim(requested_correction)) between 1 and 2000),
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'approved', 'denied')),
  tracking_number text check (tracking_number is null or length(trim(tracking_number)) between 1 and 120),
  submitted_on date not null,
  agency_response_on date,
  agency_response_notes text check (agency_response_notes is null or length(trim(agency_response_notes)) between 1 and 4000),
  created_by uuid not null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (carrier_id, tracking_number)
);

create index if not exists compass_dataq_challenges_carrier_id_idx
  on public.compass_dataq_challenges (carrier_id, submitted_on desc);
create index if not exists compass_dataq_challenges_target_idx
  on public.compass_dataq_challenges (carrier_id, target_type, target_id);

create table if not exists public.compass_dataq_evidence (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.compass_carriers(id) on delete cascade,
  challenge_id uuid not null references public.compass_dataq_challenges(id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 200),
  file_name text not null check (length(trim(file_name)) between 1 and 255),
  object_key text not null check (object_key like 'carriers/%/dataq/%' and position('..' in object_key) = 0),
  content_type text not null check (length(trim(content_type)) between 1 and 120),
  size_bytes bigint not null check (size_bytes between 1 and 26214400),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (challenge_id, object_key)
);

create index if not exists compass_dataq_evidence_carrier_id_idx
  on public.compass_dataq_evidence (carrier_id, challenge_id);

create or replace function public.dataq_evidence_carrier_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.compass_dataq_challenges challenge
    where challenge.id = new.challenge_id and challenge.carrier_id = new.carrier_id
  ) then
    raise exception 'DataQ evidence carrier must match its challenge';
  end if;
  return new;
end;
$$;

drop trigger if exists dataq_evidence_carrier_guard on public.compass_dataq_evidence;
create trigger dataq_evidence_carrier_guard
before insert or update on public.compass_dataq_evidence
for each row execute function public.dataq_evidence_carrier_guard();

alter table public.compass_dataq_challenges enable row level security;
alter table public.compass_dataq_evidence enable row level security;

drop policy if exists compass_dataq_challenges_tenant on public.compass_dataq_challenges;
create policy compass_dataq_challenges_tenant on public.compass_dataq_challenges
  for all
  using (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()))
  with check (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()));

drop policy if exists compass_dataq_evidence_tenant on public.compass_dataq_evidence;
create policy compass_dataq_evidence_tenant on public.compass_dataq_evidence
  for all
  using (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()))
  with check (carrier_id in (select carrier_id from public.compass_carrier_users where user_id = auth.uid()));

comment on table public.compass_dataq_challenges is
  'Carrier-entered DataQs RDR tracking only; status records agency-reported workflow and is not an X3 compliance or merit determination.';
