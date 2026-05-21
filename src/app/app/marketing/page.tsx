"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile } from "@/components/X3AdminHero";

type Funnel = { campaign: string; channel: string; clicks: number; leads: number; invites: number; audits: number; converted: number; click_to_lead: number | null; lead_to_audit: number | null };
type Lead   = { id: string; captured: string; name: string; email: string; company: string; fleet: string; source: string; pain: string; status: string };
type Campaign = { id: string; slug: string; name: string; channel: string | null };
type ApiPayload = {
  ok: boolean;
  demo?: boolean;
  kpis?: { clicks_30d: number; leads_30d: number; invites_total: number; audits_completed_total: number; converted_total: number; cost_per_lead: number; click_to_lead_pct: number | null; lead_to_audit_pct: number | null };
  funnel?: Funnel[];
  traffic?: number[];
  recent_leads?: Lead[];
  campaigns?: Campaign[];
};

// Demo overlay — preserves the dashboard's look when the marketing pipe has no traffic yet.
const DEMO_KPIS = { clicks_30d: 100, leads_30d: 13, invites_total: 3, audits_completed_total: 1, converted_total: 4, cost_per_lead: 0, click_to_lead_pct: 13, lead_to_audit_pct: 7.7 };
const DEMO_FUNNEL: Funnel[] = [
  { campaign: "april-launch-facebook",       channel: "facebook",       clicks: 0,  leads: 4, invites: 0, audits: 0, converted: 2, click_to_lead: null, lead_to_audit: 0 },
  { campaign: "april-launch-reddit",         channel: "reddit",         clicks: 0,  leads: 3, invites: 0, audits: 0, converted: 1, click_to_lead: null, lead_to_audit: 0 },
  { campaign: "april-launch-linkedin",       channel: "linkedin",       clicks: 24, leads: 5, invites: 2, audits: 1, converted: 1, click_to_lead: 20.8, lead_to_audit: 20 },
  { campaign: "april-launch-trucking_forum", channel: "trucking_forum", clicks: 0,  leads: 1, invites: 0, audits: 0, converted: 0, click_to_lead: null, lead_to_audit: 0 },
];
const DEMO_TRAFFIC = [11,18,22,9,17,14,21,15,28,19,12,23,18,16,9,14,17,22,11,15,19,12,8,16,17,20,14,11,18,15];
const DEMO_LEADS: Lead[] = [
  { id: "l1", captured: "2026-04-25", name: "Test Test",       email: "x3allamericanllc@gmail.com",           company: "Test",                fleet: "1-5",   source: "direct",   pain: "—",                        status: "audit_completed" },
  { id: "l2", captured: "2026-04-25", name: "Smoke Test",      email: "smoke-test+@x3fleetsafety.com",        company: "X3 Internal Smoke",   fleet: "1-5",   source: "direct",   pain: "—",                        status: "audit_invited"  },
  { id: "l3", captured: "2026-04-17", name: "Katherine Cruz",  email: "katherine.cruz@example.com",            company: "Cruz Trucking LLC",   fleet: "1",     source: "direct",   pain: "dq_files, insurance, csa", status: "new"             },
  { id: "l4", captured: "2026-04-17", name: "Jennifer Thomas", email: "jennifer.thomas@example.com",           company: "Thomas Trucking LLC", fleet: "16-50", source: "facebook", pain: "drug",                     status: "audit_completed" },
  { id: "l5", captured: "2026-04-16", name: "Mark Ruiz",       email: "mark.ruiz@example.com",                 company: "Ruiz Express",        fleet: "6-15",  source: "reddit",   pain: "csa, mvr",                 status: "converted"       },
];

// Theme-aware status pills — readable in light AND dark, matching accidents/inspections palette.
const STATUS_PILL: Record<string, string> = {
  new:              "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  audit_invited:    "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  audit_completed:  "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  converted:        "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
  unresponsive:     "bg-slate-100   dark:bg-slate-500/45   text-slate-900   dark:text-slate-50   border-slate-600   dark:border-slate-300/80",
  declined:         "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
};
const STATUS_LABEL: Record<string, string> = {
  new: "NEW", audit_invited: "AUDIT INVITED", audit_completed: "AUDIT COMPLETED", converted: "CONVERTED", unresponsive: "UNRESPONSIVE", declined: "DECLINED",
};
function StatusPill({ status }: { status: string }) {
  return (
    <span role="status" aria-label={`Status: ${STATUS_LABEL[status] || status}`} className={`inline-block min-w-[120px] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${STATUS_PILL[status] || STATUS_PILL.unresponsive}`}>
      {STATUS_LABEL[status] || status.toUpperCase()}
    </span>
  );
}

