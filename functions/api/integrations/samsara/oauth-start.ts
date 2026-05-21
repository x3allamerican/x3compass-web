/**
 * GET /api/integrations/samsara/oauth-start
 *
 * Kicks off the Samsara OAuth 2.0 Authorization Code grant.
 * - Verifies the calling user is signed in + has a carrier membership
 * - Generates a CSRF state and stores it in a short-lived HttpOnly cookie
 * - 302 redirects to Samsara's /oauth2/authorize consent page
 *
 * After the user clicks Allow, Samsara redirects back to
 * /api/integrations/samsara/oauth-callback?code=...&state=... where we
 * verify the state, exchange the code, and store tokens.
 */

import { bearerFromRequest, verifySupabaseJwt, supaFetch } from "../../../_shared/supabase-admin";
import { buildAuthorizeUrl, makeOAuthState, SAMSARA_DEFAULT_SCOPES, SamsaraEnv } from "../../../_shared/samsara";

interface Env extends SamsaraEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
}

const STATE_COOKIE = "x3_samsara_oauth_state";
const STATE_COOKIE_MAX_AGE = 600; // 10 minutes

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  // 1. Verify user
  const url = new URL(ctx.request.url);
  const token = bearerFromRequest(ctx.request) || url.searchParams.get("token") || "";
  if (!token) {
    return new Response("Sign in required. Open this URL from /app/integrations.", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }
  const user = await verifySupabaseJwt(ctx.env, token);
  if (!user) return new Response("Invalid token", { status: 401 });

  // 2. Resolve carrier
  const sb = supaFetch(ctx.env);
  const memberships = (await sb.select(
    "compass_user_carriers",
    `select=carrier_id&user_id=eq.${user.sub}&limit=1`
  )) as Array<{ carrier_id: string }>;
  if (memberships.length === 0) {
    return new Response("No carrier membership for this user", { status: 403 });
  }
  const carrierId = memberships[0].carrier_id;

  // 3. Verify env config
  if (!ctx.env.SAMSARA_CLIENT_ID) {
    return new Response(
      "Samsara integration not configured on this Compass instance. Set SAMSARA_CLIENT_ID + SAMSARA_CLIENT_SECRET + SAMSARA_REDIRECT_URI in Cloudflare Pages env vars.",
      { status: 500, headers: { "Content-Type": "text/plain" } }
    );
  }
  if (!ctx.env.SAMSARA_REDIRECT_URI) {
    return new Response("SAMSARA_REDIRECT_URI not set", { status: 500 });
  }

  // 4. Generate state + build authorize URL
  const state = makeOAuthState(carrierId);
  const authorizeUrl = buildAuthorizeUrl({
    clientId: ctx.env.SAMSARA_CLIENT_ID,
    redirectUri: ctx.env.SAMSARA_REDIRECT_URI,
    state,
    scopes: SAMSARA_DEFAULT_SCOPES,
  });

  // 5. 302 with state cookie
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl,
      "Set-Cookie": `${STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_COOKIE_MAX_AGE}`,
    },
  });
};
