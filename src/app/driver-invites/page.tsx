"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

type Driver = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  cdl_state: string | null;
  cdl_number: string | null;
  cdl_expires_on: string | null;
  medical_card_expires_on: string | null;
  status: string;
  hire_date: string | null;
  created_at: string;
};

function progress(d: Driver): { pct: number; label: string } {
  let done = 0;
  const checks = 4; // email, phone, CDL info, medical card
  if (d.email) done++;
  if (d.phone) done++;
  if (d.cdl_number && d.cdl_state && d.cdl_expires_on) done++;
  if (d.medical_card_expires_on) done++;
  const pct = Math.round((done / checks) * 100);
  return { pct, label: pct === 100 ? "Complete" : `${done}/${checks} sections done` };
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
}

export default function DriverInvitesPage() {
  const { carrier } = useUser();
  const [pending, setPending] = useState<Driver[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!carrier?.id) return;
    setLoading(true);
    const supa = getSupabase();
    const [p, c] = await Promise.all([
      supa.from("compass_drivers").select("*").eq("carrier_id", carrier.id).eq("status", "pending_hire").order("created_at", { ascending: false }).limit(50),
      supa.from("compass_drivers").select("id", { count: "exact", head: true }).eq("carrier_id", carrier.id).eq("status", "active").gte("hire_date", new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)),
    ]);
    setPending((p.data as Driver[] | null) || []);
    setRecentCompleted(c.count || 0);
    setLoading(false);
  }, [carrier]);

  useEffect(() => { void refresh(); }, [refresh]);

  const sendInvite = async () => {
    if (!carrier?.id) return;
    if (!form.first_name || !form.last_name || !form.email) {
      setFlash("First name, last name, and email are required.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await getSupabase().from("compass_drivers").insert({
        carrier_id: carrier.id,
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        email:      form.email.trim().toLowerCase(),
        phone:      form.phone.trim() || null,
        status:     "pending_hire",
      });
      if (error) throw new Error(error.message);
      setForm({ first_name: "", last_name: "", email: "", phone: "" });
      setShowCompose(false);
      setFlash("✓ Invite created. Driver will receive onboarding link by email.");
      await refresh();
    } catch (e) {
      setFlash(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  // KPIs
  const pendingFresh = pending.filter((d) => daysSince(d.created_at) <= 7).length;
  const pendingStale = pending.filter((d) => daysSince(d.created_at) > 7 && daysSince(d.created_at) <= 30).length;
  const pendingExpired = pending.filter((d) => daysSince(d.created_at) > 30).length;

  return (
    <AppShell
      title="Driver Invites"
      crumbs="Client Admin · Onboarding queue"
      actions={<button onClick={() => setShowCompose(true)} className="px-3 py-1.5 rounded-lg font-extrabold text-[12px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Invite driver</button>}
    >
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="x3-card p-4">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Active invites (≤7d)</div>
            <div className="text-[28px] font-black text-[var(--fg)]">{pendingFresh}</div>
          </div>
          <div className="x3-card p-4">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Stale (8–30d)</div>
            <div className="text-[28px] font-black text-[var(--warning)]">{pendingStale}</div>
          </div>
          <div className="x3-card p-4">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Expired (&gt;30d)</div>
            <div className="text-[28px] font-black text-[var(--danger)]">{pendingExpired}</div>
          </div>
          <div className="x3-card p-4">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Onboarded (30d)</div>
            <div className="text-[28px] font-black text-[var(--success)]">{recentCompleted}</div>
          </div>
        </div>

        {/* Flash */}
        {flash ? (
          <div className="x3-card p-3 text-[13px] text-[var(--fg)] flex items-start justify-between gap-3">
            <span>{flash}</span>
            <button onClick={() => setFlash(null)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">✕</button>
          </div>
        ) : null}

        {/* Compose */}
        {showCompose ? (
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Invite a new driver</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[13px]" />
              <input placeholder="Last name"  value={form.last_name}  onChange={(e) => setForm({ ...form, last_name: e.target.value })}  className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[13px]" />
              <input placeholder="Email"      value={form.email}      onChange={(e) => setForm({ ...form, email: e.target.value })}      className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[13px]" type="email" />
              <input placeholder="Mobile (for SMS)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}     className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[13px]" type="tel" />
            </div>
            <div className="flex gap-2 mt-3">
              <button disabled={busy} onClick={sendInvite} className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)] disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Creating…" : "Create invite"}</button>
              <button onClick={() => setShowCompose(false)} className="px-4 py-2 rounded-lg font-bold text-[13px] text-[var(--fg-muted)] border border-[var(--border)]">Cancel</button>
            </div>
          </div>
        ) : null}

        {/* Invitees table */}
        <div className="x3-card overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="flex gap-2"><div className="h-10 flex-1 bg-slate-200 dark:bg-[var(--surface-2)] rounded animate-x3-pulse"/></div>)}</div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-[16px] font-extrabold text-[var(--fg)] mb-1">No pending invites</div>
              <p className="text-[13px] text-[var(--fg-muted)]">Click <strong>+ Invite driver</strong> above to start an onboarding flow. The driver gets a secure link to upload their CDL, medical card, and consent forms.</p>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left px-4 py-2 font-bold">Driver</th>
                  <th className="text-left px-4 py-2 font-bold">Contact</th>
                  <th className="text-left px-4 py-2 font-bold">Invited</th>
                  <th className="text-left px-4 py-2 font-bold">Progress</th>
                  <th className="text-right px-4 py-2 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((d) => {
                  const days = daysSince(d.created_at);
                  const status = days > 30 ? "expired" : days > 7 ? "stale" : "fresh";
                  const tone = status === "expired" ? "bg-[var(--danger)]/15 text-[var(--danger)]" : status === "stale" ? "bg-[var(--warning)]/15 text-[var(--warning)]" : "bg-[var(--success)]/15 text-[var(--success)]";
                  const pr = progress(d);
                  return (
                    <tr key={d.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{d.first_name} {d.last_name}</td>
                      <td className="px-4 py-2.5 text-[var(--fg-muted)] font-mono text-[12px]">
                        <div>{d.email || "—"}</div>
                        <div>{d.phone || ""}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${tone}`}>{days}d ago</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-[11px] text-[var(--fg-muted)] mb-1">{pr.label}</div>
                        <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden w-32">
                          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pr.pct}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {status === "expired" ? (
                          <button className="text-[12px] text-[var(--accent)] font-bold hover:underline">Resend →</button>
                        ) : (
                          <button className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)]">Remind →</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
