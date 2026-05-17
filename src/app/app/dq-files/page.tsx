"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

type Doc = { id:string; carrier_id:string; driver_id:string; doc_type:string; label:string|null; url:string|null; expires_on:string|null; created_at:string };

const DOC_TYPES = ["application","cdl_copy","medical_card","road_test_certificate","mvr","drug_test_result","clearinghouse_query","prior_employer_inquiry","disclosure_consent","background_check","other"];

export default function DQFilesPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDriver, setFilterDriver] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    if (!carrier) return;
    setLoading(true);
    const { data } = await getSupabase().from("compass_dq_documents").select("*").eq("carrier_id", carrier.id).order("created_at",{ascending:false});
    setDocs((data as Doc[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  const filtered = useMemo(() => filterDriver ? docs.filter(d => d.driver_id === filterDriver) : docs, [docs, filterDriver]);
  const today = new Date().toISOString().slice(0,10);

  return (
    <AppShell crumbs="DQ FILES" title="Driver Qualification Files"
      actions={<button onClick={() => setShowAdd(true)} disabled={!drivers.length} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)] disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Upload document</button>}>
      <div className="p-6">
        <div className="flex gap-3 mb-4">
          <select value={filterDriver} onChange={(e)=>setFilterDriver(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm">
            <option value="">All drivers</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
          <div className="text-[12px] text-[var(--fg-muted)] self-center">{filtered.length} document{filtered.length===1?"":"s"}</div>
        </div>
        <TenantTable<Doc> rows={filtered} loading={loading}
          emptyTitle={drivers.length === 0 ? "Add a driver first" : "No documents yet"}
          emptyDesc={drivers.length === 0 ? "DQ documents attach to drivers. Add a driver from the Drivers page first." : "Upload your first DQ document."}
          columns={[
            { key: "driver", label: "Driver", render: (d) => <span className="text-[var(--fg)]">{driverLabel(drivers.find(x => x.id === d.driver_id))}</span> },
            { key: "doc_type", label: "Type", render: (d) => <Badge color="cyan">{d.doc_type.replace(/_/g," ")}</Badge> },
            { key: "label", label: "Label", hideOnMobile: true, render: (d) => d.label || <span className="text-[var(--fg-faint)]">—</span> },
            { key: "expires_on", label: "Expires", render: (d) => !d.expires_on ? <span className="text-[var(--fg-faint)]">—</span> : d.expires_on < today ? <Badge color="red">{fmtDate(d.expires_on)}</Badge> : <span className="text-[var(--fg-muted)]">{fmtDate(d.expires_on)}</span> },
            { key: "url", label: "File", render: (d) => d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">Open</a> : <span className="text-[var(--fg-faint)]">—</span> },
          ]}
        />
      </div>
      {showAdd && <DocFormModal carrier_id={carrier!.id} drivers={drivers} onClose={()=>setShowAdd(false)} onSaved={()=>{refresh();setShowAdd(false);}} />}
    </AppShell>
  );
}

function DocFormModal({ carrier_id, drivers, onClose, onSaved }:{ carrier_id:string; drivers: DriverOpt[]; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<Doc>>({ doc_type: "medical_card", driver_id: drivers[0]?.id });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!form.driver_id) throw new Error("Select a driver");
      const { error } = await getSupabase().from("compass_dq_documents").insert([{ ...form, carrier_id }]);
      if (error) throw error;
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Upload DQ document" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Driver *">
          <select required value={form.driver_id||""} onChange={(e)=>setForm({...form,driver_id:e.target.value})} className="x3i">
            <option value="">Select…</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        <Field label="Document type">
          <select value={form.doc_type||""} onChange={(e)=>setForm({...form,doc_type:e.target.value})} className="x3i">
            {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
          </select>
        </Field>
        <Field label="Label (optional)"><input className="x3i" value={form.label||""} onChange={(e)=>setForm({...form,label:e.target.value})} placeholder="e.g. 2026 renewal" /></Field>
        <Field label="File URL (Drive / R2 / S3 link)"><input className="x3i" type="url" value={form.url||""} onChange={(e)=>setForm({...form,url:e.target.value})} placeholder="https://…" /></Field>
        <Field label="Expires on"><input className="x3i" type="date" value={form.expires_on||""} onChange={(e)=>setForm({...form,expires_on:e.target.value})} /></Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} submitLabel="Upload" />
      </form>
    </Modal>
  );
}
