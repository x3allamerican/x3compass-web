"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import PageGuide from "@/components/PageGuide";
import DataSourceCard from "@/components/DataSourceCard";

type CourseStatus = "current" | "due" | "overdue" | "missing";

type CourseRow = {
  driver: string;
  initials: string;
  course: string;
  cfr: string;
  provider: string;
  completed: string;
  expires: string;
  status: CourseStatus;
  statusLabel: string;
};

const COURSES: CourseRow[] = [
  { driver: "Jared Martinez",  initials: "JM", course: "ELDT · Theory",           cfr: "Part 380.609", provider: "CarriersEdge",    completed: "2024-08-12", expires: "—",          status: "current", statusLabel: "Complete" },
  { driver: "Jared Martinez",  initials: "JM", course: "ELDT · Behind the Wheel", cfr: "Part 380.609", provider: "TPR · school 4421", completed: "2024-08-18", expires: "—",        status: "current", statusLabel: "Complete" },
  { driver: "Jared Martinez",  initials: "JM", course: "Defensive driving",       cfr: "Part 380",     provider: "Infinit-i",        completed: "2025-09-12", expires: "2026-09-12", status: "current", statusLabel: "11 mo left" },
  { driver: "Ricardo Torres",  initials: "RT", course: "Hazmat awareness",        cfr: "§ 172.704",    provider: "JJ Keller",        completed: "2023-08-20", expires: "2026-08-20", status: "due",     statusLabel: "Expires 84d" },
  { driver: "Sarah Johnson",   initials: "SJ", course: "Pre-trip inspection",     cfr: "Part 380",     provider: "CarriersEdge",     completed: "2023-03-17", expires: "2026-03-17", status: "overdue", statusLabel: "62d overdue" },
  { driver: "Emma Park",       initials: "EP", course: "ELDT · Theory",           cfr: "Part 380.609", provider: "—",                completed: "—",          expires: "—",          status: "missing", statusLabel: "Missing · BLOCKER" },
  { driver: "Emma Park",       initials: "EP", course: "ELDT · Behind the Wheel", cfr: "Part 380.609", provider: "—",                completed: "—",          expires: "—",          status: "missing", statusLabel: "Missing · BLOCKER" },
  { driver: "Mike Kowalski",   initials: "MK", course: "Cargo securement",        cfr: "Part 392.9",   provider: "Infinit-i",        completed: "2025-11-08", expires: "2026-11-08", status: "current", statusLabel: "12 mo left" },
  { driver: "Diego Ramirez",   initials: "DR", course: "Supervisor D&A awareness",cfr: "§ 382.603",    provider: "JJ Keller",        completed: "2024-04-22", expires: "2025-04-22", status: "overdue", statusLabel: "395d overdue" },
  { driver: "Linda Wilson",    initials: "LW", course: "Hazmat security plan",     cfr: "§ 172.800",   provider: "JJ Keller",        completed: "2025-06-15", expires: "2026-06-15", status: "due",     statusLabel: "Expires 31d" },
];

const STATUS_PILL: Record<CourseStatus, string> = {
  current:  "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  due:      "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  overdue:  "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  missing:  "bg-rose-500/15 text-rose-300 border border-rose-500/30",
};

const AVATAR_GRAD: Record<string, string> = {
  JM: "linear-gradient(135deg, #16C7FF, #16C7FF)",
  RT: "linear-gradient(135deg, #8B5CF6, #16C7FF)",
  SJ: "linear-gradient(135deg, #F59E0B, #EF4444)",
  MK: "linear-gradient(135deg, #16C7FF, #10B981)",
  EP: "linear-gradient(135deg, #EF4444, #8B5CF6)",
  DR: "linear-gradient(135deg, #10B981, #16C7FF)",
  LW: "linear-gradient(135deg, #16C7FF, #F59E0B)",
};

const COURSE_LIBRARY = [
  { code: "ELDT-THEORY", name: "ELDT · Theory",            cfr: "Part 380.609", required: "Pre-CDL · class A/B/passenger", cycle: "Once", provider: "TPR providers" },
  { code: "ELDT-BTW",     name: "ELDT · Behind the Wheel", cfr: "Part 380.609", required: "Pre-CDL · class A/B/passenger", cycle: "Once", provider: "TPR providers" },
  { code: "SUP-DA",       name: "Supervisor D&A Awareness", cfr: "§ 382.603",   required: "Anyone supervising CDL drivers",  cycle: "Once + remedial", provider: "JJ Keller, Infinit-i" },
  { code: "DEF-DRV",      name: "Defensive Driving",        cfr: "Part 380",    required: "All CDL drivers",                 cycle: "Annual", provider: "CarriersEdge, Infinit-i" },
  { code: "PRE-TRIP",     name: "Pre-Trip Inspection",      cfr: "Part 380",    required: "All CDL drivers",                 cycle: "Triennial", provider: "CarriersEdge" },
  { code: "CARGO",        name: "Cargo Securement",         cfr: "Part 392.9",  required: "All drivers hauling regulated loads", cycle: "Annual", provider: "Infinit-i" },
  { code: "HAZMAT-AW",    name: "Hazmat Awareness",         cfr: "§ 172.704",   required: "Anyone handling hazmat",            cycle: "Triennial", provider: "JJ Keller, Infinit-i" },
  { code: "HAZMAT-SEC",   name: "Hazmat Security Plan",     cfr: "§ 172.800",   required: "Class 7, select Class 3 & 8 carriers", cycle: "Annual", provider: "JJ Keller" },
];

