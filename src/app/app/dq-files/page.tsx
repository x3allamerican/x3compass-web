"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageGuide from "@/components/PageGuide";
import DataSourceCard from "@/components/DataSourceCard";
import { useUser } from "@/lib/useUser";

type DocStatus = "complete" | "missing" | "expiring" | "expired";

type Doc = {
  slot: string;
  cfr: string;
  status: DocStatus;
  detail: string;
};

const ROSTER = [
  { id: "rtorres",   name: "Ricardo Torres", initials: "RT", coverage: "8 / 12", risk: "amber" },
  { id: "jmartinez", name: "Jared Martinez", initials: "JM", coverage: "12 / 12", risk: "green" },
  { id: "sjohnson",  name: "Sarah Johnson",  initials: "SJ", coverage: "9 / 12",  risk: "red" },
  { id: "mkowalski", name: "Mike Kowalski",  initials: "MK", coverage: "12 / 12", risk: "green" },
  { id: "epark",     name: "Emma Park",      initials: "EP", coverage: "10 / 12", risk: "amber" },
  { id: "dramirez",  name: "Diego Ramirez",  initials: "DR", coverage: "11 / 12", risk: "green" },
];

const DOCS: Doc[] = [
  { slot: "Driver application",              cfr: "§ 391.21",      status: "complete", detail: "Signed 2024-08-12 · on file" },
  { slot: "Inquiry to previous employers",   cfr: "§ 391.23(a)(1)",status: "complete", detail: "3 employers contacted · on file" },
  { slot: "Motor vehicle record (MVR)",      cfr: "§ 391.23(a)(2)",status: "complete", detail: "TX · pulled 2026-03-10" },
  { slot: "Annual MVR review",               cfr: "§ 391.25",       status: "expiring", detail: "Next review due in 12 days" },
  { slot: "Road test certificate",           cfr: "§ 391.31",       status: "complete", detail: "Examiner: Mike Perry · 2024-08-15" },
  { slot: "Medical examiner certificate",    cfr: "§ 391.43",       status: "expiring", detail: "Expires in 14 days · UPLOAD NEW" },
  { slot: "Medical examiner cert verification (NRCME)", cfr: "§ 391.23(m)", status: "complete", detail: "Verified · 2024-08-12" },
  { slot: "Clearinghouse pre-employment query",         cfr: "§ 382.701(a)", status: "complete", detail: "Limited query · negative · 2024-08-14" },
  { slot: "Clearinghouse annual query",      cfr: "§ 382.701(b)",  status: "missing",  detail: "Not yet conducted · DUE THIS WEEK" },
  { slot: "Drug & alcohol pre-employment test", cfr: "§ 382.301",  status: "complete", detail: "DOT 5-panel · negative · 2024-08-13" },
  { slot: "Entry-Level Driver Training (ELDT) · theory", cfr: "Part 380.609", status: "missing", detail: "Driver had CDL pre-2022 · CHECK GRANDFATHER" },
  { slot: "Hazmat endorsement (TSA-H)",      cfr: "49 CFR 1572",    status: "complete", detail: "Valid · expires 2027-02-19" },
];

const STATUS_STYLE: Record<DocStatus, { bg: string; text: string; border: string; label: string; ring: string }> = {
  complete: { bg: "bg-emerald-500/10",  text: "text-emerald-300",  border: "border-emerald-500/30",  label: "Complete",  ring: "ring-emerald-500/30" },
  expiring: { bg: "bg-amber-500/10",    text: "text-amber-300",    border: "border-amber-500/40",    label: "Expiring",  ring: "ring-amber-500/40" },
  expired:  { bg: "bg-rose-500/10",     text: "text-rose-300",     border: "border-rose-500/40",     label: "Expired",   ring: "ring-rose-500/40" },
  missing:  { bg: "bg-rose-500/10",     text: "text-rose-300",     border: "border-rose-500/40",     label: "Missing",   ring: "ring-rose-500/40" },
};

const RISK_COLOR: Record<string, string> = {
  green: "#10B981",
  amber: "#FBBF24",
  red:   "#F87171",
};

