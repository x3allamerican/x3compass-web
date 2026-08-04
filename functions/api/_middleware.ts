import { requireSuperAdmin, type AdminEnv } from "../_shared/admin-auth";
import { classifyApiRoute } from "../_shared/api-route-classification";
import { bearerFromRequest, verifySupabaseJwt } from "../_shared/supabase-admin";
import { correlationId, securityError, tenantPreflight, type SecurityEnv } from "../_shared/request-security";

interface MiddlewareEnv extends AdminEnv, SecurityEnv {}

export const onRequest: PagesFunction<MiddlewareEnv> = async (ctx) => {
  const routeClass = classifyApiRoute(new URL(ctx.request.url).pathname);
  const requestId = correlationId(ctx.request);

  if (routeClass === "unclassified") return securityError(403, "route_unclassified", requestId);
  if (routeClass === "public-or-signed") return ctx.next();
  if (ctx.request.method === "OPTIONS") return tenantPreflight(ctx.request, ctx.env, "GET, POST, PATCH, PUT, DELETE, OPTIONS");

  try {
    if (routeClass === "admin") {
      if (!await requireSuperAdmin(ctx)) return securityError(401, "unauthorized", requestId);
      return ctx.next();
    }

    const user = await verifySupabaseJwt(ctx.env, bearerFromRequest(ctx.request));
    if (!user) return securityError(401, "unauthorized", requestId);
    return ctx.next();
  } catch {
    return securityError(503, "authorization_unavailable", requestId);
  }
};
