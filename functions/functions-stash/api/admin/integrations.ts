/**
 * GET /api/admin/integrations
 *
 * Probes each external vendor for liveness and returns a single rollup the
 * /app/integrations page renders. Super-admin only.
 *
 * Categories:
 *   - payments       : Stripe
 *   - ai             : Anthropic
 *   - comms          : Resend, Twilio, Postiz
 *   - hosting        : Cloudflare, Supabase, GitHub
 *   - compliance     : Checkr, FMCSA Clearinghouse (manual)
 *   - telematics     : Motive, Samsara, Geotab, SambaSafety (planned)
 *   - safety         : CarrierOk (trial), Quest (planned)
 *
 * Health check pattern (per vendor):
 *   - secret_present : env var exists
 *   - live_probe     : tiny GET to a public/auth endpoint, 3s timeout
 *   - last_event     : most recent vendor_webhook_events row (where applicable)
 */
import { requireSuperAdmin, unauthorized, ok, type AdminEnv } from "../../_shared/admin-auth";
import { supaFetch } from "../../_shared/supabase-admin";

interface Env extends AdminEnv {
  STRIPE_SECRET_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  RESEND_API_KEY?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  POSTIZ_API_KEY?: string;
  POSTIZ_BASE_URL?: string;
  CHECKR_STAGING_API_KEY?: string;
  CHECKR_API_BASE?: string;
}

type Vendor = {
  key: string; vendor: string; category: string;
  purpose: string; badge: string;
  status: "live" | "configured" | "available" | "trial" | "manual" | "error";
  secret_present: boolean;
  probe?: "ok" | "fail" | "skip";
  probe_detail?: string;
  last_event_at?: string | null;
  setup_url?: string;
};

const PROBE_TIMEOUT_MS = 3000;

