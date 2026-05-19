"use client";
import { FormEvent, useEffect, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { AccidentImportModal } from "@/components/app/AccidentImportModal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

type A = {
  id:string; driver_id:string|null; vehicle_id:string|null;
  accident_date:string; occurred_time:string|null;
  location:string|null; recordable:boolean;
  fatalities:number; injuries:number; tow_required:boolean;
  preventable:string|null; severity:string|null;
  description:string|null; cause_category:string|null; citation:string|null;
  alc_test_status:string|null; drug_test_status:string|null;
  police_report_url:string|null;
};
type VOpt = { id:string; year:number|null; make:string|null; model:string|null; license_plate:string|null };

// =========================================================================
// COLOR PALETTE — matches the FMCSA/DOT criteria reference card
// solid bg + white text in light mode; tinted /30 in dark
// =========================================================================
const SEV = {
  minor:    "bg-slate-500 text-white border-slate-600 dark:bg-slate-500/45 dark:text-slate-50 dark:border-slate-300/80",
  moderate: "bg-amber-600 text-white border-amber-700 dark:bg-amber-500/45 dark:text-amber-50 dark:border-amber-300/80",
  severe:   "bg-red-700 text-white border-red-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
  fatal:    "bg-black text-white border-black dark:bg-black dark:text-white dark:border-white/60",
};
const PRV = {
  preventable:     "bg-red-700 text-white border-red-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
  non_preventable: "bg-green-700 text-white border-green-800 dark:bg-emerald-500/45 dark:text-emerald-50 dark:border-emerald-300/80",
  undetermined:    "bg-slate-500 text-white border-slate-600 dark:bg-slate-500/45 dark:text-slate-50 dark:border-slate-300/80",
  pending:         "bg-blue-700 text-white border-blue-800 dark:bg-blue-500/45 dark:text-blue-50 dark:border-blue-300/80",
};
const DA = {
  completed:    "bg-green-700 text-white border-green-800 dark:bg-emerald-500/45 dark:text-emerald-50 dark:border-emerald-300/80",
  missed:       "bg-red-700 text-white border-red-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
  scheduled:    "bg-amber-600 text-white border-amber-700 dark:bg-amber-500/45 dark:text-amber-50 dark:border-amber-300/80",
  not_required: "bg-slate-500 text-white border-slate-600 dark:bg-slate-500/45 dark:text-slate-50 dark:border-slate-300/80",
  refused:      "bg-black text-white border-black dark:bg-black dark:text-white dark:border-white/60",
};
function Pill({ cls, children, size = "md" }: { cls: string; children: React.ReactNode; size?: "sm" | "md" }) {
  const sizing = size === "sm"
    ? "min-w-[88px] px-2 py-1 text-[10px]"
    : "min-w-[124px] px-3 py-1.5 text-[11px]";
  return (
    <span className={`inline-block ${sizing} rounded-full font-extrabold border ${cls} whitespace-nowrap text-center tracking-wider uppercase`}>
      {children}
    </span>
  );
}

// =========================================================================
// DEFINITIONS REFERENCE CARD — at the top of the page
// =========================================================================
function DefinitionsCard() {
  return (
    <div className="rounded-2xl border-2 border-blue-500 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-950/40 p-6 mb-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div className="text-[18px] font-extrabold text-blue-700 dark:text-blue-200 flex items-center gap-2">
          📚 Definitions reference
        </div>
        <div className="text-[11px] tracking-[.16em] uppercase font-extrabold text-blue-600 dark:text-blue-300">FMCSA / DOT criteria</div>
      </div>
      <div className="text-[12px] text-black dark:text-white mb-4">
        Use these definitions when classifying severity and making preventability calls. Sources: <strong>49 CFR § 390.5T</strong> (DOT-recordable), <strong>49 CFR § 382.303</strong> (post-accident testing), and the FMCSA Crash Preventability Determination Program (CPDP).
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-blue-700 dark:text-blue-200 mb-3 border-b-2 border-amber-500 dark:border-amber-400 pb-1">SEVERITY LEVELS</div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3"><Pill cls={SEV.minor} size="sm">MINOR</Pill><div className="text-[12px] text-black dark:text-white flex-1">No injuries. Minor property damage only. No tow required (e.g., low-speed parking-lot contact, fender-bender).</div></div>
            <div className="flex items-start gap-3"><Pill cls={SEV.moderate} size="sm">MODERATE</Pill><div className="text-[12px] text-black dark:text-white flex-1">Injuries treated and released, or vehicle towed from scene, or property damage requiring repair. Often DOT-recordable.</div></div>
            <div className="flex items-start gap-3"><Pill cls={SEV.severe} size="sm">SEVERE</Pill><div className="text-[12px] text-black dark:text-white flex-1">Serious injuries requiring transport for medical treatment. Substantial property damage. Disabling damage to one or more vehicles. DOT-recordable per § 390.5T.</div></div>
            <div className="flex items-start gap-3"><Pill cls={SEV.fatal} size="sm">FATAL</Pill><div className="text-[12px] text-black dark:text-white flex-1">One or more fatalities. Always DOT-recordable. Triggers post-accident drug & alcohol testing under 49 CFR § 382.303 and immediate FMCSA reporting if applicable.</div></div>
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-blue-700 dark:text-blue-200 mb-3 border-b-2 border-amber-500 dark:border-amber-400 pb-1">PREVENTABILITY CLASSIFICATIONS</div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3"><Pill cls={PRV.preventable} size="sm">PREVENT</Pill><div className="text-[12px] text-black dark:text-white flex-1">Driver could have reasonably done something to avoid the crash. Counts toward the CSA Crash Indicator BASIC. Triggers safety review and corrective action.</div></div>
            <div className="flex items-start gap-3"><Pill cls={PRV.non_preventable} size="sm">NON-PREV</Pill><div className="text-[12px] text-black dark:text-white flex-1">Driver could not reasonably have prevented the crash. Examples eligible under FMCSA's CPDP: struck by wrong-way / DUI / suicidal driver, hit while legally stopped or parked, struck by debris, hit-and-run, animal strikes.</div></div>
            <div className="flex items-start gap-3"><Pill cls={PRV.undetermined} size="sm">UNDET'D</Pill><div className="text-[12px] text-black dark:text-white flex-1">Insufficient evidence to make a determination after investigation. Document what was reviewed and why a call could not be made.</div></div>
            <div className="flex items-start gap-3"><Pill cls={PRV.pending} size="sm">PENDING</Pill><div className="text-[12px] text-black dark:text-white flex-1">Determination not yet made. Investigation in progress (police report, witness statements, ELD/dashcam review). Default state for newly logged accidents.</div></div>
          </div>
        </div>
      </div>
      <div className="text-[11px] text-black dark:text-white mt-4 pt-4 border-t border-blue-200 dark:border-blue-400/60">
        <strong>DOT-recordable test (49 CFR § 390.5T):</strong> a fatality, OR an injury treated away from the scene, OR a vehicle towed from the scene due to disabling damage. Even minor accidents can be DOT-recordable.
        <strong className="ml-3">CPDP eligibility:</strong> only crashes meeting the FMCSA-specified categories qualify for non-preventable submission. Submit within 24 months of the crash via the DataQs portal.
      </div>
    </div>
  );
}

export default function AccidentsPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [vehicles, setVehicles] = useState<VOpt[]>([]);
  const [rows, setRows] = useState<A[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editAcc, setEditAcc] = useState<A | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSev, setFilterSev] = useState("");
  const [filterPrev, setFilterPrev] = useState("");

  async function refresh() {
    if (!carrier) return;
    setLoading(true);
    const [a, v] = await Promise.all([
      getSupabase().from("compass_accidents").select("*").eq("carrier_id", carrier.id).order("accident_date",{ascending:false}),
      getSupabase().from("compass_vehicles").select("id,year,make,model,license_plate").eq("carrier_id", carrier.id),
    ]);
    setRows((a.data as A[]) || []); setVehicles((v.data as VOpt[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filterSev && r.severity !== filterSev) return false;
      if (filterPrev && (r.preventable || "pending") !== filterPrev) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const drv = drivers.find(d => d.id === r.driver_id);
        const drvName = drv ? `${drv.first_name||""} ${drv.last_name||""}`.toLowerCase() : "";
        if (!`${r.location||""} ${drvName} ${r.description||""} ${r.cause_category||""}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, drivers, filterSev, filterPrev, search]);

  function vehLabel(id: string | null) {
    if (!id) return null;
    const v = vehicles.find(x => x.id === id);
    return v ? v.license_plate || `${v.year} ${v.make}` : null;
  }

  return (
    <AppShell crumbs="ACCIDENTS · 49 CFR § 390.15" title="Accident Register"
      actions={null}
    >
      <div className="p-6">

        <DefinitionsCard />

        {/* Filter bar */}
        <div className="space-y-3 mb-5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">🔍</span>
            <input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search by location, state, or description…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg-muted)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <select value={filterSev} onChange={(e)=>setFilterSev(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm">
            <option value="">All severities</option>
            <option value="minor">Minor</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
            <option value="fatal">Fatal</option>
          </select>
          <select value={filterPrev} onChange={(e)=>setFilterPrev(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm">
            <option value="">All preventability</option>
            <option value="preventable">Preventable</option>
            <option value="non_preventable">Non-preventable</option>
            <option value="undetermined">Undetermined</option>
            <option value="pending">Pending</option>
          </select>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowImport(true)} className="px-4 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)]">📥 Import CSV</button>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-black" style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)" }}>+ Log Accident</button>
            <div className="ml-auto self-center text-[12px] text-[var(--fg-muted)]">{filtered.length} of {rows.length} accident{rows.length===1?"":"s"}</div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--fg-muted)]">
              <tr>
                <th className="text-left px-3 py-3">Date</th>
                <th className="text-left px-3 py-3">Location</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Driver / Unit</th>
                <th className="text-left px-3 py-3">Severity</th>
                <th className="text-left px-3 py-3">Preventability</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Outcomes</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">Citation</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">D&A Test</th>
                <th className="text-right px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center p-10 text-[var(--fg-muted)] text-sm">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center p-10">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-[var(--fg)] font-bold mb-1">{rows.length === 0 ? "No accidents logged" : "No matches"}</div>
                  <div className="text-[var(--fg-muted)] text-sm">{rows.length === 0 ? "If you haven't had any in the last 3 years, leave this empty." : "Try clearing your filters."}</div>
                </td></tr>
              ) : filtered.map(a => {
                const drv = drivers.find(d => d.id === a.driver_id);
                const sev = (a.severity || "minor") as keyof typeof SEV;
                const prv = (a.preventable || "pending") as keyof typeof PRV;
                return (
                  <tr key={a.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] cursor-pointer" onClick={() => setEditAcc(a)}>
                    <td className="px-3 py-3">
                      <div className="text-[var(--fg)] font-semibold">{new Date(a.accident_date).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}</div>
                      {a.occurred_time && <div className="text-[11px] text-[var(--fg-muted)]">{a.occurred_time.slice(0,5)}</div>}
                    </td>
                    <td className="px-3 py-3"><div className="text-[var(--fg)]">{a.location || <span className="text-[var(--fg-faint)]">—</span>}</div></td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {drv ? <div className="text-[var(--fg)] font-semibold">{drv.first_name} {drv.last_name}</div> : <span className="text-[var(--fg-faint)]">—</span>}
                      {vehLabel(a.vehicle_id) && <div className="text-[11px] text-[var(--fg-muted)]">{vehLabel(a.vehicle_id)}</div>}
                    </td>
                    <td className="px-3 py-3"><Pill cls={SEV[sev]}>{sev.toUpperCase()}</Pill></td>
                    <td className="px-3 py-3"><Pill cls={PRV[prv]}>{prv === "non_preventable" ? "NON PREVENTABLE" : prv === "preventable" ? "PREVENTABLE" : prv === "undetermined" ? "UNDETERMINED" : "PENDING"}</Pill></td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {a.recordable && <span className="text-red-700 dark:text-rose-300 font-extrabold text-[13px]">DOT</span>}
                      {a.fatalities > 0 && <span className="ml-2 text-black dark:text-white font-extrabold text-[13px]">FATAL</span>}
                      {a.injuries > 0 && <span className="ml-2 text-amber-700 dark:text-amber-300 font-bold text-[13px]">{a.injuries} inj</span>}
                      {!a.recordable && a.fatalities === 0 && a.injuries === 0 && <span className="text-[var(--fg-faint)]">—</span>}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      {a.citation ? <span className="text-[var(--fg)] font-mono text-[12px]">{a.citation}</span> : <span className="text-[var(--fg-faint)]">—</span>}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {(a.alc_test_status || a.drug_test_status) ? (
                        <div className="flex flex-col gap-1.5 items-start">
                          {a.alc_test_status && <Pill cls={DA[a.alc_test_status as keyof typeof DA] || DA.not_required}>Alc: {a.alc_test_status.toUpperCase()}</Pill>}
                          {a.drug_test_status && <Pill cls={DA[a.drug_test_status as keyof typeof DA] || DA.not_required}>Drug: {a.drug_test_status.toUpperCase()}</Pill>}
                        </div>
                      ) : <span className="text-[var(--fg-faint)]">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <button onClick={(e)=>{e.stopPropagation(); setEditAcc(a);}} className="text-[12px] text-[var(--accent)] font-bold hover:underline mr-2">✏️ Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(showAdd || editAcc) && <AccidentFormModal carrier_id={carrier!.id} drivers={drivers} vehicles={vehicles} accident={editAcc} onClose={()=>{setShowAdd(false); setEditAcc(null);}} onSaved={()=>{refresh();setShowAdd(false);setEditAcc(null);}} />}
      {showImport && carrier && <AccidentImportModal carrierId={carrier.id} onClose={()=>setShowImport(false)} onImported={refresh} />}
    </AppShell>
  );
}

function AccidentFormModal({ carrier_id, drivers, vehicles, accident, onClose, onSaved }:{ carrier_id:string; drivers:DriverOpt[]; vehicles:VOpt[]; accident:A|null; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<A>>(accident || { accident_date: new Date().toISOString().slice(0,10), recordable: false, fatalities: 0, injuries: 0, tow_required: false, severity: "minor" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string|null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!form.accident_date) throw new Error("Date required");
      const payload = { ...form, carrier_id };
      if (accident?.id) {
        const { error } = await getSupabase().from("compass_accidents").update(payload).eq("id", accident.id);
        if (error) throw error;
      } else {
        const { error } = await getSupabase().from("compass_accidents").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  async function handleDelete() {
    if (!accident?.id || !confirm("Delete this accident record?")) return;
    setBusy(true);
    const { error } = await getSupabase().from("compass_accidents").delete().eq("id", accident.id);
    if (error) { setError(error.message); setBusy(false); return; }
    onSaved();
  }

  return (
    <Modal title={accident ? "Edit accident" : "Log accident"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date *"><input required type="date" className="x3i" value={form.accident_date||""} onChange={(e)=>setForm({...form,accident_date:e.target.value})} /></Field>
          <Field label="Time"><input type="time" className="x3i" value={form.occurred_time||""} onChange={(e)=>setForm({...form,occurred_time:e.target.value||null})} /></Field>
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
        <Field label="Location"><input className="x3i" value={form.location||""} onChange={(e)=>setForm({...form,location:e.target.value})} placeholder="e.g. I-35 · Dallas TX" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Severity">
            <select className="x3i" value={form.severity||"minor"} onChange={(e)=>setForm({...form,severity:e.target.value})}>
              <option value="minor">Minor</option><option value="moderate">Moderate</option><option value="severe">Severe</option><option value="fatal">Fatal</option>
            </select>
          </Field>
          <Field label="Preventability">
            <select className="x3i" value={form.preventable||""} onChange={(e)=>setForm({...form,preventable:e.target.value||null})}>
              <option value="">Pending</option><option value="preventable">Preventable</option><option value="non_preventable">Non-preventable</option><option value="undetermined">Undetermined</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Recordable"><select className="x3i" value={String(form.recordable||false)} onChange={(e)=>setForm({...form,recordable:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes (DOT)</option></select></Field>
          <Field label="Tow required"><select className="x3i" value={String(form.tow_required||false)} onChange={(e)=>setForm({...form,tow_required:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
          <Field label="Injuries"><input className="x3i" type="number" min={0} value={form.injuries||0} onChange={(e)=>setForm({...form,injuries:parseInt(e.target.value)||0})} /></Field>
          <Field label="Fatalities"><input className="x3i" type="number" min={0} value={form.fatalities||0} onChange={(e)=>setForm({...form,fatalities:parseInt(e.target.value)||0})} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Alcohol test">
            <select className="x3i" value={form.alc_test_status||""} onChange={(e)=>setForm({...form,alc_test_status:e.target.value||null})}>
              <option value="">— n/a —</option><option value="completed">Completed</option><option value="scheduled">Scheduled</option><option value="missed">Missed</option><option value="refused">Refused</option><option value="not_required">Not required</option>
            </select>
          </Field>
          <Field label="Drug test">
            <select className="x3i" value={form.drug_test_status||""} onChange={(e)=>setForm({...form,drug_test_status:e.target.value||null})}>
              <option value="">— n/a —</option><option value="completed">Completed</option><option value="scheduled">Scheduled</option><option value="missed">Missed</option><option value="refused">Refused</option><option value="not_required">Not required</option>
            </select>
          </Field>
        </div>
        <Field label="Citation"><input className="x3i" value={form.citation||""} onChange={(e)=>setForm({...form,citation:e.target.value})} placeholder="e.g. 49 CFR § 392.6" /></Field>
        <Field label="Cause category"><input className="x3i" value={form.cause_category||""} onChange={(e)=>setForm({...form,cause_category:e.target.value})} placeholder="following_distance · weather · mechanical · driver_error" /></Field>
        <Field label="Description"><textarea className="x3i" rows={3} value={form.description||""} onChange={(e)=>setForm({...form,description:e.target.value})} /></Field>
        {error && <Err msg={error} />}
        <div className="flex justify-between items-center pt-2">
          <div>{accident && <button type="button" onClick={handleDelete} disabled={busy} className="text-[12px] text-red-400 hover:text-red-300">Delete record</button>}</div>
          <ModalActions onClose={onClose} busy={busy} submitLabel={accident ? "Save changes" : "Log accident"} />
        </div>
      </form>
    </Modal>
  );
}
