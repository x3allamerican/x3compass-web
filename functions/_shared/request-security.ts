import {
  bearerFromRequest,
  supaFetch,
  verifySupabaseJwt,
  type SupabaseAdminEnv,
} from "./supabase-admin";

export interface SecurityEnv extends SupabaseAdminEnv {
  APP_ALLOWED_ORIGINS?: string;
}

export type TenantAuthorization =
  | { ok: true; userId: string; carrierId: string }
  | { ok: false; status: 400 | 401 | 403; code: "invalid_tenant_id" | "unauthorized" | "tenant_forbidden" | "tenant_required" };

type Identity = { id: string };

interface AuthorizationInput {
  token: string;
  requestedCarrierId?: string | null;
  verifyIdentity: (token: string) => Promise<Identity | null>;
  loadMemberships: (userId: string) => Promise<string[]>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_APP_ORIGINS = ["https://x3compass.com", "https://www.x3compass.com"];

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export async function authorizeTenant(input: AuthorizationInput): Promise<TenantAuthorization> {
  const requested = input.requestedCarrierId?.trim() || null;
  if (requested && !isUuid(requested)) {
    return { ok: false, status: 400, code: "invalid_tenant_id" };
  }

  if (!input.token) return { ok: false, status: 401, code: "unauthorized" };
  const identity = await input.verifyIdentity(input.token);
  if (!identity) return { ok: false, status: 401, code: "unauthorized" };

  const memberships = (await input.loadMemberships(identity.id)).filter(isUuid);
  if (requested) {
    if (!memberships.includes(requested)) {
      return { ok: false, status: 403, code: "tenant_forbidden" };
    }
    return { ok: true, userId: identity.id, carrierId: requested };
  }

  if (memberships.length !== 1) {
    return { ok: false, status: 403, code: memberships.length ? "tenant_required" : "tenant_forbidden" };
  }
  return { ok: true, userId: identity.id, carrierId: memberships[0] };
}

export async function requireTenant(
  request: Request,
  env: SecurityEnv,
  requestedCarrierId?: string | null,
): Promise<TenantAuthorization> {
  return authorizeTenant({
    token: bearerFromRequest(request),
    requestedCarrierId,
    verifyIdentity: (token) => verifySupabaseJwt(env, token),
    loadMemberships: async (userId) => {
      const rows = await supaFetch(env).select(
        "compass_carrier_users",
        `user_id=eq.${encodeURIComponent(userId)}&select=carrier_id`,
      ) as Array<{ carrier_id?: unknown }>;
      return rows.map((row) => row.carrier_id).filter((id): id is string => typeof id === "string");
    },
  });
}

export function correlationId(request?: Request): string {
  const supplied = request?.headers.get("X-Correlation-ID")?.trim();
  return supplied && /^[A-Za-z0-9._-]{8,128}$/.test(supplied) ? supplied : crypto.randomUUID();
}

export function securityError(status: number, code: string, id = correlationId()): Response {
  return new Response(JSON.stringify({
    ok: false,
    error: "request denied",
    code,
    correlation_id: id,
  }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function corsHeaders(request: Request, env: Pick<SecurityEnv, "APP_ALLOWED_ORIGINS">): Headers {
  const configured = (env.APP_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowed = new Set(configured.length ? configured : DEFAULT_APP_ORIGINS);
  const headers = new Headers({ Vary: "Origin" });
  const origin = request.headers.get("Origin");
  if (origin && allowed.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

export function tenantJson(
  request: Request,
  env: SecurityEnv,
  body: unknown,
  status = 200,
): Response {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "private, no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

export function tenantPreflight(request: Request, env: SecurityEnv, methods: string): Response {
  const headers = corsHeaders(request, env);
  if (!headers.has("Access-Control-Allow-Origin")) return securityError(403, "origin_forbidden", correlationId(request));
  headers.set("Access-Control-Allow-Methods", methods);
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Correlation-ID");
  headers.set("Access-Control-Max-Age", "600");
  return new Response(null, { status: 204, headers });
}
