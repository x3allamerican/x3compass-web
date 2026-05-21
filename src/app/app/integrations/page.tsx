"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile } from "@/components/X3AdminHero";
import { useIsSuperAdmin } from "@/lib/superAdmin";
import { getSupabase } from "@/lib/supabase";

type Vendor = {
  key: string; vendor: string; category: string;
  purpose: string; badge: string;
  status: "live" | "configured" | "available" | "trial" | "manual" | "error";
  secret_present: boolean;
  probe?: "ok" | "fail" | "skip";
  probe_detail?: string;
  last_event_at?: string | null;
  setup_url?: string;
  /** If set, the row shows a "Connect" button that POSTs/GETs this URL.
   *  Used by OAuth-based integrations (e.g. Samsara: /api/integrations/samsara/oauth-start). */
  connect_url?: string;
};
type Summary = { live: number; configured: number; errors: number; planned: number; total: number };
type ApiPayload = { ok: boolean; vendors?: Vendor[]; summary?: Summary; error?: string };

// Demo fallback — preserves the page if no super-admin (or backend not yet deployed)
const DEMO_VENDORS: Vendor[] = [
  { key: "stripe",     vendor: "Stripe",     category: "payments",   purpose: "Billing + subscriptions + Customer Portal",   badge: "Live",     status: "live",        secret_present: true, probe: "ok",   probe_detail: "200 OK", setup_url: "https://dashboard.stripe.com/" },
  { key: "anthropic",  vendor: "Anthropic",  category: "ai",         purpose: "Claude (AI brain powering every X3 agent)",   badge: "Live",     status: "live",        secret_present: true, probe: "ok",   probe_detail: "200 OK", setup_url: "https://console.anthropic.com/" },
  { key: "resend",     vendor: "Resend",     category: "comms",      purpose: "Transactional email (FCRA, audits, digests)", badge: "Live",     status: "live",        secret_present: true, probe: "ok",   probe_detail: "200 OK", setup_url: "https://resend.com/" },
  { key: "twilio",     vendor: "Twilio",     category: "comms",      purpose: "Transactional SMS + STOP + A2P 10DLC",        badge: "Live",     status: "live",        secret_present: true, probe: "ok",   probe_detail: "200 OK", setup_url: "https://console.twilio.com/" },
  { key: "postiz",     vendor: "Postiz",     category: "comms",      purpose: "Social media scheduler (X/LI/FB)",            badge: "Live",     status: "live",        secret_present: true, probe: "ok",   probe_detail: "200 OK", setup_url: "https://app.postiz.com/" },
  { key: "cloudflare", vendor: "Cloudflare", category: "hosting",    purpose: "Pages + WAF + edge functions + R2",           badge: "Live",     status: "live",        secret_present: true, probe: "ok",   probe_detail: "—" },
  { key: "supabase",   vendor: "Supabase",   category: "hosting",    purpose: "Postgres + Auth + Storage + Realtime",        badge: "Live",     status: "live",        secret_present: true, probe: "ok",   probe_detail: "—" },
  { key: "github",     vendor: "GitHub",     category: "hosting",    purpose: "Code hosting + Actions for scheduled agents", badge: "Live",     status: "live",        secret_present: true, probe: "skip", probe_detail: "deploy log evidence" },
  { key: "checkr",     vendor: "Checkr",     category: "compliance", purpose: "FCRA background checks + MVR + PSP",          badge: "Staging",  status: "configured",  secret_present: true, probe: "ok",   probe_detail: "200 OK" },
  { key: "fmcsa_clearinghouse", vendor: "FMCSA Clearinghouse", category: "compliance", purpose: "Federal D&A registry queries", badge: "Manual", status: "manual", secret_present: false, probe: "skip", probe_detail: "no public API" },
  { key: "carrierok",  vendor: "CarrierOk",  category: "safety",     purpose: "CSA scores + SAFER bulk data",                badge: "Pending",  status: "trial",       secret_present: false, probe: "skip" },
  { key: "motive",     vendor: "Motive",     category: "telematics", purpose: "ELD + HOS + dashcam",                         badge: "Q3 2026",  status: "available",   secret_present: false, probe: "skip" },
  { key: "samsara",    vendor: "Samsara",    category: "telematics", purpose: "ELD + HOS + DVIR + telematics (OAuth)",       badge: "Partner",  status: "configured",  secret_present: true, probe: "skip", probe_detail: "OAuth ready — click Connect to authorize", connect_url: "/api/integrations/samsara/oauth-start" },
  { key: "geotab",     vendor: "Geotab",     category: "telematics", purpose: "ELD + telematics + fleet management",         badge: "Q3 2026",  status: "available",   secret_present: false, probe: "skip" },
  { key: "sambasafety",vendor: "SambaSafety",category: "telematics", purpose: "Continuous MVR monitoring",                   badge: "Q3 2026",  status: "available",   secret_present: false, probe: "skip" },
  { key: "fleetrabbit",vendor: "FleetRabbit",category: "telematics", purpose: "DVIR + maintenance + work orders (BYO)",       badge: "BYO",      status: "available",   secret_present: false, probe: "skip", probe_detail: "Already use FleetRabbit? Bring your API key in Settings → Integrations and Compass mirrors your DVIRs + recalls into the compliance brain." },
  { key: "quest",      vendor: "Quest Diagnostics", category: "safety", purpose: "D&A collection sites",                     badge: "Q4 2026",  status: "available",   secret_present: false, probe: "skip" },
];

