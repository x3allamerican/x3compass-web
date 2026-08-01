"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile, X3AdminTabs } from "@/components/X3AdminHero";

// ---------------- Types ----------------
type Row = {
  id: string; dot_number: string; legal_name: string; dba: string | null;
  city: string | null; state: string | null;
  power_units: number | null; drivers: number | null;
  safety_rating: string | null; safety_rating_date: string | null;
  registration_date: string | null; new_entrant: boolean;
  first_seen_at: string; first_seen_days: number | null;
  email: string | null; phone: string | null;
  outreach_status: string | null; outreach_sent_at: string | null; outreach_template_id: string | null;
};
type Distribution = { range: string; count: number };
type OutreachLogRow = {
  id: string; sent_at: string; carrier_name: string; dot_number: string;
  template_id: string; status: string; subject: string; recipient_email: string;
  delivered_at: string | null; opened_at: string | null; replied_at: string | null; error_message: string | null;
};
type Template = { template_id: string; enabled: boolean; segment_label: string; subject_template: string; body_text_template: string; required_variables: string[] | null; notes: string | null };
type RunRow = { id: string; started_at: string; duration_label: string; status: string; carriers_scanned: number | null; carriers_new: number | null; carriers_updated: number | null; ratings_changed: number | null; prospects_under_25: number | null; notes: string | null; error_message: string | null };

type ApiPayload = {
  ok: boolean;
  demo?: boolean;
  kpis?: { in_region: number; new_entrants: number; below_sat: number; new_this_week: number; outreach_sent: number; replies: number };
  distributions?: { all: Distribution[]; new_entrants: Distribution[]; below_sat: Distribution[]; new_this_week: Distribution[] };
  rows?: { new_entrants: Row[]; below_sat: Row[]; new_this_week: Row[]; all_in_region: Row[] };
  outreach_log?: OutreachLogRow[];
  templates?: Template[];
  scraper_runs?: RunRow[];
};

