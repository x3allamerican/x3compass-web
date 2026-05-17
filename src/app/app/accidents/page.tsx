"use client";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

type A = { id:string; driver_id:string|null; vehicle_id:string|null; accident_date:string; location:string|null; recordable:boolean; fatalities:number; injuries:number; tow_required:boolean; preventable:string|null; description:string|null; cause_category:string|null };
type VOpt = { id:string; year:number|null; make:string|null; model:string|null; license_plate:string|null };

export default function AccidentsPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [vehicles, setVehicles] = useState<VOpt[]>([]);
  const [rows, setRows] = useState<A[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    if (!carrier) return;
    const [a, v] = await Promise.all([
      getSupabase().from("compass_accidents").select("*").eq("carrier_id", carrier.id).order("accident_date",{ascending:false}),
      getSupabase().from("compass_vehicles").select("id,year,make,model,license_plate").eq("carrier_id", carrier.id),
    ]);
    setRows((a.data as A[]) || []); setVehicles((v.data as VOpt[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  return (
    <AppShell crumbs="ACCIDENTS" title="Accident Register"
      actions={<button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>+ Log accident</button>}>
      <div className="p-6">
        <div className="mb-4 text-[12px] text-white/55">49 CFR § 390.15 — recordable accidents must be logged and retained for 3 years from date of accident.</div>
        <TenantTable<A> rows={rows} loading={loading}
          emptyTitle="No accidents logged"
          emptyDesc="If you haven't had any in the last 3 years, leave this empty. The DOT requires only recordable accidents (fatality, injury w/ medical treatment off-scene, or tow-from-scene)."
          columns={[
            { key: "accident_date", label: "Date", render: (a) => fmtDate(a.accident_date) },
            { key: "driver_id", label: "Driver", hideOnMobile: true, render: (a) => a.driver_id ? <span>{driverLabel(drivers.find(d => d.id === a.driver_id))}</span> : <span className="text-white/35">—</span> },
            { key: "location", label: "Location", hideOnMobile: true, render: (a) => a.location || <span className="text-white/35">—</span> },
            { key: "recordable", label: "Recordable", render: (a) => a.recordable ? <Badge color="amber">Yes</Badge> : <Badge color="gray">No</Badge> },
            { key: "injuries", label: "Injuries / Fatal", render: (a) => <span>{a.injuries || 0} / {a.fatalities || 0}</span> },
            { key: "preventable", label: "Preventable", hideOnMobile: true, render: (a) => a.preventable ? <Badge color={a.preventable === "preventable" ? "red" : a.preventable === "non_preventable" ? "green" : "gray"}>{a.preventable.replace("_"," ")}</Badge> : <span className="text-white/35">—</span> },
          ]}
        />
      </div>
      {showAdd && <AccidentFormModal carrier_id={carrier!.id} drivers={drivers} vehicles={vehicles} onClose={()=>setShowAdd(false)} onSaved={()=>{refresh();setShowAdd(false);}} />}
    </AppShell>
  );
}

function AccidentFormModal({ carrier_id, drivers, vehicles, onClose, onSaved }:{ carrier_id:string; drivers:DriverOpt[]; vehicles:VOpt[]; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<A>>({ accident_date: new Date().toISOString().slice(0,10), recordable: false, fatalities: 0, injuries: 0, tow_required: false });
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string|null>(null);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!form.accident_date) throw new Error("Date required");
      const { error } = await getSupabase().from("compass_accidents").insert([{ ...form, carrier_id }]);
      if (error) throw error;
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Log accident" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Date *"><input type="date" required className="x3i" value={form.accident_date||""} onChange={(e)=>setForm({...form,accident_date:e.target.value})} /></Field>
        <Field label="Driver">
          <select value={form.driver_id||""} onChange={(e)=>setForm({...form,driver_id:e.target.value||null})} className="x3i">
            <option value="">(none)</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        <Field label="Vehicle">
          <select value={form.vehicle_id||""} onChange={(e)=>setForm({...form,vehicle_id:e.target.value||null})} className="x3i">
            <option value="">(none)</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{[v.year,v.make,v.model].filter(Boolean).join(" ")} {v.license_plate||""}</option>)}
          </select>
        </Field>
        <Field label="Location"><input className="x3i" value={form.location||""} onChange={(e)=>setForm({...form,location:e.target.value})} placeholder="I-70 mile 137, Indianapolis IN" /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Fatalities"><input type="number" min={0} className="x3i" value={String(form.fatalities||0)} onChange={(e)=>setForm({...form,fatalities:Number(e.target.value)})} /></Field>
          <Field label="Injuries"><input type="number" min={0} className="x3i" value={String(form.injuries||0)} onChange={(e)=>setForm({...form,injuries:Number(e.target.value)})} /></Field>
          <Field label="Tow"><select className="x3i" value={String(form.tow_required||false)} onChange={(e)=>setForm({...form,tow_required:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
        </div>
        <Field label="Recordable">
          <select className="x3i" value={String(form.recordable||false)} onChange={(e)=>setForm({...form,recordable:e.target.value==="true"})}>
            <option value="false">No</option>
            <option value="true">Yes (fatality, injury w/ tx off-scene, or tow)</option>
          </select>
        </Field>
        <Field label="Preventable">
          <select className="x3i" value={form.preventable||""} onChange={(e)=>setForm({...form,preventable:e.target.value||null})}>
            <option value="">(undetermined)</option>
            <option value="preventable">Preventable</option>
            <option value="non_preventable">Non-preventable</option>
          </select>
        </Field>
        <Field label="Description"><textarea className="x3i" rows={3} value={form.description||""} onChange={(e)=>setForm({...form,description:e.target.value})} /></Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}
