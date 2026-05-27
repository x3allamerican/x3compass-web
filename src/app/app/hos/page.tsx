"use client";

/* ============================================================
   /app/hos · Hours of Service · ELD command center
   ------------------------------------------------------------
   Same structural backbone we use on Clearinghouse + DQ Files:

   1. AppShell header with primary actions
   2. EducationHubCard · 3 audience columns (Drivers /
      Carrier Safety / Auditor) tuned to 49 CFR Part 395
   3. 4-KPI strip  · violations 7d · compliant drivers ·
                     ELD coverage % · drivers at-risk on 70/8
   4. Active 24-hr watchlist · drivers currently in violation
      or trending toward one this shift
   5. ELD connect card + CSV upload (manual log file ingest
      path for the 12% of fleets running short-haul exempt or
      using the FMCSA ELD output file directly)
   6. Audit ledger · full HOS logs table (last 200)

   Demo-mode safe · withDemoFallback() fills the page with
   realistic violations + driver mix so it never looks empty.

   Regs covered:
     §395.3(a)(1)  · 11-hr drive limit
     §395.3(a)(2)  · 14-hr duty window
     §395.3(a)(3)  · 30-min break after 8 cumulative drive hrs
     §395.3(c)     · 70-hr/8-day · 60-hr/7-day cycle
     §395.8(k)     · 6-month original RODS retention
     §395.24       · ELD requirement
     §395.30       · ELD output file (FMCSA Web Service / USB)
   ============================================================ */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import EducationHubCard from "@/components/EducationHubCard";
import { TenantTable, fmtDate } from "@/components/app/TenantTable";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel } from "@/components/app/useDrivers";
import { DEMO_HOS_LOGS, withDemoFallback, type DemoHosLog } from "@/lib/demoFallback";

type Violation = { cfr: string; label: string; severity: "warning" | "violation" };
type H = {
  id: string;
  driver_id: string;
  log_date: string;
  total_drive_minutes: number;
  total_on_duty_minutes: number;
  hours_70_8?: number;
  violations: Violation[] | unknown;
  eld_source: string | null;
  certified: boolean;
  raw_log_url?: string | null;
};

function minToHhMm(m: number | null | undefined): string {
  const v = Number(m || 0);
  return `${Math.floor(v / 60)}h ${v % 60}m`;
}

function isToday(iso: string): boolean {
  const t = new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10) === t;
}

function vCount(v: unknown): number {
  return Array.isArray(v) ? (v as unknown[]).length : 0;
}

const ELD_VENDORS = [
  { id: "motive",     label: "Motive"      },
  { id: "samsara",    label: "Samsara"     },
  { id: "geotab",     label: "Geotab"      },
  { id: "keeptruckin",label: "KeepTruckin" },
  { id: "eroad",      label: "EROAD"       },
  { id: "garmin",     label: "Garmin eLog" },
];