// Theme-aware status pills
const STATUS_PILL: Record<string, string> = {
  live:       "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  configured: "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  trial:      "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
  manual:     "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  available:  "bg-slate-100   dark:bg-slate-500/30   text-slate-700   dark:text-slate-50   border-slate-500   dark:border-slate-300/80",
  error:      "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
};
const STATUS_LABEL: Record<string, string> = {
  live: "LIVE", configured: "CONFIGURED", trial: "TRIAL", manual: "MANUAL", available: "PLANNED", error: "ERROR",
};
function StatusBadge({ status }: { status: Vendor["status"] }) {
  return (
    <span className={`inline-block min-w-[90px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${STATUS_PILL[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  payments:   { label: "Payments",                icon: "💳" },
  ai:         { label: "AI",                      icon: "🤖" },
  comms:      { label: "Communications",          icon: "📨" },
  hosting:    { label: "Hosting & Infrastructure",icon: "☁️" },
  compliance: { label: "Compliance",              icon: "🛡️" },
  safety:     { label: "Safety Data",             icon: "📊" },
  telematics: { label: "Telematics & ELD",        icon: "🚛" },
};

function relTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function IntegrationsPage() {
  const isSuperAdmin = useIsSuperAdmin();
  const [api, setApi] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true); setError(null);
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch("/api/admin/integrations", {
        cache: "no-store",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const body = await r.json() as ApiPayload;
      if (!r.ok || !body.ok) setError(body.error || `HTTP ${r.status}`);
      setApi(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally { setLoading(false); }
  }
  useEffect(() => { if (isSuperAdmin) refresh(); }, [isSuperAdmin]);

  const VENDORS = (api?.vendors && api.vendors.length > 0) ? api.vendors : DEMO_VENDORS;
  const isDemo  = !api?.vendors || api.vendors.length === 0 || !isSuperAdmin;

  const SUMMARY: Summary = api?.summary || {
    live:       VENDORS.filter(v => v.status === "live").length,
    configured: VENDORS.filter(v => v.status === "configured").length,
    errors:     VENDORS.filter(v => v.status === "error").length,
    planned:    VENDORS.filter(v => ["available", "trial", "manual"].includes(v.status)).length,
    total:      VENDORS.length,
  };

  // Group vendors by category
  const byCategory: Record<string, Vendor[]> = {};
  for (const v of VENDORS) {
    if (!byCategory[v.category]) byCategory[v.category] = [];
    byCategory[v.category].push(v);
  }
  const orderedCategories = ["payments", "ai", "comms", "hosting", "compliance", "safety", "telematics"];

  return (
    <AppShell title="Integrations" crumbs="Vendors wired into X3 Compass">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        <X3AdminHero
          eyebrow="Integrations"
          title={<>Every vendor. Every secret. <span className="text-amber-700 dark:text-amber-400">Every health probe.</span></>}
          intro={<>
            X3 Compass is a thin layer over a small set of audited vendors. This page probes each one in real time to verify the secret is set, the API responds, and (where applicable) when the last webhook event arrived. Anything <em>planned</em> means we&apos;ll wire it the moment we sign a contract.
          </>}
          dataSource={{
            items: [
              <span key="i1"><strong className="text-[var(--fg)]">Live probes</strong> — each card calls the vendor&apos;s health endpoint on page load with a 3-second timeout. Failure here usually means an expired API key or rate limit.</span>,
              <span key="i2"><strong className="text-[var(--fg)]">Secrets</strong> live in Cloudflare Pages env vars. If a card shows <em>no secret</em>, the binding hasn&apos;t been set — that vendor won&apos;t function.</span>,
              <span key="i3"><strong className="text-[var(--fg)]">Last events</strong> come from <code className="font-mono text-[var(--accent)]">vendor_webhook_events</code> — every inbound webhook lands there with vendor + payload + timestamp.</span>,
              <span key="i4"><strong className="text-[var(--fg)]">Setup URLs</strong> deep-link to each vendor&apos;s dashboard so you can rotate keys or add credit without hunting.</span>,
            ],
          }}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <X3KPITile label="Live"        value={SUMMARY.live}       sub="probing OK"      tone="green" />
          <X3KPITile label="Configured"  value={SUMMARY.configured} sub="staging or beta" tone="navy" />
          <X3KPITile label="Errors"      value={SUMMARY.errors}     sub="probe failures"  tone={SUMMARY.errors > 0 ? "red" : "navy"} />
          <X3KPITile label="Planned"     value={SUMMARY.planned}    sub="future wires"    tone="navy" />
          <X3KPITile label="Total"       value={SUMMARY.total}      sub="vendors"         tone="navy" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={refresh} disabled={loading} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50">
            {loading ? "↻ Probing…" : "↻ Re-probe all"}
          </button>
          {!isSuperAdmin && <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">Demo view · super-admin sees live probes</span>}
          {isDemo && isSuperAdmin && <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">Loading live probes…</span>}
          {error && <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-500/20 border border-rose-500/40 rounded-full px-3 py-1">{error}</span>}
        </div>

        {/* Categories */}
        {orderedCategories.map(catKey => {
          const cat = byCategory[catKey];
          if (!cat || cat.length === 0) return null;
          const meta = CATEGORY_META[catKey] || { label: catKey, icon: "•" };
          return (
            <section key={catKey}>
              <h2 className="text-[15px] font-extrabold text-[var(--fg)] mb-3 flex items-center gap-2">
                <span>{meta.icon}</span>{meta.label}
                <span className="text-[11px] font-normal text-[var(--fg-muted)]">— {cat.length} vendor{cat.length === 1 ? "" : "s"}</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.map(v => {
                  const probeOk   = v.probe === "ok";
                  const probeFail = v.probe === "fail";
                  return (
                    <div key={v.key} className={`x3-card p-4 transition-colors ${probeFail ? "border-rose-700/50 dark:border-rose-300/50" : "hover:border-[var(--accent)]/40"}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="text-[15px] font-extrabold text-[var(--fg)] truncate">{v.vendor}</div>
                          <div className="text-[10px] font-mono text-[var(--fg-faint)] tracking-wider uppercase">{v.badge}</div>
                        </div>
                        <StatusBadge status={v.status} />
                      </div>
                      <p className="text-[12px] text-[var(--fg-muted)] mb-3 leading-snug">{v.purpose}</p>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--fg-muted)] w-20">Secret:</span>
                          {v.secret_present
                            ? <span className="text-emerald-700 dark:text-emerald-300 font-bold">✓ present</span>
                            : <span className="text-rose-700 dark:text-rose-300 font-bold">✗ missing</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--fg-muted)] w-20">Probe:</span>
                          {probeOk   ? <span className="text-emerald-700 dark:text-emerald-300 font-bold">✓ {v.probe_detail || "OK"}</span> :
                           probeFail ? <span className="text-rose-700    dark:text-rose-300    font-bold" title={v.probe_detail || ""}>✗ {(v.probe_detail || "fail").slice(0, 40)}</span> :
                           <span className="text-[var(--fg-faint)]">— {v.probe_detail || "skipped"}</span>}
                        </div>
                        {v.last_event_at !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--fg-muted)] w-20">Last event:</span>
                            <span className="text-[var(--fg)]">{relTime(v.last_event_at)}</span>
                          </div>
                        )}
                      </div>

                      {(v.setup_url || v.connect_url) && (
                        <div className="mt-3 pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-3">
                          {v.connect_url && (
                            <a
                              href={v.connect_url}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold text-[var(--bg)]"
                              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                            >
                              🔌 Connect {v.vendor} →
                            </a>
                          )}
                          {v.setup_url && (
                            <a href={v.setup_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[var(--accent)] hover:underline font-bold">Open dashboard →</a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {!isSuperAdmin && (
          <div className="x3-card p-5 text-center">
            <div className="text-[12px] text-[var(--fg-muted)]">
              You&apos;re seeing a demo view. <Link href="/app/control-center" className="text-[var(--accent)] hover:underline font-bold">Sign in as super-admin</Link> to see live probe results.
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
