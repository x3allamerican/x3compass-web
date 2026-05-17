/**
 * POST /api/uploads/sign — issue a short-lived signed token for PUT-uploading a file
 * to R2 via /api/uploads/put. Auth-gated by Supabase JWT. Scoped to the user's carrier.
 */
import { bearerFromRequest, supaFetch, verifySupabaseJwt } from "../../_shared/supabase-admin";
import { rateLimit } from "../../_shared/rate-limit";

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const rl = rateLimit(ctx.request, { key: "uploads-sign", max: 30, windowSec: 60 });
    if (rl) return rl;
    const token = bearerFromRequest(ctx.request);
    const user = await verifySupabaseJwt(ctx.env, token);
    if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

    let body: { folder?: string; filename?: string; driver_id?: string; content_type?: string; size?: number };
    try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

    const filename = (body.filename || "upload").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
    const folder = (body.folder || "dq").replace(/[^a-z0-9-]/g, "");
    if (body.size && body.size > 25 * 1024 * 1024) return json({ ok: false, error: "Max upload size 25MB" }, 413);

    const rows = (await supaFetch(ctx.env).select("compass_carrier_users", `user_id=eq.${user.id}&select=carrier_id`)) as Array<{ carrier_id: string }>;
    if (rows.length === 0) return json({ ok: false, error: "No carrier for user" }, 400);
    const carrier_id = rows[0].carrier_id;

    const uuid = crypto.randomUUID();
    const driverSeg = body.driver_id ? `/${body.driver_id}` : "";
    const objectKey = `carriers/${carrier_id}/${folder}${driverSeg}/${uuid}-${filename}`;
    const tokenPayload = { k: objectKey, ct: body.content_type || "application/octet-stream", exp: Math.floor(Date.now()/1000) + 300, uid: user.id, cid: carrier_id };
    const signedToken = btoa(JSON.stringify(tokenPayload));

    return json({ ok: true, put_url: `/api/uploads/put?t=${encodeURIComponent(signedToken)}`, object_key: objectKey, get_url: `/api/uploads/get?k=${encodeURIComponent(objectKey)}`, max_bytes: 25 * 1024 * 1024, expires_in: 300 });
  } catch (err) {
    console.error("[uploads/sign] error:", err);
    return json({ ok: false, error: "Server error", detail: err instanceof Error ? err.message : String(err) }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