export default function HosPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [realRows, setRealRows] = useState<H[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!carrier) return;
    getSupabase()
      .from("compass_hos_logs")
      .select("*")
      .eq("carrier_id", carrier.id)
      .order("log_date", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setRealRows((data as H[]) || []);
        setLoading(false);
      });
  }, [carrier]);

  // Demo-mode fallback: when no real rows ingested, populate from canned set.
  const rows: (H | DemoHosLog)[] = useMemo(
    () => withDemoFallback<H | DemoHosLog>(realRows, DEMO_HOS_LOGS),
    [realRows]
  );

  // Derive KPIs from whichever rows are in play.
  const kpis = useMemo(() => {
    const last7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const recent = rows.filter((r) => r.log_date >= last7);
    const violations7d = recent.reduce((acc, r) => acc + vCount(r.violations), 0);
    const todayRows = rows.filter((r) => isToday(r.log_date));
    const todayClean = todayRows.filter((r) => vCount(r.violations) === 0).length;
    const todayTotal = todayRows.length || 1;
    const eldCovered = rows.filter((r) => r.eld_source).length;
    const eldCoveragePct = rows.length ? Math.round((eldCovered / rows.length) * 100) : 0;
    const atRisk70 = rows.filter((r) => {
      const h = (r as DemoHosLog).hours_70_8;
      return isToday(r.log_date) && typeof h === "number" && h >= 65;
    }).length;
    return {
      violations7d,
      todayCleanPct: Math.round((todayClean / todayTotal) * 100),
      eldCoveragePct,
      atRisk70,
    };
  }, [rows]);

  // Active watchlist: today's logs with any violation OR a warning.
  const watchlist = useMemo(
    () =>
      rows.filter(
        (r) => isToday(r.log_date) && Array.isArray(r.violations) && (r.violations as Violation[]).length > 0
      ) as DemoHosLog[],
    [rows]
  );

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploadBusy(true);
    setUploadMsg(null);
    try {
      // Demo short-circuit when no carrier (not yet signed in).
      if (!carrier) {
        await new Promise((r) => setTimeout(r, 700));
        setUploadMsg({ kind: "ok", text: `Demo mode · would have ingested ${file.name} (${(file.size / 1024).toFixed(1)} KB) and parsed daily logs into compass_hos_logs.` });
        setUploadBusy(false);
        return;
      }
      const form = new FormData();
      form.append("file", file);
      form.append("carrier_id", carrier.id);
      const token = (await getSupabase().auth.getSession()).data.session?.access_token;
      const res = await fetch("/api/hos/upload-log", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json().catch(() => ({ ok: false, error: "Bad response" }));
      if (!data.ok) {
        setUploadMsg({ kind: "err", text: data.error || "Upload failed" });
      } else {
        setUploadMsg({ kind: "ok", text: `Ingested ${data.rows_inserted || 0} daily logs from ${file.name}.` });
        // Refresh
        getSupabase()
          .from("compass_hos_logs")
          .select("*")
          .eq("carrier_id", carrier.id)
          .order("log_date", { ascending: false })
          .limit(200)
          .then(({ data }) => setRealRows((data as H[]) || []));
      }
    } catch (e) {
      setUploadMsg({ kind: "err", text: e instanceof Error ? e.message : "Upload error" });
    }
    setUploadBusy(false);
  }

  return (
    <AppShell
      crumbs="HOS / ELD · 49 CFR PART 395"
      title="Hours of Service"
      actions={
        <>
          <button
            onClick={() => setUploadOpen(true)}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]"
          >
            ⬆ Upload ELD output
          </button>
          <Link
            href="/app/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-extrabold text-[var(--bg)]"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)" }}
          >
            🔌 Connect ELD →
          </Link>
        </>
      }
    >
      <div className="p-6 space-y-6">
        {/* 1 · EDUCATION HUB */}
        <EducationHubCard
          surface="HOS / ELD"
          subtitle="49 CFR Part 395 · Records of Duty Status · ELD mandate"
          conciergeHref="/app/ask?topic=hos"
          audiences={[
            {
              label: "For Drivers",
              subtitle: "WHAT YOUR ELD ENFORCES",
              icon: "🚛",
              tone: "cyan",
              body: "Your ELD records every duty-status change automatically. You're responsible for certifying logs daily, claiming any unassigned drive time, and knowing when you'll hit a limit before the alert fires.",
              bullets: [
                "11-hr drive · 14-hr duty · 30-min break after 8 cumulative drive hrs",
                "70-hr/8-day or 60-hr/7-day · 34-hr restart resets the clock",
                "Certify every prior day · request edits, never edit certified logs yourself",
                "If your ELD malfunctions, switch to paper RODS and notify your carrier within 24 hrs",
              ],
              cta: "Driver HOS quick-guide →",
              href: "/skills?topic=hours-of-service",
            },
            {
              label: "For Carrier Safety",
              subtitle: "WHAT YOU SUPERVISE",
              icon: "🛡",
              tone: "violet",
              body: "FMCSA expects you to monitor HOS in real time, supervise edits, retain 6 months of original RODS, and have a written ELD malfunction policy. Hours-Compliance is the second-highest BASIC severity weight after Unsafe Driving.",
              bullets: [
                "Review violations daily · document corrective action in driver file",
                "Approve / reject edit requests within 8 days of receipt",
                "Repair or replace malfunctioning ELDs within 8 days · file extension if longer",
                "Maintain back-office records for 6 months (§395.8(k)) · originals + supporting docs",
              ],
              cta: "Supervisor HOS playbook →",
              href: "/skills?topic=hos-supervisor",
            },
            {
              label: "For Auditor",
              subtitle: "WHAT GETS REQUESTED IN A NEW-ENTRANT / COMPLIANCE REVIEW",
              icon: "📋",
              tone: "amber",
              body: "Auditors pull 6 months of RODS, supporting documents (fuel, toll, dispatch), and your ELD malfunction log. They compare them line-by-line. Falsification (§395.8(e)) is an acute violation · automatic OOS rating.",
              bullets: [
                "RODS + ELD output files · 6-month rolling window",
                "Supporting documents matched to log entries (§395.11)",
                "Driver edit-request log · approval/rejection trail",
                "ELD malfunction + replacement records",
              ],
              cta: "Audit-ready HOS export →",
              href: "/app/audit-export?scope=hos",
            },
          ]}
        />

        {/* 2 · KPI STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Violations · 7 days" value={kpis.violations7d.toString()} tone={kpis.violations7d > 0 ? "amber" : "emerald"} sub="Across all drivers · §395.3" />
          <KpiCard label="Compliant today" value={`${kpis.todayCleanPct}%`} tone={kpis.todayCleanPct >= 90 ? "emerald" : kpis.todayCleanPct >= 70 ? "amber" : "rose"} sub="Drivers with zero violations today" />
          <KpiCard label="ELD coverage" value={`${kpis.eldCoveragePct}%`} tone={kpis.eldCoveragePct >= 95 ? "emerald" : "amber"} sub="Logs from a registered ELD vs manual" />
          <KpiCard label="At-risk on 70/8" value={kpis.atRisk70.toString()} tone={kpis.atRisk70 > 0 ? "rose" : "emerald"} sub="Drivers ≥ 65 hrs in last 8 days" />
        </div>

        {/* 3 · ACTIVE 24-HR WATCHLIST */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5" style={{ boxShadow: "var(--card-shadow)" }}>
          <header className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-1">⏱ Active 24-hour watchlist</div>
              <h3 className="text-[15px] font-bold text-[var(--fg)] m-0">Drivers in violation or trending toward one this shift</h3>
            </div>
            <span className="text-[11px] text-[var(--fg-muted)]">{watchlist.length} active</span>
          </header>

          {watchlist.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-[var(--fg-muted)]">
              ✓ No active HOS violations today. Drivers are clean.
            </div>
          ) : (
            <ul className="space-y-2">
              {watchlist.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                  <span aria-hidden className="text-[14px]">{(r.violations as Violation[])[0].severity === "violation" ? "🔴" : "🟡"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold text-[var(--fg)] truncate">{r.driver_name || driverLabel(drivers.find((d) => d.id === r.driver_id))}</div>
                    <div className="text-[11px] text-[var(--fg-muted)] truncate">
                      {(r.violations as Violation[])[0].cfr} · {(r.violations as Violation[])[0].label}
                      {(r.violations as Violation[]).length > 1 && <span className="ml-1 text-[var(--fg-faint)]">· +{(r.violations as Violation[]).length - 1} more</span>}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-[11px] text-[var(--fg-muted)]">
                    <span><strong className="text-[var(--fg)]">{minToHhMm(r.total_drive_minutes)}</strong> drive</span>
                    {typeof (r as DemoHosLog).hours_70_8 === "number" && (
                      <span><strong className="text-[var(--fg)]">{(r as DemoHosLog).hours_70_8.toFixed(1)}h</strong> / 70</span>
                    )}
                  </div>
                  <Link
                    href={`/app/drivers?focus=${r.driver_id}#hos`}
                    className="px-2.5 py-1 rounded text-[10.5px] font-extrabold text-[var(--bg)]"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                  >
                    Review →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4 · CONNECT / UPLOAD CARD */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5" style={{ boxShadow: "var(--card-shadow)" }}>
            <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-2">🔌 Connect an ELD provider</div>
            <p className="text-[var(--fg-muted)] text-[12.5px] leading-relaxed mb-3">
              Compass HOS ingests RODS data from any FMCSA-registered ELD via the standardized output file. Tokens stored encrypted · scoped to read-only on the vendor side.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {ELD_VENDORS.map((v) => (
                <span key={v.id} className="px-2 py-1 rounded text-[10.5px] font-bold text-[var(--fg-muted)] border border-[var(--border)] bg-[var(--surface-2)]">
                  {v.label}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Link
                href="/app/settings#eld"
                className="px-3.5 py-2 rounded-lg text-[12px] font-extrabold text-[var(--bg)]"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                Configure provider →
              </Link>
              <a
                href="https://eld.fmcsa.dot.gov/List"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]"
              >
                FMCSA ELD list ↗
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5" style={{ boxShadow: "var(--card-shadow)" }}>
            <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-2">⬆ Manual log upload</div>
            <p className="text-[var(--fg-muted)] text-[12.5px] leading-relaxed mb-3">
              Short-haul exempt drivers, paper RODS for ELD malfunctions, or the FMCSA-standardized ELD output file. CSV columns: <code className="text-[11px] bg-[var(--surface-3)] px-1.5 rounded">driver_id, log_date, drive_min, on_duty_min, violations</code>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setUploadOpen(true)}
                className="px-3.5 py-2 rounded-lg text-[12px] font-extrabold text-[var(--bg)]"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                Upload log file →
              </button>
              <a
                href="/templates/hos-log-import.csv"
                className="px-3.5 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]"
              >
                Download template
              </a>
            </div>
          </div>
        </section>

        {/* 5 · LOGS TABLE */}
        <section>
          <header className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-extrabold tracking-[.14em] uppercase text-[var(--fg-muted)] m-0">📒 Audit ledger · last 200 daily logs</h3>
            <Link href="/app/audit-export?scope=hos" className="text-[11px] font-bold text-[var(--accent)] hover:underline">Export HOS bundle →</Link>
          </header>
          <TenantTable<H | DemoHosLog>
            rows={rows}
            loading={loading}
            emptyTitle="No HOS logs yet"
            emptyDesc="HOS logs appear automatically when your ELD is connected. Until then, upload a daily log file."
            columns={[
              { key: "log_date", label: "Date", render: (l) => fmtDate(l.log_date) },
              { key: "driver", label: "Driver", render: (l) => (l as DemoHosLog).driver_name || driverLabel(drivers.find((d) => d.id === l.driver_id)) },
              { key: "drive", label: "Drive", render: (l) => minToHhMm(l.total_drive_minutes) },
              { key: "on_duty", label: "On-duty", hideOnMobile: true, render: (l) => minToHhMm(l.total_on_duty_minutes) },
              { key: "h70", label: "70-hr/8", hideOnMobile: true, render: (l) => {
                  const h = (l as DemoHosLog).hours_70_8;
                  if (typeof h !== "number") return <span className="text-[var(--fg-faint)]">—</span>;
                  const tone = h >= 68 ? "text-rose-600 dark:text-rose-400" : h >= 60 ? "text-amber-600 dark:text-amber-400" : "text-[var(--fg)]";
                  return <span className={`${tone} font-semibold`}>{h.toFixed(1)}h</span>;
                } },
              { key: "violations", label: "Violations", render: (l) => {
                  const n = vCount(l.violations);
                  if (n === 0) return <span className="text-emerald-600 dark:text-emerald-400">✓ clean</span>;
                  const v = (l.violations as Violation[])[0];
                  return (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold" title={`${v.cfr} · ${v.label}`}>
                      {n} · {v.cfr}
                    </span>
                  );
                } },
              { key: "certified", label: "Cert", render: (l) => l.certified ? <span className="text-emerald-600 dark:text-emerald-400">✓</span> : <span className="text-[var(--fg-faint)]">—</span> },
              { key: "eld_source", label: "Source", hideOnMobile: true, render: (l) => l.eld_source ? <span className="capitalize">{l.eld_source}</span> : <span className="text-[var(--fg-faint)]">manual</span> },
            ]}
          />
        </section>
      </div>

      {/* CSV UPLOAD MODAL */}
      {uploadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Upload HOS log file"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(2, 6, 12, 0.65)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setUploadOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6" style={{ boxShadow: "0 24px 60px rgba(2, 6, 12, 0.55)" }}>
            <header className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-1">⬆ Upload HOS log file</div>
                <h3 className="text-[16px] font-extrabold text-[var(--fg)] m-0">Daily log ingest</h3>
              </div>
              <button onClick={() => setUploadOpen(false)} aria-label="Close" className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-[18px]">✕</button>
            </header>

            <p className="text-[12.5px] text-[var(--fg-muted)] leading-relaxed mb-3">
              Accepts FMCSA ELD output files (<code className="text-[11px] bg-[var(--surface-3)] px-1.5 rounded">.csv</code> / <code className="text-[11px] bg-[var(--surface-3)] px-1.5 rounded">.json</code>) or our simple CSV template. We parse, validate against §395.3 rules, and insert into your audit ledger.
            </p>

            <label className="block">
              <span className="sr-only">Choose log file</span>
              <input
                type="file"
                accept=".csv,.json,.txt"
                disabled={uploadBusy}
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                className="block w-full text-[12px] text-[var(--fg-muted)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-bold file:text-[var(--bg)] file:cursor-pointer disabled:opacity-50"
                style={{ ["--file-bg" as never]: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              />
            </label>

            <style jsx>{`
              input[type="file"]::file-selector-button {
                background: linear-gradient(135deg, var(--accent), var(--accent-2));
              }
            `}</style>

            {uploadMsg && (
              <div
                role="status"
                className={`mt-4 rounded-lg p-3 text-[12px] ${uploadMsg.kind === "ok" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300"}`}
              >
                {uploadMsg.text}
              </div>
            )}

            <footer className="mt-5 flex items-center justify-between gap-3 text-[11px] text-[var(--fg-faint)]">
              <span>Files are validated · invalid rows skipped with a per-row reason.</span>
              <a href="/templates/hos-log-import.csv" className="text-[var(--accent)] hover:underline">Template</a>
            </footer>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ----------------- KPI card ----------------- */

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "emerald" | "amber" | "rose" | "cyan" }) {
  const stripe: Record<typeof tone, string> = {
    emerald: "linear-gradient(90deg, #34D399, #10B981)",
    amber:   "linear-gradient(90deg, #FBBF24, #F59E0B)",
    rose:    "linear-gradient(90deg, #FB7185, #F43F5E)",
    cyan:    "linear-gradient(90deg, #16C7FF, #0EA5E9)",
  };
  return (
    <div
      className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 overflow-hidden"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <span aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stripe[tone] }} />
      <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">{label}</div>
      <div className="text-[26px] font-extrabold text-[var(--fg)] leading-none">{value}</div>
      <div className="text-[10.5px] text-[var(--fg-faint)] mt-1">{sub}</div>
    </div>
  );
}