// ---------------- Demo overlay (kept until live FMCSA scraper has populated rows) ----------------
const DEMO_KPIS = { in_region: 81, new_entrants: 5, below_sat: 3, new_this_week: 5, outreach_sent: 14, replies: 1 };
const DEMO_DIST: Distribution[] = [
  { range: "1-5", count: 18 }, { range: "6-10", count: 26 }, { range: "11-20", count: 21 }, { range: "21-50", count: 12 }, { range: "51-100", count: 4 },
];
const DEMO_NEW_ENTRANTS: Row[] = [
  { id: "d1", dot_number: "4250912", legal_name: "Northstar Logistics LLC", dba: null, city: "Detroit",      state: "MI", power_units:  8, drivers: 11, safety_rating: null, safety_rating_date: null, registration_date: "2025-09-12", new_entrant: true, first_seen_at: "2026-04-22T04:00:00Z", first_seen_days: 27, email: "ops@northstarlog.com",       phone: null, outreach_status: "sent",    outreach_sent_at: "2026-05-13T13:02:00Z", outreach_template_id: "new-entrant-intro" },
  { id: "d2", dot_number: "4271104", legal_name: "Buckeye Bulk Haulers",     dba: null, city: "Columbus",     state: "OH", power_units: 14, drivers: 17, safety_rating: null, safety_rating_date: null, registration_date: "2025-11-04", new_entrant: true, first_seen_at: "2026-04-22T04:00:00Z", first_seen_days: 27, email: "dispatch@buckeyebulk.com",   phone: null, outreach_status: "replied", outreach_sent_at: "2026-05-13T13:02:00Z", outreach_template_id: "new-entrant-intro" },
  { id: "d3", dot_number: "4360122", legal_name: "Hoosier Express Carriers",dba: null, city: "Indianapolis", state: "IN", power_units:  6, drivers:  9, safety_rating: null, safety_rating_date: null, registration_date: "2026-01-22", new_entrant: true, first_seen_at: "2026-04-22T04:00:00Z", first_seen_days: 27, email: "owner@hoosierexp.com",       phone: null, outreach_status: "queued",  outreach_sent_at: null, outreach_template_id: "new-entrant-intro" },
  { id: "d4", dot_number: "4380208", legal_name: "Lakeshore Transit Inc",    dba: null, city: "Milwaukee",    state: "WI", power_units: 23, drivers: 28, safety_rating: null, safety_rating_date: null, registration_date: "2026-02-08", new_entrant: true, first_seen_at: "2026-05-13T04:00:00Z", first_seen_days: 6,  email: "safety@lakeshoretransit.com",phone: null, outreach_status: null,      outreach_sent_at: null, outreach_template_id: null },
  { id: "d5", dot_number: "4400315", legal_name: "Prairie Wind Trucking",    dba: null, city: "Springfield",  state: "IL", power_units: 11, drivers: 13, safety_rating: null, safety_rating_date: null, registration_date: "2026-03-15", new_entrant: true, first_seen_at: "2026-05-13T04:00:00Z", first_seen_days: 6,  email: "contact@prairiewind.co",     phone: null, outreach_status: null,      outreach_sent_at: null, outreach_template_id: null },
];
const DEMO_BELOW_SAT: Row[] = [
  { id: "e1", dot_number: "3120402", legal_name: "Westgate Auto Transport", dba: null, city: "Grand Rapids", state: "MI", power_units: 17, drivers: 21, safety_rating: "CONDITIONAL",    safety_rating_date: "2025-08-14", registration_date: "2018-04-02", new_entrant: false, first_seen_at: "2024-12-01T04:00:00Z", first_seen_days: 535, email: "j.kim@westgateauto.com",     phone: null, outreach_status: "sent", outreach_sent_at: "2026-05-06T13:02:00Z", outreach_template_id: "conditional-help" },
  { id: "e2", dot_number: "2980619", legal_name: "Tri-State Cartage Co",     dba: null, city: "Toledo",       state: "OH", power_units: 22, drivers: 26, safety_rating: "CONDITIONAL",    safety_rating_date: "2025-12-03", registration_date: "2017-06-19", new_entrant: false, first_seen_at: "2024-12-01T04:00:00Z", first_seen_days: 535, email: "ops@tristatecartage.com",    phone: null, outreach_status: null,   outreach_sent_at: null,                     outreach_template_id: null },
  { id: "e3", dot_number: "3201130", legal_name: "Mid-Continent Couriers",   dba: null, city: "Champaign",    state: "IL", power_units: 19, drivers: 22, safety_rating: "UNSATISFACTORY", safety_rating_date: "2026-02-19", registration_date: "2019-11-30", new_entrant: false, first_seen_at: "2024-12-01T04:00:00Z", first_seen_days: 535, email: "hr@midcontinent.co",         phone: null, outreach_status: null,   outreach_sent_at: null,                     outreach_template_id: null },
];

const DEMO_TEMPLATES: Template[] = [
  { template_id: "new-entrant-intro", enabled: true,  segment_label: "New entrant <12 months", subject_template: "Welcome to interstate trucking · 7 things every new carrier needs in their first 90 days", body_text_template: `Hi {{first_name}},\n\nSaw your USDOT registration ({{dot_number}}) come through last {{registered_month}}. Congrats on the new authority · that's a real accomplishment.\n\nI run X3 Compass, an AI Safety Director for small fleets. We're not selling ELDs or training videos. We're the brain that watches your CDL expirations, drug-test windows, MVR pulls, IFTA filings, and CSA scores · and tells you exactly what's due before FMCSA does.\n\nIf you'd like a free 15-minute audit of where your DQ files stand right now, reply with a good time. No pitch, no obligation · you'll just walk away with a checklist.\n\nJoshua Kovarik\nFounder, X3 Compass\njoshua@x3compass.com`, required_variables: ["first_name", "dot_number", "registered_month"], notes: "Auto-sent Tue/Wed/Thu 9am ET, capped 50/day" },
  { template_id: "conditional-help",  enabled: false, segment_label: "Below-satisfactory rating", subject_template: "Spotted your Conditional rating · here's the 5-step path back to Satisfactory", body_text_template: "Personally reviewed by Joshua before send. See agent-fmcsa-outreach.", required_variables: ["first_name", "dot_number", "safety_rating"], notes: "Manual-review-only · bulk auto-outreach skips these" },
];

