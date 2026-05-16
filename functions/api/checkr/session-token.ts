/**
 * POST /api/checkr/session-token
 *
 * Exchanges X3 Compass's Checkr Secret API key for a short-lived SessionToken
 * that the Checkr Web SDK (Embeds) can use in the browser.
 *
 * Per Checkr Embeds v1 doc (Direct Customer flow):
 *   POST {api_host}/v1/web_sdk/session_tokens
 *   Authorization: Basic base64(secret_key + ':')
 *   Body: { "scopes": ["order"], "direct": true }
 *
 * Auth on OUR side: ADMIN_KEY query param (until proper Compass user auth
 * is wired). This MUST be a non-public endpoint per Checkr docs:
 * "Run your application's user authentication and authorization rules before
 *  requesting Checkr to acquire a SessionToken."
 *
 * Required Pages env vars:
 *  - CHECKR_ENV               'staging' | 'live'
 *  - CHECKR_STAGING_API_KEY   Checkr Secret key (HMAC: same value used for webhook verify)
 *  - CHECKR_LIVE_API_KEY
 *  - CHECKR_API_BASE          (optional override; defaults match CHECKR_ENV)
 *  - ADMIN_KEY                shared secret
 *
 * Body (optional):
 *   { "scopes": ["order"|"reports"|"disclosure"], "partner_id"?: "..." }
 *
 * Returns:
 *   { ok: true, token: "..." }
 */

interface Env {
  CHECKR_ENV?: "staging" | "live";
  CHECKR_STAGING_API_KEY?: string;
  CHECKR_LIVE_API_KEY?: string;
  CHECKR_API_BASE?: string;
  ADMIN_KEY?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  // Gate the endpoint
  const url = new URL(ctx.request.url);
  const key = url.searchParams.get("key") || ctx.request.headers.get("X-Admin-Key") || "";
  if (!ctx.env.ADMIN_KEY || key !== ctx.env.ADMIN_KEY) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  let body: { scopes?: string[] } = {};
  try {
    if (ctx.request.headers.get("Content-Type")?.includes("application/json")) {
      body = (await ctx.request.json()) as { scopes?: string[] };
    }
  } catch {
    body = {};
  }

  // Default to all scopes so any embed on the page works with one token
  // (Embeds POST without body, so we can't easily get per-embed scope from request)
  const queryScopes = url.searchParams.get("scopes");
  const scopes = Array.isArray(body.scopes) && body.scopes.length > 0
    ? body.scopes.filter((s) => typeof s === "string")
    : queryScopes
      ? queryScopes.split(",").map((s) => s.trim()).filter(Boolean)
      : ["order", "disclosure"]; // Valid Checkr scopes (no separate 'reports' scope exists)

  const env = ctx.env.CHECKR_ENV === "live" ? "live" : "staging";
  const apiKey =
    env === "live" ? ctx.env.CHECKR_LIVE_API_KEY : ctx.env.CHECKR_STAGING_API_KEY;
  if (!apiKey) {
    return json({ ok: false, error: `CHECKR_${env.toUpperCase()}_API_KEY not set` }, 500);
  }
  const apiBase =
    ctx.env.CHECKR_API_BASE ||
    (env === "live" ? "https://api.checkr.com" : "https://api.checkr-staging.com");

  // Exchange secret key for session token (Direct Customer flow)
  const res = await fetch(`${apiBase}/v1/web_sdk/session_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scopes, direct: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    let detail: unknown = text;
    try {
      detail = JSON.parse(text);
    } catch {
      // keep as text
    }
    return json(
      { ok: false, error: `Checkr HTTP ${res.status}`, detail },
      502
    );
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token) {
    return json({ ok: false, error: "Checkr response missing token", detail: data }, 502);
  }

  // Checkr returns { token }; the Web SDK reads this verbatim
  return json({ ok: true, token: data.token, env, scopes });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    },
  });
