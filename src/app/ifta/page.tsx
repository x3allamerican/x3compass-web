"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { IftaReturnModal } from "@/components/app/IftaReturnModal";
import PageGuide from "@/components/PageGuide";
import DataSourceCard from "@/components/DataSourceCard";

type ReturnStatus = "Filed" | "Ready to submit" | "Awaiting data" | "Overdue";

const RETURNS = [
  { quarter: "Q1 2026",  due: "2026-04-30", filed: "2026-04-22", taxOwed: "$3,847.20",   refund: "—",         status: "Filed" as ReturnStatus },
  { quarter: "Q4 2025",  due: "2026-01-31", filed: "2026-01-18", taxOwed: "$2,914.55",   refund: "—",         status: "Filed" as ReturnStatus },
  { quarter: "Q3 2025",  due: "2025-10-31", filed: "2025-10-12", taxOwed: "—",            refund: "$412.30",    status: "Filed" as ReturnStatus },
  { quarter: "Q2 2025",  due: "2025-07-31", filed: "2025-07-08", taxOwed: "$3,128.40",   refund: "—",         status: "Filed" as ReturnStatus },
  { quarter: "Q2 2026",  due: "2026-07-31", filed: "—",          taxOwed: "$2,184.10 (est)", refund: "—",         status: "Awaiting data" as ReturnStatus },
];

const STATE_BREAKDOWN = [
  { state: "TX", name: "Texas",       miles: 38127, gallons: 5732, tax: "$1,089.08", net: "$281.04 owed" },
  { state: "OK", name: "Oklahoma",    miles: 12442, gallons: 1908, tax: "$324.36",   net: "$87.94 owed" },
  { state: "AR", name: "Arkansas",    miles: 8211,  gallons: 1234, tax: "$284.82",   net: "$58.21 owed" },
  { state: "NM", name: "New Mexico",  miles: 9908,  gallons: 1530, tax: "$321.30",   net: "$31.45 owed" },
  { state: "FL", name: "Florida",     miles: 14217, gallons: 2168, tax: "$735.92",   net: "$112.40 owed" },
  { state: "GA", name: "Georgia",     miles: 5642,  gallons: 850,  tax: "$272.85",   net: "$24.92 refund" },
  { state: "CA", name: "California",  miles: 4128,  gallons: 624,  tax: "$501.18",   net: "$118.41 refund" },
  { state: "TN", name: "Tennessee",   miles: 3992,  gallons: 612,  tax: "$170.13",   net: "$8.67 owed" },
];

