"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { SkeletonShell } from "@/components/Skeleton";
import { X3AdminTabs } from "@/components/X3AdminHero";
import { useUser } from "@/lib/useUser";
import { apiFetch } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { monthlyFor, effectiveRate, usd } from "@/lib/pricing";

type CarrierFull = {
  id: string; name: string; dba: string | null;
  usdot_number: string | null; mc_number: string | null;
  legal_entity: string | null; ein: string | null;
  operation_type: string | null; carrier_category: string | null; fleet_size: string | null;
  primary_contact_email: string | null; primary_contact_phone: string | null;
  street_address: string | null; city: string | null; state: string | null; zip: string | null;
  power_units_count: number | null; drivers_count: number | null;
  service_tier: string; hazmat_addon: boolean;
  subscription_status: string;
  trial_ends_at: string | null; current_period_end: string | null;
  stripe_customer_id: string | null;
};

type TeamMember = {
  id: string; carrier_id: string; user_id: string; role: string;
  invited_at: string | null; accepted_at: string | null;
};

type SettingsTab = "profile" | "team" | "billing" | "integrations";
type VendorStatus = { vendor:string; status:string; last_sync_at?:string|null; last_sync_count?:number|null; last_error_text?:string|null; env_configured?:boolean };
const TABS: { key: SettingsTab; label: React.ReactNode }[] = [
  { key: "profile", label: <>🏢 Profile</> },
  { key: "team",    label: <>👥 Team</> },
  { key: "billing", label: <>💳 Billing</> },
  { key: "integrations", label: <>🔌 Integrations</> },
];


