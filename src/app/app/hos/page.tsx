import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageGuide from "@/components/PageGuide";
import DataSourceCard from "@/components/DataSourceCard";

type ClockState = "driving" | "on-duty" | "off-duty" | "sleeper" | "violation";

type DriverHOS = {
  initials: string;
  name: string;
  state: string;
  status: ClockState;
  duty14: { used: number; limit: 14 };
  drive11: { used: number; limit: 11 };
  cycle70: { used: number; limit: 70 };
  break30: { needed: boolean; until: string };
  note: string;
};

const HOS_DATA: DriverHOS[] = [
  { initials: "JM", name: "Jared Martinez", state: "Driving · I-40 OK",
    status: "driving",
    duty14: { used: 8.5, limit: 14 }, drive11: { used: 6.2, limit: 11 }, cycle70: { used: 42, limit: 70 },
    break30: { needed: false, until: "OK" },
    note: "Clean · 5.5h drive left",
  },
  { initials: "RT", name: "Ricardo Torres", state: "On-duty · loading TX",
    status: "violation",
    duty14: { used: 13.8, limit: 14 }, drive11: { used: 9.8, limit: 11 }, cycle70: { used: 68, limit: 70 },
    break30: { needed: true,  until: "REQUIRED NOW" },
    note: "⚠ Approaching 14h limit · break required",
  },
  { initials: "MK", name: "Mike Kowalski", state: "Off-duty · home",
    status: "off-duty",
    duty14: { used: 0, limit: 14 }, drive11: { used: 0, limit: 11 }, cycle70: { used: 22, limit: 70 },
    break30: { needed: false, until: "—" },
    note: "10h restart at 02:00 CST",
  },
  { initials: "DR", name: "Diego Ramirez", state: "Driving · I-95 FL",
    status: "driving",
    duty14: { used: 4.2, limit: 14 }, drive11: { used: 3.5, limit: 11 }, cycle70: { used: 18, limit: 70 },
    break30: { needed: false, until: "OK" },
    note: "Fresh start · 7.5h drive available",
  },
  { initials: "EP", name: "Emma Park", state: "Sleeper · TX",
    status: "sleeper",
    duty14: { used: 11.0, limit: 14 }, drive11: { used: 8.2, limit: 11 }, cycle70: { used: 51, limit: 70 },
    break30: { needed: false, until: "Off-clock" },
    note: "Split sleeper berth (8 hr block)",
  },
  { initials: "SJ", name: "Sarah Johnson", state: "On-duty · pre-trip",
    status: "on-duty",
    duty14: { used: 0.3, limit: 14 }, drive11: { used: 0, limit: 11 }, cycle70: { used: 31, limit: 70 },
    break30: { needed: false, until: "OK" },
    note: "Pre-trip inspection · 25 min in",
  },
  { initials: "AC", name: "Alex Carter", state: "Off-duty · home",
    status: "off-duty",
    duty14: { used: 0, limit: 14 }, drive11: { used: 0, limit: 11 }, cycle70: { used: 14, limit: 70 },
    break30: { needed: false, until: "—" },
    note: "Day off · restart complete",
  },
  { initials: "LW", name: "Linda Wilson", state: "Driving · I-75 GA",
    status: "driving",
    duty14: { used: 9.8, limit: 14 }, drive11: { used: 7.1, limit: 11 }, cycle70: { used: 55, limit: 70 },
    break30: { needed: false, until: "Break taken 13:45" },
    note: "Clean · 3.9h drive left",
  },
];

const STATUS_COLOR: Record<ClockState, { bg: string; text: string; dot: string; label: string }> = {
  driving:   { bg: "bg-emerald-500/15", text: "text-emerald-300",  dot: "#10B981", label: "Driving" },
  "on-duty": { bg: "bg-[#22D3EE]/15",   text: "text-[#22D3EE]",    dot: "#22D3EE", label: "On-duty" },
  "off-duty":{ bg: "bg-slate-500/15",   text: "text-slate-300",    dot: "#94A3B8", label: "Off-duty" },
  sleeper:   { bg: "bg-violet-500/15",  text: "text-violet-300",   dot: "#A78BFA", label: "Sleeper" },
  violation: { bg: "bg-rose-500/15",    text: "text-rose-300",     dot: "#F87171", label: "★ Violation risk" },
};

const AVATAR_GRAD: Record<string, string> = {
  JM: "linear-gradient(135deg, #22D3EE, #06B6D4)",
  RT: "linear-gradient(135deg, #8B5CF6, #22D3EE)",
  MK: "linear-gradient(135deg, #22D3EE, #10B981)",
  DR: "linear-gradient(135deg, #10B981, #22D3EE)",
  EP: "linear-gradient(135deg, #EF4444, #8B5CF6)",
  SJ: "linear-gradient(135deg, #F59E0B, #EF4444)",
  AC: "linear-gradient(135deg, #FBBF24, #10B981)",
  LW: "linear-gradient(135deg, #22D3EE, #F59E0B)",
};

