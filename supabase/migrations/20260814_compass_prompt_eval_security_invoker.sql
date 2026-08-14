-- Security hardening for the public weekly prompt-evaluation report.
-- Views in the exposed public schema must honor the caller's RLS policies.
create or replace view public.compass_prompt_eval_weekly
with (security_invoker = on)
as
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
