"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import { DEMO_CARRIER, DEMO_FLEET, COMPLIANCE_BARS, CSA_BASICS, ACTION_ITEMS } from "@/lib/demoData";

// ---------- helpers ----------
function StatusDot({ kind }: { kind: "overdue" | "warn" | "info" | "ok" }) {
  const map = { overdue: "var(--danger)", warn: "var(--warning)", info: "var(--accent)", ok: "var(--success)" };
  return <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: map[kind] }} />;
}

// ---------- page ----------
type ApiData = {
  carrier?: typeof DEMO_CARRIER;
  fleet?: typeof DEMO_FLEET;
  compliance_bars?: typeof COMPLIANCE_BARS;
  csa_basics?: typeof CSA_BASICS | null;
  action_items?: typeof ACTION_ITEMS;
  action_items_row2?: typeof ACTION_ITEMS;
};

export default function DashboardPage() {
  const { carrier: userCarrier } = useUser();
  const [api, setApi] = useState<ApiData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qs = userCarrier?.id ? `?carrier_id=${userCarrier.id}` : "";
        const r = await fetch(`/api/dashboard${qs}`, { cache: "no-store" });
        if (!r.ok) return;
        const body = await r.json() as { ok?: boolean; demo?: boolean; data?: ApiData };
        if (!cancelled && body?.data) setApi(body.data);
      } catch { /* keep demo */ }
    })();
    return () => { cancelled = true; };
  }, [userCarrier?.id]);

  // Live values overlay demo data — if API returned a field, use it; else demo.
  const CARRIER = api?.carrier ? { ...DEMO_CARRIER, ...api.carrier } : DEMO_CARRIER;
  const FLEET = api?.fleet ? { ...DEMO_FLEET, ...api.fleet } : DEMO_FLEET;
  const BARS = api?.compliance_bars && api.compliance_bars.length > 0 ? api.compliance_bars : COMPLIANCE_BARS;
  const BASICS = api?.csa_basics && api.csa_basics.length > 0 ? api.csa_basics : CSA_BASICS;
  const ACTIONS = { ...ACTION_ITEMS, ...(api?.action_items || {}), ...(api?.action_items_row2 || {}) };

  return (
    <AppShell title="Compliance Command Center" crumbs={`${CARRIER.name} · DOT #${CARRIER.dot_number}`}>
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        {/* Header strip */}
        <div className="x3-card p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg grid place-items-center font-black text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>X3</div>
            <div>
              <div className="text-[19px] font-extrabold text-[var(--fg)]">Compliance Command Center</div>
              <div className="text-[12px] text-[var(--fg-muted)]">{CARRIER.name} · DOT #{CARRIER.dot_number}</div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] tracking-[.12em] uppercase font-bold bg-[var(--success)]/15 text-[var(--success)]">{FLEET.compliance_pct}% Compliance health</span>
            <div className="text-[11px] text-[var(--fg-muted)] mt-1">Refreshed 8:16 PM</div>
          </div>
        </div>

        {/* KPI strip — 6 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { tone: "accent",  label: "ACTIVE DRIVERS", value: FLEET.active_drivers,  sub: `of ${FLEET.drivers_on_roster} on roster`, icon: "👤" },
            { tone: "success", label: "POWER UNITS",    value: FLEET.power_units,     sub: "across fleet",                                  icon: "🚛" },
            { tone: "danger",  label: "OPEN ALERTS",    value: FLEET.open_alerts,     sub: `${FLEET.open_alerts_urgent} urgent`,        icon: "⚠" },
            { tone: "danger",  label: "CDLS EXPIRED",   value: FLEET.cdls_expired,    sub: "needs action",                                  icon: "✕" },
            { tone: "success", label: "MECS ≤30D",      value: FLEET.mecs_expiring_30d, sub: "expiring soon",                              icon: "♡" },
            { tone: "warning", label: "DQ SCORE",       value: `${FLEET.dq_score_pct}%`, sub: `${FLEET.dq_docs_present} of ${FLEET.dq_docs_total} docs`, icon: "★" },
          ].map((k, i) => (
            <div key={i} className="x3-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] tracking-[.16em] uppercase font-bold text-[var(--fg-muted)]">{k.label}</div>
                <span className={`text-[14px]`} style={{ color: `var(--${k.tone === "accent" ? "accent" : k.tone === "danger" ? "danger" : k.tone === "warning" ? "warning" : "success"})` }}>{k.icon}</span>
              </div>
              <div className="text-[28px] font-black leading-none text-[var(--fg)]">{k.value}</div>
              <div className="text-[11px] text-[var(--fg-muted)] mt-1">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Compliance Overview + CSA Scores */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Compliance Overview</div>
              <Link href="/app/audit-export" className="text-[12px] text-[var(--accent)] font-bold hover:underline">Full Report</Link>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative">
                <Donut data={[{ label: "good", count: FLEET.compliance_pct, color: "var(--warning)" }, { label: "gap", count: 100 - FLEET.compliance_pct, color: "var(--surface-2)" }]} />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-[32px] font-black text-[var(--fg)] leading-none">{FLEET.compliance_pct}%</div>
                    <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mt-1">OVERALL</div>
                    <div className="text-[11px] text-[var(--warning)] font-semibold mt-1">Action needed</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-[280px] space-y-2.5">
                {BARS.map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-[12px] text-[var(--fg-muted)] mb-1">
                      <span className="font-semibold text-[var(--fg)]">{b.label}</span><span>{b.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color === "green" ? "var(--success)" : b.color === "yellow" ? "var(--warning)" : "var(--danger)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">CSA Scores</div>
              <div className="text-[11px] text-[var(--fg-muted)]">BASIC measures — lower is better</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BASICS.map((c) => {
                const tone = c.status === "alert" ? "var(--danger)" : c.status === "warn" ? "var(--warning)" : "var(--success)";
                const bg   = c.status === "alert" ? "rgba(220,38,38,.10)" : c.status === "warn" ? "rgba(180,83,9,.10)" : "rgba(4,120,87,.08)";
                return (
                  <div key={c.name} className="rounded-lg border border-[var(--border)] p-3" style={{ background: bg }}>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] tracking-[.12em] uppercase font-bold text-[var(--fg-muted)]">{c.name}</div>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <div className="text-[22px] font-black" style={{ color: tone }}>{c.msr}</div>
                      <div className="text-[10px] text-[var(--fg-muted)] font-semibold">MSR</div>
                    </div>
                    <div className="text-[10px] text-[var(--fg-muted)] mt-0.5">Threshold {c.threshold}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 8-tile Action Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)]">Action items · what needs you today</div>
            <div className="text-[10px] text-[var(--fg-faint)]">Generated 8:16 PM</div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(ACTION_ITEMS).map(([k, t]) => (
              <div key={k} className="x3-card p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-[12px] font-extrabold text-[var(--fg)] leading-tight">{t.title}</div>
                </div>
                <div className="text-[10px] text-[var(--fg-faint)] mb-3">{t.cfr}</div>
                <div className="space-y-1.5 flex-1">
                  {t.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="min-w-0">
                        <div className="text-[var(--fg)] font-semibold truncate">{it.who}</div>
                        <div className="text-[var(--fg-muted)] truncate">{it.meta}</div>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${it.statusKind === "overdue" ? "bg-[var(--danger)]/15 text-[var(--danger)]" : "bg-[var(--warning)]/15 text-[var(--warning)]"}`}>{it.status}</div>
                    </div>
                  ))}
                </div>
                <Link href={t.cta.href} className="text-[11px] font-bold text-[var(--accent)] hover:underline mt-3">{t.cta.label}</Link>
              </div>
            ))}
          </div>
        </div>

        {/* FMCSA Carrier Profile */}
        <div className="x3-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)]">FMCSA Carrier Profile</div>
            <Link href="https://safer.fmcsa.dot.gov/" target="_blank" rel="noopener" className="text-[12px] text-[var(--accent)] font-bold hover:underline">Sync with FMCSA</Link>
          </div>
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4 text-[12px]">
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Safety Rating</div>
              <div className="text-[15px] text-[var(--success)] font-extrabold">{CARRIER.safety_rating}</div>
              <div className="text-[10px] text-[var(--fg-muted)]">As of {CARRIER.rating_date} · {CARRIER.rating_type}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Operating Authority</div>
              <div className="text-[15px] text-[var(--success)] font-extrabold">✓ Active</div>
              <div className="text-[10px] text-[var(--fg-muted)]">Authorized for Property</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Annual Miles</div>
              <div className="text-[15px] text-[var(--fg)] font-extrabold">{CARRIER.annual_miles.toLocaleString()}</div>
              <div className="text-[10px] text-[var(--fg-muted)]">In 2025</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Power Units</div>
              <div className="text-[15px] text-[var(--fg)] font-extrabold">{CARRIER.reported_power_units.toLocaleString()}</div>
              <div className="text-[10px] text-[var(--fg-muted)]">Reported on MCS-150</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Drivers</div>
              <div className="text-[15px] text-[var(--fg)] font-extrabold">{CARRIER.reported_drivers.toLocaleString()}</div>
              <div className="text-[10px] text-[var(--fg-muted)]">Reported on MCS-150</div>
            </div>
          </div>
          <div className="text-[10px] text-[var(--fg-faint)] mt-4">📡 Last MCS-150 filed Sep 24, 2025 · Last sync 4/22/2026</div>

          <div className="border-t border-[var(--border)] mt-4 pt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-[12px]">
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--accent)] mb-1">Your X3 Fleet</div>
              <div className="flex items-baseline gap-1.5"><div className="text-[20px] text-[var(--fg)] font-extrabold">{FLEET.power_units - FLEET.trailers}</div><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">POWER UNITS</div></div>
              <div className="text-[10px] text-[var(--fg-muted)]">Active only · Manage →</div>
            </div>
            <div><div className="text-[20px] text-[var(--fg)] font-extrabold">{FLEET.tractors}</div><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Tractors</div></div>
            <div><div className="text-[20px] text-[var(--fg)] font-extrabold">{FLEET.straight_trucks}</div><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Straight trucks</div></div>
            <div><div className="text-[20px] text-[var(--fg)] font-extrabold">{FLEET.trailers}</div><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Trailers</div></div>
            <div><div className="text-[20px] text-[var(--fg)] font-extrabold">{FLEET.active_drivers}</div><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Active drivers</div></div>
          </div>

          <div className="border-t border-[var(--border)] mt-4 pt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[12px]">
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">BIPD Insurance</div>
              <div className="text-[14px] text-[var(--fg)] font-extrabold">{FLEET.bipd_insurance}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Cargo Insurance</div>
              <div className="text-[14px] text-[var(--fg)] font-extrabold">{FLEET.cargo_insurance}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">24-mo Crashes</div>
              <div className="text-[14px] text-[var(--fg)] font-extrabold">{FLEET.crashes_24mo_total} total · {FLEET.crashes_24mo_fatal} fatal · {FLEET.crashes_24mo_injury} injury</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">OOS Rates</div>
              <div className="text-[12px] text-[var(--fg)] font-semibold">Driver {FLEET.driver_oos_rate_pct}% <span className="text-[var(--fg-faint)]">(nat'l {FLEET.driver_oos_national_pct}%)</span></div>
              <div className="text-[12px] text-[var(--fg)] font-semibold">Vehicle {FLEET.vehicle_oos_rate_pct}% <span className="text-[var(--fg-faint)]">(nat'l {FLEET.vehicle_oos_national_pct}%)</span></div>
            </div>
          </div>
        </div>


        {/* ─────────────────────────────────────────────────────── */}
        {/* TRACKER OVERVIEW — replaces 6 demo-chart sections.       */}
        {/* Each tile pulls a real row count from compass_* tables.  */}
        {/* ─────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
            <div>
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-1">
                02 · TRACKERS · ALL YOUR FMCSA ARTIFACTS
              </div>
              <h2 className="text-[22px] font-extrabold text-[var(--fg)]">Every tracker, one click away.</h2>
            </div>
            <div className="text-[12px] text-[var(--fg-muted)]">Charts will populate as you add data.</div>
          </div>
          <TrackerOverview />
        </div>
      </div>
    </AppShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TrackerOverview — 12 tiles, each shows real row count from Supabase
// ═══════════════════════════════════════════════════════════════════
type TrackerTile = {
  key: string;
  href: string;
  icon: string;
  title: string;
  cfr: string;
  table: string;
  brain: "driver" | "vehicle" | "ops";
};

const TRACKERS: TrackerTile[] = [
  // Driver Brain
  { key: "drivers",         href: "/app/drivers",         icon: "👤", title: "Drivers",          cfr: "§ 391",        table: "compass_drivers",          brain: "driver" },
  { key: "dq-files",        href: "/app/dq-files",        icon: "📁", title: "DQ Files",         cfr: "§ 391.51",     table: "compass_dq_files",         brain: "driver" },
  { key: "mvr",             href: "/app/mvr",             icon: "🪪", title: "MVR",              cfr: "§ 391.25",     table: "compass_mvr_records",      brain: "driver" },
  { key: "drug-alcohol",    href: "/app/drug-alcohol",    icon: "💊", title: "Drug & Alcohol",   cfr: "Part 382",     table: "compass_da_tests",         brain: "driver" },
  { key: "training",        href: "/app/training",        icon: "🎓", title: "Training",         cfr: "Part 380",     table: "compass_training_records", brain: "driver" },
  { key: "background-checks", href: "/app/background-checks", icon: "🛡️", title: "Background",  cfr: "FCRA",         table: "vendor_orders",            brain: "driver" },

  // Vehicle Brain
  { key: "vehicles",        href: "/app/vehicles",        icon: "🚛", title: "Vehicles",         cfr: "§ 396",        table: "compass_vehicles",         brain: "vehicle" },
  { key: "inspections",     href: "/app/inspections",     icon: "🔍", title: "Inspections",      cfr: "§ 396.17",     table: "compass_inspections",      brain: "vehicle" },
  { key: "accidents",       href: "/app/accidents",       icon: "💥", title: "Accidents",        cfr: "§ 390.5",      table: "compass_accidents",        brain: "vehicle" },

  // Ops Brain
  { key: "hos",             href: "/app/hos",             icon: "⏱️", title: "Hours of Service", cfr: "Part 395",     table: "compass_hos_logs",         brain: "ops" },
  { key: "ifta",            href: "/app/ifta",            icon: "⛽", title: "IFTA",             cfr: "IFTA",         table: "compass_ifta_records",     brain: "ops" },
  { key: "scorecards",      href: "/app/scorecards",      icon: "📊", title: "Scorecards",       cfr: "§ 385",        table: "compass_scorecards",       brain: "ops" },
];

const BRAIN_LABELS: Record<TrackerTile["brain"], string> = {
  driver: "Driver Brain",
  vehicle: "Vehicle Brain",
  ops: "Ops Brain",
};

function TrackerOverview() {
  const { carrier } = useUser();
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!carrier?.id) return;
    let cancelled = false;
    (async () => {
      const sb = (await import("@/lib/supabase")).getSupabase();
      const results: Record<string, number | null> = {};
      await Promise.all(
        TRACKERS.map(async (t) => {
          try {
            const { count, error } = await sb
              .from(t.table)
              .select("id", { count: "exact", head: true })
              .eq("carrier_id", carrier.id);
            results[t.key] = error ? null : (count ?? 0);
          } catch {
            results[t.key] = null;
          }
        })
      );
      if (!cancelled) setCounts(results);
    })();
    return () => { cancelled = true; };
  }, [carrier?.id]);

  const brains: Array<TrackerTile["brain"]> = ["driver", "vehicle", "ops"];

  return (
    <div className="space-y-5">
      {brains.map((brain) => {
        const tiles = TRACKERS.filter((t) => t.brain === brain);
        return (
          <div key={brain}>
            <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[var(--fg-muted)] mb-2 px-1">
              {BRAIN_LABELS[brain]}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {tiles.map((t) => {
                const c = counts[t.key];
                const isLoading = c === undefined;
                const isEmpty = c === 0;
                const isError = c === null;
                return (
                  <Link
                    key={t.key}
                    href={t.href}
                    className="x3-card p-4 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[22px] leading-none">{t.icon}</span>
                      <span className="text-[9px] font-mono text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                    <div className="text-[13px] font-extrabold text-[var(--fg)] mb-0.5">{t.title}</div>
                    <div className="text-[10px] font-mono text-[var(--accent)] mb-2">{t.cfr}</div>
                    <div className="text-[20px] font-black text-[var(--fg)] leading-none">
                      {isLoading ? (
                        <span className="text-[var(--fg-faint)] text-[14px] font-bold">…</span>
                      ) : isError ? (
                        <span className="text-[var(--fg-faint)] text-[12px] font-semibold">—</span>
                      ) : (
                        <>{c}<span className="text-[12px] font-bold text-[var(--fg-muted)] ml-1">{c === 1 ? "record" : "records"}</span></>
                      )}
                    </div>
                    {isEmpty && (
                      <div className="text-[10px] text-[var(--fg-muted)] mt-1">Start tracking →</div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
