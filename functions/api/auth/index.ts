/**
 * GET /api/auth — lightweight auth/session probe.
 *
 * Purpose: a canonical, side-effect-free endpoint that reflects auth state.
 *  - No / invalid bearer token -> 401 with a JSON error contract.
 *  - Valid Supabase session      -> 200 { ok: true, user: { id, email } }.
 *
 * Used by the X3 Hospital "auth" vital to confirm the app's auth gate is
 * live (a healthy gated API returns 401 + JSON error when unauthenticated).
 * Kept intentionally trivial: it only verifies the JWT, touches no tenant data.
 */
import { bearerFromRequest, verifySupabaseJwt } from "../../_shared/supabase-admin";
import { correlationId } from "../../_shared/request-security";

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; SUPABASE_JWT_SECRET?: string }
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const id = correlationId(ctx.request);
  const token = bearerFromRequest(ctx.request);
  if (!token) return json({ ok: false, error: "authentication required", code: "no_token", correlation_id: id }, 401);
  let user: { id: string; email?: string } | null = null;
  try { user = await verifySupabaseJwt(ctx.env, token); }
  catch { return json({ ok: false, error: "auth service unavailable", code: "auth_unavailable", correlation_id: id }, 503); }
  if (!user) return json({ ok: false, error: "invalid or expired session", code: "invalid_token", correlation_id: id }, 401);
  return json({ ok: true, user: { id: user.id, email: user.email ?? null } });
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
