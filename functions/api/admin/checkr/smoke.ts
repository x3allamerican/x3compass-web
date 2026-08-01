/**
 * GET /api/admin/checkr/smoke?order_id=<uuid> OR ?candidate_id=<id>
 *
 * Live smoke-test view for the Checkr round-trip. Returns:
 *   - the matching vendor_orders row (full state)
 *   - all vendor_webhook_events linked to that order
 *   - a computed timeline showing which lifecycle stages have fired
 *
 * Super-admin only. Polls cheaply (~50ms) so the smoke page can refresh
 * every 2 seconds without burning Supabase quota.
 */
import { requireSuperAdmin, unauthorized, ok, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";
import { rateLimit } from "../../../_shared/rate-limit";

interface Env extends AdminEnv {}

type OrderRow = {
  id: string; status: string; vendor_ref_id: string | null;
  checkr_candidate_id: string | null; report_id: string | null;
  invitation_url: string | null;
  checkr_result: string | null; checkr_assessment: string | null;
  effective_status: string | null; includes_canceled: boolean | null;
  ordered_at: string | null; completed_at: string | null; last_event_at: string | null;
  adverse_action_at: string | null; canceled_at: string | null;
  package: string | null; work_state: string | null;
  driver_id: string | null; carrier_id: string | null;
};
type EventRow = {
  id: string; event_id: string; event_type: string;
  signature_verified: boolean; received_at: string; processed_at: string | null;
  error: string | null; payload: unknown;
};

const EXPECTED_LIFECYCLE = [
  "invitation.created",
  "invitation.completed",
  "report.created",
  "report.updated",
  "report.completed",
] as const;

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "checkr-smoke", max: 60, windowSec: 60 });
  if (_rl) return _rl;
  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);

  const url = new URL(ctx.request.url);
  const orderId = url.searchParams.get("order_id");
  const candidateId = url.searchParams.get("candidate_id");

  const supa = supaFetch(ctx.env);

  let order: OrderRow | null = null;
  if (orderId) {
    const rows = (await supa.select("vendor_orders", `id=eq.${orderId}&vendor=eq.checkr&select=*`)) as OrderRow[];
    order = rows[0] || null;
  } else if (candidateId) {
    const rows = (await supa.select("vendor_orders", `checkr_candidate_id=eq.${candidateId}&vendor=eq.checkr&select=*`)) as OrderRow[];
    order = rows[0] || null;
  } else {
    const rows = (await supa.select("vendor_orders", "vendor=eq.checkr&last_event_at=not.is.null&order=last_event_at.desc&limit=1&select=*")) as OrderRow[];
    order = rows[0] || null;
  }
  if (!order) {
    return ok({ ok: true, order: null, events: [], timeline: [], lifecycle: EXPECTED_LIFECYCLE, message: "No matching Checkr order found." });
  }

  const events = (await supa.select(
    "vendor_webhook_events",
    `vendor_order_id=eq.${order.id}&vendor=eq.checkr&order=received_at.asc&select=id,event_id,event_type,signature_verified,received_at,processed_at,error`
  )) as EventRow[];

  const seen = new Map<string, EventRow>();
  for (const e of events) if (!seen.has(e.event_type)) seen.set(e.event_type, e);
  const timeline = EXPECTED_LIFECYCLE.map((step) => {
    const e = seen.get(step);
    return {
      step, fired: !!e,
      event_id: e?.event_id || null,
      received_at: e?.received_at || null,
      signature_verified: e?.signature_verified ?? null,
      processed_at: e?.processed_at || null,
    };
  });

  const firedCount = timeline.filter(t => t.fired).length;
  const signatureFailures = events.filter(e => !e.signature_verified).length;
  const unprocessed = events.filter(e => !e.processed_at).length;

  return ok({
    ok: true, order, events,
    timeline, lifecycle: EXPECTED_LIFECYCLE,
    health: {
      events_received: events.length,
      lifecycle_steps_fired: firedCount,
      lifecycle_steps_expected: EXPECTED_LIFECYCLE.length,
      signature_failures: signatureFailures,
      unprocessed_events: unprocessed,
      order_status: order.status,
      terminal: order.status === "completed" || order.status === "canceled" || order.status === "failed",
    },
  });
};
