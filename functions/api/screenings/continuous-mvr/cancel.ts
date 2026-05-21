/**
 * POST /api/screenings/continuous-mvr/cancel
 *
 * Cancel a continuous MVR enrollment via Checkr API + flip our local row.
 * Per Checkr billing doc: "If a driver is enrolled, unenrolled, and then
 * re-enrolled within the same month, you will be charged for two separate
 * enrollment events for that driver." — surface that to the user before
 * they cancel.
 *
 * Body: { continuous_check_id: "uuid" }
 */

import { bearerFromRequest, verifySupabaseJwt, supaFetch } from "../../../_shared/supabase-admin";
import { rateLimit } from "../../../_shared/rate-limit";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  CHECKR_ENV?: "staging" | "live";
  CHECKR_STAGING_API_KEY?: string;
  CHECKR_LIVE_API_KEY?: string;
  CHECKR_API_BASE?: string;
  RATE_LIMIT?: KVNamespace;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const token = bearerFromRequest(ctx.request);
  if (!token) return json({ ok: false, error: "Unauthorized" }, 401);
  const user = await verifySupabaseJwt(ctx.env, token);
  if (!user) return json({ ok: false, error: "Invalid token" }, 401);

  const rl = await rateLimit(ctx.env, `cc-cancel:${user.sub}`, 10, 60);
  if (!rl.ok) return json({ ok: false, error: "Rate limited" }, 429);

  let body: { continuous_check_id?: string };
  try {
    body = (await ctx.request.json()) as { continuous_check_id?: string };
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }
  if (!body.continuous_check_id) return json({ ok: false, error: "continuous_check_id required" }, 400);

  const sb = supaFetch(ctx.env);

  // Verify ownership
  const rows = (await sb.select(
    "compass_continuous_checks",
    `select=id,carrier_id,checkr_continuous_check_id,status&id=eq.${body.continuous_check_id}&limit=1`
  )) as Array<{ id: string; carrier_id: string; checkr_continuous_check_id: string | null; status: string }>;
  if (rows.length === 0) return json({ ok: false, error: "Enrollment not found" }, 404);
  const row = rows[0];

  const memberships = (await sb.select(
    "compass_user_carriers",
    `select=user_id&user_id=eq.${user.sub}&carrier_id=eq.${row.carrier_id}&limit=1`
  )) as Array<{ user_id: string }>;
  if (memberships.length === 0) return json({ ok: false, error: "Not authorized" }, 403);

  if (row.status === "canceled") {
    return json({ ok: true, already_canceled: true });
  }

  // Call Checkr's cancel endpoint if we have a Checkr id
  if (row.checkr_continuous_check_id) {
    const env = ctx.env.CHECKR_ENV === "live" ? "live" : "staging";
    const apiKey = env === "live" ? ctx.env.CHECKR_LIVE_API_KEY : ctx.env.CHECKR_STAGING_API_KEY;
    if (apiKey) {
      const apiBase =
        ctx.env.CHECKR_API_BASE || (env === "live" ? "https://api.checkr.com" : "https://api.checkr-staging.com");
      const checkrRes = await fetch(
        `${apiBase}/v1/continuous_checks/${row.checkr_continuous_check_id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(apiKey + ":")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!checkrRes.ok && checkrRes.status !== 404) {
        const text = await checkrRes.text();
        return json(
          { ok: false, error: `Checkr cancel failed: HTTP ${checkrRes.status}`, detail: text },
          502
        );
      }
    }
  }

  // Flip local row
  await sb.update("compass_continuous_checks", `id=eq.${row.id}`, {
    status: "canceled",
    canceled_at: new Date().toISOString(),
  });

  return json({ ok: true, continuous_check_id: row.id, status: "canceled" });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