function TrackingLinkBuilder({ campaigns }: { campaigns: Campaign[] }) {
  const [campaignSlug, setCampaignSlug] = useState<string>(campaigns[0]?.slug || "");
  const [content, setContent] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!campaignSlug && campaigns[0]?.slug) setCampaignSlug(campaigns[0].slug); }, [campaigns, campaignSlug]);

  const link = useMemo(() => {
    if (!campaignSlug) return "—";
    const params = new URLSearchParams();
    params.set("utm_campaign", campaignSlug);
    if (content.trim()) params.set("utm_content", content.trim());
    return `https://x3compass.com/r/${campaignSlug}${params.toString() ? "?" + params.toString() : ""}`;
  }, [campaignSlug, content]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className="x3-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[15px] font-extrabold text-[var(--fg)]">Tracking Link Builder</div>
        <div className="text-[10px] tracking-[.14em] uppercase font-mono text-[var(--fg-muted)]">UTM-tagged · per campaign</div>
      </div>
      <p className="text-[12px] text-[var(--fg-muted)] mb-3 leading-relaxed">
        Generate a UTM-tagged link to paste into Reddit, LinkedIn comments, email signatures, etc. Each campaign tracks separately.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="block">
          <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1">Campaign</div>
          <select value={campaignSlug} onChange={(e) => setCampaignSlug(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]">
            {campaigns.length === 0 ? <option value="">No active campaigns</option> : campaigns.map(c => <option key={c.id} value={c.slug}>{c.slug} {c.channel ? `(${c.channel})` : ""}</option>)}
          </select>
        </label>
        <label className="block">
          <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1">Content tag (version)</div>
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="e.g., post-v1" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]" />
        </label>
      </div>
      <div className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] p-3 flex items-center gap-2">
        <code className="flex-1 text-[12px] font-mono text-[var(--fg)] break-all">{link}</code>
        <button onClick={copy} disabled={!campaignSlug} className="px-3 py-1.5 rounded-lg font-extrabold text-[11px] text-[var(--bg)] disabled:opacity-40" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
          {copied ? "✓ Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const [api, setApi] = useState<ApiPayload | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/marketing", { cache: "no-store" });
      const body = await r.json() as ApiPayload;
      setApi(body);
    } catch { /* keep previous */ }
    finally { setRefreshing(false); }
  }
  useEffect(() => { refresh(); }, []);

  const KPIS = api?.kpis ? { ...DEMO_KPIS, ...api.kpis } : DEMO_KPIS;
  const FUNNEL = api?.funnel && api.funnel.length > 0 ? api.funnel : DEMO_FUNNEL;
  const TRAFFIC = api?.traffic && api.traffic.length > 0 ? api.traffic : DEMO_TRAFFIC;
  const LEADS = api?.recent_leads && api.recent_leads.length > 0 ? api.recent_leads : DEMO_LEADS;
  const CAMPAIGNS = api?.campaigns || [];
  const isDemo = api?.demo !== false;

  const filtered = LEADS.filter(l => statusFilter === "all" || l.status === statusFilter);

  function exportCsv() {
    const headers = ["captured", "name", "email", "company", "fleet", "source", "pain", "status"];
    const rows = filtered.map(l => [l.captured, l.name, l.email, l.company, l.fleet, l.source, l.pain, l.status].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `marketing_leads_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Marketing Dashboard" crumbs="X3 Admin · Lead pipeline + campaign performance">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        <X3AdminHero
          eyebrow="Marketing Dashboard"
          title="Lead pipeline + campaign performance."
          intro="Inbound interest, conversion funnel, and content engagement."
          dataSource={{
            items: [
              <span key="k1"><strong className="text-[var(--fg)]">Clicks</strong> from <code className="font-mono text-[var(--accent)]">/r/&lt;campaign&gt;</code> redirect — every link click logs to <code className="font-mono text-[var(--accent)]">marketing_clicks</code>.</span>,
              <span key="k2"><strong className="text-[var(--fg)]">Leads</strong> from the <em>Ready-for-Compliance</em> form on x3compass.com — land in <code className="font-mono text-[var(--accent)]">marketing_leads</code> + trigger team@ alert.</span>,
              <span key="k3"><strong className="text-[var(--fg)]">Invites &amp; Audits</strong> from the 15-Min Audit flow — each invite + completed audit attaches to its lead row.</span>,
              <span key="k4"><strong className="text-[var(--fg)]">Conversions</strong> = leads marked <code className="font-mono text-[var(--accent)]">status=&apos;converted&apos;</code> once they subscribe via Stripe.</span>,
            ],
            footnote: <>Live data via <code className="font-mono text-[var(--accent)]">/api/marketing</code>. Click ↻ Refresh to re-pull.</>,
          }}
        />

        {/* KPI row — 6 cards matching X3FS classic */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <X3KPITile label="Clicks · 30 days"   value={KPIS.clicks_30d}             sub={undefined}                                                tone="navy" />
          <X3KPITile label="Leads · 30 days"    value={KPIS.leads_30d}              sub={KPIS.click_to_lead_pct != null ? `${KPIS.click_to_lead_pct}% Click→Lead` : "—"} tone="navy" />
          <X3KPITile label="Invites sent"       value={KPIS.invites_total}          sub="audit emails delivered"                                   tone="navy" />
          <X3KPITile label="Audits completed"   value={KPIS.audits_completed_total} sub={KPIS.lead_to_audit_pct != null ? `${KPIS.lead_to_audit_pct}% Lead→Audit` : "—"} tone="navy" />
          <X3KPITile label="Converted"          value={KPIS.converted_total}        sub="paying carriers"                                          tone="green" />
          <X3KPITile label="Cost per lead"      value={`$${KPIS.cost_per_lead}`}    sub={KPIS.cost_per_lead === 0 ? "current: all free channels" : ""} tone="navy" />
        </div>

        {/* Refresh + demo badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={refresh} disabled={refreshing} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50">
            {refreshing ? "↻ Refreshing…" : "↻ Refresh"}
          </button>
          {isDemo && (
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
              Demo data · drive traffic to /r/&lt;campaign&gt; to see live numbers
            </span>
          )}
        </div>

        {/* Funnel by Campaign */}
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Funnel by Campaign (last 30 Days)</div>
            <div className="text-[11px] text-[var(--fg-muted)]">{FUNNEL.length} campaigns</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">Campaign</th>
                  <th className="text-left px-3 py-2 font-bold">Channel</th>
                  <th className="text-right px-3 py-2 font-bold">Clicks</th>
                  <th className="text-right px-3 py-2 font-bold">Leads</th>
                  <th className="text-right px-3 py-2 font-bold">Invites</th>
                  <th className="text-right px-3 py-2 font-bold">Audits</th>
                  <th className="text-right px-3 py-2 font-bold">Converted</th>
                  <th className="text-right px-3 py-2 font-bold">Click→Lead</th>
                  <th className="text-right px-3 py-2 font-bold">Lead→Audit</th>
                </tr>
              </thead>
              <tbody>
                {FUNNEL.map((c, i) => (
                  <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-3 py-2.5 text-[var(--fg)] font-semibold">{c.campaign}</td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)]">{c.channel}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{c.clicks}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{c.leads}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{c.invites}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{c.audits}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-extrabold">{c.converted}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{c.click_to_lead != null ? `${c.click_to_lead}%` : "—"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{c.lead_to_audit != null ? `${c.lead_to_audit}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Two-column: Traffic sparkline + Tracking Link Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Traffic · last 30 Days</div>
              <div className="text-[10px] tracking-[.14em] uppercase font-mono text-[var(--fg-muted)]">daily clicks</div>
            </div>
            <div className="flex gap-1 items-end h-[80px]">
              {TRAFFIC.map((v, i) => {
                const max = Math.max(...TRAFFIC, 1);
                const h = (v / max) * 100;
                return <div key={i} className="flex-1 rounded-t bg-cyan-500 dark:bg-cyan-400" title={`${v} clicks`} style={{ height: `${h}%`, minHeight: 4 }} />;
              })}
            </div>
            <div className="text-[11px] text-[var(--fg-muted)] mt-2">
              Tallest bar = busiest day. Hover for click count.
            </div>
          </div>
          <TrackingLinkBuilder campaigns={CAMPAIGNS} />
        </div>

        {/* Recent Leads */}
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Recent Leads</div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="audit_invited">Audit invited</option>
              <option value="audit_completed">Audit completed</option>
              <option value="converted">Converted</option>
              <option value="unresponsive">Unresponsive</option>
              <option value="declined">Declined</option>
            </select>
            <button onClick={exportCsv} className="ml-auto px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">Captured</th>
                  <th className="text-left px-3 py-2 font-bold">Name</th>
                  <th className="text-left px-3 py-2 font-bold">Company</th>
                  <th className="text-left px-3 py-2 font-bold">Fleet</th>
                  <th className="text-left px-3 py-2 font-bold">Source</th>
                  <th className="text-left px-3 py-2 font-bold">Pain points</th>
                  <th className="text-left px-3 py-2 font-bold">Status</th>
                  <th className="text-right px-3 py-2 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-[var(--fg-muted)] text-[12px]">No leads match this filter.</td></tr>
                ) : filtered.map(l => (
                  <tr key={l.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{new Date(l.captured).toLocaleDateString()}</td>
                    <td className="px-3 py-2.5">
                      <div className="text-[var(--fg)] font-semibold">{l.name}</div>
                      <div className="text-[10px] text-[var(--fg-faint)]">{l.email}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)]">{l.company}</td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)]">{l.fleet}</td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)]">{l.source}</td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)] max-w-[200px] truncate" title={l.pain}>{l.pain}</td>
                    <td className="px-3 py-2.5"><StatusPill status={l.status} /></td>
                    <td className="px-3 py-2.5 text-right">
                      <a href={`mailto:${l.email}`} className="text-[12px] text-[var(--accent)] font-bold hover:underline">Reply</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
