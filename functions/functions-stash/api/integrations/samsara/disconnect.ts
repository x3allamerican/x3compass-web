/**
 * POST /api/integrations/samsara/disconnect
 *
 * Disconnects the carrier's Samsara integration:
 * - Clears stored tokens (sets to NULL)
 * - Flips status to 'available' so the UI shows the Connect button again
 * - Leaves the row in place to preserve sync history (last_sync_at, etc.)
 *
 * Optional: also revoke the refresh token at Samsara (if Samsara exposes a
 * revocation endpoint — not all OAuth providers do; check after first run).
 */

import { bearerFromRequest, verifySupabaseJwt, supaFetch } from "../../../_shared/supabase-admin";
import { SamsaraEnv } from "../../../_shared/samsara";
import { rateLimit } from "../../../_shared/rate-limit";

interface Env extends SamsaraEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  RATE_LIMIT?: KVNamespace;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const token = bearerFromRequest(ctx.request);
  if (!token) return json({ ok: false, error: "Unauthorized" }, 401);
  const user = await verifySupabaseJwt(ctx.env, token);
  if (!user) return json({ ok: false, error: "Invalid token" }, 401);

  const rl = await rateLimit(ctx.env, `samsara-disconnect:${user.sub}`, 10, 60);
  if (!rl.ok) return json({ ok: false, error: "Rate limited" }, 429);

  const sb = supaFetch(ctx.env);
  const memberships = (await sb.select(
    "compass_user_carriers",
    `select=carrier_id&user_id=eq.${user.sub}&limit=1`
  )) as Array<{ carrier_id: string }>;
  if (memberships.length === 0) return json({ ok: false, error: "No carrier membership" }, 403);

  const carrierId = memberships[0].carrier_id;

  await sb.update(
    "compass_vendor_integrations",
    `carrier_id=eq.${carrierId}&vendor=eq.samsara`,
    {
      status: "available",
      oauth_access_token_enc: null,
      oauth_refresh_token_enc: null,
      oauth_expires_at: null,
      oauth_scopes: null,
      external_org_id: null,
      external_org_name: null,
      last_error_at: null,
      last_error_text: null,
    }
  );

  return json({ ok: true });
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
