"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { VehicleImportModal } from "@/components/app/VehicleImportModal";
import { VendorConnectModal } from "@/components/app/VendorConnectModal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { DEMO_VEHICLES, withDemoFallback } from "@/lib/demoFallback";

type Vehicle = {
  id: string; carrier_id: string;
  vin: string | null; license_plate: string | null; license_plate_state: string | null;
  year: number | null; make: string | null; model: string | null;
  gvwr_lbs: number | null; vehicle_type: string | null; fuel_type: string | null;
  current_odometer: number | null;
  in_service_date: string | null; out_of_service_date: string | null;
  status: string;
  last_dot_inspection_on: string | null; next_dot_inspection_due: string | null;
  created_at: string;
};

/** Adapt DemoVehicle (which has a slightly different field shape) into the
 *  Vehicle type the page already renders. Lets us reuse one demo dataset
 *  across pages that share the underlying concept. */
function adaptDemoVehicle(d: typeof DEMO_VEHICLES[number]): Vehicle {
  // map demo "tractor/trailer" to vehicle_type, "active/oos/maintenance/retired" → status
  const STATUS_MAP: Record<string, string> = {
    active: "active", oos: "out_of_service", maintenance: "out_of_service", retired: "sold",
  };
  return {
    id: d.id, carrier_id: d.carrier_id,
    vin: d.vin, license_plate: d.plate_number, license_plate_state: d.plate_state,
    year: d.year, make: d.make, model: d.model,
    gvwr_lbs: null, vehicle_type: d.type, fuel_type: "diesel",
    current_odometer: null,
    in_service_date: null, out_of_service_date: null,
    status: STATUS_MAP[d.status] || "active",
    last_dot_inspection_on: d.annual_inspection_on,
    next_dot_inspection_due: d.next_pm_due_on,
    created_at: d.created_at,
  };
}

const VEHICLE_TYPES = ["tractor","straight_truck","trailer","tank","dump","bus","other"];
const STATUSES = ["active","out_of_service","sold","totaled"];
const STATUS_COLORS: Record<string, "green"|"red"|"gray"|"amber"> = {
  active: "green", out_of_service: "amber", sold: "gray", totaled: "red",
};

