/**
 * GET /api/integrations/samsara/oauth-callback
 *
 * Samsara redirects here with ?code=...&state=... after user consent.
 * - Verifies state matches the cookie we set in oauth-start (CSRF protection)
 * - Exchanges code → tokens via Samsara's /oauth2/token
 * - Fetches the connected org via /me
 * - Upserts encrypted tokens into compass_vendor_integrations
 * - 302 redirects back to /app/integrations with success/error in query string
 */

import { supaFetch } from "../../../_shared/supabase-admin";
import {
  exchangeCodeForTokens,
  fetchSamsaraOrgInfo,
  parseOAuthState,
  encryptToken,
  SamsaraEnv,
} from "../../../_shared/samsara";

interface Env extends SamsaraEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

const STATE_COOKIE = "x3_samsara_oauth_state";

function readCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get("Cookie") || "";
  for (const part of cookie.split(/;\s*/)) {
    const [k, ...v] = part.split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function redirectWithResult(env: Env, query: Record<string, string>): Response {
  const base = env.NEXT_PUBLIC_SITE_URL || "https://x3compass-web.pages.dev";
  const target = `${base}/app/integrations?${new URLSearchParams(query).toString()}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      "Set-Cookie": `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  // 1. Did the user deny consent?
  if (error) {
    return redirectWithResult(ctx.env, {
      samsara: "error",
      reason: error,
      detail: errorDesc || "",
    });
  }

  if (!code || !state) {
    return redirectWithResult(ctx.env, {
      samsara: "error",
      reason: "missing_params",
      detail: "Authorization code or state missing from Samsara callback",
    });
  }

  // 2. Verify state cookie matches (CSRF)
  const cookieState = readCookie(ctx.request, STATE_COOKIE);
  if (!cookieState || cookieState !== state) {
    return redirectWithResult(ctx.env, {
      samsara: "error",
      reason: "state_mismatch",
      detail: "OAuth state cookie did not match callback state — possible CSRF",
    });
  }

  const parsed = parseOAuthState(state);
  if (!parsed) {
    return redirectWithResult(ctx.env, { samsara: "error", reason: "bad_state" });
  }
  const { carrierId } = parsed;

  // 3. Exchange code → tokens
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(ctx.env, code);
  } catch (e) {
    return redirectWithResult(ctx.env, {
      samsara: "error",
      reason: "token_exchange_failed",
      detail: e instanceof Error ? e.message.slice(0, 200) : "unknown",
    });
  }

  // 4. Identify the connected org
  let org;
  try {
    org = await fetchSamsaraOrgInfo(ctx.env, tokens.access_token);
  } catch (e) {
    // Non-fatal — still store the tokens, just without org metadata
    console.warn("[samsara/oauth-callback] /me fetch failed:", e);
    org = { id: "", name: undefined };
  }

  // 5. Encrypt + upsert into compass_vendor_integrations
  if (!ctx.env.SAMSARA_ENC_SECRET) {
    return redirectWithResult(ctx.env, {
      samsara: "error",
      reason: "no_enc_secret",
      detail: "SAMSARA_ENC_SECRET env var must be set on Cloudflare Pages",
    });
  }

  const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
  const scopes = tokens.scope ? tokens.scope.split(/\s+/) : null;

  const sb = supaFetch(ctx.env);
  await sb.insert("compass_vendor_integrations", {
    carrier_id: carrierId,
    vendor: "samsara",
    category: "eld",
    status: "connected",
    oauth_access_token_enc: encryptToken(tokens.access_token, ctx.env.SAMSARA_ENC_SECRET),
    oauth_refresh_token_enc: encryptToken(tokens.refresh_token, ctx.env.SAMSARA_ENC_SECRET),
    oauth_expires_at: expiresAt,
    oauth_scopes: scopes,
    external_org_id: org.id || null,
    external_org_name: org.name || null,
    config_json: { token_type: tokens.token_type || "Bearer" },
  }, "merge-duplicates").catch(async () => {
    // Insert failed (likely unique conflict on carrier_id+vendor) — update instead
    await sb.update(
      "compass_vendor_integrations",
      `carrier_id=eq.${carrierId}&vendor=eq.samsara`,
      {
        status: "connected",
        oauth_access_token_enc: encryptToken(tokens.access_token, ctx.env.SAMSARA_ENC_SECRET!),
        oauth_refresh_token_enc: encryptToken(tokens.refresh_token, ctx.env.SAMSARA_ENC_SECRET!),
        oauth_expires_at: expiresAt,
        oauth_scopes: scopes,
        external_org_id: org.id || null,
        external_org_name: org.name || null,
        last_error_at: null,
        last_error_text: null,
      }
    );
  });

  // 6. Done — redirect back to /app/integrations with success flag
  return redirectWithResult(ctx.env, {
    samsara: "connected",
    org: org.name || org.id || "Samsara organization",
  });
};
