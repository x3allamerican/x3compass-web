"use client";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

type T = { id:string; driver_id:string; test_type:string; test_kind:string; collected_on:string; result:string; ccf_number:string|null; lab:string|null; notes:string|null };
const TYPES = ["pre_employment","random","post_accident","reasonable_suspicion","return_to_duty","follow_up"];
const KINDS = ["drug","alcohol","both"];
const RESULTS = ["pending","negative","positive","refusal","cancelled","dilute_negative"];
const RC: Record<string,"green"|"red"|"amber"|"gray"> = { pending:"amber", negative:"green", positive:"red", refusal:"red", cancelled:"gray", dilute_negative:"amber" };

export default function DrugAlcoholPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    if (!carrier) return;
    const { data } = await getSupabase().from("compass_da_tests").select("*").eq("carrier_id", carrier.id).order("collected_on",{ascending:false});
    setRows((data as T[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  return (
    <AppShell crumbs="DRUG & ALCOHOL" title="Drug & Alcohol Testing"
      actions={<button onClick={() => setShowAdd(true)} disabled={!drivers.length} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)] disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Log test</button>}>
      <div className="p-6">
        <div className="mb-4 text-[12px] text-[var(--fg-muted)]">49 CFR Part 382 — pre-employment, random, post-accident, reasonable-suspicion, return-to-duty, and follow-up tests.</div>
        <TenantTable<T> rows={rows} loading={loading}
          emptyTitle="No tests logged"
          emptyDesc="Log every drug or alcohol test for audit-ready FMCSA Clearinghouse records."
          columns={[
            { key: "collected_on", label: "Collected", render: (t) => fmtDate(t.collected_on) },
            { key: "driver_id", label: "Driver", render: (t) => driverLabel(drivers.find(d => d.id === t.driver_id)) },
            { key: "test_type", label: "Type", hideOnMobile: true, render: (t) => <Badge color="cyan">{t.test_type.replace(/_/g," ")}</Badge> },
            { key: "test_kind", label: "Kind", hideOnMobile: true, render: (t) => t.test_kind },
            { key: "result", label: "Result", render: (t) => <Badge color={RC[t.result]||"gray"}>{t.result.replace(/_/g," ")}</Badge> },
            { key: "lab", label: "Lab", hideOnMobile: true, render: (t) => t.lab || <span className="text-[var(--fg-faint)]">—</span> },
          ]}
        />
      </div>
      {showAdd && <DaTestFormModal carrier_id={carrier!.id} drivers={drivers} onClose={()=>setShowAdd(false)} onSaved={()=>{refresh();setShowAdd(false);}} />}
    </AppShell>
  );
}

function DaTestFormModal({ carrier_id, drivers, onClose, onSaved }:{ carrier_id:string; drivers:DriverOpt[]; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<T>>({ collected_on: new Date().toISOString().slice(0,10), test_type: "pre_employment", test_kind: "drug", result: "pending" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string|null>(null);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!form.driver_id) throw new Error("Select a driver");
      const { error } = await getSupabase().from("compass_da_tests").insert([{ ...form, carrier_id }]);
      if (error) throw error;
      if (form.collected_on) await getSupabase().from("compass_drivers").update({ last_drug_test_on: form.collected_on }).eq("id", form.driver_id);
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Log D&amp;A test" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Driver *">
          <select required className="x3i" value={form.driver_id||""} onChange={(e)=>setForm({...form,driver_id:e.target.value})}>
            <option value="">Select…</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        <Field label="Collected on"><input type="date" className="x3i" value={form.collected_on||""} onChange={(e)=>setForm({...form,collected_on:e.target.value})} required /></Field>
        <Field label="Type"><select className="x3i" value={form.test_type||""} onChange={(e)=>setForm({...form,test_type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></Field>
        <Field label="Kind"><select className="x3i" value={form.test_kind||""} onChange={(e)=>setForm({...form,test_kind:e.target.value})}>{KINDS.map(t=><option key={t}>{t}</option>)}</select></Field>
        <Field label="Result"><select className="x3i" value={form.result||""} onChange={(e)=>setForm({...form,result:e.target.value})}>{RESULTS.map(r=><option key={r}>{r}</option>)}</select></Field>
        <Field label="CCF #"><input className="x3i" value={form.ccf_number||""} onChange={(e)=>setForm({...form,ccf_number:e.target.value})} /></Field>
        <Field label="Lab"><input className="x3i" value={form.lab||""} onChange={(e)=>setForm({...form,lab:e.target.value})} /></Field>
        <Field label="Notes"><textarea className="x3i" rows={2} value={form.notes||""} onChange={(e)=>setForm({...form,notes:e.target.value})} /></Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}
