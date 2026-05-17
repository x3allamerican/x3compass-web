"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

type CarrierFull = {
  id: string; name: string;
  usdot_number: string | null; mc_number: string | null;
  legal_entity: string | null; ein: string | null;
  primary_contact_email: string | null; primary_contact_phone: string | null;
  street_address: string | null; city: string | null; state: string | null; zip: string | null;
  power_units_count: number | null; drivers_count: number | null;
  service_tier: string; hazmat_addon: boolean; subscription_status: string;
  trial_ends_at: string | null; current_period_end: string | null;
};

export default function SettingsPage() {
  const { user, carrier, refresh: refreshUser, signOut } = useUser();
  const [form, setForm] = useState<Partial<CarrierFull>>({});
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!carrier) return;
    (async () => {
      const { data } = await getSupabase().from("compass_carriers").select("*").eq("id", carrier.id).single();
      if (data) setForm(data);
      setLoading(false);
    })();
  }, [carrier]);

  function set<K extends keyof CarrierFull>(k: K, v: string | number | boolean | null) {
    setForm((p) => ({ ...p, [k]: v === "" ? null : v as CarrierFull[K] }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!carrier) return;
    setBusy(true); setError(null);
    try {
      const { error } = await getSupabase().from("compass_carriers").update({
        name: form.name, usdot_number: form.usdot_number, mc_number: form.mc_number,
        legal_entity: form.legal_entity, ein: form.ein,
        primary_contact_email: form.primary_contact_email, primary_contact_phone: form.primary_contact_phone,
        street_address: form.street_address, city: form.city, state: form.state, zip: form.zip,
        power_units_count: form.power_units_count, drivers_count: form.drivers_count,
      }).eq("id", carrier.id);
      if (error) throw error;
      setSavedAt(Date.now());
      await refreshUser();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }

  if (loading) return <AppShell title="Settings"><div className="p-6 text-white/55">Loading…</div></AppShell>;

  return (
    <AppShell crumbs="SETTINGS" title="Settings">
      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account banner */}
          <div className="rounded-xl border border-[#1E3556] bg-[#0F1C32] p-5">
            <div className="text-[10px] tracking-[.16em] uppercase text-white/55 font-bold mb-3">Account</div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-white font-bold">{user?.email}</div>
                <div className="text-[12px] text-white/55">Owner · {(form.service_tier||"diy").toUpperCase()} {form.hazmat_addon ? "+ Hazmat" : ""} · <span className="text-[#22D3EE]">{form.subscription_status}</span>
                {form.trial_ends_at && form.subscription_status === "trialing" && <> · trial ends {new Date(form.trial_ends_at).toLocaleDateString()}</>}</div>
              </div>
              <div className="flex gap-2">
                <Link href="/app/settings/billing" className="px-3 py-2 rounded-lg text-[12px] font-bold text-[#22D3EE] border border-[#1E3556] hover:border-[#22D3EE]">Manage billing</Link>
                <button type="button" onClick={signOut} className="px-3 py-2 rounded-lg text-[12px] font-bold text-white/65 hover:text-white border border-[#1E3556]">Sign out</button>
              </div>
            </div>
          </div>

          {/* Company info */}
          <Block title="Company info">
            <Row><Field label="Company name *"><Input value={form.name||""} onChange={(v)=>set("name",v)} required /></Field></Row>
            <Row>
              <Field label="USDOT #"><Input value={form.usdot_number||""} onChange={(v)=>set("usdot_number",v)} /></Field>
              <Field label="MC #"><Input value={form.mc_number||""} onChange={(v)=>set("mc_number",v)} /></Field>
            </Row>
            <Row>
              <Field label="Legal entity"><Input value={form.legal_entity||""} onChange={(v)=>set("legal_entity",v)} /></Field>
              <Field label="EIN"><Input value={form.ein||""} onChange={(v)=>set("ein",v)} /></Field>
            </Row>
          </Block>

          <Block title="Primary contact">
            <Row>
              <Field label="Email"><Input type="email" value={form.primary_contact_email||""} onChange={(v)=>set("primary_contact_email",v)} /></Field>
              <Field label="Phone"><Input value={form.primary_contact_phone||""} onChange={(v)=>set("primary_contact_phone",v)} /></Field>
            </Row>
          </Block>

          <Block title="Principal address">
            <Row><Field label="Street"><Input value={form.street_address||""} onChange={(v)=>set("street_address",v)} /></Field></Row>
            <Row>
              <Field label="City"><Input value={form.city||""} onChange={(v)=>set("city",v)} /></Field>
              <Field label="State"><Input value={form.state||""} onChange={(v)=>set("state",v)} maxLength={2} /></Field>
              <Field label="ZIP"><Input value={form.zip||""} onChange={(v)=>set("zip",v)} /></Field>
            </Row>
          </Block>

          <Block title="Fleet stats">
            <Row>
              <Field label="Power units"><Input type="number" value={String(form.power_units_count||"")} onChange={(v)=>set("power_units_count", v?Number(v):0)} /></Field>
              <Field label="Drivers"><Input type="number" value={String(form.drivers_count||"")} onChange={(v)=>set("drivers_count", v?Number(v):0)} /></Field>
            </Row>
          </Block>

          {error && <div className="text-[12px] text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
          {savedAt && Date.now() - savedAt < 4000 && <div className="text-[12px] text-emerald-300 bg-emerald-900/20 border border-emerald-700/40 rounded-lg px-3 py-2">✓ Saved</div>}
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg font-extrabold text-sm text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>{busy ? "Saving…" : "Save changes"}</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1E3556] bg-[#0F1C32] p-5">
      <div className="text-[10px] tracking-[.16em] uppercase text-[#22D3EE] font-extrabold mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-[10px] tracking-[.14em] uppercase text-white/55 font-bold mb-1">{label}</div>{children}</label>;
}
function Input(p: { value: string; onChange: (v: string)=>void; type?: string; required?: boolean; maxLength?: number }) {
  return <input type={p.type||"text"} value={p.value} onChange={(e)=>p.onChange(e.target.value)} required={p.required} maxLength={p.maxLength}
    className="w-full px-3 py-2 rounded-lg bg-[#0A1929] border border-[#1E3556] text-white text-sm focus:outline-none focus:border-[#22D3EE]" />;
}
