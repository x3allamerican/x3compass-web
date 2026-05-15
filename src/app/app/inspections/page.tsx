import Link from "next/link";
import AppShell from "@/components/AppShell";

type Status = "clean" | "violations" | "OOS" | "contestable" | "disputed" | "won";

type Inspection = {
  id: string;
  date: string;
  driver: string;
  driverInitials: string;
  truck: string;
  state: string;
  level: string;
  violations: number;
  oos: boolean;
  basic: string;
  status: Status;
  dataq: string | null;
};

const INSPECTIONS: Inspection[] = [
  { id: "INS-4291", date: "2026-05-12", driver: "Ricardo Torres", driverInitials: "RT", truck: "Unit 156A", state: "TX", level: "Level II", violations: 2, oos: false, basic: "HOS · Vehicle",       status: "contestable", dataq: "Time-of-day error · 80% win" },
  { id: "INS-4287", date: "2026-05-08", driver: "Jared Martinez",  driverInitials: "JM", truck: "Unit 109",  state: "OK", level: "Level I",  violations: 0, oos: false, basic: "—",                  status: "clean",       dataq: null },
  { id: "INS-4281", date: "2026-05-05", driver: "Mike Kowalski",   driverInitials: "MK", truck: "Unit 154",  state: "AR", level: "Level III",violations: 0, oos: false, basic: "—",                  status: "clean",       dataq: null },
  { id: "INS-4276", date: "2026-05-02", driver: "Ricardo Torres",  driverInitials: "RT", truck: "Unit 156A", state: "NM", level: "Level II", violations: 1, oos: false, basic: "HOS",                status: "contestable", dataq: "Wrong CFR cited · 65% win" },
  { id: "INS-4272", date: "2026-04-29", driver: "Diego Ramirez",   driverInitials: "DR", truck: "Unit 167",  state: "FL", level: "Level I",  violations: 0, oos: false, basic: "—",                  status: "clean",       dataq: null },
  { id: "INS-4268", date: "2026-04-26", driver: "Emma Park",       driverInitials: "EP", truck: "Unit 134",  state: "NM", level: "Level II", violations: 3, oos: true,  basic: "Vehicle Maint",      status: "violations",  dataq: null },
  { id: "INS-4263", date: "2026-04-22", driver: "Ricardo Torres",  driverInitials: "RT", truck: "Unit 156A", state: "TX", level: "Level II", violations: 1, oos: false, basic: "HOS",                status: "contestable", dataq: "Off-duty mislogged · 71% win" },
  { id: "INS-4259", date: "2026-04-18", driver: "Sarah Johnson",   driverInitials: "SJ", truck: "Unit 109",  state: "AR", level: "Level III",violations: 1, oos: false, basic: "Driver Fitness",     status: "disputed",    dataq: "Submitted 2026-04-25 · pending" },
  { id: "INS-4252", date: "2026-04-14", driver: "Alex Carter",     driverInitials: "AC", truck: "Trailer T-12", state: "TX", level: "Level VI",violations: 0, oos: false, basic: "—",               status: "clean",       dataq: null },
  { id: "INS-4248", date: "2026-04-11", driver: "Jared Martinez",  driverInitials: "JM", truck: "Unit 109",  state: "MO", level: "Level I",  violations: 0, oos: false, basic: "—",                  status: "won",         dataq: "Won · 2026-04-20 · -2 violations" },
];

