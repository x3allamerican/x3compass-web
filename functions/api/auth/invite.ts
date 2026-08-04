/**
 * POST /api/auth/invite — invite a teammate to a carrier.
 * Body: { carrier_id, email, role: "admin"|"viewer" }
 *
 * Flow:
 *  1. Verify caller is signed in AND owns/admins the target carrier.
 *  2. Use Supabase Admin API to either create an invited user (admin/inviteUserByEmail-style)
 *     or look up an existing user by email.
 *  3. Upsert a row into compass_carrier_users with role + invited_at + invited_by.
 *  4. Send a friendly invite email via Resend.
 *
 * No-Stripe-customer carriers can still invite — billing is tied to the carrier, not the user.
 */
import { bearerFromRequest, supaFetch, verifySupabaseJwt } from "../../_shared/supabase-admin";
import { rateLimit } from "../../_shared/rate-limit";
import { correlationId, isUuid, securityError } from "../../_shared/request-security";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  RESEND_API_KEY?: string; EMAIL_FROM_NO_REPLY?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

async function lookupOrInviteUser(env: Env, email: string): Promise<{ id: string; created: boolean } | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) return null;
  const sb = env.SUPABASE_URL.replace(/\/$/, "");
  const sr = env.SUPABASE_SERVICE_ROLE;
  // Look up existing
  const lookup = await fetch(`${sb}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: { apikey: sr, Authorization: `Bearer ${sr}` },
  });
  if (lookup.ok) {
    const data = await lookup.json() as { users?: { id: string; email: string }[] };
    const found = data.users?.find(u => (u.email || "").toLowerCase() === email.toLowerCase());
    if (found) return { id: found.id, created: false };
  }
  // Invite (creates user and emails magic link)
  const invite = await fetch(`${sb}/auth/v1/admin/invite`, {
    method: "POST",
    headers: { apikey: sr, Authorization: `Bearer ${sr}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, data: { invited_via: "x3compass_team" } }),
  });
  if (!invite.ok) return null;
  const created = await invite.json() as { user?: { id: string } } | { id: string };
  const uid = (created as { user?: { id: string } }).user?.id || (created as { id: string }).id;
  return uid ? { id: uid, created: true } : null;
}

async function sendInviteEmail(env: Env, to: string, carrierName: string, inviterEmail: string) {
  if (!env.RESEND_API_KEY) return;
  const from = env.EMAIL_FROM_NO_REPLY || "team@x3compass.com";
  const site = env.NEXT_PUBLIC_SITE_URL || "https://x3compass.com";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `X3 Compass <${from}>`,
      to,
      subject: `${inviterEmail} added you to ${carrierName} on X3 Compass`,
      html: `<p>You've been invited to <strong>${carrierName}</strong> on X3 Compass — the AI-powered FMCSA compliance platform.</p>
<p><a href="${site}/app/signin?invite=1" style="display:inline-block;padding:10px 18px;background:#22D3EE;color:#0B1220;font-weight:800;text-decoration:none;border-radius:8px">Accept invite & sign in →</a></p>
<p style="color:#64748B;font-size:12px">If you don't recognize this, you can safely ignore this email.</p>`,
    }),
  }).catch(() => {});
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const _rl = rateLimit(ctx.request, { key: "team-invite", max: 20, windowSec: 60 });
    if (_rl) return _rl;
    const token = bearerFromRequest(ctx.request);
    const user = await verifySupabaseJwt(ctx.env, token);
    if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

    let body: { carrier_id?: string; email?: string; role?: string };
    try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

    const carrierId = (body.carrier_id || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const role = (body.role || "viewer").toLowerCase();
    if (!isUuid(carrierId)) return json({ ok: false, error: "valid carrier_id required" }, 400);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "Valid email required" }, 400);
    if (!["admin", "viewer", "owner"].includes(role)) return json({ ok: false, error: "Invalid role" }, 400);
    if (role === "owner") return json({ ok: false, error: "Owner role cannot be granted via invite" }, 400);

    const supa = supaFetch(ctx.env);

    // Caller must be owner or admin on this carrier
    const encodedCarrierId = encodeURIComponent(carrierId);
    const myRow = (await supa.select("compass_carrier_users", `user_id=eq.${encodeURIComponent(user.id)}&carrier_id=eq.${encodedCarrierId}&select=role`)) as Array<{ role: string }>;
    if (myRow.length === 0 || !["owner", "admin"].includes(myRow[0].role)) {
      return json({ ok: false, error: "Forbidden — only owners or admins can invite" }, 403);
    }

    // Get carrier name for the email
    const carrierRow = (await supa.select("compass_carriers", `id=eq.${encodedCarrierId}&select=name`)) as Array<{ name: string }>;
    const carrierName = carrierRow[0]?.name || "your carrier";

    // Create/lookup user
    const found = await lookupOrInviteUser(ctx.env, email);
    if (!found) return json({ ok: false, error: "Could not create or look up user" }, 502);

    // Already on this carrier?
    const existing = (await supa.select("compass_carrier_users", `user_id=eq.${encodeURIComponent(found.id)}&carrier_id=eq.${encodedCarrierId}&select=id,role,accepted_at`)) as Array<{ id: string; role: string; accepted_at: string | null }>;
    if (existing.length > 0) {
      return json({ ok: true, already_member: true, status: existing[0].accepted_at ? "active" : "pending" });
    }

    // Insert membership
    await supa.insert("compass_carrier_users", {
      carrier_id: carrierId,
      user_id: found.id,
      role,
      invited_by: user.id,
      invited_at: new Date().toISOString(),
    }, "minimal");

    // Fire-and-forget email
    sendInviteEmail(ctx.env, email, carrierName, user.email || "").catch(() => {});

    return json({ ok: true, user_created: found.created, status: "pending" });
  } catch {
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};
