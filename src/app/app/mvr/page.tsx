"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

// ───────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────
type Mvr = {
  id: string;
  driver_id: string;
  pulled_on: string;
  state: string | null;
  result: string | null;
  license_status: string | null;
  points: number | null;
  violations_count: number | null;
  notes: string | null;
  file_url: string | null;
  source: string | null;
};
const LICENSE_STATUS = ["valid", "suspended", "revoked", "expired", "restricted"] as const;
const RESULTS = ["clean", "minor", "major", "serious", "disqualifying", "pending", "failed"];

// ───────────────────────────────────────────────────────────────────
// Continuous monitoring types
// ───────────────────────────────────────────────────────────────────
type ContinuousEnrollment = {
  id: string; driver_id: string | null; driver_name: string;
  status: "pending" | "active" | "canceled" | "failed" | "paused";
  enrolled_at: string | null; canceled_at: string | null; failed_reason: string | null;
  last_hit_at: string | null; last_hit_assessment: string | null; last_hit_report_id: string | null;
  hit_count_total: number; hit_count_30d: number;
  monthly_fee_cents: number; work_state: string | null;
  checkr_continuous_check_id: string | null;
};
type ContinuousListResp = {
  ok: boolean; carrier_id?: string;
  enrollments?: ContinuousEnrollment[];
  kpis?: { total_enrolled: number; active: number; pending: number; hits_30d: number; hits_total: number };
  error?: string;
};

// ───────────────────────────────────────────────────────────────────
// Driver status (computed for tracker dashboard)
// ───────────────────────────────────────────────────────────────────
type DriverStatus = "current" | "due" | "overdue" | "missing";
function statusFor(lastPull: string | null | undefined): { status: DriverStatus; label: string; daysSince: number | null } {
  if (!lastPull) return { status: "missing", label: "Never pulled", daysSince: null };
  const daysSince = Math.floor((Date.now() - new Date(lastPull).getTime()) / 86_400_000);
  if (daysSince > 365) return { status: "overdue", label: `${daysSince - 365} days overdue`, daysSince };
  if (daysSince > 335) return { status: "due", label: `Due in ${365 - daysSince} days`, daysSince };
  return { status: "current", label: `Pulled ${daysSince}d ago`, daysSince };
}
const STATUS_PILL: Record<DriverStatus, string> = {
  current:  "bg-emerald-100 dark:bg-emerald-500/40 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  due:      "bg-amber-100 dark:bg-amber-500/40 text-amber-900 dark:text-amber-50 border-amber-700 dark:border-amber-300/80",
  overdue:  "bg-rose-100 dark:bg-rose-500/40 text-rose-900 dark:text-rose-50 border-rose-700 dark:border-rose-300/80",
  missing:  "bg-slate-200 dark:bg-slate-500/40 text-slate-900 dark:text-slate-50 border-slate-600 dark:border-slate-300/80",
};

const fmtDate = (s: string | null | undefined): string => (s ? new Date(s).toLocaleDateString() : "—");

// ═══════════════════════════════════════════════════════════════════
// Hero with 3-step explainer
// ═══════════════════════════════════════════════════════════════════
function MvrHero() {
  return (
    <div className="x3-card relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)", filter: "blur(40px)" }}
      />
      <div className="relative p-6 md:p-8">
        <div className="text-[10px] tracking-[.18em] uppercase font-extrabold text-[var(--accent)] mb-2">MVR Tracker</div>
        <h2 className="text-[22px] md:text-[26px] font-black leading-tight text-[var(--fg)] mb-2">
          You pull the MVR. <span className="text-[var(--accent)]">Compass reads it</span> and does the rest.
        </h2>
        <p className="text-[13px] md:text-[14px] text-[var(--fg-muted)] max-w-3xl leading-relaxed mb-5">
          Drop the file (PDF, scan, or photo). Compass extracts license status, expiration, points, violations, and accident history — then auto-matches it to the driver and saves it to the audit-ready DQ file.{" "}
          <span className="font-mono text-[var(--accent)]">§ 391.51</span> retention handled automatically.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { n: 1, t: "Pull MVR from your DMV or vendor", s: "State portal, Checkr, SambaSafety, Foley, HireRight — anywhere" },
            { n: 2, t: "Drop it below", s: "Compass reads PDFs, scans, or phone photos" },
            { n: 3, t: "Review & save", s: "~30 sec confirm — driver record auto-updates" },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-3)]">
              <div className="w-7 h-7 rounded-full grid place-items-center font-extrabold text-[12px] text-[var(--bg)] flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{s.n}</div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[var(--fg)]">{s.t}</div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">{s.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Educational FAQ grid — When? What? Where?
