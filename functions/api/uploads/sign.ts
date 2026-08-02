/**
 * POST /api/uploads/sign — issue a short-lived signed token for PUT-uploading a file
 * to R2 via /api/uploads/put. Auth-gated by Supabase JWT. Scoped to the user's carrier.
 */
import { rateLimit } from "../../_shared/rate-limit";
import { correlationId, isUuid, requireTenant, securityError, tenantPreflight, type SecurityEnv } from "../../_shared/request-security";
import { issueUploadToken } from "../../_shared/upload-token";

interface Env extends SecurityEnv { UPLOAD_TOKEN_SECRET?: string; }

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const rl = rateLimit(ctx.request, { key: "uploads-sign", max: 30, windowSec: 60 });
    if (rl) return rl;
    let body: { folder?: string; filename?: string; driver_id?: string; content_type?: string; size?: number };
    try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

    const requestId = correlationId(ctx.request);
    const authority = await requireTenant(ctx.request, ctx.env);
    if (!authority.ok) return securityError(authority.status, authority.code, requestId);
    if (!ctx.env.UPLOAD_TOKEN_SECRET) return securityError(503, "service_unavailable", requestId);
    if (body.driver_id && !isUuid(body.driver_id)) return securityError(400, "invalid_resource_id", requestId);

    const filename = (body.filename || "upload").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
    const folder = (body.folder || "dq").replace(/[^a-z0-9-]/g, "");
    if (body.size && body.size > 25 * 1024 * 1024) return json({ ok: false, error: "Max upload size 25MB" }, 413);

    const carrier_id = authority.carrierId;

    const uuid = crypto.randomUUID();
    const driverSeg = body.driver_id ? `/${body.driver_id}` : "";
    const objectKey = `carriers/${carrier_id}/${folder}${driverSeg}/${uuid}-${filename}`;
    const tokenPayload = { k: objectKey, ct: body.content_type || "application/octet-stream", exp: Math.floor(Date.now()/1000) + 300, uid: authority.userId, cid: carrier_id };
    const signedToken = await issueUploadToken(tokenPayload, ctx.env.UPLOAD_TOKEN_SECRET);

    return json({ ok: true, put_url: `/api/uploads/put?t=${encodeURIComponent(signedToken)}`, object_key: objectKey, get_url: `/api/uploads/get?k=${encodeURIComponent(objectKey)}`, max_bytes: 25 * 1024 * 1024, expires_in: 300 });
  } catch {
    console.error("upload signing failed");
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) =>
  tenantPreflight(ctx.request, ctx.env, "POST, OPTIONS");
