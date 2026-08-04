-- X3 Compass · Batch 6 Task 3 · document-expiration sweep registration
-- NEEDS CLAUDE TO APPLY. Source only: Codex does not apply migrations or choose schedules.

insert into public.compass_agents (
  name,
  kind,
  cadence,
  cron_expr,
  description,
  enabled
) values (
  'agent-expiration-sweep',
  'scheduled',
  'Schedule pending Claude review',
  null,
  'Builds one carrier digest for dated CDL, medical certificate, annual MVR, and insurance expirations due within 60 days.',
  true
)
on conflict (name) do update set
  kind = excluded.kind,
  cadence = excluded.cadence,
  cron_expr = null,
  description = excluded.description,
  enabled = excluded.enabled;
