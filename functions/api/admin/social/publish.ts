/**
 * POST /api/admin/social/publish — push an approved post to Postiz for scheduled publishing.
 * Body: { id }
 * Gated by POSTIZ_API_KEY + POSTIZ_BASE_URL env vars.
 */
import { correlationId, isUuid, securityError } from "../../../_shared/request-security";
interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; POSTIZ_API_KEY?: string; POSTIZ_BASE_URL?: string; }

// Postiz Cloud is the hosted SaaS at app.postiz.com — use that as the default so
// only POSTIZ_API_KEY needs to be set. Self-hosted users can override via env.
const DEFAULT_POSTIZ_BASE_URL = "https://app.postiz.com";
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { id?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  if (!isUuid(body.id)) return json({ ok: false, error: "Invalid id" }, 400);
  const postId = encodeURIComponent(body.id);
  if (!ctx.env.POSTIZ_API_KEY) {
    return json({ ok: false, configured: false, error: "Postiz not configured. Set POSTIZ_API_KEY on Cloudflare Pages and redeploy. (POSTIZ_BASE_URL defaults to https://app.postiz.com for Postiz Cloud.)", help_url: "https://docs.postiz.com" }, 503);
  }
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);

  // Fetch the post
  const r = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/compass_social_posts?id=eq.${postId}`, {
    headers: { apikey: ctx.env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}` },
  });
  const rows = (await r.json()) as { id: string; platform: string; body: string; image_url?: string; scheduled_at?: string }[];
  if (rows.length === 0) return json({ ok: false, error: "Post not found" }, 404);
  const post = rows[0];

  // Push to Postiz
  try {
    const pr = await fetch(`${(ctx.env.POSTIZ_BASE_URL || DEFAULT_POSTIZ_BASE_URL).replace(/\/$/, "")}/api/v1/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ctx.env.POSTIZ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: post.scheduled_at ? "scheduled" : "now",
        date: post.scheduled_at,
        posts: [{ integration: { id: post.platform }, value: [{ content: post.body, image: post.image_url ? [{ path: post.image_url }] : [] }] }],
      }),
    });
    if (!pr.ok) {
      const errText = (await pr.text()).slice(0, 300);
      await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/compass_social_posts?id=eq.${postId}`, {
        method: "PATCH",
        headers: { apikey: ctx.env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "failed", rejection_reason: `Postiz ${pr.status}: ${errText}` }),
      });
      return securityError(502, "upstream_failed", correlationId(ctx.request));
    }
    const result = await pr.json() as { id?: string };
    await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/compass_social_posts?id=eq.${postId}`, {
      method: "PATCH",
      headers: { apikey: ctx.env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "posted", postiz_id: result.id || null, posted_at: new Date().toISOString() }),
    });
    return json({ ok: true, postiz_id: result.id });
  } catch {
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};
