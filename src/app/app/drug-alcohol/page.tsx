"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import PageGuide from "@/components/PageGuide";
import DataSourceCard from "@/components/DataSourceCard";
import CTPAPickerCard, { type Ctpa } from "@/components/CTPAPickerCard";
import { ClearinghouseStatusPanel } from "@/components/app/ClearinghouseStatusPanel";

type TestType = "Pre-employment" | "Random" | "Post-accident" | "Reasonable suspicion" | "Return-to-duty" | "Follow-up";
type TestResult = "Negative" | "Negative-dilute" | "Positive" | "Refusal" | "Pending";

const TESTS: { id: string; date: string; driver: string; initials: string; type: TestType; panel: string; mro: string; result: TestResult }[] = [
  { id: "DA-1284", date: "2026-05-08", driver: "Jared Martinez",  initials: "JM", type: "Random",        panel: "DOT 5-panel + ETOH", mro: "Health Street",    result: "Negative" },
  { id: "DA-1283", date: "2026-05-08", driver: "Mike Kowalski",    initials: "MK", type: "Random",        panel: "DOT 5-panel + ETOH", mro: "Health Street",    result: "Negative" },
  { id: "DA-1282", date: "2026-05-08", driver: "Emma Park",        initials: "EP", type: "Random",        panel: "DOT 5-panel + ETOH", mro: "Health Street",    result: "Pending" },
  { id: "DA-1280", date: "2026-04-22", driver: "Joshua Lee",       initials: "JL", type: "Post-accident", panel: "DOT 5-panel + ETOH", mro: "US Compliance",     result: "Negative" },
  { id: "DA-1278", date: "2026-04-18", driver: "Sarah Johnson",    initials: "SJ", type: "Random",        panel: "DOT 5-panel + ETOH", mro: "Health Street",    result: "Refusal" },
  { id: "DA-1275", date: "2026-04-02", driver: "Diego Ramirez",    initials: "DR", type: "Pre-employment",panel: "DOT 5-panel",        mro: "eScreen",          result: "Negative" },
  { id: "DA-1271", date: "2026-03-15", driver: "Linda Wilson",     initials: "LW", type: "Random",        panel: "DOT 5-panel + ETOH", mro: "Health Street",    result: "Negative-dilute" },
  { id: "DA-1268", date: "2026-03-04", driver: "Ricardo Torres",   initials: "RT", type: "Random",        panel: "DOT 5-panel + ETOH", mro: "Health Street",    result: "Negative" },
  { id: "DA-1262", date: "2026-02-19", driver: "Alex Carter",      initials: "AC", type: "Pre-employment",panel: "DOT 5-panel",        mro: "eScreen",          result: "Negative" },
  { id: "DA-1258", date: "2026-02-08", driver: "Emma Cooper",      initials: "EC", type: "Post-accident", panel: "DOT 5-panel + ETOH", mro: "US Compliance",     result: "Positive" },
];

const CH_QUEUE = [
  { driver: "Ricardo Torres",   initials: "RT", type: "Annual (full)",       due: "2026-05-19", overdueDays: 0,  cfr: "§ 382.701(b)" },
  { driver: "Sarah Johnson",    initials: "SJ", type: "Annual (limited)",    due: "2026-05-22", overdueDays: 0,  cfr: "§ 382.701(b)" },
  { driver: "Emma Park",        initials: "EP", type: "Annual (limited)",    due: "2026-05-24", overdueDays: 0,  cfr: "§ 382.701(b)" },
  { driver: "Mike Kowalski",    initials: "MK", type: "Annual (limited)",    due: "2026-06-02", overdueDays: 0,  cfr: "§ 382.701(b)" },
  { driver: "Emma Cooper",      initials: "EC", type: "Violation report",     due: "2026-02-11", overdueDays: 90, cfr: "§ 382.705" },
];

const RESULT_PILL: Record<TestResult, string> = {
  Negative:          "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  "Negative-dilute": "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  Positive:          "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  Refusal:           "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  Pending:           "bg-[#16C7FF]/15 text-[#16C7FF] border border-[#16C7FF]/30",
};

