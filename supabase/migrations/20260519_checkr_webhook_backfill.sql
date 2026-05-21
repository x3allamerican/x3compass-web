-- 2026-05-19: Backfill for Checkr webhook event linking
--
-- The webhook for `report.created` and `report.completed` events was looking
-- up vendor_orders by report_id (NULL until first report.created arrives) and
-- vendor_ref_id (the invitation_id, not present on report events). So 2
-- report events on 2026-05-16 landed in vendor_webhook_events but never
-- updated the corresponding vendor_orders row.
--
-- The webhook handler (functions/api/screenings/webhook.ts) has been patched
-- to also match by checkr_candidate_id. This migration replays the missed
-- update on the historical row + links the orphaned events back via
-- vendor_order_id.

-- (1) Patch the candidate's vendor_orders row from the report.completed event payload
update vendor_orders
set
  status = 'completed',
  report_id = (select payload->'data'->'object'->>'id' from vendor_webhook_events where event_id = '6a08560496770d0001fe0280'),
  checkr_result = (select payload->'data'->'object'->>'result' from vendor_webhook_events where event_id = '6a08560496770d0001fe0280'),
  checkr_assessment = (select payload->'data'->'object'->>'assessment' from vendor_webhook_events where event_id = '6a08560496770d0001fe0280'),
  completed_at = (select received_at from vendor_webhook_events where event_id = '6a08560496770d0001fe0280'),
  last_event_at = (select received_at from vendor_webhook_events where event_id = '6a08560496770d0001fe0280'),
  effective_status = coalesce(
    (select payload->'data'->'object'->>'assessment' from vendor_webhook_events where event_id = '6a08560496770d0001fe0280'),
    (select payload->'data'->'object'->>'result' from vendor_webhook_events where event_id = '6a08560496770d0001fe0280')
  )
where checkr_candidate_id = '949e797e67fb9819d154b9fe'
  and status != 'completed';

-- (2) Link the two orphan events back to the correct order
update vendor_webhook_events
set vendor_order_id = (select id from vendor_orders where checkr_candidate_id = '949e797e67fb9819d154b9fe' limit 1)
where event_id in ('6a0855dc96770d0001fe027f','6a08560496770d0001fe0280');