// ---------------- Theme-aware pills ----------------
const RATING_PILL: Record<string, string> = {
  SATISFACTORY:   "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  CONDITIONAL:    "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  UNSATISFACTORY: "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  NONE:           "bg-slate-100   dark:bg-slate-500/30   text-slate-700   dark:text-slate-50   border-slate-500   dark:border-slate-300/80",
};
function RatingPill({ rating }: { rating: string | null }) {
  if (!rating) return <span className={`inline-block min-w-[110px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${RATING_PILL.NONE}`}>—</span>;
  const r = rating.toUpperCase();
  const cls = RATING_PILL[r] || RATING_PILL.NONE;
  return <span className={`inline-block min-w-[110px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${cls}`}>{r}</span>;
}

const OUTREACH_PILL: Record<string, string> = {
  replied:   "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  opened:    "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  delivered: "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  sent:      "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
  queued:    "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  failed:    "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  none:      "bg-slate-100   dark:bg-slate-500/20   text-slate-700   dark:text-slate-300   border-slate-400   dark:border-slate-400/40",
};
function OutreachPill({ status }: { status: string | null }) {
  const key = (status || "none").toLowerCase();
  const cls = OUTREACH_PILL[key] || OUTREACH_PILL.none;
  const label = status ? key.toUpperCase() : "—";
  return <span className={`inline-block min-w-[90px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${cls}`}>{label}</span>;
}

const RUN_PILL: Record<string, string> = {
  ok:      "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  success: "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  partial: "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  failed:  "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
};
function RunPill({ status }: { status: string }) {
  const key = (status || "").toLowerCase();
  const cls = RUN_PILL[key] || RUN_PILL.partial;
  return <span className={`inline-block min-w-[80px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${cls}`}>{status || "?"}</span>;
}

