/**
 * PATCH /api/admin/social/update
 * Body: { id, status?, body?, scheduled_at?, rejection_reason? }
 * Used for approve/reject/edit/schedule from the admin UI.
 */
interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
export const onRequestPatch: PagesFunction<Env> = async (ctx) => {
  let body: { id?: string; status?: string; body?: string; scheduled_at?: string; rejection_reason?: string; image_url?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  if (!body.id) return json({ ok: false, error: "Missing id" }, 400);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) patch.status = body.status;
  if (body.body !== undefined) patch.body = body.body;
  if (body.scheduled_at !== undefined) patch.scheduled_at = body.scheduled_at;
  if (body.rejection_reason !== undefined) patch.rejection_reason = body.rejection_reason;
  if (body.image_url !== undefined) patch.image_url = body.image_url;
  const r = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/compass_social_posts?id=eq.${body.id}`, {
    method: "PATCH",
    headers: { apikey: ctx.env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) return json({ ok: false, error: `Supabase ${r.status}: ${(await r.text()).slice(0, 200)}` }, 500);
  const rows = (await r.json()) as unknown[];
  return json({ ok: true, row: rows[0] });
};
