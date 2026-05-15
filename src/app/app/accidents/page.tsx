import Link from "next/link";
import AppShell from "@/components/AppShell";

type Sev = "severe" | "moderate" | "minor";
type Prev = "preventable" | "non-preventable" | "pending";

const ACCIDENTS = [
  { id: "ACC-0042", date: "2026-03-22", driver: "Joshua Lee",      initials: "JL", unit: "Unit 156A",   state: "TX", sev: "severe"   as Sev, recordable: true,  prev: "pending" as Prev, summary: "Rear-end with passenger vehicle · I-45 N · injury reported · post-accident D&A complete · negative", insurer: "Sentry · claim filed" },
  { id: "ACC-0041", date: "2026-02-08", driver: "Emma Cooper",     initials: "EC", unit: "Unit 4287",   state: "NM", sev: "severe"   as Sev, recordable: true,  prev: "pending" as Prev, summary: "Single-vehicle rollover · I-25 S · tow required · driver hospitalized · post-accident D&A complete", insurer: "Sentry · claim filed" },
  { id: "ACC-0039", date: "2025-12-22", driver: "Ronald Watson",   initials: "RW", unit: "Unit 109",    state: "OK", sev: "minor"    as Sev, recordable: false, prev: "non-preventable" as Prev, summary: "Other vehicle ran red light · minor cosmetic damage · no injuries · police report on file", insurer: "—" },
  { id: "ACC-0036", date: "2025-09-15", driver: "Edward Alvarez",  initials: "EA", unit: "Unit 134",    state: "AR", sev: "moderate" as Sev, recordable: true,  prev: "preventable" as Prev, summary: "Rear-end into stopped traffic · § 392.1 following distance citation · D&A negative", insurer: "Resolved · paid" },
  { id: "ACC-0033", date: "2025-07-13", driver: "Joseph Morris",   initials: "JM", unit: "Unit 167",    state: "FL", sev: "minor"    as Sev, recordable: false, prev: "non-preventable" as Prev, summary: "Backed into bollard at customer site · minor scrape · no other vehicle involved", insurer: "—" },
];

const SEV_PILL: Record<Sev, string> = {
  severe:   "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  moderate: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  minor:    "bg-slate-500/15 text-slate-300 border border-slate-500/30",
};

const PREV_PILL: Record<Prev, string> = {
  preventable:      "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  "non-preventable":"bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  pending:          "bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/40",
};

const AVATAR_GRAD: Record<string, string> = {
  JL: "linear-gradient(135deg, #EF4444, #F59E0B)",
  EC: "linear-gradient(135deg, #8B5CF6, #22D3EE)",
  RW: "linear-gradient(135deg, #22D3EE, #06B6D4)",
  EA: "linear-gradient(135deg, #FBBF24, #10B981)",
  JM: "linear-gradient(135deg, #22D3EE, #10B981)",
};

export default function AccidentsPage() {
  const recordable = ACCIDENTS.filter(a => a.recordable).length;
  const pending = ACCIDENTS.filter(a => a.prev === "pending").length;

  return (
    <AppShell
      title="Accident Register"
      crumbs="INCIDENTS BRAIN · 49 CFR § 390.15 · 3-YEAR RETENTION"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            ⬆ Import register
          </button>
          <Link href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#0A1929]"
            style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
          >
            + Log new accident
          </Link>
        </>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: "Total · 3-year retention",   v: ACCIDENTS.length, c: "#22D3EE" },
            { l: "DOT-recordable",              v: recordable,       c: "#FBBF24" },
            { l: "Pending classification",      v: pending,          c: "#22D3EE" },
            { l: "Crash BASIC percentile",     v: "55",             c: "#FBBF24" },
            { l: "Severe (last 12 mo)",         v: 2,                c: "#F87171" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/50 mb-1">{s.l}</div>
              <div className="text-[26px] font-black leading-none" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Compass nudge */}
        <div
          className="rounded-2xl p-5 border flex gap-4 items-start"
          style={{
            background: "linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(15, 28, 50, 0.5))",
            borderColor: "rgba(34, 211, 238, 0.30)",
          }}
        >
          <div className="w-11 h-11 rounded-full grid place-items-center font-black text-[20px] text-[#0A1929] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 0 20px rgba(34, 211, 238, 0.4)" }}
          >
            ∞
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-[14px] mb-1">2 incidents need preventability classification</div>
            <div className="text-[13px] text-white/75 leading-relaxed mb-3">
              <strong className="text-white">ACC-0042 (Joshua Lee)</strong> and <strong className="text-white">ACC-0041 (Emma Cooper)</strong> are 60+ days old and still un-classified. Per § 385.5 SMS methodology, unclassified accidents count against your Crash BASIC the same as preventable ones. Want me to walk you through the FMCSA recommended-practice classification for each?
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 rounded-full text-[12px] font-bold text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>
                Classify both →
              </button>
              <button className="px-4 py-2 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                Read FMCSA preventability criteria
              </button>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {["All 5", "DOT-recordable 3", "Pending classification 2", "Severe 2", "Hazmat incidents 0"].map((f, i) => (
            <button
              key={i}
              className={`text-[12px] font-semibold px-3 py-2 rounded-full border ${
                i === 0
                  ? "bg-[#22D3EE]/15 border-[#22D3EE]/40 text-[#22D3EE]"
                  : "border-[#1E3556] text-white/70 hover:border-[#22D3EE]/40 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Register cards */}
        <div className="space-y-3">
          {ACCIDENTS.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl p-5 border border-[#1E3556] flex flex-col md:flex-row gap-4 hover:border-[#22D3EE]/40 transition-colors"
              style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}
            >
              <div className="flex items-center gap-3 md:flex-col md:items-start md:min-w-[160px]">
                <div className="w-10 h-10 rounded-full grid place-items-center font-extrabold text-[12px] text-[#0A1929]"
                  style={{ background: AVATAR_GRAD[a.initials] }}
                >
                  {a.initials}
                </div>
                <div>
                  <div className="text-white font-bold">{a.driver}</div>
                  <div className="text-[11px] text-white/55 font-mono">{a.unit}</div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-[11px] text-[#22D3EE]/80">{a.id}</span>
                  <span className="text-white/45 text-[12px]">·</span>
                  <span className="text-[13px] text-white font-bold">{a.date}</span>
                  <span className="text-white/45 text-[12px]">·</span>
                  <span className="text-[13px] text-white/85">{a.state}</span>
                  <span className={`ml-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${SEV_PILL[a.sev]}`}>{a.sev}</span>
                  {a.recordable && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">DOT-recordable</span>}
                </div>
                <p className="text-[13px] text-white/80 leading-relaxed mb-2">{a.summary}</p>
                <div className="text-[11px] text-white/45">Insurer: {a.insurer}</div>
              </div>

              <div className="md:min-w-[180px] flex md:flex-col gap-2 md:items-end">
                <div>
                  <div className="text-[10px] tracking-wider uppercase text-white/45 mb-1 text-right">Preventability</div>
                  <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ${PREV_PILL[a.prev]}`}>
                    {a.prev === "pending" ? "★ Classify now" : a.prev}
                  </span>
                </div>
                <Link href="#" className="text-[12px] font-bold text-[#22D3EE] hover:text-[#67E8F9] mt-auto">
                  Open packet →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
