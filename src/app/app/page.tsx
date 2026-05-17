"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

type Counts = {
  drivers: number; drivers_active: number; cdl_expiring_60d: number; medical_expiring_60d: number;
  vehicles: number; vehicles_oos: number; inspection_due_30d: number;
  inspections_recent: number; oos_recent: number;
  accidents_recent: number;
  mvr_pending: number;
  da_tests_recent: number;
  dq_docs_total: number;
  training_records_total: number;
};

const ZERO: Counts = {
  drivers: 0, drivers_active: 0, cdl_expiring_60d: 0, medical_expiring_60d: 0,
  vehicles: 0, vehicles_oos: 0, inspection_due_30d: 0,
  inspections_recent: 0, oos_recent: 0, accidents_recent: 0,
  mvr_pending: 0, da_tests_recent: 0, dq_docs_total: 0, training_records_total: 0,
};

export default function DashboardPage() {
  const { carrier, user } = useUser();
  const [counts, setCounts] = useState<Counts>(ZERO);
  const [loading, setLoading] = useState(true);
  const [recentDrivers, setRecentDrivers] = useState<Array<{id:string;first_name:string;last_name:string;status:string;cdl_state:string|null;cdl_expires_on:string|null}>>([]);

  useEffect(() => {
    if (!carrier) return;
    let cancelled = false;
    const sb = getSupabase();
    const today = new Date();
    const in60 = new Date(today.getTime() + 60*86400000).toISOString().slice(0,10);
    const todayStr = today.toISOString().slice(0,10);
    const ago90 = new Date(today.getTime() - 90*86400000).toISOString().slice(0,10);

    async function fetchAll() {
      const r = await Promise.all([
        sb.from("compass_drivers").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id),
        sb.from("compass_drivers").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).eq("status","active"),
        sb.from("compass_drivers").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).gte("cdl_expires_on", todayStr).lte("cdl_expires_on", in60),
        sb.from("compass_drivers").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).gte("medical_card_expires_on", todayStr).lte("medical_card_expires_on", in60),
        sb.from("compass_vehicles").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id),
        sb.from("compass_vehicles").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).eq("status","out_of_service"),
        sb.from("compass_vehicles").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).gte("next_dot_inspection_due", todayStr).lte("next_dot_inspection_due", in60),
        sb.from("compass_inspections").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).gte("inspection_date", ago90),
        sb.from("compass_inspections").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).gte("inspection_date", ago90).or("oos_driver.eq.true,oos_vehicle.eq.true"),
        sb.from("compass_accidents").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).gte("accident_date", ago90),
        sb.from("compass_mvr_records").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).eq("result","pending"),
        sb.from("compass_da_tests").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id).gte("collected_on", ago90),
        sb.from("compass_dq_documents").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id),
        sb.from("compass_training_records").select("*", { count: "exact", head: true }).eq("carrier_id", carrier!.id),
        sb.from("compass_drivers").select("id,first_name,last_name,status,cdl_state,cdl_expires_on").eq("carrier_id", carrier!.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (cancelled) return;
      setCounts({
        drivers: r[0].count ?? 0, drivers_active: r[1].count ?? 0,
        cdl_expiring_60d: r[2].count ?? 0, medical_expiring_60d: r[3].count ?? 0,
        vehicles: r[4].count ?? 0, vehicles_oos: r[5].count ?? 0,
        inspection_due_30d: r[6].count ?? 0,
        inspections_recent: r[7].count ?? 0, oos_recent: r[8].count ?? 0,
        accidents_recent: r[9].count ?? 0,
        mvr_pending: r[10].count ?? 0, da_tests_recent: r[11].count ?? 0,
        dq_docs_total: r[12].count ?? 0, training_records_total: r[13].count ?? 0,
      });
      setRecentDrivers((r[14].data as typeof recentDrivers) || []);
      setLoading(false);
    }
    fetchAll().catch((e) => { console.error(e); setLoading(false); });
    return () => { cancelled = true; };
  }, [carrier]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();
  const fname = ((user?.user_metadata?.full_name as string) || user?.email || "").split(/[@. ]/)[0];

  return (
    <AppShell crumbs="DASHBOARD" title={`${greeting}${fname ? `, ${fname.charAt(0).toUpperCase()+fname.slice(1)}` : ""}`}>
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <p className="text-[var(--fg-muted)] text-[14px]">
            {carrier ? <>Live snapshot for <strong className="text-[var(--fg)]">{carrier.name}</strong>.</> : "Loading your carrier…"}
          </p>
        </div>

        {/* STAT GRID — 4-col on desktop, with clear typographic hierarchy */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active drivers"      value={counts.drivers_active} delta={counts.drivers ? `${counts.drivers - counts.drivers_active} inactive` : "—"} status="info" />
          <StatCard label="Vehicles"            value={counts.vehicles}       delta={counts.vehicles_oos ? `${counts.vehicles_oos} OOS` : "All in service"} status={counts.vehicles_oos ? "warn" : "ok"} />
          <StatCard label="CDLs expiring (60d)" value={counts.cdl_expiring_60d}     delta={counts.cdl_expiring_60d ? "Action needed" : "All current"} status={counts.cdl_expiring_60d ? "warn" : "ok"} />
          <StatCard label="Medical cards (60d)" value={counts.medical_expiring_60d} delta={counts.medical_expiring_60d ? "Action needed" : "All current"} status={counts.medical_expiring_60d ? "warn" : "ok"} />
          <StatCard label="Inspections (90d)"   value={counts.inspections_recent} delta={counts.oos_recent ? `${counts.oos_recent} OOS` : "no OOS"} status={counts.oos_recent ? "warn" : "info"} />
          <StatCard label="Accidents (90d)"     value={counts.accidents_recent} delta={counts.accidents_recent ? "Review" : "None"} status={counts.accidents_recent ? "alert" : "ok"} />
          <StatCard label="DOT insp. due 60d"   value={counts.inspection_due_30d} status={counts.inspection_due_30d ? "warn" : "info"} />
          <StatCard label="MVR pulls pending"   value={counts.mvr_pending} status={counts.mvr_pending ? "warn" : "info"} />
        </div>

        {/* QUICK ACTIONS */}
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[12px] uppercase tracking-[.18em] font-bold text-[var(--fg-muted)]">Quick actions</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <QuickAction href="/app/drivers"           icon="👤" title="Add a driver"     desc="Build a new DQ file from scratch" />
          <QuickAction href="/app/vehicles"          icon="🚛" title="Add a vehicle"    desc="Track maintenance + inspections" />
          <QuickAction href="/app/background-checks" icon="🛡" title="Order BG check"   desc="Live Checkr embed (FCRA-compliant)" />
          <QuickAction href="/app/mvr"               icon="🪪" title="Pull an MVR"      desc="State-specific MVR lookup" />
          <QuickAction href="/app/audit-export"      icon="📄" title="Audit packet"     desc="Full DOT compliance export" />
          <QuickAction href="/app/ask"               icon="∞" title="Ask Compass"      desc="CFR-cited answer to any FMCSA question" />
        </div>

        {/* TWO-COLUMN: recent + compliance health */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[var(--fg)] font-bold text-[15px]">Recently added drivers</h3>
              <Link href="/app/drivers" className="text-[11px] text-[var(--accent)] font-bold hover:underline">View all →</Link>
            </div>
            {loading ? (
              <div className="text-[var(--fg-muted)] text-sm py-6 text-center">Loading…</div>
            ) : recentDrivers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-2">🚛</div>
                <p className="text-[var(--fg-muted)] text-sm mb-3">No drivers yet</p>
                <Link href="/app/drivers" className="inline-block px-4 py-2 rounded-lg font-bold text-[12px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)] transition-colors">Add your first →</Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentDrivers.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-black text-[var(--accent-fg)] bg-[var(--accent)]">{(d.first_name?.[0]||"")+(d.last_name?.[0]||"")}</div>
                      <div>
                        <Link href={`/app/drivers?id=${d.id}`} className="text-[var(--fg)] font-semibold hover:text-[var(--accent)] text-sm">{d.first_name} {d.last_name}</Link>
                        <div className="text-[11px] text-[var(--fg-muted)]">{d.cdl_state || "—"} · {d.status}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="x3-card p-5">
            <h3 className="text-[var(--fg)] font-bold text-[15px] mb-4">Compliance health</h3>
            <ul className="space-y-3">
              <HealthRow label="CDL expirations (60d)"   count={counts.cdl_expiring_60d}     okLabel="All current" />
              <HealthRow label="Medical cards (60d)"     count={counts.medical_expiring_60d} okLabel="All current" />
              <HealthRow label="Out-of-service vehicles" count={counts.vehicles_oos}         okLabel="All in service" />
              <HealthRow label="OOS inspections (90d)"   count={counts.oos_recent}           okLabel="No OOS in 90d" />
              <HealthRow label="Recent accidents (90d)"  count={counts.accidents_recent}     okLabel="None recorded" warnLevel={1} />
              <HealthRow label="DOT insp. due (60d)"     count={counts.inspection_due_30d}   okLabel="All within window" />
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================================
   DASHBOARD CARDS — refreshed for both modes
   ============================================================ */

type Status = "ok" | "info" | "warn" | "alert";

function StatCard({ label, value, delta, status = "info" }: { label: string; value: number | string; delta?: string; status?: Status }) {
  // Status drives a small color accent on the value + a left rail
  const railColor =
    status === "ok"    ? "var(--success)" :
    status === "warn"  ? "var(--warning)" :
    status === "alert" ? "var(--danger)"  :
                          "var(--accent)";
  return (
    <div className="x3-card x3-card-hover relative p-5 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: railColor }} />
      <div className="text-[10px] tracking-[.16em] uppercase font-bold text-[var(--fg-muted)] mb-2">{label}</div>
      <div className="text-3xl font-extrabold tabular-nums text-[var(--fg)]">{value}</div>
      {delta && <div className="text-[11px] text-[var(--fg-muted)] mt-1">{delta}</div>}
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="x3-card x3-card-hover block p-5 group">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-[var(--fg)] font-bold text-[14px] mb-1 group-hover:text-[var(--accent)] transition-colors">{title}</div>
      <div className="text-[var(--fg-muted)] text-[12px]">{desc}</div>
    </Link>
  );
}

function HealthRow({ label, count, okLabel, warnLevel = 0 }: { label: string; count: number; okLabel: string; warnLevel?: number }) {
  const status: Status = count === 0 ? "ok" : count <= warnLevel ? "warn" : "alert";
  const color = status === "ok" ? "var(--success)" : status === "warn" ? "var(--warning)" : "var(--danger)";
  return (
    <li className="flex items-center justify-between text-[13px]">
      <span className="text-[var(--fg-muted)]">{label}</span>
      <span className="font-extrabold tabular-nums" style={{ color }}>{count === 0 ? `✓ ${okLabel}` : count}</span>
    </li>
  );
}
