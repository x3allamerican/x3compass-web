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

/* ----------- page ----------- */

type FleetData = {
  active_drivers: number;
  drivers_on_roster: number;
  open_alerts: number;
  open_alerts_urgent: number;
  cdls_expired: number;
  mecs_expiring_30d: number;
  dq_score_pct: number;
  compliance_pct: number | null;
};
type ComplianceBar = { label: string; pct: number | null; color: string };
type CsaBasic = { name: string; msr: number; threshold: number; status: "ok" | "warn" | "alert" };
type ActionCard = {
  title: string;
  items: Array<{ who: string; meta: string; status: string; statusKind: "overdue" | "warn" }>;
};
type ExpirationBucket = { name: string; "0_30": number; "31_60": number; "61_90": number };
type ApiData = {
  fleet: FleetData;
  compliance_bars: ComplianceBar[];
  csa_basics: CsaBasic[] | null;
  action_items: Record<string, ActionCard>;
  doc_expirations: ExpirationBucket[];
};

export default function CompassDashboard() {
  const { user } = useUser();
  const [api, setApi] = useState<ApiData | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/dashboard")
      .then(async (response) => {
        if (!response.ok) throw new Error("dashboard_unavailable");
        const payload = await response.json() as { data?: ApiData };
        if (!payload.data) throw new Error("dashboard_payload_invalid");
        if (!cancelled) {
          setApi(payload.data);
          setLoadState("ready");
        }
      })
      .catch(() => { if (!cancelled) setLoadState("error"); });
    return () => { cancelled = true; };
  }, [user]);

  if (loadState !== "ready" || !api) {
    return (
      <AppShell>
        <main style={{ padding: 24 }}>
          <Card>
            <h2 style={{ margin: 0, color: "var(--fg)", fontSize: 18 }}>{loadState === "error" ? "Verified dashboard data is unavailable" : "Loading verified tenant data…"}</h2>
            <p style={{ color: "var(--fg-muted)", marginBottom: 0 }}>{loadState === "error" ? "No demo or estimated compliance values are shown. Retry after the data service is available." : "Compliance indicators will appear after authenticated records are loaded."}</p>
          </Card>
        </main>
      </AppShell>
    );
  }

  const FLEET = api.fleet;
  const BARS = api.compliance_bars.slice(0, 6);
  const ACTIONS = Object.values(api.action_items).flatMap((card) =>
    card.items.map((item, index) => ({
      id: `${card.title}-${index}`,
      severity: item.statusKind === "overdue" ? "urgent" as const : "warning" as const,
      badge: item.status,
      text: `${item.who}${item.meta ? ` · ${item.meta}` : ""}`,
    })),
  ).slice(0, 6);
  const EXPIRING = api.doc_expirations.map((bucket) => ({
    label: bucket.name,
    value: bucket["0_30"],
    color: "var(--accent)",
  }));
  const compliancePct = FLEET.compliance_pct;

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
              {compliancePct == null ? (
                <div style={{ color: "var(--fg-muted)", fontSize: 14 }}>Not enough verified records to calculate.</div>
              ) : (
                <Donut
                  pct={compliancePct}
                  label={compliancePct >= 90 ? "Strong" : compliancePct >= 75 ? "Review" : "Action"}
                  labelTone={compliancePct >= 90 ? "success" : compliancePct >= 75 ? "warning" : "danger"}
                />
              )}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Calculated from the currently available tenant records. This is decision support, not a compliance determination.</div>
              </div>
            </div>
          </Card>

          {/* KPI 2: Active Drivers · huge number, truck icon */}
          <Card>
            <CardHeader title="Active Drivers" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", gap: 12 }}>
              <div>
                <div style={{ fontSize: 56, fontWeight: 800, color: "var(--fg)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{FLEET.active_drivers}</div>
                <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 6 }}>Verified active roster</div>
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
                <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Based on current DQ artifacts found versus the expected record set.</div>
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
              <Link href="/audit-export" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>Full Report</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {BARS.map((b) => {
                const icon = ({ "Driver Qualification (CDL)": "📋", "Medical Certificates": "💚", "HOS / ELD": "⏱", "Drug & Alcohol": "🧪", "Training Records": "🎓", "Vehicle Maintenance": "🔧" } as Record<string, string>)[b.label] || "•";
                const color = b.color === "green" ? "var(--accent)" : b.color === "yellow" ? "var(--warning)" : b.color === "unknown" ? "var(--fg-faint)" : "var(--danger)";
                return (
                  <div key={b.label} style={{ display: "grid", gridTemplateColumns: "24px 1fr 50px 14px", alignItems: "center", gap: 10, padding: "4px 0" }}>
                    <span aria-hidden="true" style={{ fontSize: 16, opacity: 0.85 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>{b.label}</div>
                      <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${b.pct ?? 0}%`, height: "100%", background: color, borderRadius: 999 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{b.pct == null ? "N/A" : `${b.pct}%`}</div>
                    <span aria-hidden="true" style={{ color: "var(--fg-faint)", fontSize: 14 }}>›</span>
                  </div>
                );
              })}
            </div>
            <Link href="/audit-export" style={{ display: "block", textAlign: "center", marginTop: 16, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "var(--fg-muted)" }}>View All Compliance</Link>
          </Card>

          {/* Action Items */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", margin: 0 }}>Action Items</h3>
              <Link href="/notifications" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>View All</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ACTIONS.length === 0 && (
                <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>No action items were derived from the currently available records.</p>
              )}
              {ACTIONS.map((a, i) => {
                const tone = a.severity === "urgent" ? "var(--danger)" : "var(--warning)";
                const pillBg = a.severity === "urgent" ? "rgba(239,68,68,0.18)" : "rgba(251,191,36,0.18)";
                const isLast = i === ACTIONS.length - 1;
                return (
                  <div key={a.id} style={{ display: "grid", gridTemplateColumns: "22px 1fr auto", alignItems: "flex-start", gap: 10, padding: "11px 0", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                    <span aria-hidden="true" style={{ color: tone, fontSize: 16, fontWeight: 800, paddingTop: 1 }}>⚠</span>
                    <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.4 }}>{a.text}</div>
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 4, color: tone, background: pillBg }}>{a.badge}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/notifications" style={{ display: "block", textAlign: "center", marginTop: 16, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "var(--fg-muted)" }}>View All Action Items</Link>
          </Card>

          {/* CSA Scores (BASIC) — verified latest synchronized snapshot only. */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", margin: 0 }}>CSA Scores (BASIC) <span style={{ color: "var(--fg-faint)" }}>ⓘ</span></h3>
              <Link href="/scorecards" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>View Details</Link>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--fg-faint)", marginBottom: 12 }}>Latest synchronized snapshot</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {!api.csa_basics?.length && <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>No synchronized CSA snapshot is available.</p>}
              {api.csa_basics?.map((basic, i) => {
                const tone = basic.status === "ok" ? "var(--success)" : basic.status === "warn" ? "var(--warning)" : "var(--danger)";
                const label = basic.status === "ok" ? "Below threshold" : basic.status === "warn" ? "Watch" : "At/above threshold";
                return (
                  <div key={basic.name} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto auto", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i === api.csa_basics!.length - 1 ? "none" : "1px solid var(--border)" }}>
                    <div aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 6, border: "2px solid var(--accent)", color: "var(--accent)", fontWeight: 800, fontSize: 13, display: "grid", placeItems: "center" }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{basic.name}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-faint)" }}>Intervention threshold {basic.threshold}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{basic.msr}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: tone, minWidth: 85, textAlign: "right" }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* ============================================================
            BOTTOM ROW · Trend chart | Severity donut | Expiring items bar
            ============================================================ */}
        <section className="x3-bottom-row" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.4fr", gap: 16 }}>

          {/* Trend history is not fabricated when historical snapshots are unavailable. */}
          <Card>
            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", marginTop: 0 }}>Compliance Health Trend</h3>
            <div style={{ minHeight: 180, display: "grid", placeItems: "center", color: "var(--fg-muted)", textAlign: "center", fontSize: 13 }}>
              Historical tenant snapshots are not yet available. No estimated trend is displayed.
            </div>
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

          {/* Expiring Items derived from current tenant records. */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg)", margin: 0 }}>Expiring Items <span style={{ color: "var(--fg-muted)", fontSize: 10 }}>(Next 30 Days)</span> <span style={{ color: "var(--fg-faint)" }}>ⓘ</span></h3>
            </div>
            {EXPIRING.length ? <BarChart data={EXPIRING} /> : <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>No expiration data is available.</p>}
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