export default function VehiclesPage() {
  const { carrier } = useUser();
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [edit, setEdit] = useState<Vehicle | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showVendor, setShowVendor] = useState(false);

  async function refresh() {
    if (!carrier) return;
    setLoading(true);
    const { data, error } = await getSupabase().from("compass_vehicles").select("*").eq("carrier_id", carrier.id).order("created_at", { ascending: false });
    if (!error) setRows((data as Vehicle[]) || []);
    setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  // Fall back to demo Apex-Logistics roster (10 power units) when the
  // real query came back empty. Adapter normalizes the demo shape to Vehicle.
  const effectiveRows = useMemo(
    () => withDemoFallback(rows, DEMO_VEHICLES.map(adaptDemoVehicle)),
    [rows]
  );
  const isDemo = rows.length === 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return effectiveRows;
    return effectiveRows.filter(v => `${v.vin} ${v.license_plate} ${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q));
  }, [effectiveRows, search]);

  const today = new Date().toISOString().slice(0,10);
  const in60  = new Date(Date.now() + 60*86400000).toISOString().slice(0,10);
  const in30 = new Date(Date.now() + 30*86400000).toISOString().slice(0,10);
  const kpis = useMemo(() => {
    let active = 0, oos = 0, dotDue30 = 0, dotOverdue = 0;
    for (const v of effectiveRows) {
      if (v.status === "active") active++;
      if (v.status === "out_of_service") oos++;
      if (v.next_dot_inspection_due) {
        if (v.next_dot_inspection_due < today) dotOverdue++;
        else if (v.next_dot_inspection_due <= in30) dotDue30++;
      }
    }
    return { active, oos, dotDue30, dotOverdue };
  }, [effectiveRows, today, in30]);


  return (
    <AppShell crumbs="VEHICLES" title="Vehicles"
      actions={<>
        <button onClick={() => setShowVendor(true)} className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)]">🔌 Vendor sync</button>
        <button onClick={() => setShowImport(true)} className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)]">📥 Import CSV</button>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Add vehicle</button>
      </>}>
      <div className="p-6">
        {isDemo && (
          <div className="mb-3 text-[11px] uppercase tracking-[.14em] font-bold text-[var(--accent)]/80">
            ★ Demo data · showing Apex Logistics sample fleet until your first vehicle is added
          </div>
        )}
        {/* KPI stat cards · top row, classic-app style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KpiCard label="Active power units"           value={kpis.active}     sub={`${effectiveRows.length} on roster`} />
          <KpiCard label="Out of service"               value={kpis.oos}        sub="Down for maintenance / inspection" tone={kpis.oos > 0 ? "warn" : "ok"} />
          <KpiCard label="DOT inspection ≤30d"          value={kpis.dotDue30}   sub="49 CFR § 396.17" tone={kpis.dotDue30 > 0 ? "warn" : "ok"} />
          <KpiCard label="DOT inspection overdue"       value={kpis.dotOverdue} sub="Annual inspection past due" tone={kpis.dotOverdue > 0 ? "danger" : "ok"} />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search VIN, plate, make/model…"
            className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]" />
          <div className="text-[12px] text-[var(--fg-muted)]">{filtered.length} of {effectiveRows.length}</div>
        </div>

        <TenantTable<Vehicle>
          rows={filtered} loading={loading}
          emptyTitle={effectiveRows.length ? "No matches" : "No vehicles yet"}
          emptyDesc={effectiveRows.length ? "Try a different search." : "Add your first power unit to start tracking inspections and maintenance."}
          emptyAction={effectiveRows.length === 0 ? <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-lg font-extrabold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Add first vehicle</button> : undefined}
          onRowClick={(v) => { if (!isDemo) setEdit(v); }}
          columns={[
            { key: "vehicle", label: "Vehicle", render: (v) =>
              <div>
                <div className="text-[var(--fg)] font-semibold">{v.year} {v.make} {v.model}</div>
                <div className="text-[11px] text-[var(--fg-muted)]">{v.license_plate ? `${v.license_plate_state || ""} ${v.license_plate}` : "—"}</div>
              </div> },
            { key: "vin", label: "VIN", hideOnMobile: true, render: (v) => v.vin ? <code className="text-[11px] text-[var(--fg-muted)]">{v.vin}</code> : <span className="text-[var(--fg-faint)]">—</span> },
            { key: "vehicle_type", label: "Type", hideOnMobile: true, render: (v) => v.vehicle_type ? <Badge color="cyan">{v.vehicle_type.replace("_"," ")}</Badge> : <span className="text-[var(--fg-faint)]">—</span> },
            { key: "next_dot_inspection_due", label: "DOT due", hideOnMobile: true, render: (v) =>
              !v.next_dot_inspection_due ? <span className="text-[var(--fg-faint)]">—</span> :
              v.next_dot_inspection_due < today ? <Badge color="red">{fmtDate(v.next_dot_inspection_due)}</Badge> :
              v.next_dot_inspection_due <= in60 ? <Badge color="amber">{fmtDate(v.next_dot_inspection_due)}</Badge> :
              <span className="text-[var(--fg-muted)]">{fmtDate(v.next_dot_inspection_due)}</span> },
            { key: "status", label: "Status", render: (v) => <Badge color={STATUS_COLORS[v.status] || "gray"}>{v.status.replace("_"," ")}</Badge> },
          ]}
        />
      </div>

      {(showAdd || edit) && <VehicleFormModal carrier_id={carrier!.id} vehicle={edit} onClose={() => { setShowAdd(false); setEdit(null); }} onSaved={() => { refresh(); setShowAdd(false); setEdit(null); }} />}
      {showImport && carrier && <VehicleImportModal carrierId={carrier.id} onClose={() => setShowImport(false)} onImported={refresh} />}
      {showVendor && carrier && <VendorConnectModal carrierId={carrier.id} onClose={() => setShowVendor(false)} onImported={refresh} categories={["eld","other"]} title="Connect a fleet vendor" subtitle="Pull vehicles automatically from your ELD / telematics provider." />}
    </AppShell>
  );
}

function VehicleFormModal({ carrier_id, vehicle, onClose, onSaved }: { carrier_id: string; vehicle: Vehicle | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Vehicle>>(vehicle || { status: "active", vehicle_type: "tractor" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Vehicle>(k: K, v: string | number | null) {
    setForm((prev) => ({ ...prev, [k]: v === "" ? null : v as Vehicle[K] }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const sb = getSupabase();
      const payload = { ...form, carrier_id };
      if (vehicle?.id) {
        const { error } = await sb.from("compass_vehicles").update(payload).eq("id", vehicle.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("compass_vehicles").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!vehicle?.id) return;
    if (!confirm("Remove this vehicle? This cannot be undone.")) return;
    setBusy(true);
    const { error } = await getSupabase().from("compass_vehicles").delete().eq("id", vehicle.id);
    if (error) { setError(error.message); setBusy(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-6" onClick={onClose}>
      <div className="bg-[var(--surface-3)] border border-[var(--border)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--surface-3)] z-10">
          <h2 className="text-[var(--fg)] font-extrabold text-lg">{vehicle ? `Edit ${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""}` : "Add vehicle"}</h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Section title="Vehicle">
            <Row>
              <Field label="Year"><Input type="number" value={String(form.year||"")} onChange={(v)=>set("year", v?Number(v):null)} /></Field>
              <Field label="Make"><Input value={form.make||""} onChange={(v)=>set("make",v)} /></Field>
              <Field label="Model"><Input value={form.model||""} onChange={(v)=>set("model",v)} /></Field>
            </Row>
            <Row>
              <Field label="VIN"><Input value={form.vin||""} onChange={(v)=>set("vin",v.toUpperCase())} maxLength={17} /></Field>
              <Field label="Plate"><Input value={form.license_plate||""} onChange={(v)=>set("license_plate",v.toUpperCase())} /></Field>
              <Field label="Plate state"><Input value={form.license_plate_state||""} onChange={(v)=>set("license_plate_state",v.toUpperCase())} maxLength={2} /></Field>
            </Row>
            <Row>
              <Field label="Type"><Select value={form.vehicle_type||"tractor"} onChange={(v)=>set("vehicle_type",v)} options={VEHICLE_TYPES} /></Field>
              <Field label="GVWR (lbs)"><Input type="number" value={String(form.gvwr_lbs||"")} onChange={(v)=>set("gvwr_lbs", v?Number(v):null)} /></Field>
              <Field label="Fuel"><Input value={form.fuel_type||""} onChange={(v)=>set("fuel_type",v)} /></Field>
            </Row>
          </Section>

          <Section title="Service & inspection">
            <Row>
              <Field label="Status"><Select value={form.status||"active"} onChange={(v)=>set("status",v)} options={STATUSES} /></Field>
              <Field label="Odometer"><Input type="number" value={String(form.current_odometer||"")} onChange={(v)=>set("current_odometer", v?Number(v):null)} /></Field>
              <Field label="In-service date"><Input type="date" value={form.in_service_date||""} onChange={(v)=>set("in_service_date",v)} /></Field>
            </Row>
            <Row>
              <Field label="Last DOT inspection"><Input type="date" value={form.last_dot_inspection_on||""} onChange={(v)=>set("last_dot_inspection_on",v)} /></Field>
              <Field label="Next DOT due"><Input type="date" value={form.next_dot_inspection_due||""} onChange={(v)=>set("next_dot_inspection_due",v)} /></Field>
            </Row>
          </Section>

          {error && <div className="text-[12px] text-red-700 dark:text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-between items-center pt-2 sticky bottom-0 bg-[var(--surface-3)] py-2">
            <div>{vehicle && <button type="button" onClick={handleDelete} disabled={busy} className="text-[12px] text-red-700 dark:text-red-400 hover:text-red-700 dark:text-red-300">Delete vehicle</button>}</div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm border border-[var(--border)]">Cancel</button>
              <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg font-extrabold text-sm text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Saving…" : vehicle ? "Save changes" : "Add vehicle"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-2">{title}</div><div className="space-y-2">{children}</div></div>;
}
function Row({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1">{label}</div>{children}</label>;
}
function Input(p: { value: string; onChange: (v: string)=>void; type?: string; maxLength?: number }) {
  return <input type={p.type||"text"} value={p.value} onChange={(e)=>p.onChange(e.target.value)} maxLength={p.maxLength} className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]" />;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string)=>void; options: string[] }) {
  return <select value={value} onChange={(e)=>onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm">{options.map(o => <option key={o} value={o}>{o.replace("_"," ")}</option>)}</select>;
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