const AVATAR_GRAD: Record<string, string> = {
  JM: "linear-gradient(135deg, #16C7FF, #16C7FF)",
  RT: "linear-gradient(135deg, #8B5CF6, #16C7FF)",
  SJ: "linear-gradient(135deg, #F59E0B, #EF4444)",
  MK: "linear-gradient(135deg, #16C7FF, #10B981)",
  EP: "linear-gradient(135deg, #EF4444, #8B5CF6)",
  DR: "linear-gradient(135deg, #10B981, #16C7FF)",
  AC: "linear-gradient(135deg, #FBBF24, #10B981)",
  LW: "linear-gradient(135deg, #16C7FF, #F59E0B)",
  JL: "linear-gradient(135deg, #EF4444, #F59E0B)",
  EC: "linear-gradient(135deg, #8B5CF6, #16C7FF)",
};

export default function DrugAlcoholPage() {
  const { carrier } = useUser();
  if (carrier) return <RealDrugAlcohol carrierId={carrier.id} />;

  return (
    <AppShell
      title="Drug & Alcohol Testing"
      crumbs="D&A BRAIN · 49 CFR PART 382"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            ⬆ Import test log
          </button>
          <Link href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#000000]"
            style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)", boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)" }}
          >
            + Log a test
          </Link>
        </>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* HOW THIS PAGE WORKS */}
        <PageGuide
          cfr="49 CFR Part 382"
          what="Your D&A program: pre-employment, random pool, post-accident triggers, Clearinghouse queries, return-to-duty workflow, and follow-up testing."
          who="Every motor carrier with CDL drivers · Part 382 applies even to owner-operators (they join a Consortium/TPA pool). Random testing rates are 50% drugs / 10% alcohol annually."
          howTo={[
            { n: 1, title: "Connect your testing provider (Quest, LabCorp, Health Street, eScreen)", detail: "OAuth/API pulls every test result automatically · collection date, panel, MRO determination, final result. Clearinghouse reporting happens within the required 1 business day." },
            { n: 2, title: "Or upload test results CSV", detail: "Template: test ID, driver, date, type (pre-employment / random / post-accident / RS / RTD / follow-up), panel, MRO, result. Useful if your TPA gives you results monthly via email." },
            { n: 3, title: "Or enter results one at a time", detail: "+ Add test result · for small fleets, occasional standalone tests, or post-accident wizard runs." },
            { n: 4, title: "Run the post-accident wizard when needed", detail: "After any crash, the Post-Accident button walks you through the 3 § 382.303 triggers (fatality, injury+citation, tow-away+citation) and tells you whether tests are required + deadlines (alcohol 8h, drugs 32h)." },
          ]}
          weeklyHabits={["Check your random rate YTD · Compass shows current % vs the 50% / 10% targets", "Review Clearinghouse limited queries · annually for every driver", "Verify Clearinghouse 1-day reporting on any positives/refusals/RTD from the past week"]}
          auditTraps={["Random testing rate below 50% drugs or 10% alcohol · counted at year-end against driver-pool average", "Pre-employment test missing for a driver who started safety-sensitive functions", "Clearinghouse query missing for a new hire (must be a Full query before safety-sensitive work)", "Limited query not run annually for every existing driver"]}
          askCompassLinks={[{ label: "What's my random rate this year? (Part 382)", query: "What's my random rate this year" }, { label: "When is a full Clearinghouse query required?", query: "When is a full Clearinghouse query required" }, { label: "Driver had a crash · do I test? (§ 382.303)", query: "Driver had a crash post-accident testing" }, { label: "Refusal vs diluted result · what's a refusal?", query: "Refusal vs diluted result" }]}
        />

        {/* C/TPA · pick your consortium/third-party administrator */}
        {/* Demo-mode safe: pass undefined carrierId · picker handles real auth itself */}
        <CTPAPickerCard carrierId={undefined} />

        {/* DATA SOURCE */}
        <DataSourceCard
          trackerLabel="Drug & Alcohol"
          cfr="49 CFR Part 382"
          initialStatus="connected"
          connectedVendor="Health Street"
          lastSync="47 min ago"
          recordCount={184}
          vendors={[
            { name: "Health Street", blurb: "Test ordering + result delivery", badge: "Recommended", status: "live", cost: "Per-test pricing" },
            { name: "Quest Diagnostics", blurb: "Direct lab feed · MRO included", badge: "API key", status: "live", cost: "Per-test pricing" },
            { name: "LabCorp", blurb: "Direct lab feed · MRO via partner", badge: "API key", status: "live", cost: "Per-test pricing" },
            { name: "eScreen (Alere)", blurb: "Random selection + collection site network", badge: "OAuth", status: "live", cost: "Per-test pricing" },
            { name: "FormFox", blurb: "Multi-lab clearinghouse with auto-MRO", badge: "API key", status: "live", cost: "Per-test pricing" },
            { name: "USDOT Compliance", blurb: "Consortium random pool + reporting", status: "manual-pull", cost: "$8/driver/mo" },
          ]}
          csvTemplate={{
            name: "x3-compass-drug-alcohol-template.csv",
            columns: ["test_id", "driver_id", "date", "test_type", "panel", "mro", "result", "collection_site"],
          }}
          manualLabel="Add test result"
        />

        {/* Random rate + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-4">
          <div className="rounded-2xl p-5 border border-[#1E3556] flex items-center gap-5"
            style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}
          >
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1E3556" strokeWidth="10" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#16C7FF" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 42 * 0.50} ${2 * Math.PI * 42}`}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 6px rgba(2, 6, 12, 0.45))" }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-[24px] font-black text-white">50%</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[.14em] uppercase font-extrabold text-[#16C7FF] mb-1">
                Random rate · this period
              </div>
              <div className="text-white font-bold text-[18px]">18 of 72 CDL drivers</div>
              <div className="text-white/70 text-[14px] mt-1">
                FMCSA minimum: <strong className="text-white">50%</strong> drug · <strong className="text-white">10%</strong> alcohol · § 382.305
              </div>
              <div className="text-emerald-300 text-[13px] mt-1 font-bold">★ Compliant for Q2 2026</div>
            </div>
          </div>

          {[
            { l: "Tests · YTD",    v: "94", c: "#16C7FF" },
            { l: "Pending results", v: "1",  c: "#FBBF24" },
            { l: "Positives + refusals · YTD", v: "2", c: "#F87171" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-5 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
              <div className="text-[11px] tracking-[.14em] uppercase font-extrabold text-white/65 mb-1">{s.l}</div>
              <div className="text-[28px] font-black leading-none" style={{ color: s.c }}>{s.v}</div>
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
            style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)", boxShadow: "0 0 20px rgba(2, 6, 12, 0.45)" }}
          >
            ∞
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-[15px] mb-1">
              Clearinghouse reporting overdue · § 382.705 · 90 days past due
            </div>
            <div className="text-[14px] text-white/85 leading-relaxed mb-3">
              <strong className="text-white">Emma Cooper</strong> tested positive on{" "}
              <strong className="text-white">2026-02-08</strong> (case DA-1258). Employer reporting to the Clearinghouse is required within{" "}
              <strong className="text-rose-300">3 business days</strong>. I&apos;ve drafted the violation report · review and submit.
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 rounded-full text-[13px] font-bold text-[#000000]"
                style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
              >
                Review draft + submit →
              </button>
              <button className="px-4 py-2 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5">
                Open Emma&apos;s file
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-[#000000] border border-[#1E3556] w-fit">
          {["Test log", "Random pool", "Clearinghouse queue", "Refusals & SAP"].map((t, i) => (
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

        {/* Test log */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556] flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[16px] font-extrabold text-white">Recent tests</h3>
            <span className="text-[12px] font-mono text-[#16C7FF]/80">Part 382 · 5-year retention</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead className="bg-[#0F1C32]/60">
                <tr className="text-left text-[11px] tracking-[.14em] uppercase font-extrabold text-white/60">
                  <th className="py-3 px-4">Test #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Driver</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Panel</th>
                  <th className="py-3 px-3">MRO / Vendor</th>
                  <th className="py-3 px-3">Result</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3556]">
                {TESTS.map((t) => (
                  <tr key={t.id} className="hover:bg-[#16C7FF]/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-white/85 text-[13px]">{t.id}</td>
                    <td className="py-3 px-3 text-white/90">{t.date}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full grid place-items-center font-bold text-[11px] text-[#000000] flex-shrink-0"
                          style={{ background: AVATAR_GRAD[t.initials] }}
                        >
                          {t.initials}
                        </div>
                        <span className="text-white">{t.driver}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white/90">{t.type}</td>
                    <td className="py-3 px-3 text-white/80 text-[13px]">{t.panel}</td>
                    <td className="py-3 px-3 text-white/80 text-[13px]">{t.mro}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${RESULT_PILL[t.result]}`}>
                        {t.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href="#" className="text-[13px] font-bold text-[#16C7FF] hover:text-[#16C7FF]">
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-[#1E3556] flex items-center justify-between text-[13px] text-white/60">
            <span>10 of 94 tests · last 90 days</span>
            <span>5-year retention per § 382.401</span>
          </div>
        </div>

        {/* Clearinghouse queue */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556] flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-[16px] font-extrabold text-white">Clearinghouse queue</h3>
              <p className="text-[13px] text-white/65 mt-0.5">Annual queries due + violation reports owed</p>
            </div>
            <span className="text-[12px] font-mono text-[#16C7FF]/80">§ 382.701 · § 382.705</span>
          </div>
          <div className="divide-y divide-[#1E3556]">
            {CH_QUEUE.map((c, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full grid place-items-center font-bold text-[12px] text-[#000000] flex-shrink-0"
                    style={{ background: AVATAR_GRAD[c.initials] || "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
                  >
                    {c.initials}
                  </div>
                  <div>
                    <div className="text-white font-bold">{c.driver}</div>
                    <div className="text-[12.5px] text-white/65 font-mono">{c.type} · {c.cfr}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-right">
                    <div className="text-[11px] text-white/55 uppercase tracking-wide">Due</div>
                    <div className={`text-[14px] font-bold ${c.overdueDays > 0 ? "text-rose-300" : "text-white"}`}>
                      {c.due}
                    </div>
                  </div>
                  {c.overdueDays > 0 ? (
                    <span className="px-3 py-1 rounded-full text-[11.5px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {c.overdueDays}d overdue
                    </span>
                  ) : (
                    <button className="px-3 py-1.5 rounded-full text-[12px] font-bold text-[#000000]"
                      style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
                    >
                      Run query →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}


// ── Real-tenant Drug & Alcohol test log (49 CFR Part 382), from compass_da_tests ──
type DaTestRow = { id: string; driver_name: string | null; test_date: string; test_type: string; panel: string | null; mro: string | null; result: TestResult };

function RealDrugAlcohol({ carrierId }: { carrierId: string }) {
  const [rows, setRows] = useState<DaTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ctpaInitial, setCtpaInitial] = useState<ComponentProps<typeof CTPAPickerCard>["initial"]>(undefined);
  useEffect(() => {
    let live = true;
    (async () => {
      const sb = getSupabase();
      const [tests, drivers, cs] = await Promise.all([
        sb.from("compass_da_tests").select("id,driver_id,test_type,collected_on,result,lab,mro_notes").eq("carrier_id", carrierId).order("collected_on", { ascending: false }),
        sb.from("compass_drivers").select("id,first_name,last_name").eq("carrier_id", carrierId),
        sb.from("compass_carriers").select("ctpa_mode,ctpa_custom_name,ctpa_id,ctpa:compass_ctpas(*)").eq("id", carrierId).maybeSingle(),
      ]);
      if (!live) return;
      if (cs.data) {
        const c = cs.data as Record<string, unknown>;
        const ctpaObj = (Array.isArray(c.ctpa) ? c.ctpa[0] : c.ctpa) as Ctpa | null | undefined;
        setCtpaInitial({ ctpa_id: (c.ctpa_id as string) ?? null, ctpa_mode: c.ctpa_mode, ctpa_custom_name: (c.ctpa_custom_name as string) ?? null, ctpa: ctpaObj ?? null } as ComponentProps<typeof CTPAPickerCard>["initial"]);
      }
      const nameById: Record<string, string> = {};
      for (const d of (drivers.data as Array<{ id: string; first_name: string; last_name: string }>) || []) nameById[d.id] = `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim();
      const mapped: DaTestRow[] = ((tests.data as Array<Record<string, unknown>>) || []).map((r) => ({
        id: String(r.id),
        driver_name: r.driver_id ? (nameById[String(r.driver_id)] || null) : null,
        test_date: (r.collected_on as string) || "—",
        test_type: (r.test_type as string) || "—",
        panel: (r.lab as string) ?? null,
        mro: (r.mro_notes as string) ?? null,
        result: ((r.result as TestResult) || "Pending"),
      }));
      setRows(mapped); setLoading(false);
    })();
    return () => { live = false; };
  }, [carrierId]);

  const stats = useMemo(() => {
    const total = rows.length;
    const positives = rows.filter(r => r.result === "Positive" || r.result === "Refusal").length;
    const pending = rows.filter(r => r.result === "Pending").length;
    const random = rows.filter(r => r.test_type === "Random").length;
    return { total, positives, pending, random };
  }, [rows]);

  if (loading) return <AppShell title="Drug & Alcohol Testing"><div className="p-8 text-white/60 text-[13px]">Loading test log…</div></AppShell>;

  if (rows.length === 0) {
    return (
          <AppShell title="Drug & Alcohol Testing">
            <div className="p-6"><CTPAPickerCard carrierId={carrierId} initial={ctpaInitial} /></div>
            <div className="px-6"><ClearinghouseStatusPanel /></div>
            <div className="p-8 pt-2 max-w-2xl">
          <div className="rounded-xl border border-dashed border-[#1E3556] bg-[#0C1A30] px-6 py-14 text-center">
            <div className="text-3xl mb-3" aria-hidden>🧪</div>
            <div className="text-[15px] font-extrabold text-white">No test records yet</div>
            <p className="mt-1.5 mx-auto max-w-md text-[13px] text-white/60">Log a DOT drug or alcohol test — or connect your C/TPA — and your random pool, MRO results, and Clearinghouse queries appear here, tracked against 49 CFR Part 382.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Drug & Alcohol Testing">
      <div className="p-6 pb-0"><CTPAPickerCard carrierId={carrierId} initial={ctpaInitial} /></div>
      <div className="p-6 space-y-6">
        <ClearinghouseStatusPanel />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[["Tests on file", stats.total], ["Random tests", stats.random], ["Pending results", stats.pending], ["Positives / refusals", stats.positives]].map(([label, val]) => (
            <div key={String(label)} className="rounded-xl border border-[#1E3556] bg-[#0C1A30] p-4">
              <div className="text-[10px] tracking-wider uppercase text-white/45">{label}</div>
              <div className="text-[24px] font-black text-white tabular-nums">{val as number}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#1E3556] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-white/40 bg-[#091525]">
            <span>Driver</span><span>Type</span><span>Date</span><span>Result</span>
          </div>
          {rows.map((t) => (
            <div key={t.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-4 py-3 border-t border-[#1E3556]">
              <div className="min-w-0"><div className="text-[13px] font-semibold text-white truncate">{t.driver_name || "—"}</div><div className="text-[10px] text-white/45">{t.panel || ""}{t.mro ? ` · ${t.mro}` : ""}</div></div>
              <span className="text-[12px] text-white/70">{t.test_type}</span>
              <span className="text-[12px] text-white/60 tabular-nums">{t.test_date}</span>
              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${RESULT_PILL[t.result] || RESULT_PILL.Pending}`}>{t.result}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-white/40">Decision support · every determination is the carrier&apos;s and the MRO&apos;s. 49 CFR Part 382.</p>
      </div>
    </AppShell>
  );
}
