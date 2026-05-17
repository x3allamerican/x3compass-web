"use client";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

type Mvr = { id:string; driver_id:string; pulled_on:string; state:string|null; result:string|null; violations_count:number|null; notes:string|null; file_url:string|null; source:string|null };
const RESULTS = ["clean","minor","major","serious","disqualifying","pending","failed"];
const COLOR: Record<string, "green"|"amber"|"red"|"violet"|"gray"|"cyan"> = { clean:"green", minor:"amber", major:"red", serious:"red", disqualifying:"red", pending:"cyan", failed:"red" };

export default function MvrPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [rows, setRows] = useState<Mvr[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    if (!carrier) return;
    const { data } = await getSupabase().from("compass_mvr_records").select("*").eq("carrier_id", carrier.id).order("pulled_on",{ascending:false});
    setRows((data as Mvr[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  return (
    <AppShell crumbs="MVR" title="MVR Tracker"
      actions={<button onClick={() => setShowAdd(true)} disabled={!drivers.length} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)] disabled:opacity-50" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>+ Log MVR pull</button>}>
      <div className="p-6">
        <TenantTable<Mvr> rows={rows} loading={loading}
          emptyTitle={drivers.length === 0 ? "Add drivers first" : "No MVR pulls yet"}
          emptyDesc={drivers.length === 0 ? "MVR records attach to drivers." : "FMCSA § 391.25 requires annual MVR review. Log each pull here."}
          columns={[
            { key: "driver", label: "Driver", render: (m) => <span className="text-[var(--fg)]">{driverLabel(drivers.find(d => d.id === m.driver_id))}</span> },
            { key: "pulled_on", label: "Pulled", render: (m) => fmtDate(m.pulled_on) },
            { key: "state", label: "State", hideOnMobile: true, render: (m) => m.state || <span className="text-white/35">—</span> },
            { key: "result", label: "Result", render: (m) => m.result ? <Badge color={COLOR[m.result]||"gray"}>{m.result}</Badge> : <Badge color="gray">pending</Badge> },
            { key: "violations_count", label: "Violations", hideOnMobile: true, render: (m) => m.violations_count ?? 0 },
            { key: "file_url", label: "File", render: (m) => m.file_url ? <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-[#22D3EE] underline">View</a> : <span className="text-white/35">—</span> },
          ]}
        />
      </div>
      {showAdd && <MvrFormModal carrier_id={carrier!.id} drivers={drivers} onClose={()=>setShowAdd(false)} onSaved={()=>{refresh();setShowAdd(false);}} />}
    </AppShell>
  );
}

function MvrFormModal({ carrier_id, drivers, onClose, onSaved }:{ carrier_id:string; drivers:DriverOpt[]; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<Mvr>>({ pulled_on: new Date().toISOString().slice(0,10), result: "pending", violations_count: 0 });
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string|null>(null);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!form.driver_id) throw new Error("Select a driver");
      const { error } = await getSupabase().from("compass_mvr_records").insert([{ ...form, carrier_id }]);
      if (error) throw error;
      // Also update driver.last_mvr_pulled_on
      await getSupabase().from("compass_drivers").update({ last_mvr_pulled_on: form.pulled_on }).eq("id", form.driver_id);
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Log MVR pull" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Driver *">
          <select required value={form.driver_id||""} onChange={(e)=>setForm({...form,driver_id:e.target.value})} className="x3i">
            <option value="">Select…</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        <Field label="Pulled on"><input type="date" className="x3i" value={form.pulled_on||""} onChange={(e)=>setForm({...form,pulled_on:e.target.value})} required /></Field>
        <Field label="State"><input className="x3i" value={form.state||""} onChange={(e)=>setForm({...form,state:e.target.value.toUpperCase()})} maxLength={2} /></Field>
        <Field label="Result">
          <select value={form.result||""} onChange={(e)=>setForm({...form,result:e.target.value})} className="x3i">{RESULTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
        </Field>
        <Field label="Violation count"><input type="number" min={0} className="x3i" value={String(form.violations_count||0)} onChange={(e)=>setForm({...form,violations_count:Number(e.target.value)})} /></Field>
        <Field label="File URL"><input type="url" className="x3i" value={form.file_url||""} onChange={(e)=>setForm({...form,file_url:e.target.value})} /></Field>
        <Field label="Notes"><textarea className="x3i" rows={2} value={form.notes||""} onChange={(e)=>setForm({...form,notes:e.target.value})} /></Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}
