"use client";

/* ============================================================
   X3 COMPASS · COMPLIANCE COMMAND CENTER
   ------------------------------------------------------------
   Mirrors app.x3compass.com/dashboard.html structure exactly:
     main
       section.kpi-row    · 4-tile hero (donut + sparkline)
       section.middle-row · Compliance Overview | Action Items | CSA Scores
       section.bottom-row · Health Trend | Severity Donut | Expiring Items
   ============================================================ */

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import { DEMO_CARRIER, DEMO_FLEET, COMPLIANCE_BARS, ACTION_ITEMS } from "@/lib/demoData";

/* ----------- helpers ----------- */

function Donut({
  pct, size = 110, stroke = 12, color = "var(--accent)",
  label, labelTone = "success",
}: {
  pct: number; size?: number; stroke?: number; color?: string;
  label?: string; labelTone?: "success" | "warning" | "danger";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${filled} ${c - filled}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", lineHeight: 1.1 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{pct}%</div>
          {label && (
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2,
              color: labelTone === "warning" ? "var(--warning)" : labelTone === "danger" ? "var(--danger)" : "var(--success)" }}>
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tiny SVG sparkline · fake-positive cyan line for the dashboard hero KPIs. */
function Sparkline({ trend = "up", width = 180, height = 60 }: { trend?: "up" | "flat" | "down"; width?: number; height?: number }) {
  const points = trend === "up"   ? [10, 12, 9, 15, 13, 22, 18, 25, 24, 32]
                : trend === "down" ? [32, 28, 30, 22, 25, 18, 19, 12, 14, 8]
                :                    [18, 22, 19, 21, 20, 22, 18, 21, 19, 20];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - ((p - min) / range) * (height - 8) - 4}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ flex: 1, minWidth: 0 }}>
      <defs>
        <linearGradient id="x3-spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="url(#x3-spark-fill)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Filled severity donut · used in Open Alerts KPI + bottom-row Severity card. */
function SeverityDonut({ urgent, warning, info, size = 110, stroke = 18 }: { urgent: number; warning: number; info: number; size?: number; stroke?: number }) {
  const total = urgent + warning + info || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const parts = [
    { v: urgent, color: "var(--danger)" },
    { v: warning, color: "var(--warning)" },
    { v: info, color: "var(--accent)" },
  ];
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      {parts.map((p, i) => {
        const len = (p.v / total) * c;
        const seg = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />
        );
        offset += len;
        return seg;
      })}
    </svg>
  );
}

