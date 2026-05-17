"use client";
import { FormEvent, useEffect, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, Badge, fmtDate } from "@/components/app/TenantTable";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

type Driver = {
  id: string; carrier_id: string;
  first_name: string; middle_name: string | null; last_name: string;
  email: string | null; phone: string | null;
  cdl_state: string | null; cdl_number: string | null;
  cdl_class: string | null; cdl_expires_on: string | null;
  hire_date: string | null; termination_date: string | null;
  status: string;
  medical_card_expires_on: string | null;
  last_mvr_pulled_on: string | null;
  last_drug_test_on: string | null;
  bg_check_status: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, "green" | "amber" | "red" | "gray" | "violet"> = {
  active: "green", pending_hire: "amber", inactive: "gray", on_leave: "violet", terminated: "red",
};
const CDL_CLASSES = ["A", "B", "C", "none"];
const STATUSES = ["active", "pending_hire", "on_leave", "inactive", "terminated"];

export default function DriversPage() {
  const { carrier } = useUser();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  async function refresh() {
    if (!carrier) return;
    setLoading(true);
    const { data, error } = await getSupabase().from("compass_drivers")
      .select("*").eq("carrier_id", carrier.id).order("last_name", { ascending: true });
    if (!error) setDrivers((data as Driver[]) || []);
    setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter(d => {
      if (statusFilter && d.status !== statusFilter) return false;
      if (!q) return true;
      return `${d.first_name} ${d.last_name} ${d.cdl_number} ${d.email}`.toLowerCase().includes(q);
    });
  }, [drivers, search, statusFilter]);

  const today = new Date().toISOString().slice(0, 10);
  const in60 = new Date(Date.now() + 60*86400000).toISOString().slice(0, 10);
  const isExpiring = (d?: string | null) => !!(d && d >= today && d <= in60);
  const isExpired = (d?: string | null) => !!(d && d < today);

  return (
    <AppShell crumbs="DRIVERS" title="Drivers"
      actions={<button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Add driver</button>}>
      <div className="p-6">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, CDL #, email…"
            className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm">
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
          </select>
          <div className="text-[12px] text-[var(--fg-muted)]">{filtered.length} of {drivers.length}</div>
        </div>

        <TenantTable<Driver>
          rows={filtered} loading={loading}
          emptyTitle={drivers.length ? "No matches" : "No drivers yet"}
          emptyDesc={drivers.length ? "Try clearing filters." : "Add your first driver to start building DQ files, ordering MVRs, and running background checks."}
          emptyAction={drivers.length === 0 ? <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-lg font-extrabold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Add first driver</button> : undefined}
          onRowClick={(d) => setEditDriver(d)}
          columns={[
            { key: "name", label: "Driver", render: (d) =>
              <div>
                <div className="text-[var(--fg)] font-semibold">{d.last_name}, {d.first_name}</div>
                <div className="text-[11px] text-[var(--fg-muted)]">{d.email || d.phone || "—"}</div>
              </div> },
            { key: "cdl", label: "CDL", hideOnMobile: true, render: (d) =>
              d.cdl_number ? <div><div className="text-[var(--fg)]">{d.cdl_state} · {d.cdl_class}</div><div className="text-[11px] text-[var(--fg-muted)]">{d.cdl_number}</div></div> : <span className="text-[var(--fg-faint)]">—</span> },
            { key: "cdl_expires_on", label: "CDL expires", hideOnMobile: true, render: (d) =>
              !d.cdl_expires_on ? <span className="text-[var(--fg-faint)]">—</span> :
              isExpired(d.cdl_expires_on) ? <Badge color="red">{fmtDate(d.cdl_expires_on)}</Badge> :
              isExpiring(d.cdl_expires_on) ? <Badge color="amber">{fmtDate(d.cdl_expires_on)}</Badge> :
              <span className="text-[var(--fg-muted)]">{fmtDate(d.cdl_expires_on)}</span> },
            { key: "medical_card_expires_on", label: "Medical", hideOnMobile: true, render: (d) =>
              !d.medical_card_expires_on ? <span className="text-[var(--fg-faint)]">—</span> :
              isExpired(d.medical_card_expires_on) ? <Badge color="red">{fmtDate(d.medical_card_expires_on)}</Badge> :
              isExpiring(d.medical_card_expires_on) ? <Badge color="amber">{fmtDate(d.medical_card_expires_on)}</Badge> :
              <span className="text-[var(--fg-muted)]">{fmtDate(d.medical_card_expires_on)}</span> },
            { key: "status", label: "Status", render: (d) => <Badge color={STATUS_COLORS[d.status] || "gray"}>{d.status.replace("_"," ")}</Badge> },
          ]}
        />
      </div>

      {(showAdd || editDriver) && <DriverFormModal carrier_id={carrier!.id} driver={editDriver} onClose={() => { setShowAdd(false); setEditDriver(null); }} onSaved={() => { refresh(); setShowAdd(false); setEditDriver(null); }} />}
    </AppShell>
  );
}

