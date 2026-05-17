"use client";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

type F = { id:string; quarter:string; filed_on:string|null; total_miles:number|null; total_gallons:number|null; net_tax_due:number|null; status:string; filing_state:string|null; receipt_url:string|null; notes:string|null };
const STATUSES = ["draft","filed","accepted","rejected","amended"];
const SC: Record<string,"gray"|"cyan"|"green"|"red"|"amber"> = { draft:"gray", filed:"cyan", accepted:"green", rejected:"red", amended:"amber" };

export default function IftaPage() {
  const { carrier } = useUser();
  const [rows, setRows] = useState<F[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    if (!carrier) return;
    const { data } = await getSupabase().from("compass_ifta_filings").select("*").eq("carrier_id", carrier.id).order("quarter",{ascending:false});
    setRows((data as F[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  return (
    <AppShell crumbs="IFTA" title="IFTA Filings"
      actions={<button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ New filing</button>}>
      <div className="p-6">
        <div className="mb-4 text-[12px] text-[var(--fg-muted)]">International Fuel Tax Agreement quarterly returns. Due Apr 30 (Q1), Jul 31 (Q2), Oct 31 (Q3), Jan 31 (Q4).</div>
        <TenantTable<F> rows={rows} loading={loading}
          emptyTitle="No filings yet"
          emptyDesc="Start tracking IFTA returns. Connect your ELD to auto-populate miles & gallons (coming next sprint)."
          columns={[
            { key: "quarter", label: "Quarter", render: (f) => <span className="text-[var(--fg)] font-semibold">{f.quarter}</span> },
            { key: "status", label: "Status", render: (f) => <Badge color={SC[f.status]||"gray"}>{f.status}</Badge> },
            { key: "filed_on", label: "Filed", render: (f) => fmtDate(f.filed_on) || <span className="text-[var(--fg-faint)]">—</span> },
            { key: "total_miles", label: "Miles", hideOnMobile: true, render: (f) => f.total_miles ? f.total_miles.toLocaleString() : <span className="text-[var(--fg-faint)]">—</span> },
            { key: "total_gallons", label: "Gallons", hideOnMobile: true, render: (f) => f.total_gallons ? f.total_gallons.toLocaleString() : <span className="text-[var(--fg-faint)]">—</span> },
            { key: "net_tax_due", label: "Net tax", render: (f) => f.net_tax_due !== null && f.net_tax_due !== undefined ? `$${Number(f.net_tax_due).toLocaleString(undefined,{minimumFractionDigits:2})}` : <span className="text-[var(--fg-faint)]">—</span> },
            { key: "receipt_url", label: "Receipt", render: (f) => f.receipt_url ? <a href={f.receipt_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">View</a> : <span className="text-[var(--fg-faint)]">—</span> },
          ]}
        />
      </div>
      {showAdd && <IftaFormModal carrier_id={carrier!.id} onClose={()=>setShowAdd(false)} onSaved={()=>{refresh();setShowAdd(false);}} />}
    </AppShell>
  );
}

function IftaFormModal({ carrier_id, onClose, onSaved }:{ carrier_id:string; onClose:()=>void; onSaved:()=>void }) {
  const y = new Date().getFullYear();
  const q = Math.ceil((new Date().getMonth() + 1) / 3);
  const [form, setForm] = useState<Partial<F>>({ quarter: `${y}-Q${q}`, status: "draft" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string|null>(null);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!form.quarter) throw new Error("Quarter required");
      const { error } = await getSupabase().from("compass_ifta_filings").insert([{ ...form, carrier_id }]);
      if (error) throw error;
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="New IFTA filing" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Quarter (e.g. 2026-Q2) *"><input className="x3i" required value={form.quarter||""} onChange={(e)=>setForm({...form,quarter:e.target.value})} placeholder="2026-Q2" /></Field>
        <Field label="Status"><select className="x3i" value={form.status||"draft"} onChange={(e)=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></Field>
        <Field label="Filed on"><input type="date" className="x3i" value={form.filed_on||""} onChange={(e)=>setForm({...form,filed_on:e.target.value})} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Total miles"><input type="number" className="x3i" value={String(form.total_miles||"")} onChange={(e)=>setForm({...form,total_miles:e.target.value?Number(e.target.value):null})} /></Field>
          <Field label="Total gallons"><input type="number" className="x3i" value={String(form.total_gallons||"")} onChange={(e)=>setForm({...form,total_gallons:e.target.value?Number(e.target.value):null})} /></Field>
        </div>
        <Field label="Net tax due ($)"><input type="number" step="0.01" className="x3i" value={String(form.net_tax_due||"")} onChange={(e)=>setForm({...form,net_tax_due:e.target.value?Number(e.target.value):null})} /></Field>
        <Field label="Filing state"><input className="x3i" maxLength={2} value={form.filing_state||""} onChange={(e)=>setForm({...form,filing_state:e.target.value.toUpperCase()})} /></Field>
        <Field label="Receipt URL"><input type="url" className="x3i" value={form.receipt_url||""} onChange={(e)=>setForm({...form,receipt_url:e.target.value})} /></Field>
        <Field label="Notes"><textarea className="x3i" rows={2} value={form.notes||""} onChange={(e)=>setForm({...form,notes:e.target.value})} /></Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}
