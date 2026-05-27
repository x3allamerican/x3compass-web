import { requireSuperAdmin, unauthorized } from "../../_shared/admin-auth";
import { rateLimit } from "../../_shared/rate-limit";
/**
 * GET /api/admin/partners?key=<ADMIN_KEY>
 *
 * Returns all rows from partner_applications, newest first.
 * Auth: shared-secret via ADMIN_KEY env var (required).
 *
 * Required Pages env vars:
 *  - SUPABASE_URL          — e.g., https://your-project.supabase.co
 *  - SUPABASE_SERVICE_ROLE — Supabase service-role key
 *  - ADMIN_KEY             — shared secret to gate this endpoint
 *
 * PATCH /api/admin/partners?key=<ADMIN_KEY>&id=<row-id>
 *  Body: { status?, notes?, reviewed_by? }
 *  Updates the row, sets reviewed_at=now() if status changed.
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  ADMIN_KEY?: string;
}

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  "Content-Type": "application/json",
});

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "admin-partners", max: 30, windowSec: 60 });
  if (_rl) return _rl;

  // SECURITY: was previously gated by query-string ADMIN_KEY which leaks in HTTP
  // logs + Referer. Migrated to JWT super-admin check. Caught by code-quality agent.
  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);

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
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "fetch error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const onRequestPatch: PagesFunction<Env> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "admin-partners", max: 30, windowSec: 60 });
  if (_rl) return _rl;

  // SECURITY: same JWT super-admin gate as the GET handler.
  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);

  const url = new URL(ctx.request.url);
  const id = url.searchParams.get("id");
  if (!id) {
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
      const text = await r.text();
      return new Response(JSON.stringify({ ok: false, error: `Supabase HTTP ${r.status}: ${text}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "patch error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