const STATUS_PILL: Record<Status, { bg: string; text: string; border: string; label: string }> = {
  clean:       { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30", label: "Clean" },
  violations:  { bg: "bg-rose-500/15",    text: "text-rose-300",    border: "border-rose-500/30",    label: "Violations" },
  OOS:         { bg: "bg-rose-600/20",    text: "text-rose-300",    border: "border-rose-500/40",    label: "OOS" },
  contestable: { bg: "bg-[#22D3EE]/15",   text: "text-[#22D3EE]",   border: "border-[#22D3EE]/40",   label: "★ Contestable" },
  disputed:    { bg: "bg-amber-500/15",   text: "text-amber-300",   border: "border-amber-500/30",   label: "Dispute filed" },
  won:         { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30", label: "Won" },
};

const AVATAR_GRAD: Record<string, string> = {
  RT: "linear-gradient(135deg, #8B5CF6, #22D3EE)",
  JM: "linear-gradient(135deg, #22D3EE, #06B6D4)",
  MK: "linear-gradient(135deg, #22D3EE, #10B981)",
  DR: "linear-gradient(135deg, #10B981, #22D3EE)",
  EP: "linear-gradient(135deg, #EF4444, #8B5CF6)",
  SJ: "linear-gradient(135deg, #F59E0B, #EF4444)",
  AC: "linear-gradient(135deg, #FBBF24, #10B981)",
};

export default function InspectionsPage() {
  const contestable = INSPECTIONS.filter(i => i.status === "contestable").length;
  const wonYTD = 21;
  const wonDollars = "$18.4k";

  return (
    <AppShell
      title="Inspections & DataQ Disputes"
      crumbs="INSPECTIONS BRAIN · 49 CFR § 396.9 · CSA · DATAQ"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            ⬆ Log inspection
          </button>
          <Link href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#0A1929]"
            style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
          >
            ★ Draft DataQ disputes ({contestable})
          </Link>
        </>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: "Inspections · 30d",  v: 10,                  c: "#22D3EE" },
            { l: "Clean rate",          v: "89%",               c: "#10B981" },
            { l: "★ Contestable",       v: contestable,          c: "#22D3EE" },
            { l: "DataQ wins · YTD",   v: wonYTD,              c: "#10B981" },
            { l: "$ saved · YTD",       v: wonDollars,          c: "#FBBF24" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/50 mb-1">{s.l}</div>
              <div className="text-[26px] font-black leading-none" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Compass DataQ nudge */}
        <div
          className="rounded-2xl p-5 border flex gap-4 items-start"
          style={{
            background: "linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(15, 28, 50, 0.5))",
            borderColor: "rgba(34, 211, 238, 0.35)",
          }}
        >
          <div
            className="w-11 h-11 rounded-full grid place-items-center font-black text-[20px] text-[#0A1929] flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
              boxShadow: "0 0 20px rgba(34, 211, 238, 0.45)",
            }}
          >
            ∞
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-extrabold text-white">Compass</span>
              <span className="text-[12px] text-white/55">· DataQ analysis · last run 2 min ago</span>
            </div>
            <p className="text-[15px] text-white/90 leading-relaxed mb-3">
              I&apos;ve flagged <strong className="text-[#22D3EE]">3 inspections</strong> as contestable this month — all on{" "}
              <strong className="text-white">Ricardo Torres</strong>. Two have time-of-day errors against the ELD log (§ 395.20), one cites the wrong CFR. Average win value:{" "}
              <strong className="text-emerald-300">$300/violation</strong> in avoided premium impact. Aggregate win probability:{" "}
              <strong className="text-[#22D3EE]">72%</strong>.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 rounded-full text-[12px] font-bold text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>
                Draft all 3 disputes →
              </button>
              <button className="px-4 py-2 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                Review each individually
              </button>
              <button className="px-4 py-2 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                Email Ricardo first
              </button>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {["All 30d", "Contestable 3", "Disputed 1", "Won 8", "OOS 1", "Clean 5"].map((f, i) => (
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

        {/* Inspections table */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556] flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[15px] font-extrabold text-white">Roadside inspections · last 30 days</h3>
            <span className="text-[11px] font-mono text-[#22D3EE]/70">§ 396.9 · FMCSA SAFER</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#0F1C32]/60">
                <tr className="text-left text-[10px] tracking-[.14em] uppercase font-bold text-white/45">
                  <th className="py-3 px-4">Insp #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Driver</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">State · Level</th>
                  <th className="py-3 px-3">BASIC</th>
                  <th className="py-3 px-3 text-center">Violations</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">DataQ</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3556]">
                {INSPECTIONS.map((i) => {
                  const s = STATUS_PILL[i.status];
                  return (
                    <tr key={i.id} className="hover:bg-[#22D3EE]/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-white/80 text-[12px]">{i.id}</td>
                      <td className="py-3 px-3 text-white/85">{i.date}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full grid place-items-center font-bold text-[10px] text-[#0A1929] flex-shrink-0"
                            style={{ background: AVATAR_GRAD[i.driverInitials] }}
                          >
                            {i.driverInitials}
                          </div>
                          <span className="text-white truncate">{i.driver}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-white/80 font-mono text-[12px]">{i.truck}</td>
                      <td className="py-3 px-3 text-white/85">{i.state} · <span className="text-white/55">{i.level}</span></td>
                      <td className="py-3 px-3 text-white/65 text-[12px]">{i.basic}</td>
                      <td className="py-3 px-3 text-center">
                        {i.violations === 0 ? (
                          <span className="text-emerald-400 font-bold">0</span>
                        ) : (
                          <span className={`font-bold ${i.oos ? "text-rose-400" : "text-amber-300"}`}>
                            {i.violations}{i.oos && " · OOS"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${s.bg} ${s.text} border ${s.border}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[12px] text-white/70">
                        {i.dataq ?? <span className="text-white/30">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {i.status === "contestable" ? (
                          <button className="text-[12px] font-bold text-[#0A1929] px-3 py-1 rounded-full"
                            style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                          >
                            Draft dispute →
                          </button>
                        ) : (
                          <Link href="#" className="text-[12px] font-bold text-[#22D3EE] hover:text-[#67E8F9]">
                            View →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-[#1E3556] flex items-center justify-between text-[12px] text-white/55">
            <span>10 inspections shown · last 30 days</span>
            <div className="flex items-center gap-3">
              <span>Avg dispute win value: <strong className="text-emerald-300">$300</strong></span>
              <span>·</span>
              <span>YTD savings: <strong className="text-[#22D3EE]">{wonDollars}</strong></span>
            </div>
          </div>
        </div>

        {/* Skill chips for related questions */}
        <div className="rounded-2xl p-5 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE]/70 mb-3">
            Related skills · ask Compass
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { cfr: "Part 386",   q: "Is this inspection contestable?" },
              { cfr: "§ 395.20",   q: "ELD malfunction during inspection?" },
              { cfr: "§ 396.11",   q: "Are DVIRs required if no defects?" },
              { cfr: "§ 391.41",   q: "Med cert issues found in inspection?" },
              { cfr: "Part 385",   q: "Why did my HOS BASIC spike?" },
            ].map((s, i) => (
              <Link
                key={i}
                href={`/app/ask?q=${encodeURIComponent(s.q)}`}
                className="px-3 py-2 rounded-full text-[12px] text-white/80 border border-[#1E3556] hover:border-[#22D3EE]/40 hover:text-white inline-flex items-center gap-2"
              >
                <span className="text-[#22D3EE] font-mono text-[10px]">{s.cfr}</span>
                <span>{s.q}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
