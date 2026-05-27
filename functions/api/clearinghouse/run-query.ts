/**
 * POST /api/clearinghouse/run-query
 *
 * Advances a pending compass_clearinghouse_queries row from result='pending'
 * to a terminal result. PHASE 1 MOCK: simulates the FMCSA query call · returns
 * 'no_information' on ~90% of runs, 'information' on ~10% so the limited→
 * triggered_full workflow can be demonstrated end-to-end.
 *
 * PHASE 2 will replace the mock with a real FMCSA Clearinghouse API call
 * once Joshua's enrollment lands (30-180 day application window).
 *
 * Request body: { query_id: string }
 * Response:     { ok, query_id, result, fmcsa_query_id, triggered_followup }
 *               or { ok: false, error }
 *
 * Auth: Bearer JWT (Supabase). User must be a member of the query's carrier.
 *
 * Side effects:
 *   1. UPDATE compass_clearinghouse_queries.result + fmcsa_query_id
 *   2. If query_type='annual_limited' AND result='information':
 *      INSERT a fresh compass_clearinghouse_consents row of type
 *      'triggered_24hr' with consent_deadline_at = now() + 24h, so the
 *      24h watchlist immediately shows the new pending consent.
 *      (V2 will also auto-dispatch the consent email here · for now the
 *      carrier-side UI flags the new pending consent and they can hit
 *      the existing Resend Consent button to send it.)
 *
 * See: /clearinghouse-vertical-memo.md · 49 CFR §382.701(a)(2)
 */

import { bearerFromRequest, verifySupabaseJwt, type SupaEnv } from "../../_shared/supabase-admin";

interface Env extends SupaEnv {}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

function generateMockFmcsaId(): string {
  // Match the format used in our demo data: FMCSA-YY-MM-DD-XNNNN
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const x = letters[Math.floor(Math.random() * letters.length)];
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `FMCSA-${yy}-${mm}-${dd}-${x}${n}`;
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, error: "Supabase env vars missing" }, 500);
  }

  // 1. Auth
  const token = bearerFromRequest(request);
  if (!token) return json({ ok: false, error: "Missing Bearer token" }, 401);
  const user = await verifySupabaseJwt(env, token);
  if (!user) return json({ ok: false, error: "Invalid token" }, 401);

  // 2. Parse body
  let body: { query_id?: string };
  try { body = await request.json() as { query_id?: string }; }
  catch { return json({ ok: false, error: "Invalid JSON body" }, 400); }
  if (!body.query_id) return json({ ok: false, error: "query_id required" }, 400);

  // 3. Fetch the query + verify carrier membership
  const lookup = await fetch(
    `${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_queries?id=eq.${body.query_id}&select=id,carrier_id,driver_id,query_type,result`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE) }
  );
  if (!lookup.ok) return json({ ok: false, error: `Supabase lookup ${lookup.status}` }, 500);
  const rows = await lookup.json() as Array<{ id: string; carrier_id: string; driver_id: string; query_type: string; result: string }>;
  if (!rows.length) return json({ ok: false, error: "Query not found" }, 404);
  const q = rows[0];

  if (q.result !== "pending") {
    return json({ ok: false, error: `Query is already ${q.result}; cannot re-run` }, 409);
  }

  const memberCheck = await fetch(
    `${env.SUPABASE_URL}/rest/v1/carrier_members?user_id=eq.${user.sub}&carrier_id=eq.${q.carrier_id}&select=carrier_id`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE) }
  );
  const members = memberCheck.ok ? await memberCheck.json() as unknown[] : [];
  if (!members.length) return json({ ok: false, error: "Not a member of this carrier" }, 403);

  // 4. MOCK FMCSA call · Phase 1 placeholder.
  //    Phase 2 will replace with a real fetch to clearinghouse.fmcsa.dot.gov API.
  const rolled = Math.random();
  const result: "no_information" | "information" = rolled < 0.10 ? "information" : "no_information";
  const fmcsaQueryId = generateMockFmcsaId();
  const now = new Date();

  // 5. UPDATE the query row
  const update = await fetch(
    `${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_queries?id=eq.${q.id}`,
    {
      method: "PATCH",
      headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE),
      body: JSON.stringify({
        result,
        fmcsa_query_id: fmcsaQueryId,
        query_run_at: now.toISOString(),
        query_run_by: user.sub,
      }),
    }
  );
  if (!update.ok) return json({ ok: false, error: `Update failed: ${await update.text()}` }, 500);

  // 6. Side-effect: if an annual_limited returned 'information', auto-spawn
  //    a triggered_24hr consent so the 24h watchlist picks it up immediately.
  let triggeredFollowup = false;
  if (q.query_type === "annual_limited" && result === "information") {
    const deadlineAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const ins = await fetch(
      `${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_consents`,
      {
        method: "POST",
        headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE),
        body: JSON.stringify({
          carrier_id: q.carrier_id,
          driver_id: q.driver_id,
          consent_type: "triggered_24hr",
          consent_requested_at: now.toISOString(),
          consent_requested_by: user.sub,
          consent_deadline_at: deadlineAt.toISOString(),
        }),
      }
    );
    triggeredFollowup = ins.ok;
  }

  return json({
    ok: true,
    query_id: q.id,
    result,
    fmcsa_query_id: fmcsaQueryId,
    triggered_followup: triggeredFollowup,
    note: "Mock result · Phase 2 will wire the real FMCSA Clearinghouse API once enrollment lands.",
  });
}
