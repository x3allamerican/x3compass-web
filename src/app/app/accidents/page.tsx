"use client";
import { FormEvent, useEffect, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { AccidentImportModal } from "@/components/app/AccidentImportModal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel, DriverOpt } from "@/components/app/useDrivers";

type A = { id:string; driver_id:string|null; vehicle_id:string|null; accident_date:string; location:string|null; recordable:boolean; fatalities:number; injuries:number; tow_required:boolean; preventable:string|null; description:string|null; cause_category:string|null };
type VOpt = { id:string; year:number|null; make:string|null; model:string|null; license_plate:string|null };

// Bright, theme-aware pill — high contrast in both light and dark mode
function StatusPill({ tone, children }: { tone: "preventable" | "non_preventable" | "undetermined" | "recordable" | "not_recordable"; children: React.ReactNode }) {
  const map: Record<typeof tone, string> = {
    preventable:     "bg-red-700 text-white border-red-800 dark:bg-rose-500/30 dark:text-rose-100 dark:border-rose-400/70",
    non_preventable: "bg-green-700 text-white border-green-800 dark:bg-emerald-500/30 dark:text-emerald-100 dark:border-emerald-400/70",
    undetermined:    "bg-amber-600 text-white border-amber-700 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/70",
    recordable:      "bg-amber-600 text-white border-amber-700 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/70",
    not_recordable:  "bg-slate-500 text-white border-slate-600 dark:bg-slate-500/30 dark:text-slate-100 dark:border-slate-400/70",
  } as const;
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${map[tone]}`}>{children}</span>;
}

function KpiCard({ label, value, sub, tone = "ok" }: { label: string; value: number | string; sub?: string; tone?: "ok" | "warn" | "danger" | "muted" }) {
  const accent = tone === "warn" ? "var(--warning, #FBBF24)" : tone === "danger" ? "var(--danger, #F87171)" : tone === "muted" ? "var(--fg-muted)" : "var(--accent)";
  const show = (tone === "warn" || tone === "danger") && typeof value === "number" && value > 0;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
      <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">{label}</div>
      <div className="text-[28px] font-black leading-none text-[var(--fg)]" style={{ color: show ? accent : undefined }}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--fg-muted)] mt-1">{sub}</div>}
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

  // KPI roll-ups
  const today = new Date();
  const ytdStart = new Date(today.getFullYear(), 0, 1).toISOString().slice(0,10);
  const kpis = useMemo(() => {
    const ytd = rows.filter(a => a.accident_date >= ytdStart);
    const last24 = new Date(); last24.setMonth(last24.getMonth() - 24);
    const since24 = rows.filter(a => new Date(a.accident_date) >= last24);
    const recordable24 = since24.filter(a => a.recordable).length;
    const totalInjuries = ytd.reduce((s, a) => s + (a.injuries || 0), 0);
    const totalFatalities = ytd.reduce((s, a) => s + (a.fatalities || 0), 0);
    const awaiting = rows.filter(a => !a.preventable || a.preventable === "undetermined").length;
    return {
      total_ytd: ytd.length,
      recordable_24mo: recordable24,
      injuries_fatalities: `${totalInjuries} / ${totalFatalities}`,
      awaiting_classification: awaiting,
    };
  }, [rows, ytdStart]);

  return (
    <AppShell crumbs="ACCIDENTS · 49 CFR § 390.15" title="Accident Register"
      actions={
        <>
          <button onClick={() => setShowImport(true)} className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)]">📥 Import CSV</button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Log accident</button>
        </>
      }
    >
      <div className="p-6">

        {/* KPI stat cards — top row, classic-app style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KpiCard label="Total YTD"               value={kpis.total_ytd}           sub="All accidents this year" />
          <KpiCard label="Recordable (24 mo)"      value={kpis.recordable_24mo}     sub="Fatality / med / tow-from-scene" tone={kpis.recordable_24mo > 0 ? "warn" : "ok"} />
          <KpiCard label="Injuries / fatalities"   value={kpis.injuries_fatalities} sub="YTD totals" tone={kpis.injuries_fatalities !== "0 / 0" ? "danger" : "ok"} />
          <KpiCard label="Awaiting classification" value={kpis.awaiting_classification} sub="Preventability review" tone={kpis.awaiting_classification > 0 ? "warn" : "ok"} />
        </div>

        <div className="mb-4 text-[12px] text-[var(--fg-muted)]">
          <strong>49 CFR § 390.15</strong> — recordable accidents must be logged and retained for 3 years from date of accident.
          Recordable = involves a fatality, an injury requiring immediate medical treatment away from scene, or a vehicle towed from the scene.
        </div>

        <TenantTable<A>
          rows={rows} loading={loading}
          emptyTitle="No accidents logged"
          emptyDesc="If you haven't had any in the last 3 years, leave this empty. The DOT requires only recordable accidents."
          onRowClick={(a) => setEditAcc(a)}
          columns={[
            { key: "accident_date", label: "Date", render: (a) => <span className="text-[var(--fg)] font-semibold">{fmtDate(a.accident_date)}</span> },
            { key: "driver_id", label: "Driver", hideOnMobile: true, render: (a) => a.driver_id ? <span className="text-[var(--fg)]">{driverLabel(drivers.find(d => d.id === a.driver_id))}</span> : <span className="text-[var(--fg-faint)]">—</span> },
            { key: "location", label: "Location", hideOnMobile: true, render: (a) => a.location || <span className="text-[var(--fg-faint)]">—</span> },
            { key: "recordable", label: "Recordable", render: (a) => a.recordable ? <StatusPill tone="recordable">Recordable</StatusPill> : <StatusPill tone="not_recordable">Not recordable</StatusPill> },
            { key: "injuries", label: "Injuries / Fatal", render: (a) => <span className="text-[var(--fg)] font-bold">{a.injuries || 0} / {a.fatalities || 0}</span> },
            { key: "preventable", label: "Preventable", hideOnMobile: true, render: (a) => a.preventable === "preventable" ? <StatusPill tone="preventable">Preventable</StatusPill> : a.preventable === "non_preventable" ? <StatusPill tone="non_preventable">Non-preventable</StatusPill> : <StatusPill tone="undetermined">Classify</StatusPill> },
          ]}
        />
      </div>

      {(showAdd || editAcc) && <AccidentFormModal carrier_id={carrier!.id} drivers={drivers} vehicles={vehicles} accident={editAcc} onClose={()=>{setShowAdd(false); setEditAcc(null);}} onSaved={()=>{refresh();setShowAdd(false);setEditAcc(null);}} />}
      {showImport && carrier && <AccidentImportModal carrierId={carrier.id} onClose={()=>setShowImport(false)} onImported={refresh} />}
    </AppShell>
  );
}

function AccidentFormModal({ carrier_id, drivers, vehicles, accident, onClose, onSaved }:{ carrier_id:string; drivers:DriverOpt[]; vehicles:VOpt[]; accident:A|null; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState<Partial<A>>(accident || { accident_date: new Date().toISOString().slice(0,10), recordable: false, fatalities: 0, injuries: 0, tow_required: false });
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
        <Field label="Date *"><input required type="date" className="x3i" value={form.accident_date||""} onChange={(e)=>setForm({...form,accident_date:e.target.value})} /></Field>
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
          <Field label="Recordable"><select className="x3i" value={String(form.recordable||false)} onChange={(e)=>setForm({...form,recordable:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
          <Field label="Tow required"><select className="x3i" value={String(form.tow_required||false)} onChange={(e)=>setForm({...form,tow_required:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
          <Field label="Injuries"><input className="x3i" type="number" min={0} value={form.injuries||0} onChange={(e)=>setForm({...form,injuries:parseInt(e.target.value)||0})} /></Field>
          <Field label="Fatalities"><input className="x3i" type="number" min={0} value={form.fatalities||0} onChange={(e)=>setForm({...form,fatalities:parseInt(e.target.value)||0})} /></Field>
        </div>
        <Field label="Preventability">
          <select className="x3i" value={form.preventable||""} onChange={(e)=>setForm({...form,preventable:e.target.value||null})}>
            <option value="">— not yet classified —</option>
            <option value="preventable">Preventable</option>
            <option value="non_preventable">Non-preventable</option>
            <option value="undetermined">Undetermined</option>
          </select>
        </Field>
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
