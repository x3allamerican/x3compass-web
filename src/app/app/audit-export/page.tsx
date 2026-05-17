"use client";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

type E = { id:string; exported_on:string; scope:string|null; date_range_start:string|null; date_range_end:string|null; status:string; packet_url:string|null; size_bytes:number|null };
const SC: Record<string,"cyan"|"green"|"red"|"gray"|"amber"> = { queued:"amber", generating:"cyan", ready:"green", failed:"red", expired:"gray" };

export default function AuditExportPage() {
  const { carrier } = useUser();
  const [rows, setRows] = useState<E[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    if (!carrier) return;
    const { data } = await getSupabase().from("compass_audit_exports").select("*").eq("carrier_id", carrier.id).order("exported_on",{ascending:false});
    setRows((data as E[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  return (
    <AppShell crumbs="AUDIT EXPORT" title="Audit Packet Generator"
      actions={<button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>+ Generate packet</button>}>
      <div className="p-6">
        <div className="mb-4 rounded-xl border border-[#1E3556] bg-[#0F1C32] p-5">
          <div className="text-[10px] tracking-[.16em] uppercase text-[#22D3EE] font-extrabold mb-2">What this does</div>
          <p className="text-white/65 text-sm leading-relaxed">
            Bundles drivers, DQ documents, MVRs, drug & alcohol test results, training records, accidents, and roadside inspections into a single DOT audit-ready ZIP. Use for FMCSA Compliance Reviews, insurance underwriting, or M&amp;A due diligence.
          </p>
        </div>
        <TenantTable<E> rows={rows} loading={loading}
          emptyTitle="No exports yet"
          emptyDesc="Generate your first audit packet — covers all data in your account, all dates by default."
          columns={[
            { key: "exported_on", label: "Generated", render: (e) => new Date(e.exported_on).toLocaleString() },
            { key: "scope", label: "Scope", render: (e) => e.scope || <Badge color="cyan">full</Badge> },
            { key: "range", label: "Date range", hideOnMobile: true, render: (e) => e.date_range_start ? `${fmtDate(e.date_range_start)} → ${fmtDate(e.date_range_end)||"now"}` : "all time" },
            { key: "status", label: "Status", render: (e) => <Badge color={SC[e.status]||"gray"}>{e.status}</Badge> },
            { key: "size_bytes", label: "Size", hideOnMobile: true, render: (e) => e.size_bytes ? `${Math.round(e.size_bytes/1024)} KB` : <span className="text-white/35">—</span> },
            { key: "packet_url", label: "Download", render: (e) => e.packet_url ? <a href={e.packet_url} target="_blank" rel="noopener noreferrer" className="text-[#22D3EE] underline">ZIP</a> : <span className="text-white/35">pending</span> },
          ]}
        />
      </div>
      {showAdd && <ExportFormModal carrier_id={carrier!.id} onClose={()=>setShowAdd(false)} onSaved={()=>{refresh();setShowAdd(false);}} />}
    </AppShell>
  );
}

function ExportFormModal({ carrier_id, onClose, onSaved }:{ carrier_id:string; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<E>>({ scope: "full" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string|null>(null);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const { error } = await getSupabase().from("compass_audit_exports").insert([{ ...form, carrier_id, status: "queued" }]);
      if (error) throw error;
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Queue failed"); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Generate audit packet" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Scope">
          <select className="x3i" value={form.scope||"full"} onChange={(e)=>setForm({...form,scope:e.target.value})}>
            <option value="full">Full audit (recommended)</option>
            <option value="dq_files_only">DQ Files only</option>
            <option value="drug_alcohol_only">Drug & Alcohol only</option>
            <option value="csa_only">CSA / Inspections / Accidents only</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="From"><input type="date" className="x3i" value={form.date_range_start||""} onChange={(e)=>setForm({...form,date_range_start:e.target.value})} /></Field>
          <Field label="To"><input type="date" className="x3i" value={form.date_range_end||""} onChange={(e)=>setForm({...form,date_range_end:e.target.value})} /></Field>
        </div>
        <p className="text-[11px] text-white/55">Leaving dates blank = all-time. Packet generation is queued; you&apos;ll see status update to <strong>ready</strong> when the ZIP is downloadable.</p>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} submitLabel="Queue export" />
      </form>
    </Modal>
  );
}
