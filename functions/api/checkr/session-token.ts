import { bearerFromRequest, verifySupabaseJwt } from "../../_shared/supabase-admin";

interface Env {
  CHECKR_ENV?: "staging" | "live";
  CHECKR_STAGING_API_KEY?: string; CHECKR_LIVE_API_KEY?: string;
  CHECKR_API_BASE?: string; ADMIN_KEY?: string;
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const token = bearerFromRequest(ctx.request) || url.searchParams.get("token") || "";
  const user = token ? await verifySupabaseJwt(ctx.env, token) : null;
  if (!user) {
    const adminKey = url.searchParams.get("key") || ctx.request.headers.get("X-Admin-Key") || "";
    if (!ctx.env.ADMIN_KEY || adminKey !== ctx.env.ADMIN_KEY) return json({ ok: false, error: "Unauthorized" }, 401);
  }
  let body: { scopes?: string[] } = {};
  try { if (ctx.request.headers.get("Content-Type")?.includes("application/json")) body = (await ctx.request.json()) as { scopes?: string[] }; } catch { body = {}; }
  const queryScopes = url.searchParams.get("scopes");
  const scopes = Array.isArray(body.scopes) && body.scopes.length > 0
    ? body.scopes.filter((s) => typeof s === "string")
    : queryScopes ? queryScopes.split(",").map((s) => s.trim()).filter(Boolean) : ["order", "disclosure"];
  const env = ctx.env.CHECKR_ENV === "live" ? "live" : "staging";
  const apiKey = env === "live" ? ctx.env.CHECKR_LIVE_API_KEY : ctx.env.CHECKR_STAGING_API_KEY;
  if (!apiKey) return json({ ok: false, error: `CHECKR_${env.toUpperCase()}_API_KEY not set` }, 500);
  const apiBase = ctx.env.CHECKR_API_BASE || (env === "live" ? "https://api.checkr.com" : "https://api.checkr-staging.com");
  const res = await fetch(`${apiBase}/v1/web_sdk/session_tokens`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(apiKey + ":")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ scopes, direct: true }),
  });
  if (!res.ok) {
    const text = await res.text(); let detail: unknown = text;
    try { detail = JSON.parse(text); } catch { /* */ }
    return json({ ok: false, error: `Checkr HTTP ${res.status}`, detail }, 502);
  }
  const data = (await res.json()) as { token?: string };
  if (!data.token) return json({ ok: false, error: "Checkr response missing token", detail: data }, 502);
  return json({ ok: true, token: data.token, env, scopes });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key, Authorization" } });