export default function SettingsPage() {
  const { user, carrier, refresh: refreshUser, signOut } = useUser();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [vendors,setVendors]=useState<VendorStatus[]>([]); const [syncBusy,setSyncBusy]=useState(false); const [syncMessage,setSyncMessage]=useState<string|null>(null);

  // Profile state
  const [form, setForm] = useState<Partial<CarrierFull>>({});
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Team state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "viewer">("admin");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!carrier) return;
    (async () => {
      const { data } = await getSupabase().from("compass_carriers").select("*").eq("id", carrier.id).single();
      if (data) setForm(data);
      setLoading(false);
    })();
  }, [carrier]);

  useEffect(() => {
    if (tab !== "team" || !carrier) return;
    setTeamLoading(true);
    (async () => {
      const { data } = await getSupabase()
        .from("compass_carrier_users")
        .select("*")
        .eq("carrier_id", carrier.id)
        .order("invited_at", { ascending: false });
      setMembers((data as TeamMember[]) || []);
      setTeamLoading(false);
    })();
  }, [tab, carrier]);

  async function loadVendors(){if(!carrier)return;try{const body=await apiFetch<{vendors?:VendorStatus[]}>(`/api/vendors/list?carrier_id=${carrier.id}`);setVendors(body.vendors||[]);}catch{setVendors([]);}}
  useEffect(()=>{if(tab==="integrations")void loadVendors();},[tab,carrier]); // eslint-disable-line react-hooks/exhaustive-deps
  async function syncSamsara(){if(!carrier)return;setSyncBusy(true);setSyncMessage(null);try{const body=await apiFetch<{ok?:boolean;vehicles?:{reconciled:number};drivers?:{reconciled:number};hos?:{reconciled:number}}>("/api/vendors/samsara/sync",{method:"POST",body:JSON.stringify({carrier_id:carrier.id})});setSyncMessage(`Samsara sync complete · ${body.drivers?.reconciled||0} drivers · ${body.vehicles?.reconciled||0} vehicles · ${body.hos?.reconciled||0} HOS days`);await loadVendors();}catch(error){setSyncMessage(error instanceof Error?error.message:"Samsara sync failed");}finally{setSyncBusy(false);}}

  function set<K extends keyof CarrierFull>(k: K, v: string | number | boolean | null) {
    setForm((p) => ({ ...p, [k]: v === "" ? null : v as CarrierFull[K] }));
  }

  // Hide carrier_category if not interstate (matches X3FS toggleCarrierCategory)
  const showCarrierCategory = form.operation_type === "interstate" || form.operation_type === "both";
  useEffect(() => {
    if (!showCarrierCategory && form.carrier_category) {
      set("carrier_category", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCarrierCategory]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!carrier) return;
    setBusy(true); setError(null);
    try {
      const { error } = await getSupabase().from("compass_carriers").update({
        name: form.name, dba: form.dba,
        usdot_number: form.usdot_number, mc_number: form.mc_number,
        legal_entity: form.legal_entity, ein: form.ein,
        operation_type: form.operation_type, carrier_category: form.carrier_category, fleet_size: form.fleet_size,
        primary_contact_email: form.primary_contact_email, primary_contact_phone: form.primary_contact_phone,
        street_address: form.street_address, city: form.city,
        state: form.state ? form.state.toUpperCase().slice(0, 2) : null, zip: form.zip,
        power_units_count: form.power_units_count, drivers_count: form.drivers_count,
      }).eq("id", carrier.id);
      if (error) throw error;
      setSavedAt(Date.now());
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendInvite(e: FormEvent) {
    e.preventDefault();
    if (!carrier || !inviteEmail.trim()) return;
    setInviteBusy(true); setInviteMsg(null);
    try {
      let body: { ok?: boolean; error?: string; already_member?: boolean };
      try {
        body = await apiFetch("/api/auth/invite", {
          method: "POST",
          body: JSON.stringify({ carrier_id: carrier.id, email: inviteEmail.trim(), role: inviteRole }),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invite failed";
        setInviteMsg({ ok: false, msg });
        body = { ok: false, error: msg };
      }
      if (body.ok === false) {
        setInviteMsg({ ok: false, msg: body.error || "Invite failed" });
      } else {
        setInviteMsg({ ok: true, msg: `✓ Invite sent to ${inviteEmail.trim()}` });
        setInviteEmail("");
        // refresh team list
        const { data } = await getSupabase().from("compass_carrier_users").select("*").eq("carrier_id", carrier.id).order("invited_at", { ascending: false });
        setMembers((data as TeamMember[]) || []);
      }
    } catch (err) {
      setInviteMsg({ ok: false, msg: err instanceof Error ? err.message : "Invite failed" });
    } finally {
      setInviteBusy(false);
    }
  }

  async function openStripePortal() {
    try {
      const body = await apiFetch<{ url?: string; error?: string }>("/api/stripe/portal-session", { method: "POST" });
      if (body.url) window.location.href = body.url;
      else alert(body.error || "Could not open billing portal");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Portal error");
    }
  }

  async function exportData() {
    if (!carrier) return;
    try {
      const inserted = await getSupabase().from("compass_audit_exports").insert([{ carrier_id: carrier.id, scope: "full", status: "queued" }]).select("id").single();
      if (inserted.error) throw inserted.error;
      apiFetch("/api/audit/build", { method: "POST", body: JSON.stringify({ id: inserted.data!.id }) }).catch(() => {});
      alert("Export queued · see /audit-export for download when ready (~60s).");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export queue failed");
    }
  }

  const driverCount = form.drivers_count || 0;
  const tierLabel = "X3 Compass";
  const pricePerDriver = Math.round(effectiveRate(driverCount));
  const estMonthly = useMemo(() => usd(monthlyFor(driverCount)), [driverCount]);

  if (loading) return <AppShell title="Settings"><div className="p-6"><SkeletonShell kpis={3} rows={4} /></div></AppShell>;

  return (
    <AppShell crumbs="SETTINGS" title="Settings">
      <div className="px-6 pt-4">
        {/* Account banner */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[var(--fg)] font-bold">{user?.email}</div>
              <div className="text-[12px] text-[var(--fg-muted)]">
                Owner · <strong className="text-[var(--fg)]">{tierLabel}</strong> · <span className="text-[var(--accent)]">{form.subscription_status}</span>
                {form.trial_ends_at && form.subscription_status === "trialing" && <> · trial ends {new Date(form.trial_ends_at).toLocaleDateString()}</>}
              </div>
            </div>
            <button type="button" onClick={signOut} className="px-3 py-2 rounded-lg text-[12px] font-bold text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)]">Sign out</button>
          </div>
        </div>

        <X3AdminTabs tabs={TABS} active={tab} onChange={(k) => setTab(k as SettingsTab)} />
      </div>

      <div className="px-6 py-6 max-w-3xl">
        {/* PROFILE TAB */}
        {tab === "profile" && (
          <form onSubmit={saveProfile} className="space-y-6">
            <Block title="Carrier profile">
              <Row>
                <Field label="Legal name *"><Input value={form.name || ""} onChange={(v) => set("name", v)} required /></Field>
                <Field label="DBA"><Input value={form.dba || ""} onChange={(v) => set("dba", v)} /></Field>
              </Row>
              <Row>
                <Field label="USDOT #"><Input value={form.usdot_number || ""} onChange={(v) => set("usdot_number", v)} /></Field>
                <Field label="MC #"><Input value={form.mc_number || ""} onChange={(v) => set("mc_number", v)} /></Field>
                <Field label="EIN"><Input value={form.ein || ""} onChange={(v) => set("ein", v)} placeholder="12-3456789" /></Field>
              </Row>
              <Row>
                <Field label="Legal entity"><Input value={form.legal_entity || ""} onChange={(v) => set("legal_entity", v)} placeholder="LLC, Corp, etc." /></Field>
                <Field label="Phone"><Input type="tel" value={form.primary_contact_phone || ""} onChange={(v) => set("primary_contact_phone", v)} /></Field>
                <Field label="Primary email"><Input type="email" value={form.primary_contact_email || ""} onChange={(v) => set("primary_contact_email", v)} /></Field>
              </Row>
            </Block>

            <Block title="FMCSA operation">
              <Row>
                <Field label="Operation type">
                  <Select value={form.operation_type || ""} onChange={(v) => set("operation_type", v)}>
                    <option value="">Select…</option>
                    <option value="interstate">Interstate</option>
                    <option value="intrastate">Intrastate</option>
                    <option value="both">Both</option>
                  </Select>
                </Field>
                {showCarrierCategory && (
                  <Field label="Carrier type">
                    <Select value={form.carrier_category || ""} onChange={(v) => set("carrier_category", v)}>
                      <option value="">Select…</option>
                      <option value="property">Property</option>
                      <option value="passenger">Passenger</option>
                      <option value="hazmat">Hazmat</option>
                      <option value="other">Other</option>
                    </Select>
                  </Field>
                )}
                <Field label="Fleet size">
                  <Select value={form.fleet_size || ""} onChange={(v) => set("fleet_size", v)}>
                    <option value="">Select…</option>
                    <option value="1-5">1-5</option>
                    <option value="6-20">6-20</option>
                    <option value="21-50">21-50</option>
                    <option value="51-100">51-100</option>
                    <option value="101-500">101-500</option>
                    <option value="500+">500+</option>
                  </Select>
                </Field>
              </Row>
              <p className="text-[11px] text-[var(--fg-muted)]">Carrier type only required for interstate operations (FMCSA §390.5T).</p>
            </Block>

            <Block title="Principal address">
              <Row><Field label="Street"><Input value={form.street_address || ""} onChange={(v) => set("street_address", v)} placeholder="123 Main St" /></Field></Row>
              <Row>
                <Field label="City"><Input value={form.city || ""} onChange={(v) => set("city", v)} /></Field>
                <Field label="State"><Input value={form.state || ""} onChange={(v) => set("state", v)} maxLength={2} /></Field>
                <Field label="ZIP"><Input value={form.zip || ""} onChange={(v) => set("zip", v)} /></Field>
              </Row>
            </Block>

            <Block title="Fleet stats">
              <Row>
                <Field label="Power units"><Input type="number" value={String(form.power_units_count || "")} onChange={(v) => set("power_units_count", v ? Number(v) : 0)} /></Field>
                <Field label="Drivers"><Input type="number" value={String(form.drivers_count || "")} onChange={(v) => set("drivers_count", v ? Number(v) : 0)} /></Field>
              </Row>
            </Block>

            {error && <div className="text-[12px] text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/20 border border-rose-700/40 rounded-lg px-3 py-2">{error}</div>}
            {savedAt && Date.now() - savedAt < 4000 && <div className="text-[12px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-700/40 rounded-lg px-3 py-2">✓ Saved. DOT/MC changes reflect on dashboard and audit letters immediately.</div>}
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg font-extrabold text-sm text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Saving…" : "Save profile"}</button>
            </div>
          </form>
        )}

        {/* TEAM TAB */}
        {tab === "team" && (
          <div className="space-y-6">
            <Block title="Invite a teammate">
              <form onSubmit={sendInvite} className="space-y-3">
                <Row>
                  <Field label="Email *"><Input type="email" value={inviteEmail} onChange={setInviteEmail} required placeholder="teammate@yourcompany.com" /></Field>
                  <Field label="Role *">
                    <Select value={inviteRole} onChange={(v) => setInviteRole(v as "admin" | "viewer")}>
                      <option value="admin">Admin · full read/write</option>
                      <option value="viewer">Viewer · read-only</option>
                    </Select>
                  </Field>
                </Row>
                {inviteMsg && (
                  <div className={`text-[12px] rounded-lg px-3 py-2 ${inviteMsg.ok ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-700/40" : "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/20 border border-rose-700/40"}`}>
                    {inviteMsg.msg}
                  </div>
                )}
                <button type="submit" disabled={inviteBusy} className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                  {inviteBusy ? "Sending…" : "Send invite"}
                </button>
              </form>
            </Block>

            <Block title="Current team">
              {teamLoading ? (
                <div className="text-[12px] text-[var(--fg-muted)] py-6 text-center">Loading…</div>
              ) : members.length === 0 ? (
                <div className="text-[12px] text-[var(--fg-muted)] py-6 text-center">Just you for now. Invite a teammate above.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                      <tr>
                        <th className="text-left px-3 py-2 font-bold">Role</th>
                        <th className="text-left px-3 py-2 font-bold">Status</th>
                        <th className="text-left px-3 py-2 font-bold">Invited</th>
                        <th className="text-left px-3 py-2 font-bold">Accepted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id} className="border-t border-[var(--border)]">
                          <td className="px-3 py-2 text-[var(--fg)] font-bold uppercase">{m.role}</td>
                          <td className="px-3 py-2">
                            {m.accepted_at
                              ? <span className="inline-block min-w-[80px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80 text-center tracking-wider uppercase">Active</span>
                              : <span className="inline-block min-w-[80px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-amber-100 dark:bg-amber-500/45 text-amber-900 dark:text-amber-50 border-amber-700 dark:border-amber-300/80 text-center tracking-wider uppercase">Pending</span>}
                          </td>
                          <td className="px-3 py-2 text-[var(--fg-muted)] tabular-nums">{m.invited_at ? new Date(m.invited_at).toLocaleDateString() : "—"}</td>
                          <td className="px-3 py-2 text-[var(--fg-muted)] tabular-nums">{m.accepted_at ? new Date(m.accepted_at).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Block>
          </div>
        )}

        {tab === "integrations" && <div className="space-y-6"><Block title="Fleet data synchronization">
          <p className="text-[12px] text-[var(--fg-muted)] mb-4">Samsara reconciliation imports active drivers, vehicles, and the prior seven days of HOS summaries. Stable vendor IDs make repeat runs idempotent.</p>
          {vendors.filter(v=>v.vendor==="samsara").map(v=><div key={v.vendor} className="rounded-lg border border-[var(--border)] p-4 flex items-center justify-between gap-4 flex-wrap"><div><div className="font-extrabold text-[var(--fg)]">Samsara</div><div className="text-[11px] text-[var(--fg-muted)]">Status: {v.status} · Last sync: {v.last_sync_at?new Date(v.last_sync_at).toLocaleString():"never"} · Last count: {v.last_sync_count??"—"}</div>{v.last_error_text&&<div className="text-[11px] text-rose-700 dark:text-rose-300">{v.last_error_text}</div>}</div><button type="button" onClick={()=>void syncSamsara()} disabled={syncBusy||!v.env_configured} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)] disabled:opacity-50" style={{background:"linear-gradient(135deg,var(--accent),var(--accent-2))"}}>{syncBusy?"Syncing…":"Sync Samsara"}</button></div>)}
          {!vendors.some(v=>v.vendor==="samsara")&&<div className="text-[12px] text-[var(--fg-muted)]">Samsara is not configured for this carrier.</div>}
          {syncMessage&&<div role="status" className="mt-3 text-[12px] text-[var(--fg)]">{syncMessage}</div>}
        </Block></div>}

        {/* BILLING TAB */}
        {tab === "billing" && (
          <div className="space-y-6">
            <Block title="Current plan">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-gradient-to-r from-[var(--surface-2)] to-[var(--bg)] border border-[var(--border)] rounded-xl p-5">
                <div>
                  <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-extrabold">{tierLabel}</div>
                  <div className="text-[36px] font-black text-[var(--fg)] leading-none">${pricePerDriver}<span className="text-[12px] font-bold text-[var(--fg-muted)]">/driver/mo</span></div>
                  <div className="text-[11px] text-[var(--fg-muted)] mt-1">Month-to-month · cancel anytime · billed on the 1st</div>
                </div>
                <div className="text-center">
                  <div className="text-[36px] font-black text-[var(--accent)] tabular-nums">{driverCount}</div>
                  <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-extrabold">Active drivers</div>
                </div>
                <div className="text-center">
                  <div className="text-[36px] font-black text-emerald-600 dark:text-emerald-300 tabular-nums">{estMonthly}</div>
                  <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-extrabold">Est. Monthly</div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap pt-2">
                <a href="https://x3compass.com/pricing" className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)]">View pricing details</a>
                <a href="mailto:joshua@x3compass.com?subject=Billing%20question" className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)]">Contact billing</a>
              </div>
            </Block>

            <Block title="Auto-renewal">
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed">
                Your subscription renews automatically. You can cancel at any time · cancellation takes effect at the end of your current term, and you keep access through that date. <span className="text-[11px] font-mono">(SOP-A5 · MSA § 7.2(c))</span>
              </p>
              {form.current_period_end && (
                <div className="text-[12px] text-[var(--fg)] bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-700/40 dark:border-cyan-300/40 rounded-lg px-3 py-2 mt-2">
                  Current period ends <strong>{new Date(form.current_period_end).toLocaleDateString()}</strong>. <span className="text-[var(--fg-muted)]">Status: {form.subscription_status}.</span>
                </div>
              )}
              <div className="flex gap-2 flex-wrap pt-2">
                <button onClick={openStripePortal} className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]">Manage in Stripe portal →</button>
              </div>
              <p className="text-[11px] text-[var(--fg-muted)] mt-3">
                You can also cancel by (1) replying <code className="text-[var(--fg)] bg-[var(--surface-2)] px-1 rounded">CANCEL</code> to any renewal-reminder email, or (2) emailing <a className="text-[var(--accent)] underline" href="mailto:team@x3compass.com?subject=Cancel%20Renewal">team@x3compass.com</a> with subject <strong>Cancel Renewal</strong>.
              </p>
            </Block>

            <Block title="Export your data">
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed">
                Download a JSON bundle of everything X3 Compass holds on your carrier · drivers, DQ files, MVRs, D&amp;A tests, IFTA records, audit history. Available any time.
              </p>
              <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
                DOT-regulated records (49 CFR §§ 391.51, 382.401, 395.8, 396.3, IFTA P560) remain on file under federal retention windows even if you cancel · the export reflects everything we hold today.
              </p>
              <div className="flex gap-2 flex-wrap pt-2">
                <button onClick={exportData} className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Generate export →</button>
                <a href="/audit-export" className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)]">View all exports</a>
              </div>
            </Block>

            <Block title="Payment method & invoices">
              <p className="text-[13px] text-[var(--fg-muted)]">Manage your saved card, download invoices, and update billing email through the Stripe Customer Portal.</p>
              <div className="pt-2">
                <button onClick={openStripePortal} className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]">Open Stripe portal →</button>
              </div>
              {!form.stripe_customer_id && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 border border-amber-500/40 rounded-lg px-3 py-2 mt-2">
                  No Stripe customer linked yet. Subscribe first via <a className="text-[var(--accent)] underline" href="https://x3compass.com/pricing">/pricing</a>.
                </p>
              )}
            </Block>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-5">
      <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1">{label}</div>{children}</label>;
}
function Input(p: { value: string; onChange: (v: string) => void; type?: string; required?: boolean; maxLength?: number; placeholder?: string }) {
  return <input type={p.type || "text"} value={p.value} onChange={(e) => p.onChange(e.target.value)} required={p.required} maxLength={p.maxLength} placeholder={p.placeholder}
    className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]" />;
}
function Select(p: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return <select value={p.value} onChange={(e) => p.onChange(e.target.value)}
    className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]">
    {p.children}
  </select>;
}
