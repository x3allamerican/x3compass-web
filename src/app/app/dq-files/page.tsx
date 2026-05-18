"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { DriverDQGrid } from "@/components/app/DriverDQGrid";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

type Doc = { id:string; carrier_id:string; driver_id:string; doc_type:string; label:string|null; url:string|null; expires_on:string|null; created_at:string };

const DOC_TYPES = [
  "application","cdl_copy","medical_card","road_test_certificate",
  "mvr","mvr_initial","mvr_annual","mvr_review",
  "drug_test_result","pre_employment_drug_test",
  "clearinghouse_query","clearinghouse_full",
  "prior_employer_inquiry","psp","psp_report",
  "national_registry_verification","registry_verification",
  "disclosure_consent","background_check",
  "eldt_certificate","eldt","other",
];

export default function DQFilesPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDriver, setFilterDriver] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [prefillDocType, setPrefillDocType] = useState<string | undefined>();
  const [view, setView] = useState<"grid" | "table">("grid");

  async function refresh() {
    if (!carrier) return;
    setLoading(true);
    const { data } = await getSupabase().from("compass_dq_documents").select("*").eq("carrier_id", carrier.id).order("created_at",{ascending:false});
    setDocs((data as Doc[]) || []); setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  const filtered = useMemo(() => filterDriver ? docs.filter(d => d.driver_id === filterDriver) : docs, [docs, filterDriver]);
  const selectedDriver = useMemo(() => drivers.find(d => d.id === filterDriver), [drivers, filterDriver]);

  const today = new Date().toISOString().slice(0,10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0,10);

  // ── KPI rollups across the whole fleet
  const kpis = useMemo(() => {
    const driversWithDocs = new Set(docs.map(d => d.driver_id)).size;
    const expiringSoon = docs.filter(d => d.expires_on && d.expires_on >= today && d.expires_on <= in30).length;
    const expired = docs.filter(d => d.expires_on && d.expires_on < today).length;
    // Coverage = fraction of drivers that have *any* documents on file (rough proxy)
    const coveragePct = drivers.length > 0 ? Math.round((driversWithDocs / drivers.length) * 100) : 0;
    return { totalDocs: docs.length, coveragePct, expiringSoon, expired, driversWithFiles: driversWithDocs };
  }, [docs, drivers, today, in30]);

  function startUpload(docType?: string) {
    setPrefillDocType(docType);
    setShowAdd(true);
  }

  return (
    <AppShell crumbs="DQ FILES · 49 CFR § 391" title="Driver Qualification Files"
      actions={
        <>
          {selectedDriver && (
            <button
              onClick={() => setView(v => v === "grid" ? "table" : "grid")}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)]"
            >
              {view === "grid" ? "📋 Table view" : "🟦 Grid view"}
            </button>
          )}
          <button onClick={() => startUpload()} disabled={!drivers.length} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)] disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Upload document</button>
        </>
      }
    >
      <div className="p-6">

        {/* KPI stat cards — top row, classic-app style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KpiCard label="Total documents"        value={kpis.totalDocs} sub={`${kpis.driversWithFiles} of ${drivers.length} drivers have files`} />
          <KpiCard label="Roster coverage"         value={`${kpis.coveragePct}%`} sub="Drivers with ≥1 DQ doc" tone={kpis.coveragePct < 80 ? "warn" : "ok"} />
          <KpiCard label="Expiring ≤30d"           value={kpis.expiringSoon} sub="Across all drivers" tone={kpis.expiringSoon > 0 ? "warn" : "ok"} />
          <KpiCard label="Expired"                 value={kpis.expired} sub="Action required" tone={kpis.expired > 0 ? "danger" : "ok"} />
        </div>

        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <select value={filterDriver} onChange={(e)=>setFilterDriver(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm min-w-[220px]">
            <option value="">All drivers (table view)</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
          {!filterDriver && <div className="text-[12px] text-[var(--fg-muted)]">{filtered.length} document{filtered.length===1?"":"s"} across all drivers · pick a driver to see the 12-box DQ grid</div>}
        </div>

        {/* Grid view: per-driver colored requirement tiles */}
        {selectedDriver && view === "grid" && (
          <DriverDQGrid
            driver={selectedDriver as Parameters<typeof DriverDQGrid>[0]["driver"]}
            docs={docs.filter(d => d.driver_id === selectedDriver.id) as Parameters<typeof DriverDQGrid>[0]["docs"]}
            onUpload={(docType) => startUpload(docType)}
          />
        )}

        {/* Table view: flat doc list (filter applies if a driver is selected) */}
        {(!selectedDriver || view === "table") && (
          <TenantTable<Doc> rows={filtered} loading={loading}
            emptyTitle={drivers.length === 0 ? "Add a driver first" : "No documents yet"}
            emptyDesc={drivers.length === 0 ? "DQ documents attach to drivers. Add a driver from the Drivers page first." : "Upload your first DQ document, or pick a driver above to see what's required."}
            columns={[
              { key: "driver", label: "Driver", render: (d) => <span className="text-[var(--fg)]">{driverLabel(drivers.find(x => x.id === d.driver_id))}</span> },
              { key: "doc_type", label: "Type", render: (d) => <Badge color="cyan">{d.doc_type.replace(/_/g," ")}</Badge> },
              { key: "label", label: "Label", hideOnMobile: true, render: (d) => d.label || <span className="text-[var(--fg-faint)]">—</span> },
              { key: "expires_on", label: "Expires", render: (d) => !d.expires_on ? <span className="text-[var(--fg-faint)]">—</span> : d.expires_on < today ? <Badge color="red">{fmtDate(d.expires_on)}</Badge> : d.expires_on <= in30 ? <Badge color="amber">{fmtDate(d.expires_on)}</Badge> : <span className="text-[var(--fg-muted)]">{fmtDate(d.expires_on)}</span> },
              { key: "url", label: "File", render: (d) => d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">Open</a> : <span className="text-[var(--fg-faint)]">—</span> },
            ]}
          />
        )}
      </div>

      {showAdd && <DocFormModal carrier_id={carrier!.id} drivers={drivers} preDriverId={filterDriver} preDocType={prefillDocType} onClose={()=>{setShowAdd(false); setPrefillDocType(undefined);}} onSaved={()=>{refresh(); setShowAdd(false); setPrefillDocType(undefined);}} />}
    </AppShell>
  );
}

function KpiCard({ label, value, sub, tone = "ok" }: { label: string; value: number | string; sub?: string; tone?: "ok" | "warn" | "info" | "muted" | "danger" }) {
  const accent = tone === "warn" ? "var(--warning, #FBBF24)" : tone === "danger" ? "var(--danger, #F87171)" : tone === "info" ? "var(--accent)" : tone === "muted" ? "var(--fg-muted)" : "var(--accent)";
  const showAccent = (tone === "warn" || tone === "danger") && typeof value === "number" && value > 0;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
      <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">{label}</div>
      <div className="text-[28px] font-black leading-none text-[var(--fg)]" style={{ color: showAccent ? accent : undefined }}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--fg-muted)] mt-1">{sub}</div>}
    </div>
  );
}

function DocFormModal({ carrier_id, drivers, preDriverId, preDocType, onClose, onSaved }:{ carrier_id:string; drivers: DriverOpt[]; preDriverId?: string; preDocType?: string; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<Doc>>({ doc_type: preDocType || "medical_card", driver_id: preDriverId || drivers[0]?.id });
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
