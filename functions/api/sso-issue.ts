/**
 * GET /api/sso-issue?to=<product-domain> — authenticated (Supabase). Mints a one-time
 * x3accounts SSO ticket for the logged-in user and returns the product's /api/sso URL so
 * the embedded dashboard loads already authenticated (no second login inside the iframe).
 */
import { verifySupabaseJwt, bearerFromRequest } from "../_shared/supabase-admin";

interface D1Like { prepare(query: string): { bind(...args: unknown[]): { run(): Promise<unknown> } } }
interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; ACCTS?: D1Like; }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const hex = (n: number) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map((x) => x.toString(16).padStart(2, "0")).join(""); };

// The product dashboards embeddable in Compass.
const DOMAINS = new Set([
  "x3verify.com", "x3sop.com", "x3preventability.com", "x3newentrant.com", "x3carriercheck.com",
  "x3insurability.com", "x3legal.com", "x3enviro.com", "x3environmental.com", "x3cleantruck.com",
  "x3workforce.com", "x3csa.com", "x3mvr.com", "x3permits.com", "x3hazmat.com", "x3dataq.com",
  "x3background.com", "x3drugalcohol.com", "x3hos.com", "x3dotaudit.com", "x3dotskills.com",
]);

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const to = String(new URL(ctx.request.url).searchParams.get("to") || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  if (!DOMAINS.has(to)) return json({ ok: false, error: "unknown product" }, 400);
  const ident = await verifySupabaseJwt(ctx.env, bearerFromRequest(ctx.request));
  if (!ident) return json({ ok: false, error: "unauthorized" }, 401);
  if (!ctx.env.ACCTS) return json({ ok: false, error: "sso_unavailable", url: `https://${to}/` }, 200);
  const ticket = hex(32); const now = Date.now(); const exp = now + 120000; // 2-min one-time
  try {
    await ctx.env.ACCTS.prepare("INSERT INTO sso_tickets (ticket,email,dot,target,expires_at,consumed,created_at) VALUES (?,?,?,?,?,0,?)")
      .bind(ticket, String(ident.email || "").toLowerCase(), "", to, exp, now).run();
  } catch { return json({ ok: false, error: "mint_failed", url: `https://${to}/` }, 200); }
  return json({ ok: true, url: `https://${to}/api/sso?ticket=${ticket}` });
};

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
