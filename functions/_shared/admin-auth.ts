/**
 * Admin auth helpers — gate Pages Functions to super-admin users only.
 * Re-uses Supabase JWT verification + checks email against allow-list.
 */
import { bearerFromRequest, verifySupabaseJwt, type SupaEnv, type SupaUser } from "./supabase-admin";

export interface AdminEnv extends SupaEnv {
  ADMIN_KEY?: string;
  SUPER_ADMIN_EMAILS?: string;  // comma-separated; falls back to hardcoded
}

const DEFAULT_SUPER_ADMINS = [
  "joshua@x3compass.com",
  "joshua@x3fleetsafety.com",
  "joshuakovarik@yahoo.com",
];

export type AdminCheckResult =
  | { ok: true; user: SupaUser; via: "jwt" | "admin-key" }
  | { ok: false; reason: string };

export async function requireSuperAdmin(ctx: { request: Request; env: AdminEnv }): Promise<AdminCheckResult> {
  // Path 1: X-Admin-Key shared secret (for scripts/tests)
  const adminKeyHeader = ctx.request.headers.get("X-Admin-Key");
  if (ctx.env.ADMIN_KEY && adminKeyHeader && adminKeyHeader === ctx.env.ADMIN_KEY) {
    return { ok: true, user: { sub: "admin-key", email: "admin@x3compass.com" }, via: "admin-key" };
  }

  // Path 2: Supabase JWT — user must be in super-admin allow-list
  const token = bearerFromRequest(ctx.request);
  if (!token) return { ok: false, reason: "no bearer token" };
  const user = await verifySupabaseJwt(ctx.env, token);
  if (!user) return { ok: false, reason: "invalid jwt" };

  const allow = (ctx.env.SUPER_ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const list = allow.length > 0 ? allow : DEFAULT_SUPER_ADMINS;
  if (!user.email || !list.includes(user.email.toLowerCase())) {
    return { ok: false, reason: "not in super-admin list" };
  }
  return { ok: true, user, via: "jwt" };
}

export function unauthorized(reason = "Unauthorized"): Response {
  return new Response(JSON.stringify({ ok: false, error: reason }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function ok(data: unknown = { ok: true }): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function serverError(error: unknown): Response {
  const msg = error instanceof Error ? error.message : String(error);
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