/** Bar chart · Expiring Items Next 30 Days. */
function BarChart({ data, height = 200 }: { data: Array<{ label: string; value: number; color?: string }>; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height, paddingTop: 12 }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{d.value}</div>
          <div style={{ width: "100%", height: `${(d.value / max) * (height - 60)}px`, background: d.color || "var(--accent)", borderRadius: 6, minHeight: 4 }} />
          <div style={{ fontSize: 10, color: "var(--fg-muted)", textAlign: "center", lineHeight: 1.2, whiteSpace: "pre-line" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Trend line chart · Compliance Health Trend (90 days). */
function TrendChart({ values, height = 200 }: { values: number[]; height?: number }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 100;
  const step = width / (values.length - 1);
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${100 - ((v - min) / range) * 80 - 10}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} 100`} preserveAspectRatio="none" style={{ width: "100%", height }} aria-hidden="true">
      <defs>
        <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width} 100 L 0 100 Z`} fill="url(#trend-fill)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------- page ----------- */

type ApiData = {
  carrier?: typeof DEMO_CARRIER;
  fleet?: typeof DEMO_FLEET;
  compliance_bars?: typeof COMPLIANCE_BARS;
  /** Reserved: real CSA BASIC data when the FMCSA SAFER feed wires in.
   *  Currently the dashboard renders a hardcoded canonical B/A/S/I/C
   *  5-row table to match the live reference at app.x3compass.com. */
  csa_basics?: Array<{ letter: string; name: string; score: number; rating: "Good" | "Fair" | "Alert" }>;
  action_items?: typeof ACTION_ITEMS;
  action_items_row2?: typeof ACTION_ITEMS;
};

export default function CompassDashboard() {
  const { user } = useUser();
  const [api, setApi] = useState<ApiData | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/dashboard").then(r => r.ok ? r.json() : null).then(setApi).catch(() => {});
  }, [user]);

  const CARRIER = api?.carrier ? { ...DEMO_CARRIER, ...api.carrier } : DEMO_CARRIER;
  const FLEET   = api?.fleet ? { ...DEMO_FLEET, ...api.fleet } : DEMO_FLEET;
  const BARS    = (api?.compliance_bars?.length ? api.compliance_bars : COMPLIANCE_BARS).slice(0, 6);
  // CSA BASICS now hardcoded inline (5 rows, canonical B/A/S/I/C
  // acronym) to match the live reference exactly. When real CSA
  // data ships, reattach via api?.csa_basics here.

  // Static action items inline to match Manus design (vertical list, badges, due dates).
  // When the API ships richer data we'll source from `api.action_items_inline`.
  const ACTIONS = [
    { id: 1, severity: "urgent",  badge: "URGENT",  text: `${Math.max(15, FLEET.cdls_expired ?? 0)} Drivers with Expired/Expiring Medical Certificates`, due: "Due Now" },
    { id: 2, severity: "urgent",  badge: "URGENT",  text: `${FLEET.open_alerts_urgent ?? 8} Drivers with Expired Drug Test Results`, due: "Due Now" },
    { id: 3, severity: "warning", badge: "WARNING", text: `${FLEET.mecs_expiring_30d ?? 12} Drivers with Expiring HOS/ELD Exemptions`, due: "Due in 7 days" },
    { id: 4, severity: "warning", badge: "WARNING", text: `7 Vehicle Inspections Overdue`, due: "Due in 7 days" },
    { id: 5, severity: "good",    badge: "GOOD",    text: `All Training Records Current`, due: "" },
    { id: 6, severity: "good",    badge: "GOOD",    text: `IFTA Filing Up to Date`, due: "" },
  ];

  return (
    <AppShell>
      <main className="x3-dashboard-main" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ============================================================
            KPI ROW · 4 hero cards (Manus design)
            ============================================================ */}
        <section className="x3-kpi-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {/* KPI 1: Compliance Health · cyan donut + sparkline */}
          <Card>
            <CardHeader title="Compliance Health" />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Donut pct={FLEET.compliance_pct} label="Good" labelTone="success" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: "var(--success)" }}>Up 8%</span>
                  <span style={{ color: "var(--success)" }}>↑</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>vs last 30 days</div>
                <Sparkline trend="up" />
              </div>
            </div>
          </Card>

          {/* KPI 2: Active Drivers · huge number, truck icon */}
          <Card>
            <CardHeader title="Active Drivers" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", gap: 12 }}>
              <div>
                <div style={{ fontSize: 56, fontWeight: 800, color: "var(--fg)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{FLEET.active_drivers}</div>
                <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span aria-hidden="true">👥</span>
                  <span style={{ color: "var(--success)" }}>+3 vs last 30 days</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-faint)", marginTop: 4 }}>{Math.max(0, (FLEET.drivers_on_roster ?? 0) - (FLEET.active_drivers ?? 0))} Inactive</div>
              </div>
              <div aria-hidden="true" style={{ fontSize: 38, opacity: 0.6 }}>🚛</div>
            </div>
          </Card>

          {/* KPI 3: Open Alerts · number + severity breakdown + severity donut */}
          <Card>
            <CardHeader title="Open Alerts" />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: "var(--fg)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{FLEET.open_alerts}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10, fontSize: 12, fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--danger)", minWidth: 18, textAlign: "right" }}>{FLEET.open_alerts_urgent}</span>
                    <span style={{ color: "var(--danger)" }}>⚠ Urgent</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--warning)", minWidth: 18, textAlign: "right" }}>{Math.max(0, (FLEET.open_alerts ?? 0) - (FLEET.open_alerts_urgent ?? 0))}</span>
                    <span style={{ color: "var(--warning)" }}>● Warning</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--fg-muted)", minWidth: 18, textAlign: "right" }}>0</span>
                    <span style={{ color: "var(--fg-muted)" }}>● Info</span>
                  </div>
                </div>
              </div>
              <SeverityDonut urgent={FLEET.open_alerts_urgent ?? 0} warning={Math.max(0, (FLEET.open_alerts ?? 0) - (FLEET.open_alerts_urgent ?? 0))} info={0} />
            </div>
          </Card>

          {/* KPI 4: DQ Score · donut + sparkline */}
          <Card>
            <CardHeader title="DQ Score" />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Donut pct={FLEET.dq_score_pct} label={FLEET.dq_score_pct >= 85 ? "Good" : FLEET.dq_score_pct >= 70 ? "Fair" : "Poor"} labelTone={FLEET.dq_score_pct >= 85 ? "success" : "warning"} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: "var(--success)" }}>Up 5%</span>
                  <span style={{ color: "var(--success)" }}>↑</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>vs last 30 days</div>
                <Sparkline trend="up" />
              </div>
            </div>
          </Card>
        </section>

        {/* ============================================================
            MIDDLE ROW · Compliance Overview | Action Items | CSA Scores
            ============================================================ */}
        <section className="x3-middle-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

          {/* Compliance Overview */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", margin: 0 }}>Compliance Overview <span style={{ color: "var(--fg-faint)" }}>ⓘ</span></h3>
              <Link href="/app/audit-export" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>Full Report</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {BARS.map((b) => {
                const icon = ({ "Driver Qualification (CDL)": "📋", "Medical Certificates": "💚", "HOS / ELD": "⏱", "Drug & Alcohol": "🧪", "Training Records": "🎓", "Vehicle Maintenance": "🔧" } as Record<string, string>)[b.label] || "•";
                const color = b.color === "green" ? "var(--accent)" : b.color === "yellow" ? "var(--warning)" : "var(--danger)";
                return (
                  <div key={b.label} style={{ display: "grid", gridTemplateColumns: "24px 1fr 50px 14px", alignItems: "center", gap: 10, padding: "4px 0" }}>
                    <span aria-hidden="true" style={{ fontSize: 16, opacity: 0.85 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>{b.label}</div>
                      <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${b.pct}%`, height: "100%", background: color, borderRadius: 999 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{b.pct}%</div>
                    <span aria-hidden="true" style={{ color: "var(--fg-faint)", fontSize: 14 }}>›</span>
                  </div>
                );
              })}
            </div>
            <Link href="/app/audit-export" style={{ display: "block", textAlign: "center", marginTop: 16, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "var(--fg-muted)" }}>View All Compliance</Link>
          </Card>

          {/* Action Items */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", margin: 0 }}>Action Items</h3>
              <Link href="/app/notifications" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>View All</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ACTIONS.map((a, i) => {
                const tone = a.severity === "urgent" ? "var(--danger)" : a.severity === "warning" ? "var(--warning)" : "var(--success)";
                const pillBg = a.severity === "urgent" ? "rgba(239,68,68,0.18)" : a.severity === "warning" ? "rgba(251,191,36,0.18)" : "rgba(34,197,94,0.18)";
                const icon = a.severity === "good" ? "✓" : "⚠";
                const isLast = i === ACTIONS.length - 1;
                return (
                  <div key={a.id} style={{ display: "grid", gridTemplateColumns: "22px 1fr auto", alignItems: "flex-start", gap: 10, padding: "11px 0", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                    <span aria-hidden="true" style={{ color: tone, fontSize: 16, fontWeight: 800, paddingTop: 1 }}>{icon}</span>
                    <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: a.text.replace(/^(\d+)/, "<strong>$1</strong>") }} />
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 4, color: tone, background: pillBg }}>{a.badge}</span>
                      {a.due && <span style={{ fontSize: 10, color: "var(--fg-faint)", marginTop: 3 }}>{a.due}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/app/notifications" style={{ display: "block", textAlign: "center", marginTop: 16, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "var(--fg-muted)" }}>View All Action Items</Link>
          </Card>

          {/* CSA Scores (BASIC) — match reference exactly: 5 rows with
              hardcoded BASIC acronym letters B/A/S/I/C, NOT first-letter
              of the row name. The acronym is canonical FMCSA terminology
              (BASIC = Behavior Analysis and Safety Improvement Category).
              Reference: app.x3compass.com/dashboard.html line 167 ff. */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", margin: 0 }}>CSA Scores (BASIC) <span style={{ color: "var(--fg-faint)" }}>ⓘ</span></h3>
              <Link href="/app/scorecards" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>View Details</Link>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--fg-faint)", marginBottom: 12 }}>As of May 12, 2024</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(() => {
                // Canonical 5-row CSA BASIC table per reference. Letters
                // form the acronym B-A-S-I-C, not name-initials. Order
                // matches FMCSA dashboard convention.
                const CSA_ROWS = [
                  { letter: "B", name: "Unsafe Driving",        score: 42, rating: "Good" as const },
                  { letter: "A", name: "Crash Indicator",       score: 35, rating: "Good" as const },
                  { letter: "S", name: "HOS Compliance",        score: 58, rating: "Fair" as const },
                  { letter: "I", name: "Vehicle Maintenance",   score: 65, rating: "Fair" as const },
                  { letter: "C", name: "Controlled Substances", score: 38, rating: "Good" as const },
                ];
                return CSA_ROWS.map((c, i) => {
                  const tone = c.rating === "Good" ? "var(--success)" : c.rating === "Fair" ? "var(--warning)" : "var(--danger)";
                  const isLast = i === CSA_ROWS.length - 1;
                  return (
                    <div key={c.letter} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto auto", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                      <div aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 6, background: "transparent", border: "2px solid var(--accent)", color: "var(--accent)", fontWeight: 800, fontSize: 14, display: "grid", placeItems: "center" }}>{c.letter}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-faint)" }}>Percentile</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{c.score}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: tone, minWidth: 50, textAlign: "right" }}>{c.rating}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>
        </section>

        {/* ============================================================
            BOTTOM ROW · Trend chart | Severity donut | Expiring items bar
            ============================================================ */}
        <section className="x3-bottom-row" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.4fr", gap: 16 }}>

          {/* Compliance Health Trend — reference has a 90-Day / 30-Day /
              7-Day select. Pure-presentation in mockup, but matching the
              UI affordance even when wired to a single window is faithful. */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", margin: 0 }}>Compliance Health Trend <span style={{ color: "var(--fg-faint)" }}>ⓘ</span></h3>
              <select
                aria-label="Trend window"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--fg-muted)",
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontFamily: "inherit",
                }}
                defaultValue="90 Days"
              >
                <option>90 Days</option>
                <option>30 Days</option>
                <option>7 Days</option>
              </select>
            </div>
            <TrendChart values={[77, 78, 80, 79, 81, 82, 81, 83, 82, 84, 85, 86, 85, 87, FLEET.compliance_pct]} />
          </Card>

          {/* Open Alerts by Severity */}
          <Card>
            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", marginBottom: 10, marginTop: 0 }}>Open Alerts by Severity</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 0" }}>
              <SeverityDonut urgent={FLEET.open_alerts_urgent ?? 0} warning={Math.max(0, (FLEET.open_alerts ?? 0) - (FLEET.open_alerts_urgent ?? 0))} info={0} size={160} stroke={22} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0 }}>
                <SeverityLegend color="var(--danger)"  label="Urgent"  value={FLEET.open_alerts_urgent ?? 0} />
                <SeverityLegend color="var(--warning)" label="Warning" value={Math.max(0, (FLEET.open_alerts ?? 0) - (FLEET.open_alerts_urgent ?? 0))} />
                <SeverityLegend color="var(--accent)"  label="Info"    value={0} />
              </div>
            </div>
          </Card>

          {/* Expiring Items (Next 30 Days) — match reference labels +
              counts. Reference: Medical Certificates 24, Drug Tests 18,
              HOS/ELD 14, Driver Licenses 8, Vehicle Inspections 5,
              Training Records 3. All cyan bars in reference (single
              color), with the dropdown control. */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", margin: 0 }}>Expiring Items <span style={{ color: "var(--fg-muted)", fontSize: 10 }}>(Next 30 Days)</span> <span style={{ color: "var(--fg-faint)" }}>ⓘ</span></h3>
              <select
                aria-label="Expiring window"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--fg-muted)",
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontFamily: "inherit",
                }}
                defaultValue="Next 30 Days"
              >
                <option>Next 30 Days</option>
                <option>Next 60 Days</option>
                <option>Next 90 Days</option>
              </select>
            </div>
            <BarChart
              data={[
                { label: "Medical\nCertificates",  value: 24, color: "var(--accent)" },
                { label: "Drug Test\nResults",     value: 18, color: "var(--accent)" },
                { label: "HOS/ELD\nExemptions",    value: 14, color: "var(--accent)" },
                { label: "Driver\nLicenses",       value: 8,  color: "var(--accent)" },
                { label: "Vehicle\nInspections",   value: 5,  color: "var(--accent)" },
                { label: "Training\nRecords",      value: 3,  color: "var(--accent)" },
              ]}
            />
          </Card>
        </section>

      </main>
    </AppShell>
  );
}

/* ============================================================
   Card primitives · used throughout the dashboard. Match the
   Manus surface look: dark panel, 1px border, soft drop shadow.
   ============================================================ */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <article style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 20,
      boxShadow: "var(--card-shadow)",
      minHeight: 0,
      transition: "border-color 0.15s",
    }}>
      {children}
    </article>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--fg-faint)", margin: 0 }}>
        {title} <span style={{ color: "var(--fg-faint)", opacity: 0.6 }}>ⓘ</span>
      </h3>
    </div>
  );
}

function SeverityLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: color, flexShrink: 0 }} />
      <span style={{ color: "var(--fg)", fontWeight: 600, flex: 1 }}>{label}</span>
      <span style={{ color: "var(--fg)", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
