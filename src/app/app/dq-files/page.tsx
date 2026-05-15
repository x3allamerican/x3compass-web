import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageGuide from "@/components/PageGuide";
import DataSourceCard from "@/components/DataSourceCard";

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
  { slot: "Entry-Level Driver Training (ELDT) — theory", cfr: "Part 380.609", status: "missing", detail: "Driver had CDL pre-2022 · CHECK GRANDFATHER" },
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
  const active = ROSTER[0];

  return (
    <AppShell
      title="DQ Files · Ricardo Torres"
      crumbs="DQ FILES BRAIN · 49 CFR § 391.51 · 12-DOCUMENT FILE"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            ⬆ Upload
          </button>
          <Link href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#0A1929]"
            style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
          >
            📄 Audit-ready bundle →
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0">
        {/* DRIVER PICKER SIDEBAR (within main) */}
        <aside className="border-r border-[#1E3556] bg-[#0C1A30] min-h-[calc(100vh-64px)] py-5 px-3">
          <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[#22D3EE]/60 px-2 mb-3">
            Drivers · 72
          </div>
          <div className="relative mb-3">
            <input
              type="search"
              placeholder="Search drivers…"
              className="w-full bg-[#15233D] border border-[#1E3556] rounded-lg pl-9 pr-3 py-2 text-[12px] text-white placeholder:text-white/40 focus:border-[#22D3EE] focus:outline-none"
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
                    ? "bg-[#22D3EE]/12 border border-[#22D3EE]/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full grid place-items-center font-extrabold text-[11px] text-[#0A1929] flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, " + RISK_COLOR[d.risk] + ", #06B6D4)",
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
        {/* HOW THIS PAGE WORKS */}
        <PageGuide
          cfr="49 CFR § 391.51"
          what="The 12 § 391.51 documents per driver, with green/yellow/red status on each slot. The single most-audited area in motor-carrier compliance."
          who="Every motor carrier with CDL drivers. New entrants must have complete DQFs within 30 days of hiring each driver. Compliance reviews start here."
          howTo={[
            { n: 1, title: "Connect Tenstreet / DocuSign / Drive My Way", detail: "If you already process driver applicants through Tenstreet, the application + signed forms route directly to the DQF. DocuSign-signed forms (medical, road test) auto-attach to the right slot." },
            { n: 2, title: "Or upload your existing PDFs", detail: "Drag and drop scanned med certs, CDLs, prior-employer letters, road test certificates. Compass OCRs each document, classifies it (e.g., 'medical certificate'), and routes it to the correct slot." },
            { n: 3, title: "Or add documents to slots one at a time", detail: "Click any of the 12 slots → upload that specific document. Useful when you're remediating an existing fleet's DQFs slot by slot." },
            { n: 4, title: "Watch the compliance score per driver", detail: "Each driver shows a percentage — 12/12 slots green = 100%. Auditors typically sample 10-15 drivers; you want 100% on every one of those." },
          ]}
          weeklyHabits={["Review drivers with red/yellow slots (expired or missing) — fix them this week", "Run the DQF audit-self-assessment report monthly — surfaces patterns across the whole fleet"]}
          auditTraps={["Prior-employer inquiries missing 30-day response documentation — § 391.23(c)(2) requires you document the attempt", "Annual driver's certificate of violations missing — § 391.27 — drivers often forget this one", "Medical examiner verification missing the National Registry number — § 391.51(b)(7)", "Road test or equivalent missing for drivers hired before § 391.31 was widely understood"]}
          askCompassLinks={[{ label: "What's missing from this DQF? (§ 391.51)", query: "What's missing from this DQF" }, { label: "DQF audit self-assessment workflow", query: "DQF audit self-assessment workflow" }, { label: "When can I accept a prior employer's pre-employment test?", query: "Pre-employment test prior employer acceptance" }]}
        />

        {/* DATA SOURCE */}
        <DataSourceCard
          trackerLabel="Driver Qualification Files"
          cfr="49 CFR § 391.51 (the 12 documents)"
          initialStatus="manual"
          recordCount={864}
          vendors={[
            { name: "Tenstreet", blurb: "Pulls full DQ file from candidate intake", badge: "Recommended", status: "live", cost: "Included" },
            { name: "Foley Carrier Services", blurb: "DQ file management · annual reviews", badge: "API key", status: "live", cost: "$8/driver/mo" },
            { name: "JJ Keller Encompass", blurb: "DQ files + medical card tracking", status: "manual-pull", cost: "$12/driver/mo" },
            { name: "DocuSign", blurb: "eSign-completed forms route to DQ file", badge: "OAuth", status: "live", cost: "Included" },
            { name: "Drive My Way", blurb: "ATS-to-DQ doc transfer", badge: "API key", status: "live", cost: "Included" },
            { name: "Upload PDFs to X3", blurb: "Drag-and-drop · OCR + auto-classify", badge: "Recommended", status: "live", cost: "Included" },
          ]}
          csvTemplate={{
            name: "x3-compass-dq-files-template.csv",
            columns: ["driver_id", "document_type", "document_url", "issued_date", "expires_date", "verified_by"],
          }}
          manualLabel="Upload document"
        />

          {/* Driver header */}
          <div
            className="rounded-2xl p-5 border border-[#1E3556] flex items-center gap-4 flex-wrap"
            style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}
          >
            <div
              className="w-14 h-14 rounded-full grid place-items-center font-black text-[18px] text-[#0A1929]"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #22D3EE)" }}
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
              background: "linear-gradient(135deg, rgba(34, 211, 238, 0.06), rgba(15, 28, 50, 0.5))",
              borderColor: "rgba(34, 211, 238, 0.30)",
            }}
          >
            <div
              className="w-9 h-9 rounded-full grid place-items-center font-black text-[16px] text-[#0A1929] flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
            >
              ∞
            </div>
            <div className="flex-1">
              <div className="text-[13px] text-white leading-relaxed">
                <strong className="text-[#22D3EE]">Compass:</strong>{" "}
                Ricardo&apos;s med cert expires in <strong>14 days</strong> per § 391.43. He also needs his <strong>annual Clearinghouse query</strong> (§ 382.701(b)) before next Tuesday, and we should check his <strong>ELDT grandfather status</strong> (Part 380.609) since he had his CDL before Feb 7, 2022.
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button className="px-3 py-1.5 rounded-full text-[12px] font-bold text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>
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
                    <div className="text-[10px] font-mono text-[#22D3EE]/80">{d.cfr}</div>
                    <div className="text-[12px] text-white/70 leading-relaxed flex-1">{d.detail}</div>
                    <div className="flex gap-2 mt-1">
                      {d.status === "complete" && (
                        <>
                          <button className="text-[11px] font-bold text-[#22D3EE] hover:text-[#67E8F9]">View →</button>
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
        </div>
      </div>
    </AppShell>
  );
}
