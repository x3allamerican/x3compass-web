/**
 * GET /api/admin/v1/partners
 *
 * Returns all rows from partner_applications, newest first.
 * Auth: short-lived Supabase session verified as super-admin.
 *
 * Required Pages env vars:
 *  - SUPABASE_URL          — e.g., https://your-project.supabase.co
 *  - SUPABASE_SERVICE_ROLE — Supabase service-role key
 *
 * PATCH /api/admin/v1/partners?id=<row-id>
 *  Body: { status?, notes?, reviewed_by? }
 *  Updates the row, sets reviewed_at=now() if status changed.
 */

import { requireSuperAdmin, unauthorized, type AdminEnv } from "../../_shared/admin-auth";
import { correlationId, isUuid, securityError } from "../../_shared/request-security";

interface Env extends AdminEnv {}

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  "Content-Type": "application/json",
});

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  if (!await requireSuperAdmin(ctx)) return unauthorized();
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    return new Response(JSON.stringify({ ok: false, error: "Server not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const r = await fetch(
      `${ctx.env.SUPABASE_URL}/rest/v1/partner_applications?select=*&order=submitted_at.desc`,
      { headers: SUPABASE_HEADERS(ctx.env.SUPABASE_SERVICE_ROLE) }
    );
    const rows = await r.json();
    return new Response(JSON.stringify({ ok: true, rows }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};

export const onRequestPatch: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const id = url.searchParams.get("id");
  if (!await requireSuperAdmin(ctx)) return unauthorized();
  if (!id || !isUuid(id)) {
    return new Response(JSON.stringify({ ok: false, error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    return new Response(JSON.stringify({ ok: false, error: "Server not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const updates: Record<string, unknown> = {};
  if (typeof body.status === "string") {
    updates.status = body.status;
    updates.reviewed_at = new Date().toISOString();
  }
  if (typeof body.notes === "string") updates.notes = body.notes;
  if (typeof body.reviewed_by === "string") updates.reviewed_by = body.reviewed_by;
  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ ok: false, error: "No fields to update" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const r = await fetch(
      `${ctx.env.SUPABASE_URL}/rest/v1/partner_applications?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { ...SUPABASE_HEADERS(ctx.env.SUPABASE_SERVICE_ROLE), Prefer: "return=minimal" },
        body: JSON.stringify(updates),
      }
    );
    if (!r.ok) {
      return securityError(500, "request_failed", correlationId(ctx.request));
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};
