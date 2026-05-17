"use client";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

type I = { id:string; driver_id:string|null; vehicle_id:string|null; inspection_date:string; level:number|null; state:string|null; inspector:string|null; report_number:string|null; oos_driver:boolean; oos_vehicle:boolean; violation_count:number; report_url:string|null };
type VOpt = { id:string; year:number|null; make:string|null; model:string|null; license_plate:string|null };

export default function InspectionsPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [vehicles, setVehicles] = useState<VOpt[]>([]);
  const [rows, setRows] = useState<I[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    if (!carrier) return;
    const [a, v] = await Promise.all([
      getSupabase().from("compass_inspections").select("*").eq("carrier_id", carrier.id).order("inspection_date",{ascending:false}),
      getSupabase().from("compass_vehicles").select("id,year,make,model,license_plate").eq("carrier_id", carrier.id),
    ]);
    setRows((a.data as I[]) || []); setVehicles((v.data as VOpt[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  return (
    <AppShell crumbs="INSPECTIONS" title="Roadside Inspections"
      actions={<button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>+ Log inspection</button>}>
      <div className="p-6">
        <div className="mb-4 text-[12px] text-[var(--fg-muted)]">Track every roadside CVSA inspection (levels 1–8). Out-of-service findings feed your CSA score; DataQ disputes can be initiated from here.</div>
        <TenantTable<I> rows={rows} loading={loading}
          emptyTitle="No inspections logged"
          emptyDesc="Add roadside inspections as they come in to keep your CSA scores accurate and prepare for DataQ disputes if needed."
          columns={[
            { key: "inspection_date", label: "Date", render: (i) => fmtDate(i.inspection_date) },
            { key: "level", label: "Level", render: (i) => i.level ? <Badge color="cyan">Lvl {i.level}</Badge> : <span className="text-white/35">—</span> },
            { key: "state", label: "State", hideOnMobile: true, render: (i) => i.state || <span className="text-white/35">—</span> },
            { key: "driver_id", label: "Driver", hideOnMobile: true, render: (i) => i.driver_id ? driverLabel(drivers.find(d => d.id === i.driver_id)) : <span className="text-white/35">—</span> },
            { key: "violations", label: "Violations", render: (i) => i.violation_count ? <span className="text-[var(--fg)]">{i.violation_count}</span> : <span className="text-[var(--fg-muted)]">0</span> },
            { key: "oos", label: "OOS", render: (i) => (i.oos_driver || i.oos_vehicle) ? <Badge color="red">OOS</Badge> : <Badge color="green">clean</Badge> },
            { key: "report_url", label: "Report", render: (i) => i.report_url ? <a href={i.report_url} target="_blank" rel="noopener noreferrer" className="text-[#22D3EE] underline">View</a> : <span className="text-white/35">—</span> },
          ]}
        />
      </div>
      {showAdd && <InspectionFormModal carrier_id={carrier!.id} drivers={drivers} vehicles={vehicles} onClose={()=>setShowAdd(false)} onSaved={()=>{refresh();setShowAdd(false);}} />}
    </AppShell>
  );
}

function InspectionFormModal({ carrier_id, drivers, vehicles, onClose, onSaved }:{ carrier_id:string; drivers:DriverOpt[]; vehicles:VOpt[]; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<I>>({ inspection_date: new Date().toISOString().slice(0,10), level: 1, oos_driver: false, oos_vehicle: false, violation_count: 0 });
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string|null>(null);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const { error } = await getSupabase().from("compass_inspections").insert([{ ...form, carrier_id }]);
      if (error) throw error;
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Log inspection" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Date *"><input type="date" required className="x3i" value={form.inspection_date||""} onChange={(e)=>setForm({...form,inspection_date:e.target.value})} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Level">
            <select className="x3i" value={String(form.level||1)} onChange={(e)=>setForm({...form,level:Number(e.target.value)})}>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Level {n}</option>)}
            </select>
          </Field>
          <Field label="State"><input className="x3i" maxLength={2} value={form.state||""} onChange={(e)=>setForm({...form,state:e.target.value.toUpperCase()})} /></Field>
        </div>
        <Field label="Driver">
          <select className="x3i" value={form.driver_id||""} onChange={(e)=>setForm({...form,driver_id:e.target.value||null})}>
            <option value="">(none)</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        <Field label="Vehicle">
          <select className="x3i" value={form.vehicle_id||""} onChange={(e)=>setForm({...form,vehicle_id:e.target.value||null})}>
            <option value="">(none)</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{[v.year,v.make,v.model].filter(Boolean).join(" ")} {v.license_plate||""}</option>)}
          </select>
        </Field>
        <Field label="Report #"><input className="x3i" value={form.report_number||""} onChange={(e)=>setForm({...form,report_number:e.target.value})} /></Field>
        <Field label="Inspector"><input className="x3i" value={form.inspector||""} onChange={(e)=>setForm({...form,inspector:e.target.value})} /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="# Violations"><input type="number" min={0} className="x3i" value={String(form.violation_count||0)} onChange={(e)=>setForm({...form,violation_count:Number(e.target.value)})} /></Field>
          <Field label="OOS Driver"><select className="x3i" value={String(form.oos_driver||false)} onChange={(e)=>setForm({...form,oos_driver:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
          <Field label="OOS Vehicle"><select className="x3i" value={String(form.oos_vehicle||false)} onChange={(e)=>setForm({...form,oos_vehicle:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
        </div>
        <Field label="Report URL"><input type="url" className="x3i" value={form.report_url||""} onChange={(e)=>setForm({...form,report_url:e.target.value})} /></Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}