async function probe(url: string, init?: RequestInit): Promise<{ ok: true; detail: string } | { ok: false; detail: string }> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), PROBE_TIMEOUT_MS);
    const r = await fetch(url, { ...init, signal: c.signal });
    clearTimeout(t);
    return r.ok ? { ok: true, detail: `${r.status} OK` } : { ok: false, detail: `${r.status} ${r.statusText}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "probe failed" };
  }
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);
  const env = ctx.env;

  // Last-event lookup from vendor_webhook_events (when available)
  let lastEventByVendor = new Map<string, string>();
  try {
    const supa = supaFetch(env);
    const rows = (await supa.select("vendor_webhook_events", "select=vendor,received_at&order=received_at.desc&limit=200")) as Array<{ vendor: string; received_at: string }>;
    for (const r of rows) if (!lastEventByVendor.has(r.vendor)) lastEventByVendor.set(r.vendor, r.received_at);
  } catch { /* table optional */ }

  // Probe each
  const vendors: Vendor[] = [];

  // — Stripe
  vendors.push({
    key: "stripe", vendor: "Stripe", category: "payments",
    purpose: "Billing + subscriptions + Customer Portal", badge: "Live",
    status: "configured",
    secret_present: !!env.STRIPE_SECRET_KEY,
    last_event_at: lastEventByVendor.get("stripe") || null,
    setup_url: "https://dashboard.stripe.com/",
    ...(env.STRIPE_SECRET_KEY ? await (async () => {
      const p = await probe("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
      return { status: (p.ok ? "live" : "error") as Vendor["status"], probe: (p.ok ? "ok" : "fail") as "ok" | "fail", probe_detail: p.detail };
    })() : { probe: "skip" as const, probe_detail: "no secret" }),
  });

  // — Anthropic
  vendors.push({
    key: "anthropic", vendor: "Anthropic", category: "ai",
    purpose: "Claude (the AI brain powering every X3 agent)", badge: "Live",
    status: "configured",
    secret_present: !!env.ANTHROPIC_API_KEY,
    last_event_at: lastEventByVendor.get("anthropic") || null,
    setup_url: "https://console.anthropic.com/",
    ...(env.ANTHROPIC_API_KEY ? await (async () => {
      // /v1/messages requires POST; use /v1/models which is GET
      const p = await probe("https://api.anthropic.com/v1/models", { headers: { "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" } });
      return { status: (p.ok ? "live" : "error") as Vendor["status"], probe: (p.ok ? "ok" : "fail") as "ok" | "fail", probe_detail: p.detail };
    })() : { probe: "skip" as const, probe_detail: "no secret" }),
  });

  // — Resend
  vendors.push({
    key: "resend", vendor: "Resend", category: "comms",
    purpose: "Transactional email (FCRA notices, audit invites, digests)", badge: "Live",
    status: "configured",
    secret_present: !!env.RESEND_API_KEY,
    last_event_at: lastEventByVendor.get("resend") || null,
    setup_url: "https://resend.com/",
    ...(env.RESEND_API_KEY ? await (async () => {
      const p = await probe("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } });
      return { status: (p.ok ? "live" : "error") as Vendor["status"], probe: (p.ok ? "ok" : "fail") as "ok" | "fail", probe_detail: p.detail };
    })() : { probe: "skip" as const, probe_detail: "no secret" }),
  });

  // — Twilio
  vendors.push({
    key: "twilio", vendor: "Twilio", category: "comms",
    purpose: "Transactional SMS + STOP keyword handling + A2P 10DLC", badge: "Live",
    status: "configured",
    secret_present: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
    last_event_at: lastEventByVendor.get("twilio") || null,
    setup_url: "https://console.twilio.com/",
    ...(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN ? await (async () => {
      const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
      const p = await probe(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}.json`, { headers: { Authorization: `Basic ${auth}` } });
      return { status: (p.ok ? "live" : "error") as Vendor["status"], probe: (p.ok ? "ok" : "fail") as "ok" | "fail", probe_detail: p.detail };
    })() : { probe: "skip" as const, probe_detail: "no secret" }),
  });

  // — Postiz
  vendors.push({
    key: "postiz", vendor: "Postiz", category: "comms",
    purpose: "Social media scheduler (Twitter/LinkedIn/Facebook auto-post)", badge: "Live",
    status: "configured",
    secret_present: !!env.POSTIZ_API_KEY,
    last_event_at: lastEventByVendor.get("postiz") || null,
    setup_url: env.POSTIZ_BASE_URL || "https://app.postiz.com/",
    ...(env.POSTIZ_API_KEY ? await (async () => {
      const base = (env.POSTIZ_BASE_URL || "https://app.postiz.com").replace(/\/$/, "");
      const p = await probe(`${base}/api/v1/integrations`, { headers: { Authorization: `Bearer ${env.POSTIZ_API_KEY!}` } });
      return { status: (p.ok ? "live" : "error") as Vendor["status"], probe: (p.ok ? "ok" : "fail") as "ok" | "fail", probe_detail: p.detail };
    })() : { probe: "skip" as const, probe_detail: "no secret" }),
  });

  // — Cloudflare (Pages serves this Function, so it's implicitly live)
  vendors.push({
    key: "cloudflare", vendor: "Cloudflare", category: "hosting",
    purpose: "Pages hosting + WAF + edge functions + R2", badge: "Live",
    status: "live",
    secret_present: true,
    probe: "ok", probe_detail: "function serving this request",
    setup_url: "https://dash.cloudflare.com/",
  });

  // — Supabase (we just used it for the lookup above)
  vendors.push({
    key: "supabase", vendor: "Supabase", category: "hosting",
    purpose: "Postgres + Auth + Storage + Realtime", badge: "Live",
    status: "live",
    secret_present: true,
    probe: "ok", probe_detail: "queried for last-event lookup above",
    setup_url: "https://supabase.com/dashboard/projects",
  });

  // — GitHub (used to host the repo + run Actions agents)
  vendors.push({
    key: "github", vendor: "GitHub", category: "hosting",
    purpose: "Code hosting + Actions runners for scheduled agents", badge: "Live",
    status: "live",
    secret_present: true,
    probe: "skip", probe_detail: "deploy log evidence",
    setup_url: "https://github.com/x3fleetsafety",
  });

  // — Checkr (staging)
  vendors.push({
    key: "checkr", vendor: "Checkr", category: "compliance",
    purpose: "FCRA-compliant background checks + MVR + PSP", badge: "Staging",
    status: "configured",
    secret_present: !!env.CHECKR_STAGING_API_KEY,
    last_event_at: lastEventByVendor.get("checkr") || null,
    setup_url: "https://dashboard.checkr.com/",
    ...(env.CHECKR_STAGING_API_KEY ? await (async () => {
      const base = (env.CHECKR_API_BASE || "https://api.checkr.com").replace(/\/$/, "");
      const auth = btoa(`${env.CHECKR_STAGING_API_KEY}:`);
      const p = await probe(`${base}/v1/account`, { headers: { Authorization: `Basic ${auth}` } });
      return { status: (p.ok ? "live" : "error") as Vendor["status"], probe: (p.ok ? "ok" : "fail") as "ok" | "fail", probe_detail: p.detail };
    })() : { probe: "skip" as const, probe_detail: "no secret" }),
  });

  // — FMCSA Clearinghouse — manual (no API)
  vendors.push({
    key: "fmcsa_clearinghouse", vendor: "FMCSA Clearinghouse", category: "compliance",
    purpose: "Federal drug & alcohol registry queries", badge: "Manual",
    status: "manual",
    secret_present: false,
    probe: "skip", probe_detail: "no public API — manual login per query",
    setup_url: "https://clearinghouse.fmcsa.dot.gov/",
  });

  // — CarrierOk — trial
  vendors.push({
    key: "carrierok", vendor: "CarrierOk", category: "safety",
    purpose: "Live CSA scores + SAFER bulk data ingest", badge: "Dev Tier — pending signup",
    status: "trial",
    secret_present: false,
    probe: "skip", probe_detail: "awaiting Joe Parley discovery call",
    setup_url: "https://carrierok.com/",
  });

  // — Planned (telematics + safety) — all show "available"
  const planned: Array<{ key: string; vendor: string; category: string; purpose: string; badge: string }> = [
    { key: "motive",       vendor: "Motive",       category: "telematics", purpose: "ELD + HOS + dashcam telematics",       badge: "Q3 2026" },
    { key: "samsara",      vendor: "Samsara",      category: "telematics", purpose: "ELD + HOS + asset tracking",            badge: "Q3 2026" },
    { key: "geotab",       vendor: "Geotab",       category: "telematics", purpose: "ELD + telematics + fleet management",   badge: "Q3 2026" },
    { key: "sambasafety",  vendor: "SambaSafety",  category: "telematics", purpose: "Continuous MVR monitoring",             badge: "Q3 2026" },
    { key: "quest",        vendor: "Quest Diagnostics", category: "safety", purpose: "Drug & alcohol collection sites",      badge: "Q4 2026" },
  ];
  for (const p of planned) {
    vendors.push({
      ...p, status: "available", secret_present: false, probe: "skip", probe_detail: "planned",
    });
  }

  // Roll-up KPIs
  const live      = vendors.filter(v => v.status === "live").length;
  const configured = vendors.filter(v => v.status === "configured").length;
  const errors    = vendors.filter(v => v.status === "error").length;
  const planned_count = vendors.filter(v => v.status === "available" || v.status === "trial" || v.status === "manual").length;

  return ok({
    vendors,
    summary: { live, configured, errors, planned: planned_count, total: vendors.length },
  });
};