function ClockBar({ label, used, limit, warn }: { label: string; used: number; limit: number; warn?: boolean }) {
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct > 90 ? "#F87171" : pct > 75 ? "#FBBF24" : "#22D3EE";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="font-bold text-white/70">{label}</span>
        <span className={`font-mono font-bold ${warn ? "text-rose-300" : "text-white"}`}>
          {used.toFixed(1)} / {limit}h
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1E3556] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }} />
      </div>
    </div>
  );
}

export default function HOSPage() {
  const driving = HOS_DATA.filter(d => d.status === "driving").length;
  const violations = HOS_DATA.filter(d => d.status === "violation").length;

  return (
    <AppShell
      title="Hours of Service · ELD"
      crumbs="HOS / ELD BRAIN · 49 CFR PART 395"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            🔄 Refresh ELD
          </button>
          <Link href="/app/ask?skill=hours-of-service" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#0A1929]"
            style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
          >
            ★ Ask Compass · HOS
          </Link>
        </>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* HOW THIS PAGE WORKS */}
        <PageGuide
          cfr="49 CFR Part 395"
          what="Track every driver's 14-hour duty window, 11-hour drive limit, 30-minute break, and 70-hour cycle — live from your ELD, CSV, or paper logs."
          who="Every motor carrier with drivers operating CMVs in interstate commerce. Even owner-operators driving solo need RODS or short-haul time records. Short-haul-exempt drivers (returning to base within 14 hours, ≤150 air-mile radius) keep simpler time records but still need them."
          howTo={[
            { n: 1, title: "Connect your ELD (the fast path)", detail: "Hit Connect → Motive / Samsara / Geotab / Omnitracs / EROAD. OAuth + sync takes ~3 min. RODS auto-pull every 60 seconds. This is what most fleets do." },
            { n: 2, title: "Or import CSV from any registered ELD", detail: "Download the X3 HOS RODS template, export from your ELD into matching columns, drag and drop. Compass parses dates, duty statuses, locations, and links them to your drivers automatically." },
            { n: 3, title: "Or enter paper logs manually", detail: "Use the + Add log entry button (Option C). Best for short-haul-exempt drivers or rare paper-log days during ELD malfunction (max 8 days per § 395.34)." },
            { n: 4, title: "Review the live driver clocks dashboard", detail: "Every driver shows three progress bars: 14-hour duty window, 11-hour drive, 70-hour cycle. Red = violation risk in next 60 minutes. Yellow = approaching limit. Green = clean." },
            { n: 5, title: "Respond to Compass nudges", detail: "When a driver hits 13.5 of 14 hours, Compass auto-pings their ELD with a stop-now alert and surfaces the situation in the dashboard so you can call them too." },
          ]}
          weeklyHabits={["Monday: review last week's near-violations (>13h duty days) and coach drivers who showed pattern", "Friday: confirm all unassigned driving time is assigned (under § 395.32 — required within 8 days)", "Monthly: pull the HOS BASIC trend from the CSA module and look for inspections that contributed"]}
          auditTraps={["Unassigned driving time over 8 days old — auditors flag this as missing recordkeeping", "Driver edits without annotation reason codes — the audit trail shows them anyway", "Personal conveyance time logged during dispatch-assigned routes (per § 395.8 guidance — positioning is on-duty)", "ELD malfunction not paper-backed for the malfunction days"]}
          askCompassLinks={[{ label: "Walk me through the 14-hour rule (§ 395.3)", query: "Walk me through the 14-hour rule" }, { label: "When does the 16-hour exception apply? (§ 395.1(o))", query: "When does the 16-hour exception apply?" }, { label: "Explain the 7/3 split-sleeper berth (§ 395.1(g))", query: "Explain the 7/3 split-sleeper berth" }, { label: "My ELD says malfunction — what now? (§ 395.34)", query: "My ELD says malfunction what now" }]}
        />

        {/* DATA SOURCE */}
        <DataSourceCard
          trackerLabel="Hours of Service"
          cfr="49 CFR Part 395"
          initialStatus="connected"
          connectedVendor="Motive"
          lastSync="2 min ago"
          recordCount={HOS_DATA.length}
          vendors={[
            { name: "Motive (KeepTruckin)",  blurb: "Direct ELD feed · auto-pull RODS every 60s",      badge: "Recommended", status: "live", cost: "Included if you already pay Motive" },
            { name: "Samsara",               blurb: "Direct ELD + camera feed · auto-pull RODS",      badge: "OAuth",       status: "live", cost: "Included" },
            { name: "Geotab",                blurb: "Direct ELD feed via MyGeotab API",                badge: "API key",     status: "live", cost: "Included" },
            { name: "Omnitracs",             blurb: "Direct feed for One/IVG hardware",                badge: "API key",     status: "live", cost: "Included" },
            { name: "EROAD",                 blurb: "Direct ELD feed · sync every 5 min",              badge: "OAuth",       status: "live", cost: "Included" },
            { name: "PeopleNet (Trimble)",   blurb: "Trimble Connected Truck Platform",                badge: "API key",     status: "beta", cost: "Included" },
            { name: "Garmin eLog",           blurb: "Per-driver export via Garmin Fleet portal",       status: "manual-pull",                cost: "$0.10 / driver / mo" },
            { name: "Other ELD on FMCSA list", blurb: "Daily CSV export from any registered ELD",      status: "manual-pull",                cost: "$0.10 / driver / mo" },
          ]}
          csvTemplate={{
            name: "x3-compass-hos-rods-template.csv",
            columns: ["driver_name", "driver_id", "date", "duty_status", "start_time", "end_time", "location", "odometer", "notes"],
          }}
          manualLabel="Add log entry"
        />

        {/* STAT STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: "Drivers on duty",     v: HOS_DATA.length - HOS_DATA.filter(d => d.status === "off-duty").length, c: "#22D3EE" },
            { l: "Currently driving",   v: driving,    c: "#10B981" },
            { l: "★ Violation risk",    v: violations, c: "#F87171" },
            { l: "ELD malfunctions",    v: 0,          c: "#10B981" },
            { l: "HOS BASIC percentile", v: "78",      c: "#FBBF24" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/50 mb-1">{s.l}</div>
              <div className="text-[26px] font-black leading-none" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Violation alert */}
        {violations > 0 && (
          <div
            className="rounded-2xl p-5 border flex gap-4 items-start"
            style={{
              background: "linear-gradient(135deg, rgba(248, 113, 113, 0.10), rgba(15, 28, 50, 0.5))",
              borderColor: "rgba(248, 113, 113, 0.40)",
            }}
          >
            <div className="text-[24px]">⚠</div>
            <div className="flex-1">
              <div className="text-white font-extrabold text-[15px] mb-1">Ricardo Torres approaching 14-hour limit · § 395.3(a)(2)</div>
              <div className="text-[13px] text-white/80 leading-relaxed mb-3">
                He&apos;s at <strong className="text-rose-300">13.8 / 14 hours</strong>. He must take a 30-min break and stop driving within <strong className="text-rose-300">12 minutes</strong> or it&apos;s a logged violation.
                Compass already sent him an in-cab alert via the ELD. Want to call him too?
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="px-4 py-2 rounded-full text-[12px] font-bold text-[#0A1929]"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                >
                  Call Ricardo →
                </button>
                <button className="px-4 py-2 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                  Send SMS
                </button>
                <button className="px-4 py-2 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                  Read § 395.3
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Driver clocks grid */}
        <div>
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-[15px] font-extrabold text-white">Live driver clocks</h3>
            <div className="text-[11px] text-white/45">
              Refreshed every 60s · Motive ELD live feed
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HOS_DATA.map((d) => {
              const s = STATUS_COLOR[d.status];
              return (
                <div
                  key={d.initials}
                  className="rounded-2xl p-5 border border-[#1E3556] space-y-4"
                  style={{
                    background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)",
                    boxShadow: d.status === "violation" ? "0 0 0 1px rgba(248, 113, 113, 0.4) inset, 0 8px 24px rgba(248, 113, 113, 0.12)" : undefined,
                  }}
                >
                  {/* Driver header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full grid place-items-center font-extrabold text-[12px] text-[#0A1929] flex-shrink-0"
                      style={{ background: AVATAR_GRAD[d.initials] }}
                    >
                      {d.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold truncate">{d.name}</div>
                      <div className="text-[11px] text-white/55">{d.state}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${s.bg} ${s.text} flex items-center gap-1.5`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
                      {s.label}
                    </span>
                  </div>

                  {/* Clocks */}
                  <div className="space-y-2.5">
                    <ClockBar label="14-hr duty window" used={d.duty14.used} limit={d.duty14.limit} warn={d.status === "violation"} />
                    <ClockBar label="11-hr drive" used={d.drive11.used} limit={d.drive11.limit} />
                    <ClockBar label="70-hr cycle" used={d.cycle70.used} limit={d.cycle70.limit} />
                  </div>

                  {/* Note */}
                  <div className={`text-[11.5px] pt-2 border-t border-[#1E3556] ${d.status === "violation" ? "text-rose-300 font-bold" : "text-white/65"}`}>
                    {d.note}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skill chips */}
        <div className="rounded-2xl p-5 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE]/70 mb-3">
            Related skills · ask Compass
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { cfr: "Part 395",  q: "Walk me through the 14-hour rule" },
              { cfr: "§ 395.1(g)", q: "Explain the 7/3 split sleeper" },
              { cfr: "§ 395.20",  q: "My ELD says malfunction — what now?" },
              { cfr: "§ 395.3",   q: "What counts toward the 14-hour clock?" },
              { cfr: "Part 386",  q: "Is this HOS inspection contestable?" },
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
