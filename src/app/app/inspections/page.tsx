"use client";
import { FormEvent, useEffect, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { SkeletonRow } from "@/components/Skeleton";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { InspectionImportModal } from "@/components/app/InspectionImportModal";
import { DataqChallengePanel } from "@/components/app/DataqChallengePanel";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";
import { DEMO_INSPECTIONS, withDemoFallback } from "@/lib/demoFallback";

type I = { id:string; driver_id:string|null; vehicle_id:string|null; inspection_date:string; level:number|null; state:string|null; inspector:string|null; report_number:string|null; oos_driver:boolean; oos_vehicle:boolean; violation_count:number; violations:unknown[]|null; report_url:string|null };
type VOpt = { id:string; year:number|null; make:string|null; model:string|null; license_plate:string|null };

/** Reshape DemoInspection → I so the existing renderer just works.
 *  We keep driver_id/vehicle_id null on demo rows (the table falls back to "—")
 *  but we attach driver_name + vehicle_unit via the unused `violations` slot
 *  so the page can still surface them in a render helper if it cares. */
function adaptDemoInspection(d: typeof DEMO_INSPECTIONS[number]): I & { _demoDriver: string; _demoVehicle: string } {
  const LEVEL_MAP: Record<string, number> = {
    "Level I": 1, "Level II": 2, "Level III": 3, "Level IV": 4, "Level V": 5, "Level VI": 6,
  };
  const oos = d.result === "oos";
  return {
    id: d.id,
    driver_id: null,
    vehicle_id: null,
    inspection_date: d.inspection_date,
    level: LEVEL_MAP[d.level] ?? null,
    state: d.state,
    inspector: d.location,
    report_number: null,
    oos_driver: oos && d.oos_violations > 0,
    oos_vehicle: oos && d.oos_violations > 0,
    violation_count: d.violations,
    violations: null,
    report_url: null,
    _demoDriver: d.driver_name,
    _demoVehicle: d.vehicle_unit,
  };
}

// ============================================================
// COLOR PALETTE · same theme-aware tokens as Accidents
// ============================================================
const LEVEL_COLORS = {
  1: "bg-red-700 text-white border-red-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
  2: "bg-amber-600 text-white border-amber-700 dark:bg-amber-500/45 dark:text-amber-50 dark:border-amber-300/80",
  3: "bg-blue-700 text-white border-blue-800 dark:bg-blue-500/45 dark:text-blue-50 dark:border-blue-300/80",
  4: "bg-purple-700 text-white border-purple-800 dark:bg-purple-500/45 dark:text-purple-50 dark:border-purple-300/80",
  5: "bg-slate-600 text-white border-slate-700 dark:bg-slate-500/45 dark:text-slate-50 dark:border-slate-300/80",
  6: "bg-black text-white border-black dark:bg-black dark:text-white dark:border-white/60",
};
const OUTCOME_COLORS = {
  clean:      "bg-green-700 text-white border-green-800 dark:bg-emerald-500/45 dark:text-emerald-50 dark:border-emerald-300/80",
  violations: "bg-amber-600 text-white border-amber-700 dark:bg-amber-500/45 dark:text-amber-50 dark:border-amber-300/80",
  oos_v:      "bg-red-700 text-white border-red-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
  oos_d:     "bg-red-700 text-white border-red-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
  oos_both:   "bg-black text-white border-black dark:bg-black dark:text-white dark:border-white/60",
};

function Pill({ cls, children, size = "md" }: { cls: string; children: React.ReactNode; size?: "sm" | "md" }) {
  const sizing = size === "sm" ? "min-w-[130px] px-3 py-1.5 text-[10px]" : "min-w-[130px] px-3 py-1.5 text-[11px]";
  return <span className={`inline-block ${sizing} rounded-full font-extrabold border ${cls} whitespace-nowrap text-center tracking-wider uppercase`}>{children}</span>;
}

function outcomeFor(r: I): { key: keyof typeof OUTCOME_COLORS; label: string } {
  if (r.oos_driver && r.oos_vehicle) return { key: "oos_both", label: "OOS - BOTH" };
  if (r.oos_vehicle) return { key: "oos_v", label: "OOS - VEHICLE" };
  if (r.oos_driver) return { key: "oos_d", label: "OOS - DRIVER" };
  if ((r.violation_count || 0) > 0) return { key: "violations", label: "VIOLATIONS" };
  return { key: "clean", label: "CLEAN" };
}

// ============================================================
// DEFINITIONS CARD · FMCSA inspection levels + outcome classifications
// (Mirrors the X3 Fleet Safety app's definitions content + Accidents card style)
// ============================================================
function DefinitionsCard() {
  return (
    <div className="rounded-2xl border-2 border-blue-500 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-950/40 p-6 mb-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div className="text-[18px] font-extrabold text-blue-700 dark:text-blue-200 flex items-center gap-2">🛣 Definitions reference</div>
        <div className="text-[11px] tracking-[.16em] uppercase font-extrabold text-blue-600 dark:text-blue-300">FMCSA / DOT criteria</div>
      </div>
      <div className="text-[12px] text-black dark:text-white mb-4">
        Roadside and DOT inspections feed your CSA BASIC scores via SAFER. Inspection levels follow the <strong>CVSA North American Standard</strong>. Out-of-service (OOS) decisions are mandatory roadside removals until the defect is corrected. Sources: <strong>CVSA Operational Policy</strong>, <strong>49 CFR § 396.9</strong> (record retention), <strong>49 CFR § 392.5</strong> (OOS driver), <strong>49 CFR Appendix G</strong> (OOS vehicle criteria).
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-blue-700 dark:text-blue-200 mb-3 border-b-2 border-amber-500 dark:border-amber-400 pb-1">CVSA INSPECTION LEVELS</div>
          <div className="space-y-3.5">
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={LEVEL_COLORS[1]} size="sm">LEVEL I</Pill><div className="text-[12px] text-black dark:text-white pt-0.5"><strong>North American Standard</strong> · most thorough roadside. Driver credentials (CDL, med card, RODS/HOS, Clearinghouse) + 37 vehicle components (brakes, tires, lighting, steering, suspension, coupling, exhaust, fuel, frame, cargo securement). ~30 min.</div></div>
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={LEVEL_COLORS[2]} size="sm">LEVEL II</Pill><div className="text-[12px] text-black dark:text-white pt-0.5"><strong>Walk-around vehicle inspection</strong> · same vehicle items as Level I but inspector does not go under the vehicle. Driver credentials still verified.</div></div>
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={LEVEL_COLORS[3]} size="sm">LEVEL III</Pill><div className="text-[12px] text-black dark:text-white pt-0.5"><strong>Driver-only</strong> · credentials, RODS/HOS, drug & alcohol status, seat belt, Clearinghouse check. No vehicle inspection.</div></div>
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={LEVEL_COLORS[4]} size="sm">LEVEL IV</Pill><div className="text-[12px] text-black dark:text-white pt-0.5"><strong>Special study</strong> · one-time examination of a specific item, typically as part of a research project (e.g. a tire study). Rare.</div></div>
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={LEVEL_COLORS[5]} size="sm">LEVEL V</Pill><div className="text-[12px] text-black dark:text-white pt-0.5"><strong>Vehicle-only</strong> · same as Level I vehicle components, but no driver is present (e.g. terminal yard, scale).</div></div>
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={LEVEL_COLORS[6]} size="sm">LEVEL VI</Pill><div className="text-[12px] text-black dark:text-white pt-0.5"><strong>Enhanced for radioactive shipments</strong> · Level I plus additional requirements specific to highway-route-controlled-quantity radioactive material.</div></div>
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-blue-700 dark:text-blue-200 mb-3 border-b-2 border-amber-500 dark:border-amber-400 pb-1">OUTCOME CLASSIFICATIONS</div>
          <div className="space-y-3.5">
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={OUTCOME_COLORS.clean} size="sm">CLEAN</Pill><div className="text-[12px] text-black dark:text-white pt-0.5">No violations cited. Counts as a <strong>clean inspection</strong> for CSA scoring · these actually <em>lower</em> your BASIC scores when reported to SAFER.</div></div>
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={OUTCOME_COLORS.violations} size="sm">VIOLATIONS</Pill><div className="text-[12px] text-black dark:text-white pt-0.5">One or more violations cited but driver / vehicle remained in service. Each violation has a severity weight in the BASIC scoring math. Review for DataQ challenge eligibility.</div></div>
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={OUTCOME_COLORS.oos_v} size="sm">OOS - VEHICLE</Pill><div className="text-[12px] text-black dark:text-white pt-0.5"><strong>Out-of-service vehicle</strong> · the truck or trailer is held at the inspection point until the defect is fixed (49 CFR Appendix G). Tow or roadside repair required.</div></div>
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={OUTCOME_COLORS.oos_d} size="sm">OOS - DRIVER</Pill><div className="text-[12px] text-black dark:text-white pt-0.5"><strong>Out-of-service driver</strong> · driver may not operate for the remainder of a duty period (49 CFR § 395.13 / § 392.5). Common triggers: HOS overage, no CDL, no med card, suspended license.</div></div>
            <div className="grid grid-cols-[140px_1fr] items-start gap-3"><Pill cls={OUTCOME_COLORS.oos_both} size="sm">OOS - BOTH</Pill><div className="text-[12px] text-black dark:text-white pt-0.5">Both vehicle and driver placed out-of-service. Highest-impact outcome; vehicle and driver each require remediation before returning to service.</div></div>
          </div>
        </div>
      </div>
      <div className="text-[11px] text-black dark:text-white mt-4 pt-4 border-t border-blue-200 dark:border-blue-400/60">
        <strong>Retention:</strong> 49 CFR § 396.9 · keep inspection reports for at least 12 months from date. <strong className="ml-3">DataQs window:</strong> challenge incorrect violations within 30 days via the FMCSA DataQs portal · disputes after this window often time out without review. <strong className="ml-3">SAFER reporting:</strong> roadside inspections appear on your SMS profile within 7–10 business days.
      </div>
    </div>
  );
}

export default function InspectionsPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [vehicles, setVehicles] = useState<VOpt[]>([]);
  const [rows, setRows] = useState<I[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [edit, setEdit] = useState<I | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("");
  const [dataqTarget, setDataqTarget] = useState("");

  async function refresh() {
    if (!carrier) return;
    setLoading(true);
    const [i, v] = await Promise.all([
      getSupabase().from("compass_inspections").select("*").eq("carrier_id", carrier.id).order("inspection_date",{ascending:false}),
      getSupabase().from("compass_vehicles").select("id,year,make,model,license_plate").eq("carrier_id", carrier.id),
    ]);
    setRows((i.data as I[]) || []); setVehicles((v.data as VOpt[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  // Fall back to demo Apex-Logistics inspection log (7 records, 21d window)
  // when the real Supabase query returns no rows for this carrier yet.
  const effectiveRows = useMemo(
    () => withDemoFallback(rows, DEMO_INSPECTIONS.map(adaptDemoInspection) as I[], !carrier),
    [rows, carrier]
  );
  const isDemo = !carrier && rows.length === 0;

  const filtered = useMemo(() => effectiveRows.filter(r => {
    if (filterLevel && String(r.level) !== filterLevel) return false;
    if (filterOutcome && outcomeFor(r).key !== filterOutcome) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const drv = drivers.find(d => d.id === r.driver_id);
      const drvName = drv ? `${drv.first_name||""} ${drv.last_name||""}`.toLowerCase() : "";
      // Demo rows carry _demoDriver as a fallback search target.
      const demoName = (r as I & { _demoDriver?: string })._demoDriver || "";
      if (!`${r.state||""} ${r.inspector||""} ${r.report_number||""} ${drvName} ${demoName}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [effectiveRows, drivers, filterLevel, filterOutcome, search]);

  function vehLabel(id: string | null) {
    if (!id) return null;
    const v = vehicles.find(x => x.id === id);
    return v ? v.license_plate || `${v.year} ${v.make}` : null;
  }

  return (
    <AppShell crumbs="INSPECTIONS · 49 CFR § 396.9" title="Inspection Register" actions={null}>
      <div className="p-6">

        <DefinitionsCard />

        {carrier && <DataqChallengePanel inspections={rows} initialInspectionId={dataqTarget} />}

        {/* Filter bar */}
        <div className="space-y-3 mb-5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">🔍</span>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by state, inspector, report number, or driver…" className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg-muted)] text-sm focus:outline-none focus:border-[var(--accent)]" />
          </div>
          <select value={filterLevel} onChange={(e)=>setFilterLevel(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm">
            <option value="">All levels</option>
            <option value="1">Level I · Full</option><option value="2">Level II · Walk-around</option><option value="3">Level III · Driver-only</option>
            <option value="4">Level IV · Special</option><option value="5">Level V · Vehicle-only</option><option value="6">Level VI · Radioactive</option>
          </select>
          <select value={filterOutcome} onChange={(e)=>setFilterOutcome(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm">
            <option value="">All outcomes</option>
            <option value="clean">Clean</option><option value="violations">Violations</option>
            <option value="oos_v">OOS - Vehicle</option><option value="oos_d">OOS - Driver</option><option value="oos_both">OOS - Both</option>
          </select>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowImport(true)} className="px-4 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)]">📥 Import CSV</button>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-black" style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)" }}>+ Log Inspection</button>
            <div className="ml-auto self-center text-[12px] text-[var(--fg-muted)]">{filtered.length} of {effectiveRows.length} inspection{effectiveRows.length===1?"":"s"}{isDemo && <span className="ml-2 text-[var(--accent)]/80 font-bold">· DEMO</span>}</div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--fg-muted)]">
              <tr>
                <th className="text-left px-3 py-3">Date</th>
                <th className="text-left px-3 py-3">State</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Driver / Unit</th>
                <th className="text-left px-3 py-3">Level</th>
                <th className="text-left px-3 py-3">Outcome</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Violations</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">Report #</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">Inspector</th>
                <th className="text-right px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>{Array.from({length:5}).map((_,i)=><SkeletonRow key={i} cols={9} />)}</>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center p-10">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-[var(--fg)] font-bold mb-1">{effectiveRows.length === 0 ? "No inspections logged" : "No matches"}</div>
                  <div className="text-[var(--fg-muted)] text-sm">{effectiveRows.length === 0 ? "Roadside inspections appear here. Clean ones lower your CSA BASIC scores." : "Try clearing your filters."}</div>
                </td></tr>
              ) : filtered.map(r => {
                const drv = drivers.find(d => d.id === r.driver_id);
                const lev = (r.level || 1) as keyof typeof LEVEL_COLORS;
                const out = outcomeFor(r);
                // Demo rows carry driver/vehicle as strings (no real FK)
                const demoExt = r as I & { _demoDriver?: string; _demoVehicle?: string };
                return (
                  <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] cursor-pointer" onClick={() => { if (!isDemo) setEdit(r); }}>
                    <td className="px-3 py-3"><div className="text-[var(--fg)] font-semibold">{new Date(r.inspection_date).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}</div></td>
                    <td className="px-3 py-3"><div className="text-[var(--fg)] font-mono">{r.state || <span className="text-[var(--fg-faint)]">—</span>}</div></td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {drv ? <div className="text-[var(--fg)] font-semibold">{drv.first_name} {drv.last_name}</div>
                           : demoExt._demoDriver ? <div className="text-[var(--fg)] font-semibold">{demoExt._demoDriver}</div>
                           : <span className="text-[var(--fg-faint)]">—</span>}
                      {vehLabel(r.vehicle_id) ? <div className="text-[11px] text-[var(--fg-muted)]">{vehLabel(r.vehicle_id)}</div>
                       : demoExt._demoVehicle ? <div className="text-[11px] text-[var(--fg-muted)]">{demoExt._demoVehicle}</div>
                       : null}
                    </td>
                    <td className="px-3 py-3"><Pill cls={LEVEL_COLORS[lev]}>LEVEL {["", "I", "II", "III", "IV", "V", "VI"][lev]}</Pill></td>
                    <td className="px-3 py-3"><Pill cls={OUTCOME_COLORS[out.key]}>{out.label}</Pill></td>
                    <td className="px-3 py-3 hidden md:table-cell"><span className={`font-extrabold ${r.violation_count > 0 ? "text-amber-700 dark:text-amber-300" : "text-[var(--fg-muted)]"}`}>{r.violation_count || 0}</span></td>
                    <td className="px-3 py-3 hidden lg:table-cell"><span className="font-mono text-[12px] text-[var(--fg-muted)]">{r.report_number || "—"}</span></td>
                    <td className="px-3 py-3 hidden lg:table-cell"><span className="text-[12px] text-[var(--fg-muted)]">{r.inspector || "—"}</span></td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {!isDemo && <><button onClick={(e)=>{e.stopPropagation(); setDataqTarget(r.id); window.scrollTo({ top: 0, behavior: "smooth" });}} className="text-[12px] text-[var(--accent)] font-bold hover:underline mr-2">Start DataQ</button><button onClick={(e)=>{e.stopPropagation(); setEdit(r);}} className="text-[12px] text-[var(--accent)] font-bold hover:underline mr-2">✏️ Edit</button></>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(showAdd || edit) && <InspectionFormModal carrier_id={carrier!.id} drivers={drivers} vehicles={vehicles} inspection={edit} onClose={()=>{setShowAdd(false); setEdit(null);}} onSaved={()=>{refresh();setShowAdd(false);setEdit(null);}} />}
      {showImport && carrier && <InspectionImportModal carrierId={carrier.id} onClose={()=>setShowImport(false)} onImported={refresh} />}
    </AppShell>
  );
}

function InspectionFormModal({ carrier_id, drivers, vehicles, inspection, onClose, onSaved }:{ carrier_id:string; drivers:DriverOpt[]; vehicles:VOpt[]; inspection:I|null; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<I>>(inspection || { inspection_date: new Date().toISOString().slice(0,10), level: 1, oos_driver: false, oos_vehicle: false, violation_count: 0 });
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string|null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!form.inspection_date) throw new Error("Date required");
      const payload = { ...form, carrier_id };
      if (inspection?.id) {
        const { error } = await getSupabase().from("compass_inspections").update(payload).eq("id", inspection.id).eq("carrier_id", carrier_id);
        if (error) throw error;
      } else {
        const { error } = await getSupabase().from("compass_inspections").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  async function handleDelete() {
    if (!inspection?.id || !confirm("Delete this inspection record?")) return;
    setBusy(true);
    const { error } = await getSupabase().from("compass_inspections").delete().eq("id", inspection.id).eq("carrier_id", carrier_id);
    if (error) { setError(error.message); setBusy(false); return; }
    onSaved();
  }

  return (
    <Modal title={inspection ? "Edit inspection" : "Log inspection"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date *"><input required type="date" className="x3i" value={form.inspection_date||""} onChange={(e)=>setForm({...form,inspection_date:e.target.value})} /></Field>
          <Field label="Level *">
            <select required className="x3i" value={form.level||1} onChange={(e)=>setForm({...form,level:parseInt(e.target.value)})}>
              <option value={1}>I · Full</option><option value={2}>II · Walk-around</option><option value={3}>III · Driver-only</option>
              <option value={4}>IV · Special</option><option value={5}>V · Vehicle-only</option><option value={6}>VI · Radioactive</option>
            </select>
          </Field>
          <Field label="State"><input className="x3i" maxLength={2} value={form.state||""} onChange={(e)=>setForm({...form,state:e.target.value.toUpperCase()})} placeholder="TX" /></Field>
          <Field label="Report #"><input className="x3i" value={form.report_number||""} onChange={(e)=>setForm({...form,report_number:e.target.value})} placeholder="INS-238411" /></Field>
        </div>
        <Field label="Driver">
          <select className="x3i" value={form.driver_id||""} onChange={(e)=>setForm({...form,driver_id:e.target.value||null})}>
            <option value="">— none —</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        <Field label="Vehicle">
          <select className="x3i" value={form.vehicle_id||""} onChange={(e)=>setForm({...form,vehicle_id:e.target.value||null})}>
            <option value="">— none —</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} ({v.license_plate})</option>)}
          </select>
        </Field>
        <Field label="Inspector"><input className="x3i" value={form.inspector||""} onChange={(e)=>setForm({...form,inspector:e.target.value})} placeholder="Officer #4287" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Violations"><input className="x3i" type="number" min={0} value={form.violation_count||0} onChange={(e)=>setForm({...form,violation_count:parseInt(e.target.value)||0})} /></Field>
          <Field label="OOS Driver"><select className="x3i" value={String(form.oos_driver||false)} onChange={(e)=>setForm({...form,oos_driver:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
          <Field label="OOS Vehicle"><select className="x3i" value={String(form.oos_vehicle||false)} onChange={(e)=>setForm({...form,oos_vehicle:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
        </div>
        <Field label="Report URL"><input className="x3i" type="url" value={form.report_url||""} onChange={(e)=>setForm({...form,report_url:e.target.value})} placeholder="https://…" /></Field>
        {error && <Err msg={error} />}
        <div className="flex justify-between items-center pt-2">
          <div>{inspection && <button type="button" onClick={handleDelete} disabled={busy} className="text-[12px] text-red-700 dark:text-red-400 hover:text-red-700 dark:text-red-300">Delete record</button>}</div>
          <ModalActions onClose={onClose} busy={busy} submitLabel={inspection ? "Save changes" : "Log inspection"} />
        </div>
      </form>
    </Modal>
  );
}