export default function TrainingPage() {
  const { carrier } = useUser();
  if (carrier) return <RealTraining carrierId={carrier.id} />;

  return (
    <AppShell
      title="Training & ELDT"
      crumbs="TRAINING BRAIN · 49 CFR PART 380"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            ⬆ Upload cert
          </button>
          <Link href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#000000]"
            style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)", boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)" }}
          >
            + Assign training
          </Link>
        </>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* HOW THIS PAGE WORKS */}
        <PageGuide
          cfr="49 CFR Part 380 + § 391.11"
          what="Training completions per driver · ELDT (first-time CDL), defensive driving, supervisor reasonable-suspicion, hazmat refresher, and any carrier-specific curriculum."
          who="Every motor carrier. ELDT is mandatory for first-time CDL applicants after 2/7/2022. Hazmat carriers need annual security awareness. Supervisors need RS training before they can make reasonable-suspicion calls."
          howTo={[
            { n: 1, title: "Connect your LMS (Infinit-i, JJ Keller Encompass, CarriersEdge)", detail: "OAuth pulls completion data per driver, per course, with timestamps and certificate URLs. Real-time sync as drivers finish courses." },
            { n: 2, title: "Or upload training completion CSV", detail: "Template: driver, course code, course name, completion date, certificate URL, expiration. Works for any LMS that lets you export · or manual training (Smith System certified instructor)." },
            { n: 3, title: "Or log training events manually", detail: "+ Add training record · useful for in-house toolbox talks, post-accident coaching, supervisor 2-hour RS training (§ 382.603), and one-off events." },
            { n: 4, title: "Verify ELDT for new CDL holders", detail: "Drivers with first CDL after 2/7/2022 need ELDT (theory + behind-the-wheel) from a TPR-registered provider. Compass checks the provider's TPR number against FMCSA's registry." },
          ]}
          weeklyHabits={["Confirm new hires have completed orientation training", "Review drivers with annual refresher coming due in next 30 days"]}
          auditTraps={["ELDT certificate missing for a driver with first CDL after 2/7/2022 · automatic finding", "Supervisor reasonable-suspicion training undocumented · they can't legally make RS calls", "Hazmat security awareness training missing or older than 12 months for hazmat-endorsed drivers"]}
          askCompassLinks={[{ label: "Is annual refresher training required?", query: "Annual driver refresher training requirements" }, { label: "ELDT · who needs it and what counts?", query: "ELDT entry-level driver training requirements" }, { label: "Supervisor 2-hour reasonable-suspicion course documentation", query: "Supervisor reasonable suspicion training documentation" }]}
        />

        {/* DATA SOURCE */}
        <DataSourceCard
          trackerLabel="Training"
          cfr="49 CFR Part 380 (ELDT) + § 391.11 (qualifications)"
          initialStatus="imported"
          lastSync="2 days ago"
          recordCount={412}
          vendors={[
            { name: "Infinit-i Workforce", blurb: "LMS sync · 200+ DOT courses · ELDT-registered TPR", badge: "Recommended", status: "live", cost: "$12/driver/mo" },
            { name: "JJ Keller Training", blurb: "Course library + completion sync", badge: "API key", status: "live", cost: "$15/driver/mo" },
            { name: "CarriersEdge", blurb: "DOT-focused LMS + scorecards", badge: "OAuth", status: "live", cost: "$10/driver/mo" },
            { name: "Smith System", blurb: "Defensive driving online", status: "manual-pull", cost: "Per-course" },
            { name: "Luma Brighter Learning", blurb: "ELDT theory + behind-the-wheel", badge: "API key", status: "live", cost: "$8/driver/mo" },
            { name: "Compass Skills Library", blurb: "100 X3-authored skill briefings · free", badge: "Recommended", status: "live", cost: "Included" },
          ]}
          csvTemplate={{
            name: "x3-compass-training-template.csv",
            columns: ["driver_id", "course_code", "course_name", "completed_date", "certificate_url", "expires_date", "instructor", "trp_number"],
          }}
          manualLabel="Add training record"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: "Course completions · YTD", v: "412", c: "#16C7FF" },
            { l: "Current",                   v: "8",   c: "#10B981" },
            { l: "Due ≤ 90 days",             v: "2",   c: "#FBBF24" },
            { l: "Overdue",                   v: "2",   c: "#F87171" },
            { l: "ELDT blockers",             v: "2",   c: "#F87171" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
              <div className="text-[11px] tracking-[.14em] uppercase font-extrabold text-white/65 mb-1">{s.l}</div>
              <div className="text-[26px] font-black leading-none" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Compass nudge */}
        <div className="rounded-2xl p-5 border flex gap-4 items-start"
          style={{
            background: "linear-gradient(135deg, rgba(248, 113, 113, 0.10), rgba(15, 28, 50, 0.5))",
            borderColor: "rgba(248, 113, 113, 0.40)",
          }}
        >
          <div className="w-11 h-11 rounded-full grid place-items-center font-black text-[20px] text-[#000000] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
          >
            ∞
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-[15px] mb-1">Emma Park can&apos;t drive yet · ELDT incomplete · Part 380.609</div>
            <div className="text-[14px] text-white/85 leading-relaxed mb-3">
              She passed her CDL skills test on 2026-04-12 but the TPR-registry check shows no Theory or BTW completion. Federal regulation requires both before she can operate a CMV. I can email a list of TPR-registered providers near Las Cruces, NM, sorted by distance and price.
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 rounded-full text-[13px] font-bold text-[#000000]"
                style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
              >
                Send TPR provider list →
              </button>
              <button className="px-4 py-2 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5">
                Check grandfather status
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-[#000000] border border-[#1E3556] w-fit">
          {["Completions log", "Course library", "Assigned · in-progress"].map((t, i) => (
            <button
              key={i}
              className={`px-4 py-2 rounded-md text-[14px] font-bold ${
                i === 0 ? "bg-[#16C7FF]/15 text-[#16C7FF]" : "text-white/75 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Completions table */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556] flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[16px] font-extrabold text-white">Training completions</h3>
            <span className="text-[12px] font-mono text-[#16C7FF]/80">Part 380 · per-driver expiry tracking</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead className="bg-[#0F1C32]/60">
                <tr className="text-left text-[11px] tracking-[.14em] uppercase font-extrabold text-white/60">
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3">CFR</th>
                  <th className="py-3 px-3">Provider</th>
                  <th className="py-3 px-3">Completed</th>
                  <th className="py-3 px-3">Expires</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3556]">
                {COURSES.map((c, i) => (
                  <tr key={i} className="hover:bg-[#16C7FF]/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full grid place-items-center font-bold text-[11px] text-[#000000] flex-shrink-0"
                          style={{ background: AVATAR_GRAD[c.initials] }}
                        >
                          {c.initials}
                        </div>
                        <span className="text-white font-semibold">{c.driver}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white">{c.course}</td>
                    <td className="py-3 px-3 font-mono text-[12px] text-[#16C7FF]/80">{c.cfr}</td>
                    <td className="py-3 px-3 text-white/80">{c.provider}</td>
                    <td className="py-3 px-3 text-white/85">{c.completed}</td>
                    <td className="py-3 px-3 text-white/85">{c.expires}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${STATUS_PILL[c.status]}`}>
                        {c.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href="#" className="text-[13px] font-bold text-[#16C7FF] hover:text-[#16C7FF]">Open →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course library */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556]">
            <h3 className="text-[16px] font-extrabold text-white">Course library · 8 standards</h3>
            <p className="text-[13px] text-white/65 mt-0.5">Click any course to assign it to drivers or set fleet-wide policy.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1E3556]">
            <div className="divide-y divide-[#1E3556]">
              {COURSE_LIBRARY.slice(0, 4).map((c) => (
                <Link key={c.code} href="#" className="block px-5 py-4 hover:bg-[#16C7FF]/5">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="text-[11px] font-mono text-[#16C7FF]/80">{c.cfr}</span>
                  </div>
                  <div className="text-[12.5px] text-white/65 mb-1">{c.required}</div>
                  <div className="text-[11px] text-white/45">Cycle: {c.cycle} · Provider: {c.provider}</div>
                </Link>
              ))}
            </div>
            <div className="divide-y divide-[#1E3556]">
              {COURSE_LIBRARY.slice(4).map((c) => (
                <Link key={c.code} href="#" className="block px-5 py-4 hover:bg-[#16C7FF]/5">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="text-[11px] font-mono text-[#16C7FF]/80">{c.cfr}</span>
                  </div>
                  <div className="text-[12.5px] text-white/65 mb-1">{c.required}</div>
                  <div className="text-[11px] text-white/45">Cycle: {c.cycle} · Provider: {c.provider}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}


// ── Real-tenant training/ELDT completions, from compass_training_records ──
type TrainRow = { id: string; driver_name: string | null; course: string; cfr: string | null; provider: string | null; completed_on: string | null; expires_on: string | null; status: CourseStatus };

function RealTraining({ carrierId }: { carrierId: string }) {
  const [rows, setRows] = useState<TrainRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    (async () => {
      const sb = getSupabase();
      const [recs, drivers] = await Promise.all([
        sb.from("compass_training_records").select("id,driver_id,course_name,course_category,provider,completed_on,expires_on").eq("carrier_id", carrierId).order("completed_on", { ascending: false }),
        sb.from("compass_drivers").select("id,first_name,last_name").eq("carrier_id", carrierId),
      ]);
      if (!live) return;
      const nameById: Record<string, string> = {};
      for (const d of (drivers.data as Array<{ id: string; first_name: string; last_name: string }>) || []) nameById[d.id] = `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim();
      const today = new Date().toISOString().slice(0, 10);
      const in60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
      const statusOf = (exp: string | null): CourseStatus => !exp ? "current" : (exp < today ? "overdue" : (exp <= in60 ? "due" : "current"));
      const mapped: TrainRow[] = ((recs.data as Array<Record<string, unknown>>) || []).map((r) => ({
        id: String(r.id),
        driver_name: r.driver_id ? (nameById[String(r.driver_id)] || null) : null,
        course: (r.course_name as string) || "—",
        cfr: (r.course_category as string) ?? null,
        provider: (r.provider as string) ?? null,
        completed_on: (r.completed_on as string) ?? null,
        expires_on: (r.expires_on as string) ?? null,
        status: statusOf((r.expires_on as string) ?? null),
      }));
      setRows(mapped); setLoading(false);
    })();
    return () => { live = false; };
  }, [carrierId]);
  const stats = useMemo(() => ({
    total: rows.length,
    overdue: rows.filter(r => r.status === "overdue").length,
    due: rows.filter(r => r.status === "due").length,
    missing: rows.filter(r => r.status === "missing").length,
  }), [rows]);
  if (loading) return <AppShell title="Training & ELDT"><div className="p-8 text-white/60 text-[13px]">Loading training records…</div></AppShell>;
  if (rows.length === 0) return (
    <AppShell title="Training & ELDT"><div className="p-8 max-w-2xl"><div className="rounded-xl border border-dashed border-[#1E3556] bg-[#0C1A30] px-6 py-14 text-center">
      <div className="text-3xl mb-3" aria-hidden>🎓</div><div className="text-[15px] font-extrabold text-white">No training records yet</div>
      <p className="mt-1.5 mx-auto max-w-md text-[13px] text-white/60">Assign courses or upload certificates and completions appear here per driver — ELDT (Part 380), HazMat (§ 172.704), and more.</p>
    </div></div></AppShell>
  );
  const PILL: Record<CourseStatus, string> = { current: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30", due: "bg-amber-500/15 text-amber-300 border border-amber-500/30", overdue: "bg-rose-500/15 text-rose-300 border border-rose-500/30", missing: "bg-rose-500/15 text-rose-300 border border-rose-500/30" };
  return (
    <AppShell title="Training & ELDT"><div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Records", stats.total], ["Due soon", stats.due], ["Overdue", stats.overdue], ["Missing", stats.missing]].map(([l, v]) => (
          <div key={String(l)} className="rounded-xl border border-[#1E3556] bg-[#0C1A30] p-4"><div className="text-[10px] uppercase tracking-wider text-white/45">{l}</div><div className="text-[24px] font-black text-white tabular-nums">{v as number}</div></div>
        ))}
      </div>
      <div className="rounded-xl border border-[#1E3556] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-white/40 bg-[#091525]"><span>Driver · course</span><span>Completed</span><span>Expires</span><span>Status</span></div>
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-4 py-3 border-t border-[#1E3556]">
            <div className="min-w-0"><div className="text-[13px] font-semibold text-white truncate">{r.driver_name || "—"}</div><div className="text-[10px] text-white/45">{r.course}{r.cfr ? ` · ${r.cfr}` : ""}</div></div>
            <span className="text-[12px] text-white/60 tabular-nums">{r.completed_on || "—"}</span>
            <span className="text-[12px] text-white/60 tabular-nums">{r.expires_on || "—"}</span>
            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${PILL[r.status] || PILL.current}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div></AppShell>
  );
}
