import { bearerFromRequest, verifySupabaseJwt } from "../../_shared/supabase-admin";
import { correlationId, securityError, tenantPreflight, type SecurityEnv } from "../../_shared/request-security";

interface Env extends SecurityEnv {
  CHECKR_ENV?: "staging" | "live";
  CHECKR_STAGING_API_KEY?: string; CHECKR_LIVE_API_KEY?: string;
  CHECKR_API_BASE?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const requestId = correlationId(ctx.request);
    const token = bearerFromRequest(ctx.request);
    const user = token ? await verifySupabaseJwt(ctx.env, token) : null;
    if (!user) return securityError(401, "unauthorized", requestId);
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
      console.error("Checkr session request failed", { correlation_id: requestId, status: res.status });
      return securityError(502, "upstream_failed", requestId);
    }
    const data = (await res.json()) as { token?: string };
    if (!data.token) return securityError(502, "upstream_failed", requestId);
    return json({ ok: true, token: data.token, env, scopes });
  } catch {
    console.error("Checkr session request failed", { correlation_id: correlationId(ctx.request) });
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) =>
  tenantPreflight(ctx.request, ctx.env, "POST, OPTIONS");
