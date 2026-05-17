-- X3 Compass · Prompt Performance Capture · 2026-05-17
-- Logs every /api/ask call with the cited sections + eCFR round-trip results
-- so we can identify which prompt patterns produce reliable answers vs.
-- which produce unverified citations or hallucinated CFR sections.

create table if not exists public.compass_prompt_eval (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- Who / what
  user_id uuid references auth.users(id) on delete set null,
  carrier_id uuid references public.compass_carriers(id) on delete set null,
  prompt_version text not null default 'v1',         -- system prompt version
  model text not null default 'claude-sonnet-4-6',

  -- The conversation (last user turn only — full history is in client storage)
  user_question text not null,
  question_category text,                            -- HOS, DQF, HM, etc.

  -- The response
  response_text text,
  response_ms integer,                               -- end-to-end latency
  input_tokens integer,
  output_tokens integer,
  total_tokens integer generated always as (coalesce(input_tokens,0)+coalesce(output_tokens,0)) stored,

  -- Citation extraction + validation (runtime quality signal)
  cited_sections text[],                             -- e.g. {'391.41','395.3(a)(3)'}
  cited_sections_count integer generated always as (coalesce(array_length(cited_sections,1),0)) stored,
  unverified_citations text[],                       -- sections we couldn't round-trip in eCFR
  unverified_count integer generated always as (coalesce(array_length(unverified_citations,1),0)) stored,
  citation_quality_score numeric(3,2),               -- 0.00–1.00 (verified / total)

  -- Customer feedback (optional, captured async)
  customer_rating smallint check (customer_rating between 1 and 5),
  customer_rated_at timestamptz,
  customer_note text,

  -- Failure flags
  errored boolean not null default false,
  error_class text,
  error_detail text
);

create index if not exists idx_prompt_eval_created on public.compass_prompt_eval(created_at desc);
create index if not exists idx_prompt_eval_carrier on public.compass_prompt_eval(carrier_id, created_at desc);
create index if not exists idx_prompt_eval_category on public.compass_prompt_eval(question_category, created_at desc);
create index if not exists idx_prompt_eval_low_quality on public.compass_prompt_eval(citation_quality_score) where citation_quality_score < 1.0;

-- RLS
alter table public.compass_prompt_eval enable row level security;

-- Service role bypass (the /api/ask Function inserts via service role)
create policy compass_prompt_eval_service_all on public.compass_prompt_eval
  for all to service_role using (true) with check (true);

-- Authenticated users can SELECT their own carrier's rows for in-app analytics later
create policy compass_prompt_eval_own_carrier on public.compass_prompt_eval
  for select to authenticated using (
    carrier_id in (
      select carrier_id from public.compass_carrier_users where user_id = auth.uid()
    )
  );

-- Aggregation view for the weekly report
create or replace view public.compass_prompt_eval_weekly as
select
  date_trunc('week', created_at) as week,
  question_category,
  count(*) as total_questions,
  count(*) filter (where errored = true) as errored,
  count(*) filter (where unverified_count > 0) as had_unverified_citations,
  round(avg(citation_quality_score) filter (where cited_sections_count > 0), 3) as avg_citation_quality,
  round(avg(response_ms))::int as avg_response_ms,
  round(avg(customer_rating) filter (where customer_rating is not null), 2) as avg_customer_rating
from public.compass_prompt_eval
where created_at > now() - interval '12 weeks'
group by 1, 2
order by 1 desc, total_questions desc;

grant select on public.compass_prompt_eval_weekly to authenticated;
