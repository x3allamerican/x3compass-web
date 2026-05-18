/**
 * Super-admin auth helper for Pages Functions.
 *
 * Two valid auth paths:
 *  1. A logged-in user whose email is on the SUPER_ADMIN_EMAILS list, OR
 *     whose JWT contains user_metadata.role = 'super_admin'.
 *  2. An internal-cron caller with the X3_INTERNAL_SECRET header (used by
 *     the GitHub Actions dispatcher workflow).
 */
import { verifySupabaseJwt, bearerFromRequest, type SupabaseAdminEnv } from "./supabase-admin";

export interface AdminEnv extends SupabaseAdminEnv {
  X3_INTERNAL_SECRET?: string;
}

const SUPER_ADMIN_EMAILS = new Set([
  "joshua@x3compass.com",
  "joshua@x3fleetsafety.com",
  "joshuakovarik@yahoo.com",
]);

export type AdminPrincipal =
  | { type: "user"; id: string; email: string }
  | { type: "internal"; reason: string };

/**
 * Returns the AdminPrincipal if the request is authorized, otherwise returns null.
 * Pages Function callers should: `const who = await requireSuperAdmin(ctx); if (!who) return unauthorized()`.
 */
export async function requireSuperAdmin(ctx: { request: Request; env: AdminEnv }): Promise<AdminPrincipal | null> {
  // Path 1: internal-secret header from the cron dispatcher
  const internal = ctx.request.headers.get("X-X3-Internal-Secret") || ctx.request.headers.get("x-x3-internal-secret");
  if (internal && ctx.env.X3_INTERNAL_SECRET && internal === ctx.env.X3_INTERNAL_SECRET) {
    return { type: "internal", reason: "cron-dispatcher" };
  }

  // Path 2: signed-in super-admin
  const token = bearerFromRequest(ctx.request);
  if (token) {
    const user = await verifySupabaseJwt(ctx.env, token);
    if (user && user.email) {
      const email = user.email.toLowerCase().trim();
      if (SUPER_ADMIN_EMAILS.has(email)) {
        return { type: "user", id: user.id, email };
      }
      // also check role
      const r = await fetch(`${ctx.env.SUPABASE_URL?.replace(/\/$/, "")}/auth/v1/user`, {
        headers: { apikey: ctx.env.SUPABASE_SERVICE_ROLE || "", Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const u = (await r.json()) as { user_metadata?: { role?: string } };
        if (u.user_metadata?.role === "super_admin") return { type: "user", id: user.id, email };
      }
    }
  }
  return null;
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ ok: false, error: "Unauthorized — super-admin only." }), {
    status: 401, headers: { "Content-Type": "application/json" },
  });
}

export function serverError(message: string, status = 500): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status, headers: { "Content-Type": "application/json" },
  });
}

export function ok<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, ...body }), {
    status, headers: { "Content-Type": "application/json" },
  });
}