const STATUS_PILL: Record<ReturnStatus, string> = {
  Filed:             "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  "Ready to submit": "bg-[#16C7FF]/15 text-[#16C7FF] border border-[#16C7FF]/30",
  "Awaiting data":   "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  Overdue:           "bg-rose-500/15 text-rose-300 border border-rose-500/30",
};

export default function IFTAPage() {
  const { carrier } = useUser();
  if (carrier) return <RealIfta carrierId={carrier.id} />;

  return (
    <AppShell
      title="IFTA Concierge"
      crumbs="FUEL TAX · IFTA · UCR § 367"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            ⬆ Import fuel + trip data
          </button>
          <Link href="/audit-export?scope=full" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#000000]"
            style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)", boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)" }}
          >
            File current quarter →
          </Link>
        </>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* HOW THIS PAGE WORKS */}
        <PageGuide
          cfr="IFTA Articles of Agreement"
          what="Quarterly IFTA fuel-tax return prep: state-by-state mileage from your ELD or trip sheets, fuel purchases from fuel cards, automatic tax owed / refund calculation."
          who="Any motor carrier with a CMV that crosses state lines and exceeds the 26,000-lb GVW threshold. Required quarterly, due 30 days after each quarter ends."
          howTo={[
            { n: 1, title: "Connect your fuel card (WEX, Comdata, EFS, Fleet One)", detail: "OAuth/API pulls every fuel transaction with state + amount automatically. Combined with miles from your ELD, this is the fully-automated path." },
            { n: 2, title: "Connect your ELD for state-by-state mileage", detail: "Motive / Samsara / Geotab · Compass extracts state-crossings from GPS data and computes state-by-state miles per quarter." },
            { n: 3, title: "Or upload fuel + mileage CSVs", detail: "Two templates: fuel transactions (date, state, gallons, cost) and mileage by state (date, vehicle, miles per state). Useful if you do paper trip sheets." },
            { n: 4, title: "Compass generates the quarterly return", detail: "Pre-built quarterly return ready for review. Variance flags compare to prior quarters. Direct e-file to base state (when state portal supports it) or printable PDF." },
          ]}
          weeklyHabits={["Quick weekly fuel-vs-miles sanity check · Compass flags anomalies", "Late in Q4: review Q1 reconciliation to confirm payment was applied correctly"]}
          auditTraps={["Mileage from ELD vs odometer mismatch · IFTA auditors look for this", "Fuel receipts double-counted or missing", "Personal-use miles included in IFTA reporting", "Late filing penalties (returns due 30 days after quarter)"]}
          askCompassLinks={[{ label: "How do I file IFTA quarterly?", query: "How do I file IFTA quarterly" }, { label: "IFTA audit preparation · what records do I produce?", query: "IFTA audit preparation" }, { label: "IFTA mileage by state calculation", query: "IFTA mileage by state calculation" }]}
        />

        {/* DATA SOURCE */}
        <DataSourceCard
          trackerLabel="IFTA fuel + miles"
          cfr="International Fuel Tax Agreement (IFTA Articles)"
          initialStatus="imported"
          lastSync="yesterday"
          recordCount={1248}
          vendors={[
            { name: "WEX Fleet (fuel card)", blurb: "Auto-pull every fuel transaction with state + amount", badge: "Recommended", status: "live", cost: "Included with WEX" },
            { name: "Comdata Fuel", blurb: "Auto-pull fuel transactions", badge: "API key", status: "live", cost: "Included" },
            { name: "EFS (Electronic Funds Source)", blurb: "Daily fuel transaction sync", badge: "API key", status: "live", cost: "Included" },
            { name: "Fleet One Edge", blurb: "Auto-pull fuel + cash advances", badge: "API key", status: "live", cost: "Included" },
            { name: "Motive miles", blurb: "Auto-pull state-by-state mileage from ELD", badge: "OAuth", status: "live", cost: "Included with Motive" },
            { name: "Samsara miles", blurb: "Auto-pull state-by-state mileage from ELD", badge: "OAuth", status: "live", cost: "Included with Samsara" },
          ]}
          csvTemplate={{
            name: "x3-compass-ifta-template.csv",
            columns: ["trip_id", "date", "vehicle_id", "start_state", "end_state", "miles", "gallons", "fuel_cost", "fuel_state", "jurisdiction_miles_json"],
          }}
          manualLabel="Add fuel/miles entry"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: "Current quarter",       v: "Q2 '26",      c: "#16C7FF" },
            { l: "Filing due",             v: "Jul 31",     c: "#16C7FF" },
            { l: "Est. tax owed",          v: "$2,184",     c: "#FBBF24" },
            { l: "Jurisdictions",          v: "8 states",   c: "#16C7FF" },
            { l: "Avg MPG · fleet",        v: "6.65",       c: "#10B981" },
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
            background: "linear-gradient(135deg, rgba(2, 6, 12, 0.45), rgba(15, 28, 50, 0.5))",
            borderColor: "rgba(2, 6, 12, 0.45)",
          }}
        >
          <div className="w-11 h-11 rounded-full grid place-items-center font-black text-[20px] text-[#000000] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
          >
            ∞
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-[15px] mb-1">Q2 2026 is 75% complete · 47 days until filing due</div>
            <div className="text-[14px] text-white/85 leading-relaxed mb-3">
              You have <strong className="text-white">96,667 miles</strong> logged across <strong className="text-white">8 jurisdictions</strong> and <strong className="text-white">14,658 gallons</strong> of fuel purchases. Compass projects <strong className="text-amber-300">$2,184.10</strong> tax owed, primarily to Texas ($281) and California ($118 refund). Drop in your remaining ELD data and I&apos;ll have a ready-to-submit return on July 1.
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 rounded-full text-[13px] font-bold text-[#000000]"
                style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
              >
                Sync ELD mileage now →
              </button>
              <button className="px-4 py-2 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5">
                Upload fuel-card CSV
              </button>
            </div>
          </div>
        </div>

        {/* Quarter-by-quarter */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556] flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[16px] font-extrabold text-white">Quarterly filing history</h3>
            <span className="text-[12px] font-mono text-[#16C7FF]/80">IFTA · 4 years retention</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead className="bg-[#0F1C32]/60">
                <tr className="text-left text-[11px] tracking-[.14em] uppercase font-extrabold text-white/60">
                  <th className="py-3 px-4">Quarter</th>
                  <th className="py-3 px-3">Due</th>
                  <th className="py-3 px-3">Filed</th>
                  <th className="py-3 px-3">Tax owed</th>
                  <th className="py-3 px-3">Refund</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3556]">
                {RETURNS.map((r, i) => (
                  <tr key={i} className="hover:bg-[#16C7FF]/5 transition-colors">
                    <td className="py-3 px-4 text-white font-bold">{r.quarter}</td>
                    <td className="py-3 px-3 text-white/90">{r.due}</td>
                    <td className="py-3 px-3 text-white/85">{r.filed}</td>
                    <td className="py-3 px-3 text-white/90 tabular-nums">{r.taxOwed}</td>
                    <td className="py-3 px-3 text-emerald-300 tabular-nums">{r.refund}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${STATUS_PILL[r.status]}`}>
                        {r.status}
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

        {/* State breakdown */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556]">
            <h3 className="text-[16px] font-extrabold text-white">Q2 2026 · jurisdiction breakdown</h3>
            <p className="text-[13px] text-white/65 mt-0.5">Mileage and fuel auto-segmented from your ELD trip log + fuel card data.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead className="bg-[#0F1C32]/60">
                <tr className="text-left text-[11px] tracking-[.14em] uppercase font-extrabold text-white/60">
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-3 text-right">Miles</th>
                  <th className="py-3 px-3 text-right">Gallons</th>
                  <th className="py-3 px-3 text-right">Tax due</th>
                  <th className="py-3 px-3 text-right">Net (owed / refund)</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3556]">
                {STATE_BREAKDOWN.map((s) => (
                  <tr key={s.state} className="hover:bg-[#16C7FF]/5 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#16C7FF]/15 text-[#16C7FF] font-bold text-[12px]">
                        {s.state}
                      </span>
                      <span className="text-white">{s.name}</span>
                    </td>
                    <td className="py-3 px-3 text-white/90 text-right tabular-nums">{s.miles.toLocaleString()}</td>
                    <td className="py-3 px-3 text-white/85 text-right tabular-nums">{s.gallons.toLocaleString()}</td>
                    <td className="py-3 px-3 text-white/90 text-right tabular-nums">{s.tax}</td>
                    <td className={`py-3 px-3 text-right font-bold tabular-nums ${s.net.includes("refund") ? "text-emerald-300" : "text-amber-300"}`}>{s.net}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href="#" className="text-[13px] font-bold text-[#16C7FF] hover:text-[#16C7FF]">Detail →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}


// ── Real-tenant IFTA returns, from compass_ifta_returns ──
type IftaRow = { id: string; quarter: string; due_date: string | null; filed_date: string | null; tax_owed_cents: number | null; refund_cents: number | null; status: ReturnStatus };
const money = (c: number | null) => (c == null ? "—" : `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

function RealIfta({ carrierId }: { carrierId: string }) {
  const [rows, setRows] = useState<IftaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    getSupabase().from("compass_ifta_returns")
      .select("id,quarter,due_date,filed_date,tax_owed_cents,refund_cents,status")
      .eq("carrier_id", carrierId).order("due_date", { ascending: false })
      .then(({ data }) => { if (!live) return; setRows((data as IftaRow[]) || []); setLoading(false); });
    return () => { live = false; };
  }, [carrierId, reload]);
  const stats = useMemo(() => ({
    total: rows.length,
    filed: rows.filter(r => r.status === "Filed").length,
    overdue: rows.filter(r => r.status === "Overdue").length,
    awaiting: rows.filter(r => r.status === "Awaiting data" || r.status === "Ready to submit").length,
  }), [rows]);
  if (loading) return <AppShell title="IFTA Concierge"><div className="p-8 text-white/60 text-[13px]">Loading returns…</div></AppShell>;
  if (rows.length === 0) return (
    <AppShell title="IFTA Concierge" actions={<button onClick={() => setShowLog(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-extrabold text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Record a return</button>}>{showLog && <IftaReturnModal carrierId={carrierId} onClose={() => setShowLog(false)} onSaved={() => { setShowLog(false); setReload((r) => r + 1); }} />}<div className="p-8 max-w-2xl"><div className="rounded-xl border border-dashed border-[#1E3556] bg-[#0C1A30] px-6 py-14 text-center">
      <div className="text-3xl mb-3" aria-hidden>🧾</div><div className="text-[15px] font-extrabold text-white">No IFTA returns yet</div>
      <p className="mt-1.5 mx-auto max-w-md text-[13px] text-white/60">As fuel and mileage data flows in, each quarterly IFTA return is prepped here for your review before you file.</p>
    </div></div></AppShell>
  );
  const PILL: Record<ReturnStatus, string> = { "Filed": "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30", "Ready to submit": "bg-[#16C7FF]/15 text-[#16C7FF] border border-[#16C7FF]/30", "Awaiting data": "bg-amber-500/15 text-amber-300 border border-amber-500/30", "Overdue": "bg-rose-500/15 text-rose-300 border border-rose-500/30" };
  return (
    <AppShell title="IFTA Concierge" actions={<button onClick={() => setShowLog(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-extrabold text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Record a return</button>}>{showLog && <IftaReturnModal carrierId={carrierId} onClose={() => setShowLog(false)} onSaved={() => { setShowLog(false); setReload((r) => r + 1); }} />}<div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Returns", stats.total], ["Filed", stats.filed], ["Awaiting/ready", stats.awaiting], ["Overdue", stats.overdue]].map(([l, v]) => (
          <div key={String(l)} className="rounded-xl border border-[#1E3556] bg-[#0C1A30] p-4"><div className="text-[10px] uppercase tracking-wider text-white/45">{l}</div><div className="text-[24px] font-black text-white tabular-nums">{v as number}</div></div>
        ))}
      </div>
      <div className="rounded-xl border border-[#1E3556] overflow-hidden">
        <div className="grid grid-cols-[auto_auto_auto_1fr_auto] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-white/40 bg-[#091525]"><span>Quarter</span><span>Due</span><span>Filed</span><span>Tax / refund</span><span>Status</span></div>
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[auto_auto_auto_1fr_auto] gap-3 items-center px-4 py-3 border-t border-[#1E3556]">
            <span className="text-[13px] font-semibold text-white">{r.quarter}</span>
            <span className="text-[12px] text-white/60 tabular-nums">{r.due_date || "—"}</span>
            <span className="text-[12px] text-white/60 tabular-nums">{r.filed_date || "—"}</span>
            <span className="text-[12px] text-white/70 tabular-nums">{r.refund_cents ? `refund ${money(r.refund_cents)}` : money(r.tax_owed_cents)}</span>
            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${PILL[r.status] || PILL["Awaiting data"]}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div></AppShell>
  );
}