export default function DQFilesPage() {
  const { carrier } = useUser();
  const active = ROSTER[0];

  // Real signed-in carrier: the sample "Ricardo Torres" DQ file below is demo
  // content and must not be shown as if it were theirs. Until per-driver DQ
  // documents are wired to Supabase, show an honest onboarding state.
  if (carrier) {
    return (
      <AppShell title="DQ Files" crumbs="DQ FILES · 49 CFR § 391.51">
        <div className="p-8 max-w-2xl">
          <div className="rounded-xl border border-dashed border-[#1E3556] bg-[#0C1A30] px-6 py-14 text-center">
            <div className="text-3xl mb-3" aria-hidden>📁</div>
            <div className="text-[15px] font-extrabold text-white">No driver qualification files yet</div>
            <p className="mt-1.5 mx-auto max-w-md text-[13px] text-white/60">
              Add your drivers and upload their documents, and X3 Compass builds each 49 CFR § 391.51 DQ file here — with citation mapping, expiry tracking, and audit-ready export.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Link href="/app/drivers" className="px-5 py-2.5 rounded-lg font-extrabold text-[13px] text-black" style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}>Add drivers →</Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="DQ Files · Ricardo Torres"
      crumbs="DQ FILES BRAIN · 49 CFR § 391.51 · 12-DOCUMENT FILE"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            ⬆ Upload
          </button>
          <Link href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#000000]"
            style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)", boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)" }}
          >
            📄 Audit-ready bundle →
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0">
        {/* DRIVER PICKER SIDEBAR (within main) */}
        <aside className="border-r border-[#1E3556] bg-[#0C1A30] min-h-[calc(100vh-64px)] py-5 px-3">
          <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[#16C7FF]/60 px-2 mb-3">
            Drivers · 72
          </div>
          <div className="relative mb-3">
            <input
              type="search"
              placeholder="Search drivers…"
              className="w-full bg-[#000000] border border-[#1E3556] rounded-lg pl-9 pr-3 py-2 text-[12px] text-white placeholder:text-white/40 focus:border-[#16C7FF] focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[12px]">🔍</span>
          </div>
          <div className="space-y-1">
            {ROSTER.map((d) => (
              <Link
                key={d.id}
                href={`/app/dq-files?d=${d.id}`}
                className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${
                  d.id === active.id
                    ? "bg-[#16C7FF]/12 border border-[#16C7FF]/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full grid place-items-center font-extrabold text-[11px] text-[#000000] flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, " + RISK_COLOR[d.risk] + ", #16C7FF)",
                  }}
                >
                  {d.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-white truncate">{d.name}</div>
                  <div className="text-[10px] text-white/45 font-mono">{d.coverage}</div>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLOR[d.risk], boxShadow: `0 0 6px ${RISK_COLOR[d.risk]}80` }} />
              </Link>
            ))}
            <div className="text-[11px] text-white/40 px-2 py-2">+ 66 more drivers</div>
          </div>
        </aside>

        {/* DOC GRID */}
        <div className="px-6 py-6 space-y-6">
        {/* Joshua's polish pass: action content (driver detail + 12-doc grid)
            renders FIRST. The Education Hub explainer ("How this page works")
            and DataSource picker live at the bottom now — matches Drivers tab
            structure where the title + KPIs + table lead, and any explainers
            sit below. Original PageGuide + DataSourceCard moved to render
            AFTER the 12-doc grid (see further down in this file). */}

          {/* Driver header */}
          <div
            className="rounded-2xl p-5 border border-[#1E3556] flex items-center gap-4 flex-wrap"
            style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}
          >
            <div
              className="w-14 h-14 rounded-full grid place-items-center font-black text-[18px] text-[#000000]"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #16C7FF)" }}
            >
              RT
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[20px] font-extrabold text-white">Ricardo Torres</h2>
              <div className="text-[12px] text-white/55 mt-0.5">CDL-A · H · Dallas, TX · TX-DL-8901442 · Hire date 2024-08-12</div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <div className="text-[10px] tracking-wider uppercase text-white/45">Coverage</div>
                <div className="text-[20px] font-black text-amber-300">8 / 12</div>
              </div>
              <div>
                <div className="text-[10px] tracking-wider uppercase text-white/45">Risk</div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  ⚠ 2 missing · 2 expiring
                </span>
              </div>
            </div>
          </div>

          {/* Compass nudge */}
          <div
            className="rounded-2xl p-4 border flex gap-3 items-start"
            style={{
              background: "linear-gradient(135deg, rgba(2, 6, 12, 0.45), rgba(15, 28, 50, 0.5))",
              borderColor: "rgba(2, 6, 12, 0.45)",
            }}
          >
            <div
              className="w-9 h-9 rounded-full grid place-items-center font-black text-[16px] text-[#000000] flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
            >
              ∞
            </div>
            <div className="flex-1">
              {/* Joshua: Compass answer text needs to be bright + readable.
                  Bumped 13px → 16px and forced #FFFFFF (no opacity) so it's
                  full white on the dark card surface, not the 70%-opacity
                  off-white that was making it dim. */}
              <div className="text-[16px] leading-relaxed" style={{ color: "#FFFFFF" }}>
                <strong style={{ color: "#16C7FF" }}>Compass:</strong>{" "}
                Ricardo&apos;s med cert expires in <strong style={{ color: "#FFFFFF" }}>14 days</strong> per § 391.43. He also needs his <strong style={{ color: "#FFFFFF" }}>annual Clearinghouse query</strong> (§ 382.701(b)) before next Tuesday, and we should check his <strong style={{ color: "#FFFFFF" }}>ELDT grandfather status</strong> (Part 380.609) since he had his CDL before Feb 7, 2022.
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button className="px-3 py-1.5 rounded-full text-[12px] font-bold text-[#000000]" style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}>
                  Email Ricardo a med-cert reminder
                </button>
                <button className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                  Run Clearinghouse query
                </button>
                <button className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                  Check ELDT grandfather
                </button>
              </div>
            </div>
          </div>

          {/* 12-DOC GRID */}
          <div>
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-[15px] font-extrabold text-white">The 12 documents · § 391.51</h3>
              <span className="text-[11px] text-white/50">Click any slot to upload, replace, or view history</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DOCS.map((d, i) => {
                const s = STATUS_STYLE[d.status];
                return (
                  <div
                    key={i}
                    className={`rounded-xl p-4 border ${s.bg} ${s.border} flex flex-col gap-2 hover:scale-[1.01] transition-transform cursor-pointer`}
                    style={{
                      boxShadow: d.status === "missing" || d.status === "expired" ? `0 0 0 1px ${s.ring.split("/")[0].replace("ring-", "")} inset` : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[14px] font-bold text-white leading-snug">{d.slot}</div>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${s.bg} ${s.text} border ${s.border} whitespace-nowrap`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#16C7FF]/80">{d.cfr}</div>
                    <div className="text-[12px] text-white/70 leading-relaxed flex-1">{d.detail}</div>
                    <div className="flex gap-2 mt-1">
                      {d.status === "complete" && (
                        <>
                          <button className="text-[11px] font-bold text-[#16C7FF] hover:text-[#16C7FF]">View →</button>
                          <button className="text-[11px] font-bold text-white/55 hover:text-white">Replace</button>
                        </>
                      )}
                      {(d.status === "expiring" || d.status === "expired") && (
                        <button className="text-[11px] font-bold text-amber-300 hover:text-amber-200">⬆ Upload new</button>
                      )}
                      {d.status === "missing" && (
                        <button className="text-[11px] font-bold text-rose-300 hover:text-rose-200">⬆ Upload now</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color legend — Joshua wants this under the 4 (12) status boxes so
              the green / amber / rose / red meaning is unambiguous. */}
          <div className="rounded-xl border border-[#1E3556] bg-[#0C1A30] p-4">
            <div className="text-[12px] font-bold uppercase tracking-[.14em] text-[#16C7FF]/80 mb-3">
              Status legend
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[14px]">
              <div className="flex items-start gap-2.5">
                <span className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#10B981", boxShadow: "0 0 6px #10B98180" }} />
                <div>
                  <div className="font-bold text-white">Complete <span className="text-white/60 font-normal">(green)</span></div>
                  <div className="text-white/65 text-[12px]">On file, signed, verified, and current.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#FBBF24", boxShadow: "0 0 6px #FBBF2480" }} />
                <div>
                  <div className="font-bold text-white">Expiring soon <span className="text-white/60 font-normal">(yellow / amber)</span></div>
                  <div className="text-white/65 text-[12px]">Expires within 30 days. Schedule renewal now.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#F97316", boxShadow: "0 0 6px #F9731680" }} />
                <div>
                  <div className="font-bold text-white">Action required <span className="text-white/60 font-normal">(orange)</span></div>
                  <div className="text-white/65 text-[12px]">Driver action pending (e.g. signature, prior-employer reply).</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#F87171", boxShadow: "0 0 6px #F8717180" }} />
                <div>
                  <div className="font-bold text-white">Expired / Missing <span className="text-white/60 font-normal">(red)</span></div>
                  <div className="text-white/65 text-[12px]">Past expiration or never on file. Audit-fail risk.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