function DriverFormModal({ carrier_id, driver, onClose, onSaved }: { carrier_id: string; driver: Driver | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Driver>>(driver || { status: "active" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Driver>(k: K, v: Driver[K] | string) {
    setForm((prev) => ({ ...prev, [k]: v === "" ? null : v as Driver[K] }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const sb = getSupabase();
      const payload = { ...form, carrier_id };
      if (driver?.id) {
        const { error } = await sb.from("compass_drivers").update(payload).eq("id", driver.id);
        if (error) throw error;
      } else {
        if (!form.first_name?.trim() || !form.last_name?.trim()) throw new Error("First and last name required");
        const { error } = await sb.from("compass_drivers").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!driver?.id) return;
    if (!confirm(`Remove ${driver.first_name} ${driver.last_name}? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await getSupabase().from("compass_drivers").delete().eq("id", driver.id);
    if (error) { setError(error.message); setBusy(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-6" onClick={onClose}>
      <div className="bg-[var(--surface-3)] border border-[var(--border)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--surface-3)]">
          <h2 className="text-[var(--fg)] font-extrabold text-lg">{driver ? `Edit ${driver.first_name} ${driver.last_name}` : "Add driver"}</h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Section title="Identity">
            <Row>
              <Field label="First name *"><Input value={form.first_name||""} onChange={(v)=>set("first_name",v)} required /></Field>
              <Field label="Middle"><Input value={form.middle_name||""} onChange={(v)=>set("middle_name",v)} /></Field>
              <Field label="Last name *"><Input value={form.last_name||""} onChange={(v)=>set("last_name",v)} required /></Field>
            </Row>
            <Row>
              <Field label="Email"><Input type="email" value={form.email||""} onChange={(v)=>set("email",v)} /></Field>
              <Field label="Phone"><Input value={form.phone||""} onChange={(v)=>set("phone",v)} /></Field>
            </Row>
          </Section>

          <Section title="CDL">
            <Row>
              <Field label="State"><Input value={form.cdl_state||""} onChange={(v)=>set("cdl_state",v.toUpperCase())} maxLength={2} /></Field>
              <Field label="Class"><Select value={form.cdl_class||""} onChange={(v)=>set("cdl_class",v)} options={["",...CDL_CLASSES]} /></Field>
              <Field label="Number"><Input value={form.cdl_number||""} onChange={(v)=>set("cdl_number",v)} /></Field>
            </Row>
            <Row>
              <Field label="CDL expires"><Input type="date" value={form.cdl_expires_on||""} onChange={(v)=>set("cdl_expires_on",v)} /></Field>
              <Field label="Medical card expires"><Input type="date" value={form.medical_card_expires_on||""} onChange={(v)=>set("medical_card_expires_on",v)} /></Field>
            </Row>
          </Section>

          <Section title="Employment">
            <Row>
              <Field label="Hire date"><Input type="date" value={form.hire_date||""} onChange={(v)=>set("hire_date",v)} /></Field>
              <Field label="Termination"><Input type="date" value={form.termination_date||""} onChange={(v)=>set("termination_date",v)} /></Field>
              <Field label="Status"><Select value={form.status||"active"} onChange={(v)=>set("status",v)} options={STATUSES} /></Field>
            </Row>
          </Section>

          <Section title="Compliance dates">
            <Row>
              <Field label="Last MVR pulled"><Input type="date" value={form.last_mvr_pulled_on||""} onChange={(v)=>set("last_mvr_pulled_on",v)} /></Field>
              <Field label="Last drug test"><Input type="date" value={form.last_drug_test_on||""} onChange={(v)=>set("last_drug_test_on",v)} /></Field>
            </Row>
          </Section>

          {error && <div className="text-[12px] text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-between items-center pt-2 sticky bottom-0 bg-[var(--surface-3)] py-2">
            <div>{driver && <button type="button" onClick={handleDelete} disabled={busy} className="text-[12px] text-red-400 hover:text-red-300">Delete driver</button>}</div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm border border-[var(--border)]">Cancel</button>
              <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg font-extrabold text-sm text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Saving…" : driver ? "Save changes" : "Add driver"}</button>
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
function Input(p: { value: string; onChange: (v: string)=>void; type?: string; required?: boolean; maxLength?: number }) {
  return <input type={p.type||"text"} value={p.value} onChange={(e)=>p.onChange(e.target.value)} required={p.required} maxLength={p.maxLength}
    className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]" />;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string)=>void; options: string[] }) {
  return <select value={value} onChange={(e)=>onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm">{options.map(o => <option key={o} value={o}>{o.replace("_"," ")||"—"}</option>)}</select>;
}