// ═══════════════════════════════════════════════════════════════════
function EduFaqGrid() {
  const cards = [
    {
      ico: "📅",
      title: "When do I need to pull an MVR?",
      cfr: "49 CFR § 391.23, § 391.25, § 391.27",
      body: (
        <>
          <p className="mb-2">Federal rules give you four triggers — three required, one strongly recommended:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li><strong>At hire</strong> — within 30 days of putting the driver behind the wheel. Pull from <em>every state</em> the driver was licensed in during the last 3 years.</li>
            <li><strong>Annual</strong> — at least once every 12 months from the driver&apos;s licensing state, every active driver.</li>
            <li><strong>Post-violation / on notice</strong> — within 30 days of being notified of a disqualifying conviction, license suspension, or state administrative action.</li>
            <li><strong>Continuous monitoring</strong> (recommended) — ongoing alerts surface license changes within hours instead of yearly.</li>
          </ul>
          <p className="mt-2">Compass calculates these dates for you and shows the status next to each driver below.</p>
        </>
      ),
    },
    {
      ico: "📄",
      title: "What kind of MVR do I need?",
      cfr: "49 CFR § 391.25",
      body: (
        <>
          <p className="mb-2"><strong>At hire (every state in last 3 years):</strong> a 3-year history report from <em>each</em> state where the driver held a license. MI + OH + IN = three separate MVRs.</p>
          <p className="mb-2"><strong>Annual review:</strong> a 3-year history report from the driver&apos;s <em>current</em> licensing state. Just one.</p>
          <p>The MVR must show: <strong>license status, class, endorsements, restrictions, conviction history, and any administrative actions.</strong> CDL holders need the &ldquo;commercial driving record&rdquo; version that includes CDLIS data.</p>
          <p className="mt-2">Compass reads any of those formats — you don&apos;t need to pre-format anything.</p>
        </>
      ),
    },
    {
      ico: "🌐",
      title: "Where can I get one?",
      cfr: "Vendor-neutral",
      body: (
        <>
          <p><strong>1. Direct from your state DMV (cheapest)</strong> — all 50 states have online portals.</p>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
            {["MI · Secretary of State", "OH · BMV", "IN · BMV", "TX · DPS", "CA · DMV", "All 50 states"].map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/30">{p}</span>
            ))}
          </div>
          <p><strong>2. Through a CRA vendor (faster)</strong></p>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
            {["SambaSafety", "Foley", "HireRight", "Checkr", "Sterling", "Driver iQ"].map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[var(--fg)] bg-[var(--bg-3)] border border-[var(--border)]">{p}</span>
            ))}
          </div>
          <p><strong>3. Continuous monitoring (~$5/driver/mo)</strong></p>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
            {["Checkr (built into Compass)", "SambaSafety", "Foley", "HireRight Driver Monitor"].map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[var(--fg)] bg-[var(--bg-3)] border border-[var(--border)]">{p}</span>
            ))}
          </div>
          <p className="text-[11px] text-[var(--fg-faint)] italic">Compass has no exclusive partnership — pick whichever vendor fits your workflow.</p>
        </>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {cards.map((c) => (
        <details key={c.title} className="x3-card group">
          <summary className="cursor-pointer p-4 list-none flex items-start gap-3 hover:bg-[var(--bg-3)]">
            <span className="text-[20px] flex-shrink-0">{c.ico}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-extrabold text-[var(--fg)] leading-tight">{c.title}</div>
              <div className="text-[10px] font-mono text-[var(--accent)] mt-1">{c.cfr}</div>
            </div>
            <span className="text-[var(--fg-muted)] group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="px-4 pb-4 text-[12.5px] text-[var(--fg-muted)] leading-relaxed border-t border-[var(--border)] pt-3">
            {c.body}
          </div>
        </details>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Upload zone — drag-drop, AI-extract (Phase 1: stores file, queues for AI in Phase 2)
// ═══════════════════════════════════════════════════════════════════
function UploadCard({ onManualEntry, onUploaded }: { onManualEntry: () => void; onUploaded: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) onUploaded(f);
  }

  return (
    <div className="x3-card p-6">
      <h3 className="text-[15px] font-extrabold text-[var(--fg)] mb-1 flex items-center gap-2">
        <span>📤</span> Drop a Motor Vehicle Record
      </h3>
      <p className="text-[12.5px] text-[var(--fg-muted)] mb-4 max-w-3xl">
        PDF, JPG, PNG, or WEBP. Multiple files at once OK. Compass reads each one, auto-matches to a driver in your fleet, and saves the result to the DQ file. You&apos;ll get a 30-second review screen for each.
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : "border-[var(--accent)]/40 bg-[var(--accent)]/5 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
        }`}
      >
        <div className="text-[36px] mb-2">⬆</div>
        <div className="text-[14px] font-bold text-[var(--fg)] mb-1">Drop MVR here, or click to browse</div>
        <div className="text-[11px] text-[var(--fg-muted)]">PDF · JPG · PNG · WEBP · up to 20 MB each</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <div className="text-[11px] text-[var(--fg-muted)] mt-3">
        Prefer to type it in by hand?{" "}
        <button onClick={onManualEntry} className="text-[var(--accent)] underline font-semibold">
          Open the manual log form →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Continuous monitoring opt-in card — Compass differentiator
// (Sits between Upload and KPIs. Vendor-neutral; just an offer.)
// ═══════════════════════════════════════════════════════════════════
function ContinuousMonitoringCallout({ enrollmentCount, carrierId, drivers, onEnrolled }: {
  enrollmentCount: number; carrierId: string; drivers: DriverOpt[]; onEnrolled: () => void;
}) {
  const [showEnroll, setShowEnroll] = useState(false);
  return (
    <div className="x3-card p-5 border-l-4 border-l-[var(--accent)]">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="text-[32px] flex-shrink-0">∞</div>
        <div className="flex-1 min-w-[260px]">
          <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-1">Optional · Compass-native</div>
          <h3 className="text-[15px] font-extrabold text-[var(--fg)] mb-1">
            Stop pulling MVRs annually. <span className="text-[var(--accent)]">Continuously monitor.</span>
          </h3>
          <p className="text-[12.5px] text-[var(--fg-muted)] mb-3 max-w-2xl">
            Checkr Continuous MVR integration: <strong>$5/driver/mo retail</strong> + $9.50 per triggered report (passthrough at cost) + state passthrough fees. The instant any state DMV updates a driver&apos;s record — violation, suspension, license status change — Compass writes the alert to this tracker and notifies you.{" "}
            {enrollmentCount > 0 ? (
              <span className="text-[var(--fg)] font-semibold">Currently active for {enrollmentCount} driver{enrollmentCount === 1 ? "" : "s"}.</span>
            ) : (
              <span>None enrolled yet.</span>
            )}
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowEnroll(true)}
              disabled={!drivers.length}
              className="px-4 py-2 rounded-full text-[12px] font-extrabold text-[var(--bg)] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              {enrollmentCount > 0 ? "Enroll another driver" : "Enroll a driver"}
            </button>
            <a
              href="/app/mvr/continuous"
              className="px-4 py-2 rounded-full text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--bg-3)]"
            >
              View all enrollments →
            </a>
          </div>
        </div>
      </div>
      {showEnroll && (
        <EnrollModal
          carrierId={carrierId}
          drivers={drivers}
          onClose={() => setShowEnroll(false)}
          onEnrolled={() => { setShowEnroll(false); onEnrolled(); }}
        />
      )}
    </div>
  );
}

function EnrollModal({ carrierId, drivers, onClose, onEnrolled }: {
  carrierId: string; drivers: DriverOpt[]; onClose: () => void; onEnrolled: () => void;
}) {
  const [driverId, setDriverId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll(e: FormEvent) {
    e.preventDefault();
    if (!driverId) return;
    setBusy(true); setError(null);
    try {
      const { data: { session } } = await getSupabase().auth.getSession();
      const r = await fetch("/api/screenings/continuous-mvr/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ driver_id: driverId, carrier_id: carrierId }),
      });
      const j = await r.json();
      if (!j.ok) {
        if (j.code === "NEEDS_BASELINE") setError("This driver needs a completed baseline Checkr MVR first. Order one from /app/background-checks, then come back once it returns 'clear'.");
        else if (j.code === "ACCOUNT_NOT_APPROVED") setError("Continuous MVR isn't yet enabled on your Checkr account. The qualification form has been submitted — this will start working automatically once approved.");
        else setError(j.error || "Enrollment failed");
        return;
      }
      onEnrolled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Enroll driver in continuous MVR" onClose={onClose}>
      <form onSubmit={handleEnroll} className="space-y-3">
        <p className="text-[12px] text-[var(--fg-muted)]">
          $5/mo retail. Requires a completed baseline Checkr MVR with result=clear.
        </p>
        <Field label="Driver *">
          <select required value={driverId} onChange={(e) => setDriverId(e.target.value)} className="x3i">
            <option value="">Select a driver…</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function MvrPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [rows, setRows] = useState<Mvr[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [continuousCount, setContinuousCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DriverStatus>("all");

  const refresh = useCallback(async () => {
    if (!carrier) return;
    const { data } = await getSupabase().from("compass_mvr_records").select("*").eq("carrier_id", carrier.id).order("pulled_on", { ascending: false });
    setRows((data as Mvr[]) || []);
    setLoading(false);
  }, [carrier]);

  const refreshContinuous = useCallback(async () => {
    try {
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session?.access_token) return;
      const r = await fetch("/api/screenings/continuous-mvr/list", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const j = (await r.json()) as ContinuousListResp;
      if (j.ok) setContinuousCount(j.kpis?.active || 0);
    } catch { /* no-op */ }
  }, []);

  useEffect(() => { if (carrier) { refresh(); refreshContinuous(); } }, [carrier, refresh, refreshContinuous]);

  // Compute per-driver tracker view
  const driverRows = drivers.map((d) => {
    const last = rows
      .filter((r) => r.driver_id === d.id)
      .sort((a, b) => (a.pulled_on > b.pulled_on ? -1 : 1))[0];
    const st = statusFor(last?.pulled_on || null);
    return { driver: d, last, ...st };
  });

  const kpis = {
    total: drivers.length,
    current: driverRows.filter((d) => d.status === "current").length,
    due: driverRows.filter((d) => d.status === "due").length,
    overdue: driverRows.filter((d) => d.status === "overdue").length + driverRows.filter((d) => d.status === "missing").length,
  };

  const filteredDrivers = driverRows.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const lbl = driverLabel(d.driver).toLowerCase();
      if (!lbl.includes(q)) return false;
    }
    return true;
  });

  function handleUpload(file: File) {
    // Phase 1: just open the manual modal so the user has feedback.
    // Phase 2 (separate task): POST file to /api/screenings/mvr/parse → AI extract → pre-fill modal.
    console.log("[mvr] file received:", file.name, file.size, "bytes");
    setShowAdd(true);
  }

  return (
    <AppShell crumbs="MVR · 49 CFR § 391.25" title="MVR Tracker">
      <div className="p-6 space-y-6">
        <MvrHero />

        <EduFaqGrid />

        <UploadCard onManualEntry={() => setShowAdd(true)} onUploaded={handleUpload} />

        {carrier && (
          <ContinuousMonitoringCallout
            enrollmentCount={continuousCount}
            carrierId={carrier.id}
            drivers={drivers}
            onEnrolled={refreshContinuous}
          />
        )}

        {/* KPI grid — 4 tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Active drivers", v: kpis.total, sub: "tracked here", c: "text-[var(--fg)]" },
            { l: "Current", v: kpis.current, sub: "MVR pulled in last 365 days", c: "text-emerald-700 dark:text-emerald-300" },
            { l: "Due soon", v: kpis.due, sub: "within 30 days of deadline", c: "text-amber-700 dark:text-amber-300" },
            { l: "Overdue / Missing", v: kpis.overdue, sub: "past deadline · pull immediately", c: "text-rose-700 dark:text-rose-300" },
          ].map((s) => (
            <div key={s.l} className="x3-card p-4">
              <div className="text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--fg-muted)] mb-1">{s.l}</div>
              <div className={`text-[26px] font-black leading-none ${s.c} mb-1`}>{s.v}</div>
              <div className="text-[11px] text-[var(--fg-faint)]">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Per-driver tracker card */}
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-[16px] font-extrabold text-[var(--fg)] flex items-center gap-2">📋 Driver-by-driver MVR status</h2>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Source of truth — pulls from any source land here.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                type="search"
                placeholder="🔎 Search driver"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="x3i text-[12px] w-44"
              />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | DriverStatus)} className="x3i text-[12px] w-auto">
                <option value="all">All statuses</option>
                <option value="overdue">Overdue only</option>
                <option value="due">Due soon only</option>
                <option value="current">Current only</option>
                <option value="missing">Missing only</option>
              </select>
              <button onClick={refresh} className="text-[11px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--bg-3)] px-3 py-1.5 rounded-full whitespace-nowrap">↻ Refresh</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-[13px] text-[var(--fg-muted)]">Loading drivers…</div>
            ) : drivers.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-[14px] font-bold text-[var(--fg)] mb-1">No drivers yet</div>
                <p className="text-[12px] text-[var(--fg-muted)]">Add drivers in /app/drivers — MVRs attach to drivers.</p>
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--bg-3)] text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--fg-muted)]">
                  <tr>
                    <th className="py-2 px-4 text-left">Driver</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-left">Last pull</th>
                    <th className="py-2 px-3 text-left">State</th>
                    <th className="py-2 px-3 text-center">Points</th>
                    <th className="py-2 px-3 text-center">Violations</th>
                    <th className="py-2 px-3 text-left">License</th>
                    <th className="py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((d) => (
                    <tr key={d.driver.id} className="border-t border-[var(--border)]">
                      <td className="py-2 px-4 text-[var(--fg)] font-semibold">{driverLabel(d.driver)}</td>
                      <td className="py-2 px-3"><span role="status" aria-label={`Status: ${d.status}`} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_PILL[d.status]}`}>{d.label}</span></td>
                      <td className="py-2 px-3 text-[var(--fg-muted)]">{d.last ? fmtDate(d.last.pulled_on) : <span className="text-[var(--fg-faint)]">never</span>}</td>
                      <td className="py-2 px-3 text-[var(--fg-muted)]">{d.last?.state || <span className="text-[var(--fg-faint)]">—</span>}</td>
                      <td className="py-2 px-3 text-center tabular-nums">{d.last?.points ?? <span className="text-[var(--fg-faint)]">—</span>}</td>
                      <td className="py-2 px-3 text-center tabular-nums">{d.last?.violations_count ?? <span className="text-[var(--fg-faint)]">—</span>}</td>
                      <td className="py-2 px-3 text-[var(--fg-muted)] text-[11px]">{d.last?.license_status || <span className="text-[var(--fg-faint)]">—</span>}</td>
                      <td className="py-2 px-4 text-right">
                        {d.last?.file_url ? (
                          <a href={d.last.file_url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[var(--accent)] hover:underline">View file →</a>
                        ) : (
                          <button onClick={() => setShowAdd(true)} className="text-[11px] font-bold text-[var(--accent)] hover:underline">Log pull →</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showAdd && carrier && (
        <MvrFormModal
          carrier_id={carrier.id}
          drivers={drivers}
          onClose={() => setShowAdd(false)}
          onSaved={() => { refresh(); setShowAdd(false); }}
        />
      )}
    </AppShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Manual log modal
// ═══════════════════════════════════════════════════════════════════
function MvrFormModal({ carrier_id, drivers, onClose, onSaved }: { carrier_id: string; drivers: DriverOpt[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Mvr>>({ pulled_on: new Date().toISOString().slice(0, 10), license_status: "valid", points: 0, violations_count: 0, source: "manual" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (!form.driver_id) throw new Error("Select a driver");
      const { error } = await getSupabase().from("compass_mvr_records").insert([{ ...form, carrier_id }]);
      if (error) throw error;
      await getSupabase().from("compass_drivers").update({ last_mvr_pulled_on: form.pulled_on }).eq("id", form.driver_id);
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Log MVR pull (manual)" onClose={onClose}>
      <p className="text-[12px] text-[var(--fg-muted)] mb-3">
        Skip the upload — type the values directly. Compass saves it to the audit file the same way.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Driver *">
            <select required value={form.driver_id || ""} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} className="x3i">
              <option value="">Select…</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
            </select>
          </Field>
          <Field label="Pull date *">
            <input type="date" className="x3i" value={form.pulled_on || ""} onChange={(e) => setForm({ ...form, pulled_on: e.target.value })} required />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="State">
            <input className="x3i uppercase" value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} maxLength={2} placeholder="MI" />
          </Field>
          <Field label="Source">
            <select className="x3i" value={form.source || "manual"} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="manual">Manual entry</option>
              <option value="vendor">CRA vendor</option>
              <option value="continuous">Continuous monitoring alert</option>
              <option value="ai_upload">AI upload</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="License status *">
            <select required className="x3i" value={form.license_status || ""} onChange={(e) => setForm({ ...form, license_status: e.target.value })}>
              <option value="">— Select —</option>
              {LICENSE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Result">
            <select className="x3i" value={form.result || ""} onChange={(e) => setForm({ ...form, result: e.target.value })}>
              <option value="">— Select —</option>
              {RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Points">
            <input type="number" min={0} className="x3i" value={String(form.points || 0)} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
          </Field>
          <Field label="Violations count">
            <input type="number" min={0} className="x3i" value={String(form.violations_count || 0)} onChange={(e) => setForm({ ...form, violations_count: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="File URL">
          <input type="url" className="x3i" value={form.file_url || ""} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Notes">
          <textarea className="x3i" rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Convictions, restrictions, reviewer comments" />
        </Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}
