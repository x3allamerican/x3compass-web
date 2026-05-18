"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import {
  DEMO_CARRIER, DEMO_FLEET, COMPLIANCE_BARS, CSA_BASICS, ACTION_ITEMS,
  DRIVER_STATUS, CDL_BUCKETS, VEHICLE_TYPES, MAINTENANCE_KPIS,
  INSPECTIONS_BARS, DA_TESTS_BY_TYPE, DA_MONTHLY, HOS_METRICS, DOC_EXPIRATIONS, TRAINING_TOPICS,
} from "@/lib/demoData";

// ---------- helpers ----------
function Donut({ data, size = 180 }: { data: { label: string; count: number; color: string }[]; size?: number }) {
  const total = data.reduce((a, b) => a + b.count, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size * 0.42, inner = size * 0.27;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="distribution">
      {data.map((d, i) => {
        const start = (acc / total) * 2 * Math.PI - Math.PI / 2;
        acc += d.count;
        const end = (acc / total) * 2 * Math.PI - Math.PI / 2;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
        const x3 = cx + inner * Math.cos(end), y3 = cy + inner * Math.sin(end);
        const x4 = cx + inner * Math.cos(start), y4 = cy + inner * Math.sin(start);
        return (
          <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`} fill={d.color} />
        );
      })}
    </svg>
  );
}
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
  driver_status?: typeof DRIVER_STATUS;
  cdl_buckets?: typeof CDL_BUCKETS;
  vehicle_types?: typeof VEHICLE_TYPES;
  maintenance_kpis?: typeof MAINTENANCE_KPIS;
  inspections_bars?: typeof INSPECTIONS_BARS;
  da_tests_by_type?: typeof DA_TESTS_BY_TYPE;
  da_monthly?: typeof DA_MONTHLY;
  hos_metrics?: typeof HOS_METRICS;
  doc_expirations?: typeof DOC_EXPIRATIONS;
  training_topics?: typeof TRAINING_TOPICS;
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
  const DRIVERS_STATUS = api?.driver_status && api.driver_status.length > 0 ? api.driver_status : DRIVER_STATUS;
  const CDLS = api?.cdl_buckets && api.cdl_buckets.length > 0 ? api.cdl_buckets : CDL_BUCKETS;
  const VEHICLES = api?.vehicle_types && api.vehicle_types.length > 0 ? api.vehicle_types : VEHICLE_TYPES;
  const MAINT = api?.maintenance_kpis && api.maintenance_kpis.length > 0 ? api.maintenance_kpis : MAINTENANCE_KPIS;
  const INSPECTIONS = api?.inspections_bars && api.inspections_bars.length > 0 ? api.inspections_bars : INSPECTIONS_BARS;
  const DA_BY_TYPE = api?.da_tests_by_type && api.da_tests_by_type.length > 0 ? api.da_tests_by_type : DA_TESTS_BY_TYPE;
  const DA_TREND = api?.da_monthly && api.da_monthly.length > 0 ? api.da_monthly : DA_MONTHLY;
  const HOS = api?.hos_metrics ? { ...HOS_METRICS, ...api.hos_metrics } : HOS_METRICS;
  const DOCEX = api?.doc_expirations && api.doc_expirations.length > 0 ? api.doc_expirations : DOC_EXPIRATIONS;
  const TRAINING = api?.training_topics && api.training_topics.length > 0 ? api.training_topics : TRAINING_TOPICS;

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

        {/* Drivers section */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Driver status</div>
            <div className="flex items-center gap-6 flex-wrap">
              <Donut data={DRIVER_STATUS} />
              <ul className="text-[12px] space-y-1.5">
                {DRIVERS_STATUS.map((d) => (
                  <li key={d.label} className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /> <span className="text-[var(--fg)] font-semibold">{d.label}</span> <span className="text-[var(--fg-muted)]">{d.count}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">CDL expiration buckets</div>
              <div className="text-[10px] text-[var(--fg-muted)]">Active drivers</div>
            </div>
            <div className="grid grid-cols-5 gap-2 items-end h-[180px]">
              {CDLS.map((b) => {
                const max = Math.max(...CDLS.map(x => x.count));
                const h = Math.max(2, (b.count / max) * 100);
                const color = b.label === "Expired" ? "var(--danger)" : b.label === "Over 90 days" ? "var(--success)" : "var(--warning)";
                return (
                  <div key={b.label} className="flex flex-col items-center gap-1.5">
                    <div className="text-[11px] font-bold text-[var(--fg)]">{b.count}</div>
                    <div className="w-full rounded-t" style={{ height: `${h}%`, background: color, minHeight: 4 }} />
                    <div className="text-[9px] text-[var(--fg-muted)] text-center">{b.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Vehicles section */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Vehicle types</div>
              <div className="text-[10px] text-[var(--fg-muted)]">100 units</div>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <Donut data={VEHICLE_TYPES} />
              <ul className="text-[12px] space-y-1.5">
                {VEHICLES.map((d) => (
                  <li key={d.label} className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /> <span className="text-[var(--fg)] font-semibold">{d.label}</span> <span className="text-[var(--fg-muted)]">{d.count}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Maintenance & inspection</div>
            <div className="grid grid-cols-2 gap-3">
              {MAINT.map((k) => {
                const toneColor = k.tone === "red" ? "var(--danger)" : k.tone === "yellow" ? "var(--warning)" : "var(--success)";
                const bg = k.tone === "red" ? "rgba(220,38,38,.08)" : k.tone === "yellow" ? "rgba(180,83,9,.08)" : "rgba(4,120,87,.08)";
                return (
                  <div key={k.label} className="rounded-lg border border-[var(--border)] p-4" style={{ background: bg }}>
                    <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">{k.label}</div>
                    <div className="text-[28px] font-black leading-none" style={{ color: toneColor }}>{k.value}</div>
                    <div className="text-[10px] text-[var(--fg-muted)] mt-1">{k.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inspections last 6 months */}
        <div className="x3-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)]">Inspections · last 6 months</div>
            <div className="flex gap-3 text-[10px] text-[var(--fg-muted)]">
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded" style={{ background: "var(--success)" }} />Clean</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded" style={{ background: "var(--warning)" }} />Violations</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded" style={{ background: "var(--danger)" }} />Out-of-service</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3 items-end h-[180px]">
            {INSPECTIONS.map((m) => {
              const total = m.clean + m.violations + m.oos;
              const maxT = Math.max(...INSPECTIONS.map(x => x.clean + x.violations + x.oos));
              const scale = (total / maxT) * 100;
              return (
                <div key={m.month} className="flex flex-col items-center gap-1.5">
                  <div className="w-full flex flex-col" style={{ height: `${scale}%`, minHeight: 6 }}>
                    <div style={{ flex: m.oos,        background: "var(--danger)"  }} />
                    <div style={{ flex: m.violations, background: "var(--warning)" }} />
                    <div style={{ flex: m.clean,      background: "var(--success)" }} />
                  </div>
                  <div className="text-[10px] text-[var(--fg-muted)]">{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drug & Alcohol */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Tests by type</div>
              <div className="text-[10px] text-[var(--fg-muted)]">Stacked by result</div>
            </div>
            <div className="grid grid-cols-4 gap-3 items-end h-[180px]">
              {DA_BY_TYPE.map((t) => {
                const total = t.negative + t.dilute + t.canceled + t.positive + t.refusal;
                const maxT = Math.max(...DA_BY_TYPE.map(x => x.negative + x.dilute + x.canceled + x.positive + x.refusal));
                const h = (total / maxT) * 100;
                return (
                  <div key={t.type} className="flex flex-col items-center gap-1.5">
                    <div className="w-full flex flex-col" style={{ height: `${h}%`, minHeight: 6 }}>
                      <div style={{ flex: t.refusal,  background: "#A78BFA" }} />
                      <div style={{ flex: t.positive, background: "var(--danger)" }} />
                      <div style={{ flex: t.canceled, background: "#9CA3AF" }} />
                      <div style={{ flex: t.dilute,   background: "var(--warning)" }} />
                      <div style={{ flex: t.negative, background: "var(--success)" }} />
                    </div>
                    <div className="text-[10px] text-[var(--fg-muted)] text-center">{t.type}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Monthly testing trend</div>
            <svg viewBox="0 0 600 180" className="w-full h-[180px]" preserveAspectRatio="none">
              {(() => {
                const max = Math.max(...DA_TREND.map(d => d.total));
                const w = 600, h = 180, padL = 40, padR = 20, padT = 10, padB = 30;
                const stepX = (w - padL - padR) / (DA_TREND.length - 1);
                const y = (v: number) => padT + (h - padT - padB) * (1 - v / max);
                const total = DA_TREND.map((d, i) => `${padL + i*stepX},${y(d.total)}`).join(" ");
                const pos = DA_TREND.map((d, i) => `${padL + i*stepX},${y(d.positives)}`).join(" ");
                return (
                  <>
                    <polyline fill="none" stroke="var(--accent)" strokeWidth="2.5" points={total} />
                    <polyline fill="none" stroke="var(--danger)" strokeWidth="2" points={pos} />
                    {DA_TREND.map((d, i) => (
                      <g key={i}>
                        <circle cx={padL + i*stepX} cy={y(d.total)}     r="3" fill="var(--accent)" />
                        <circle cx={padL + i*stepX} cy={y(d.positives)} r="2.5" fill="var(--danger)" />
                        <text x={padL + i*stepX} y={h - 12} textAnchor="middle" fontSize="10" fill="var(--fg-muted)">{d.m}</text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
            <div className="flex gap-4 text-[10px] text-[var(--fg-muted)] mt-2">
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: "var(--accent)" }} />Total tests</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: "var(--danger)" }} />Positives/refusal</span>
            </div>
          </div>
        </div>

        {/* HOS / ELD */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">HOS metrics — last 30 days</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[var(--border)] p-4 bg-[rgba(4,120,87,.06)]">
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Total Logs</div>
                <div className="text-[28px] font-black leading-none text-[var(--fg)] mt-1">{HOS.total_logs_30d}</div>
                <div className="text-[10px] text-[var(--fg-muted)] mt-1">last 30 days</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4 bg-[rgba(4,120,87,.06)]">
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Violations</div>
                <div className="text-[28px] font-black leading-none text-[var(--success)] mt-1">{HOS.violations_30d}</div>
                <div className="text-[10px] text-[var(--fg-muted)] mt-1">11hr or 14hr</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Avg Drive</div>
                <div className="text-[24px] font-black leading-none text-[var(--fg)] mt-1">{HOS.avg_drive}</div>
                <div className="text-[10px] text-[var(--fg-muted)] mt-1">per log</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Total Miles</div>
                <div className="text-[24px] font-black leading-none text-[var(--fg)] mt-1">{HOS.total_miles_30d.toLocaleString()}</div>
                <div className="text-[10px] text-[var(--fg-muted)] mt-1">distance driven</div>
              </div>
            </div>
          </div>
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Document expiration</div>
              <div className="text-[10px] text-[var(--fg-muted)]">Next 90 days</div>
            </div>
            <div className="space-y-2.5">
              {DOCEX.map((row) => {
                const total = row["0_30"] + row["31_60"] + row["61_90"];
                const max = Math.max(...DOCEX.map(r => r["0_30"] + r["31_60"] + r["61_90"]));
                const scale = (total / max) * 100;
                return (
                  <div key={row.kind}>
                    <div className="text-[11px] text-[var(--fg-muted)] mb-1">{row.kind}</div>
                    <div className="flex h-5 rounded overflow-hidden bg-[var(--surface-2)]" style={{ width: `${scale}%`, minWidth: 30 }}>
                      <div style={{ flex: row["0_30"],  background: "var(--danger)"  }} />
                      <div style={{ flex: row["31_60"], background: "var(--warning)" }} />
                      <div style={{ flex: row["61_90"], background: "var(--success)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 text-[10px] text-[var(--fg-muted)] mt-3">
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded" style={{ background: "var(--danger)"  }} />0-30 days</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded" style={{ background: "var(--warning)" }} />31-60 days</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded" style={{ background: "var(--success)" }} />61-90 days</span>
            </div>
          </div>
        </div>

        {/* Training by topic */}
        <div className="x3-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)]">Training by topic</div>
            <div className="text-[10px] text-[var(--fg-muted)]">Stacked · completed / in progress / expired</div>
          </div>
          <div className="space-y-2">
            {TRAINING.map((t) => {
              const total = t.completed + t.in_progress + t.expired;
              const max = Math.max(...TRAINING.map(x => x.completed + x.in_progress + x.expired));
              const scale = (total / max) * 100;
              return (
                <div key={t.topic} className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-[11px]">
                  <div className="text-[var(--fg)] font-semibold truncate">{t.topic}</div>
                  <div className="flex h-4 rounded overflow-hidden bg-[var(--surface-2)]" style={{ width: `${scale}%`, minWidth: 20 }}>
                    <div style={{ flex: t.completed,   background: "var(--success)" }} />
                    <div style={{ flex: t.in_progress, background: "var(--accent)"  }} />
                    <div style={{ flex: t.expired,     background: "var(--danger)"  }} />
                  </div>
                  <div className="text-[10px] text-[var(--fg-muted)] tabular-nums text-right">{t.completed + t.in_progress + t.expired}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 text-[10px] text-[var(--fg-muted)] mt-3">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded" style={{ background: "var(--success)" }} />Completed</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded" style={{ background: "var(--accent)"  }} />In progress</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded" style={{ background: "var(--danger)"  }} />Expired</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