// ---------------- Distribution chart ----------------
function FleetDistribution({ data, label }: { data: Distribution[]; label: string }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="x3-card p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[15px] font-extrabold text-[var(--fg)]">📊 Fleet size distribution (power units)</div>
        <div className="text-[11px] text-[var(--fg-muted)]">Showing: <span className="text-[var(--accent)] font-bold">{label}</span></div>
      </div>
      <div className="grid grid-cols-5 gap-3 h-[120px] items-end">
        {data.map(b => {
          const h = (b.count / max) * 100;
          return (
            <div key={b.range} className="flex flex-col items-center gap-1.5">
              <div className="text-[11px] font-bold text-[var(--fg)] tabular-nums">{b.count}</div>
              <div className="w-full rounded-t bg-cyan-500 dark:bg-cyan-400 transition-all" style={{ height: `${h}%`, minHeight: 2 }} title={`${b.count} carriers · ${b.range} power units`} />
              <div className="text-[10px] text-[var(--fg-muted)] font-mono">{b.range} PU</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Page ----------------
export default function ProspectsPage() {
  const [api, setApi] = useState<ApiPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"new" | "below_sat" | "all" | "this_week" | "outreach" | "template" | "scraper">("new");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  async function refresh() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/prospects", { cache: "no-store" });
      const body = await r.json() as ApiPayload;
      setApi(body);
    } catch { /* keep previous */ }
    finally { setRefreshing(false); }
  }
  useEffect(() => { refresh(); }, []);

  // Reset selection when tab changes
  useEffect(() => { setSelected(new Set()); }, [tab]);

  const KPIS  = api?.kpis  || DEMO_KPIS;
  const ROWS_NEW   = api?.rows?.new_entrants  && api.rows.new_entrants.length  > 0 ? api.rows.new_entrants  : DEMO_NEW_ENTRANTS;
  const ROWS_BELOW = api?.rows?.below_sat     && api.rows.below_sat.length     > 0 ? api.rows.below_sat     : DEMO_BELOW_SAT;
  const ROWS_WEEK  = api?.rows?.new_this_week && api.rows.new_this_week.length > 0 ? api.rows.new_this_week : DEMO_NEW_ENTRANTS.filter(r => (r.first_seen_days || 99) <= 7);
  const ROWS_ALL   = api?.rows?.all_in_region && api.rows.all_in_region.length > 0 ? api.rows.all_in_region : [...DEMO_NEW_ENTRANTS, ...DEMO_BELOW_SAT];
  const TEMPLATES  = api?.templates || DEMO_TEMPLATES;
  const LOG        = api?.outreach_log || [];
  const RUNS       = api?.scraper_runs || [];
  const isDemo = api?.demo !== false;

  // Choose the active row-set and distribution scope
  const { activeRows, distData, distLabel } = useMemo(() => {
    if (tab === "new")        return { activeRows: ROWS_NEW,   distData: api?.distributions?.new_entrants  || DEMO_DIST, distLabel: "New entrants <12 mo" };
    if (tab === "below_sat")  return { activeRows: ROWS_BELOW, distData: api?.distributions?.below_sat     || DEMO_DIST, distLabel: "Below-satisfactory carriers" };
    if (tab === "this_week")  return { activeRows: ROWS_WEEK,  distData: api?.distributions?.new_this_week || DEMO_DIST, distLabel: "New this week" };
    if (tab === "all")        return { activeRows: ROWS_ALL,   distData: api?.distributions?.all           || DEMO_DIST, distLabel: "All in-region carriers" };
    return { activeRows: ROWS_ALL, distData: api?.distributions?.all || DEMO_DIST, distLabel: "All in-region carriers" };
  }, [tab, api, ROWS_NEW, ROWS_BELOW, ROWS_WEEK, ROWS_ALL]);

  // Filter active rows by search + rating + state
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeRows.filter(r =>
      (q === "" ||
        r.legal_name.toLowerCase().includes(q) ||
        r.dot_number.includes(q) ||
        (r.city || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q)
      ) &&
      (ratingFilter === "all" || (ratingFilter === "none" ? !r.safety_rating : (r.safety_rating || "").toUpperCase() === ratingFilter)) &&
      (stateFilter === "all" || r.state === stateFilter)
    );
  }, [activeRows, search, ratingFilter, stateFilter]);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function selectAllVisible() {
    setSelected(new Set(filteredRows.map(r => r.id)));
  }
  function clearSelection() { setSelected(new Set()); }

  async function bulkOutreach() {
    if (selected.size === 0) {
      setBulkMsg({ ok: false, msg: "Select at least one carrier first." });
      return;
    }
    const templateId = tab === "below_sat" ? "conditional-help" : "new-entrant-intro";
    setBulkBusy(true); setBulkMsg(null);
    try {
      const dotNumbers = filteredRows.filter(r => selected.has(r.id)).map(r => r.dot_number);
      const r = await fetch("/api/prospects/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dot_numbers: dotNumbers, template_id: templateId, skip_below_sat: tab !== "below_sat" }),
      });
      const body = await r.json() as { ok?: boolean; error?: string; queued?: number; skipped?: number; breakdown?: Record<string, number> };
      if (!r.ok || !body.ok) {
        setBulkMsg({ ok: false, msg: body.error || `Server returned ${r.status}` });
      } else {
        setBulkMsg({ ok: true, msg: `✓ Queued ${body.queued} carrier(s) · skipped ${body.skipped}${body.breakdown ? ` (below-sat ${body.breakdown.below_satisfactory}, no email ${body.breakdown.no_email}, already queued ${body.breakdown.already_queued})` : ""}.` });
        clearSelection();
        refresh();
      }
    } catch (err) {
      setBulkMsg({ ok: false, msg: err instanceof Error ? err.message : "Bulk outreach failed" });
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCsv() {
    const headers = ["registered", "dot", "legal_name", "city", "state", "power_units", "drivers", "safety_rating", "email", "phone", "outreach_status", "outreach_sent_at"];
    const rows = filteredRows.map(r => [
      r.registration_date || "", r.dot_number, r.legal_name,
      r.city || "", r.state || "", r.power_units || "", r.drivers || "",
      r.safety_rating || "", r.email || "", r.phone || "",
      r.outreach_status || "", r.outreach_sent_at || "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `fmcsa_prospects_${tab}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="FMCSA Prospects" crumbs="X3 Admin · 5-State Region · Refreshed weekly">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        <X3AdminHero
          eyebrow="FMCSA Prospects · 5-State Region"
          title={<>Small carriers in MI · OH · IN · IL · WI · <span className="text-amber-700 dark:text-amber-400">refreshed weekly.</span></>}
          intro={<>A weekly scrape pulls active interstate &amp; intrastate carriers in our 5-state region with <strong className="text-white">1–100 power units</strong> and an <strong className="text-white">email on file</strong> into the prospect list. Two signals get top billing: <strong className="text-white">new entrants under 12 months old</strong> (highest intent), and <strong className="text-white">conditional or unsatisfactory ratings</strong> (highest need for X3&apos;s help).</>}
          dataSource={{
            items: [
              <span key="p1"><strong className="text-[var(--fg)]">Source</strong> · FMCSA SAFER bulk census (free, monthly) for the universe + Carrier Snapshot (free) for safety rating + new-entrant status. No paid APIs.</span>,
              <span key="p2"><strong className="text-[var(--fg)]">Filter at ingest</strong> · <code className="font-mono text-[var(--accent)]">state IN (&apos;MI&apos;,&apos;OH&apos;,&apos;IN&apos;,&apos;IL&apos;,&apos;WI&apos;)</code>, <code className="font-mono text-[var(--accent)]">power_units BETWEEN 1 AND 100</code>, <code className="font-mono text-[var(--accent)]">operating_status=&apos;ACTIVE&apos;</code>, <code className="font-mono text-[var(--accent)]">email IS NOT NULL</code>.</span>,
              <span key="p3"><strong className="text-[var(--fg)]">Scraper</strong> · <code className="font-mono text-[var(--accent)]">agent-fmcsa-scraper</code> runs every Monday 4am ET. Run summary lands in <code className="font-mono text-[var(--accent)]">fmcsa_scraper_runs</code>.</span>,
              <span key="p4"><strong className="text-[var(--fg)]">Outreach</strong> · <code className="font-mono text-[var(--accent)]">agent-fmcsa-outreach</code> Tue/Wed/Thu 9am ET, 50/day cap. Below-satisfactory carriers skip bulk auto-outreach; Joshua handles those personally.</span>,
            ],
          }}
        />

        {/* 6 KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <X3KPITile label="In-region carriers"   value={KPIS.in_region}     sub="5-state · ≤100 trucks · email" tone="navy" />
          <X3KPITile label="New entrants <12 mo"  value={KPIS.new_entrants}  sub="highest intent"                 tone="green" />
          <X3KPITile label="Below satisfactory"   value={KPIS.below_sat}     sub="highest need"                   tone="red" />
          <X3KPITile label="New this week"        value={KPIS.new_this_week} sub="first_seen_at < 7d"             tone="navy" />
          <X3KPITile label="Outreach sent"        value={KPIS.outreach_sent} sub="cumulative"                     tone="navy" />
          <X3KPITile label="Replies"              value={KPIS.replies}       sub="positive intent"                tone="green" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={refresh} disabled={refreshing} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50">
            {refreshing ? "↻ Refreshing…" : "↻ Refresh"}
          </button>
          {isDemo && (
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
              Demo data · agent-fmcsa-scraper will populate live carriers on next Monday 4am ET run
            </span>
          )}
        </div>

        {/* Fleet distribution · updates per tab */}
        <FleetDistribution data={distData} label={distLabel} />

        {/* 7-tab nav */}
        <X3AdminTabs
          active={tab}
          onChange={(k) => setTab(k as typeof tab)}
          tabs={[
            { key: "new",       label: "🌱 New entrants <12 mo" },
            { key: "below_sat", label: "⚠️ Below satisfactory" },
            { key: "all",       label: "📋 All in-region" },
            { key: "this_week", label: "✨ New this week" },
            { key: "outreach",  label: "✉️ Outreach log" },
            { key: "template",  label: "📨 Email template" },
            { key: "scraper",   label: "⏱️ Scraper runs" },
          ]}
        />

        {/* CARRIER TABLES · new / below_sat / all / this_week */}
        {(tab === "new" || tab === "below_sat" || tab === "all" || tab === "this_week") && (
          <div className="x3-card overflow-hidden mt-4">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[14px] font-extrabold text-[var(--fg)]">
                  {tab === "new"       && "🌱 New entrants · registered in the last 12 months"}
                  {tab === "below_sat" && "⚠️ Below satisfactory · highest help-need"}
                  {tab === "this_week" && "✨ New this week · first_seen_at < 7d"}
                  {tab === "all"       && "📋 All in-region carriers"}
                </div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  {tab === "new"       && "Highest intent · they're still building compliance habits. Auto-outreach goes here first."}
                  {tab === "below_sat" && "Joshua handles personally · bulk auto-outreach is paused for these."}
                  {tab === "this_week" && "Carriers that showed up in this week's scrape but not the prior one."}
                  {tab === "all"       && "Full ICP-filtered universe. Use search/filters to narrow."}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={exportCsv} disabled={filteredRows.length === 0} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-40">↓ Export CSV</button>
                <button onClick={bulkOutreach} disabled={bulkBusy || selected.size === 0} className="px-3 py-1.5 rounded-lg font-extrabold text-[12px] text-[var(--bg)] disabled:opacity-40" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                  {bulkBusy ? "Queuing…" : `📩 Bulk outreach${selected.size > 0 ? ` (${selected.size})` : ""}`}
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2 flex-wrap bg-[var(--surface-3)]">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, DOT, city, email…" className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px] min-w-[240px] focus:outline-none focus:border-[var(--accent)]" />
              <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
                <option value="all">All states</option>{["MI", "OH", "IN", "IL", "WI"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
                <option value="all">Any rating</option>
                <option value="SATISFACTORY">Satisfactory</option>
                <option value="CONDITIONAL">Conditional</option>
                <option value="UNSATISFACTORY">Unsatisfactory</option>
                <option value="none">Not rated</option>
              </select>
              <span className="text-[11px] text-[var(--fg-muted)] ml-auto">
                {filteredRows.length} of {activeRows.length} {filteredRows.length === activeRows.length ? "" : "(filtered)"}
              </span>
              {filteredRows.length > 0 && (
                selected.size === filteredRows.length
                  ? <button onClick={clearSelection} className="text-[11px] text-[var(--accent)] font-bold underline">Clear selection</button>
                  : <button onClick={selectAllVisible} className="text-[11px] text-[var(--accent)] font-bold underline">Select all visible</button>
              )}
            </div>

            {bulkMsg && (
              <div className={`px-5 py-2 text-[12px] border-b border-[var(--border)] ${bulkMsg.ok ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/20" : "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/20"}`}>{bulkMsg.msg}</div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr>
                    <th className="px-3 py-2 w-8"></th>
                    <th className="text-left px-3 py-2 font-bold whitespace-nowrap">Registered</th>
                    <th className="text-left px-3 py-2 font-bold">DOT #</th>
                    <th className="text-left px-3 py-2 font-bold">Legal name</th>
                    <th className="text-left px-3 py-2 font-bold">City</th>
                    <th className="text-left px-3 py-2 font-bold">State</th>
                    <th className="text-right px-3 py-2 font-bold">Power units</th>
                    <th className="text-right px-3 py-2 font-bold">Drivers</th>
                    <th className="text-left px-3 py-2 font-bold">Rating</th>
                    <th className="text-left px-3 py-2 font-bold">Email</th>
                    <th className="text-left px-3 py-2 font-bold">Outreach</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr><td colSpan={11} className="px-3 py-8 text-center text-[var(--fg-muted)]">
                      {activeRows.length === 0 ? "No carriers in this segment yet." : "No carriers match these filters."}
                    </td></tr>
                  ) : filteredRows.map(r => (
                    <tr key={r.id} className={`border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors ${selected.has(r.id) ? "bg-cyan-50 dark:bg-cyan-500/10" : ""}`}>
                      <td className="px-3 py-2.5">
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="accent-[var(--accent)]" aria-label={`Select ${r.legal_name}`} />
                      </td>
                      <td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{r.registration_date || "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-[var(--accent)] whitespace-nowrap">{r.dot_number}</td>
                      <td className="px-3 py-2.5 text-[var(--fg)] font-semibold">{r.legal_name}{r.dba && <span className="text-[10px] text-[var(--fg-muted)] ml-1">(dba {r.dba})</span>}</td>
                      <td className="px-3 py-2.5 text-[var(--fg-muted)]">{r.city || "—"}</td>
                      <td className="px-3 py-2.5 text-[var(--fg-muted)] font-mono">{r.state || "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{r.power_units ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{r.drivers ?? "—"}</td>
                      <td className="px-3 py-2.5"><RatingPill rating={r.safety_rating} /></td>
                      <td className="px-3 py-2.5">
                        {r.email ? <a href={`mailto:${r.email}`} className="text-[var(--accent)] hover:underline font-mono text-[11px]">{r.email}</a> : <span className="text-[var(--fg-faint)]">—</span>}
                      </td>
                      <td className="px-3 py-2.5"><OutreachPill status={r.outreach_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OUTREACH LOG */}
        {tab === "outreach" && (
          <div className="x3-card overflow-hidden mt-4">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <div className="text-[14px] font-extrabold text-[var(--fg)]">✉️ Outreach log</div>
              <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">Every send by <code className="font-mono">agent-fmcsa-outreach</code>. Latest 200 rows.</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold whitespace-nowrap">Sent</th>
                    <th className="text-left px-3 py-2 font-bold">Carrier</th>
                    <th className="text-left px-3 py-2 font-bold">DOT #</th>
                    <th className="text-left px-3 py-2 font-bold">Template</th>
                    <th className="text-left px-3 py-2 font-bold">Status</th>
                    <th className="text-left px-3 py-2 font-bold">Subject</th>
                  </tr>
                </thead>
                <tbody>
                  {LOG.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-[var(--fg-muted)]">No outreach sent yet. <code>agent-fmcsa-outreach</code> fires Tue/Wed/Thu 9am ET, capped 50/day.</td></tr>
                  ) : LOG.map(l => (
                    <tr key={l.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{new Date(l.sent_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                      <td className="px-3 py-2.5 text-[var(--fg)] font-semibold">{l.carrier_name}</td>
                      <td className="px-3 py-2.5 font-mono text-[var(--accent)]">{l.dot_number}</td>
                      <td className="px-3 py-2.5"><code className="font-mono text-[10px] text-[var(--fg)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{l.template_id}</code></td>
                      <td className="px-3 py-2.5"><OutreachPill status={l.status} /></td>
                      <td className="px-3 py-2.5 text-[var(--fg-muted)] max-w-[420px] truncate" title={l.subject}>{l.subject}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EMAIL TEMPLATE */}
        {tab === "template" && (
          <div className="space-y-4 mt-4">
            {TEMPLATES.map(t => (
              <div key={t.template_id} className="x3-card p-5">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-[10px] text-[var(--accent)] bg-[var(--surface-2)] px-2 py-1 rounded tracking-wider uppercase">{t.template_id}</code>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${t.enabled ? RATING_PILL.SATISFACTORY : RATING_PILL.NONE}`}>
                      {t.enabled ? "ENABLED" : "MANUAL ONLY"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--fg-muted)]">Segment: <strong className="text-[var(--fg)]">{t.segment_label}</strong></span>
                </div>
                <div className="text-[13px] font-extrabold text-[var(--fg)] mb-3">Subject: {t.subject_template}</div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <pre className="text-[12px] text-[var(--fg)] font-mono leading-relaxed whitespace-pre-wrap">{t.body_text_template}</pre>
                </div>
                {t.required_variables && t.required_variables.length > 0 && (
                  <div className="mt-2 text-[11px] text-[var(--fg-muted)]">
                    <strong className="text-[var(--fg)]">Variables:</strong> {t.required_variables.map((v, i) => <code key={i} className="font-mono text-[var(--accent)] ml-1">{`{{${v}}}`}</code>)}
                  </div>
                )}
                {t.notes && <div className="mt-1 text-[11px] text-[var(--fg-muted)]">{t.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {/* SCRAPER RUNS */}
        {tab === "scraper" && (
          <div className="x3-card overflow-hidden mt-4">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <div className="text-[14px] font-extrabold text-[var(--fg)]">⏱️ Scraper runs</div>
              <div className="text-[11px] text-[var(--fg-muted)] mt-0.5"><code className="font-mono">agent-fmcsa-scraper</code> · weekly Mondays 4am ET · latest 30 runs</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold whitespace-nowrap">Run started</th>
                    <th className="text-left px-3 py-2 font-bold">Duration</th>
                    <th className="text-right px-3 py-2 font-bold">Scanned</th>
                    <th className="text-right px-3 py-2 font-bold">New</th>
                    <th className="text-right px-3 py-2 font-bold">Updated</th>
                    <th className="text-right px-3 py-2 font-bold">Ratings changed</th>
                    <th className="text-left px-3 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RUNS.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-[var(--fg-muted)]">No runs yet. First Monday 4am ET will populate this.</td></tr>
                  ) : RUNS.map(r => (
                    <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{new Date(r.started_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                      <td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums">{r.duration_label}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{r.carriers_scanned ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-extrabold">{r.carriers_new ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{r.carriers_updated ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-amber-700 dark:text-amber-300">{r.ratings_changed ?? "—"}</td>
                      <td className="px-3 py-2.5"><RunPill status={r.status || "ok"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
