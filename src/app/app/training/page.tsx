"use client";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

type T = { id:string; driver_id:string; course_name:string; course_category:string|null; completed_on:string|null; expires_on:string|null; certificate_url:string|null; provider:string|null; hours_credited:number|null; notes:string|null };

export default function TrainingPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    if (!carrier) return;
    const { data } = await getSupabase().from("compass_training_records").select("*").eq("carrier_id", carrier.id).order("completed_on",{ascending:false});
    setRows((data as T[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  const today = new Date().toISOString().slice(0,10);
  return (
    <AppShell crumbs="TRAINING" title="Training Records"
      actions={<button onClick={() => setShowAdd(true)} disabled={!drivers.length} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)] disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Add training</button>}>
      <div className="p-6">
        <TenantTable<T> rows={rows} loading={loading}
          emptyTitle={drivers.length === 0 ? "Add drivers first" : "No training records yet"}
          emptyDesc={drivers.length === 0 ? "Training records attach to drivers." : "Log entry-level driver training (ELDT) completions, refreshers, and certifications."}
          columns={[
            { key: "driver", label: "Driver", render: (r) => <span className="text-[var(--fg)]">{driverLabel(drivers.find(d => d.id === r.driver_id))}</span> },
            { key: "course_name", label: "Course", render: (r) => <span className="text-[var(--fg)]">{r.course_name}</span> },
            { key: "course_category", label: "Category", hideOnMobile: true, render: (r) => r.course_category || <span className="text-[var(--fg-faint)]">—</span> },
            { key: "completed_on", label: "Completed", render: (r) => fmtDate(r.completed_on) },
            { key: "expires_on", label: "Expires", render: (r) => !r.expires_on ? <span className="text-[var(--fg-faint)]">—</span> : r.expires_on < today ? <Badge color="red">{fmtDate(r.expires_on)}</Badge> : <span className="text-[var(--fg-muted)]">{fmtDate(r.expires_on)}</span> },
            { key: "certificate_url", label: "Cert", render: (r) => r.certificate_url ? <a href={r.certificate_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">View</a> : <span className="text-[var(--fg-faint)]">—</span> },
          ]}
        />
      </div>
      {showAdd && <TrainingFormModal carrier_id={carrier!.id} drivers={drivers} onClose={()=>setShowAdd(false)} onSaved={()=>{refresh();setShowAdd(false);}} />}
    </AppShell>
  );
}

function TrainingFormModal({ carrier_id, drivers, onClose, onSaved }:{ carrier_id:string; drivers:DriverOpt[]; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<T>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string|null>(null);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!form.driver_id || !form.course_name) throw new Error("Driver and course name required");
      const { error } = await getSupabase().from("compass_training_records").insert([{ ...form, carrier_id }]);
      if (error) throw error;
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Log training record" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Driver *">
          <select required value={form.driver_id||""} onChange={(e)=>setForm({...form,driver_id:e.target.value})} className="x3i">
            <option value="">Select…</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        <Field label="Course name *"><input className="x3i" value={form.course_name||""} onChange={(e)=>setForm({...form,course_name:e.target.value})} required placeholder="e.g. ELDT theory module" /></Field>
        <Field label="Category"><input className="x3i" value={form.course_category||""} onChange={(e)=>setForm({...form,course_category:e.target.value})} placeholder="ELDT / Hazmat / refresher / ..." /></Field>
        <Field label="Provider"><input className="x3i" value={form.provider||""} onChange={(e)=>setForm({...form,provider:e.target.value})} /></Field>
        <Field label="Completed on"><input type="date" className="x3i" value={form.completed_on||""} onChange={(e)=>setForm({...form,completed_on:e.target.value})} /></Field>
        <Field label="Expires on"><input type="date" className="x3i" value={form.expires_on||""} onChange={(e)=>setForm({...form,expires_on:e.target.value})} /></Field>
        <Field label="Certificate URL"><input type="url" className="x3i" value={form.certificate_url||""} onChange={(e)=>setForm({...form,certificate_url:e.target.value})} /></Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}
