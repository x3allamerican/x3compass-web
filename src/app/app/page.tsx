"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { StatCard } from "@/components/app/TenantTable";
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
      const head = (q: ReturnType<typeof sb.from>) => q;
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
        <div className="mb-6">
          <p className="text-white/65">
            {carrier ? <>Live snapshot for <strong className="text-white">{carrier.name}</strong>.</> : "Loading your carrier…"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Drivers" value={counts.drivers_active} sub={`${counts.drivers} total · ${counts.drivers - counts.drivers_active} inactive`} />
          <StatCard label="Vehicles" value={counts.vehicles} sub={counts.vehicles_oos ? `${counts.vehicles_oos} out of service` : "All in service"} accent="#34D399" />
          <StatCard label="CDLs expiring 60d" value={counts.cdl_expiring_60d} accent={counts.cdl_expiring_60d ? "#FACC15" : "#34D399"} />
          <StatCard label="Medical cards 60d" value={counts.medical_expiring_60d} accent={counts.medical_expiring_60d ? "#FACC15" : "#34D399"} />
          <StatCard label="Inspections (90d)" value={counts.inspections_recent} sub={counts.oos_recent ? `${counts.oos_recent} OOS` : "no OOS"} />
          <StatCard label="Accidents (90d)" value={counts.accidents_recent} accent={counts.accidents_recent ? "#F87171" : "#34D399"} />
          <StatCard label="DOT insp. due 60d" value={counts.inspection_due_30d} accent={counts.inspection_due_30d ? "#FACC15" : "#22D3EE"} />
          <StatCard label="MVR pulls pending" value={counts.mvr_pending} accent={counts.mvr_pending ? "#FACC15" : "#22D3EE"} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <QuickAction href="/app/drivers"          icon="👤" title="Add a driver" desc="Build a new DQ file from scratch" />
          <QuickAction href="/app/vehicles"         icon="🚛" title="Add a vehicle" desc="Track maintenance + inspections" />
          <QuickAction href="/app/background-checks" icon="🛡" title="Order BG check" desc="Live Checkr embed (FCRA-compliant)" />
          <QuickAction href="/app/mvr"              icon="🪪" title="Pull an MVR" desc="State-specific MVR lookup" />
          <QuickAction href="/app/audit-export"     icon="📄" title="Audit packet" desc="Generate full DOT compliance export" />
          <QuickAction href="/app/ask"              icon="∞" title="Ask Compass" desc="CFR-cited answer to any FMCSA question" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#1E3556] bg-[#0F1C32] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-[15px]">Recently added drivers</h3>
              <Link href="/app/drivers" className="text-[11px] text-[#22D3EE] font-bold hover:underline">View all →</Link>
            </div>
            {loading ? (
              <div className="text-white/55 text-sm py-6 text-center">Loading…</div>
            ) : recentDrivers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-2">🚛</div>
                <p className="text-white/65 text-sm mb-3">No drivers yet</p>
                <Link href="/app/drivers" className="inline-block px-4 py-2 rounded-lg font-bold text-[12px] text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>Add your first →</Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentDrivers.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-black text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>{(d.first_name?.[0]||"")+(d.last_name?.[0]||"")}</div>
                      <div>
                        <Link href={`/app/drivers?id=${d.id}`} className="text-white font-semibold hover:text-[#22D3EE] text-sm">{d.first_name} {d.last_name}</Link>
                        <div className="text-[11px] text-white/55">{d.cdl_state || "—"} · {d.status}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-[#1E3556] bg-[#0F1C32] p-5">
            <h3 className="text-white font-bold text-[15px] mb-4">Compliance health</h3>
            <ul className="space-y-3">
              <HealthRow label="CDL expirations 60d" count={counts.cdl_expiring_60d} okLabel="All current" />
              <HealthRow label="Medical cards 60d" count={counts.medical_expiring_60d} okLabel="All current" />
              <HealthRow label="Out-of-service vehicles" count={counts.vehicles_oos} okLabel="All in service" />
              <HealthRow label="Recent OOS inspections" count={counts.oos_recent} okLabel="No OOS in last 90d" />
              <HealthRow label="Recent accidents" count={counts.accidents_recent} okLabel="None recorded in 90d" warnLevel={1} />
              <HealthRow label="DOT inspections due 60d" count={counts.inspection_due_30d} okLabel="All within window" />
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-[#1E3556] bg-[#0F1C32] hover:border-[#22D3EE] p-5 transition-colors">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-white font-bold text-[14px] mb-1">{title}</div>
      <div className="text-white/55 text-[12px]">{desc}</div>
    </Link>
  );
}

function HealthRow({ label, count, okLabel, warnLevel = 0 }: { label: string; count: number; okLabel: string; warnLevel?: number }) {
  const status = count === 0 ? "ok" : count <= warnLevel ? "warn" : "alert";
  const color = status === "ok" ? "#34D399" : status === "warn" ? "#FACC15" : "#F87171";
  return (
    <li className="flex items-center justify-between text-[13px]">
      <span className="text-white/75">{label}</span>
      <span className="font-extrabold tabular-nums" style={{ color }}>{count === 0 ? `✓ ${okLabel}` : count}</span>
    </li>
  );
}
