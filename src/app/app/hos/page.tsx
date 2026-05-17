"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { TenantTable, fmtDate } from "@/components/app/TenantTable";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel } from "@/components/app/useDrivers";

type H = { id:string; driver_id:string; log_date:string; total_drive_minutes:number; total_on_duty_minutes:number; violations: unknown; eld_source:string|null; certified:boolean; raw_log_url:string|null };

export default function HosPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [rows, setRows] = useState<H[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!carrier) return;
    getSupabase().from("compass_hos_logs").select("*").eq("carrier_id", carrier.id).order("log_date",{ascending:false}).limit(200).then(({ data }) => {
      setRows((data as H[]) || []); setLoading(false);
    });
  }, [carrier]);

  return (
    <AppShell crumbs="HOS / ELD" title="Hours of Service">
      <div className="p-6 space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[#0F1C32] p-5">
          <div className="text-[10px] tracking-[.16em] uppercase text-[#22D3EE] font-extrabold mb-2">Connect your ELD</div>
          <p className="text-[var(--fg-muted)] text-sm leading-relaxed mb-3">
            Compass HOS ingests RODS data from your ELD via the FMCSA-compliant ELD output file. Once connected, daily logs, status changes, and HOS violations appear here automatically. Supported integrations roadmap: Motive, Samsara, KeepTruckin, Geotab, EROAD, Garmin.
          </p>
          <div className="flex gap-3">
            <Link href="/app/settings" className="px-4 py-2 rounded-lg text-[12px] font-bold text-[var(--bg)]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>Set ELD provider →</Link>
            <a href="https://csa.fmcsa.dot.gov" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[#22D3EE]">FMCSA ELD info</a>
          </div>
        </div>

        <TenantTable<H> rows={rows} loading={loading}
          emptyTitle="No HOS logs yet"
          emptyDesc="HOS logs appear automatically when your ELD is connected. Until then, you can manually upload a daily log file."
          columns={[
            { key: "log_date", label: "Date", render: (l) => fmtDate(l.log_date) },
            { key: "driver_id", label: "Driver", render: (l) => driverLabel(drivers.find(d => d.id === l.driver_id)) },
            { key: "drive", label: "Drive", render: (l) => `${Math.floor((l.total_drive_minutes||0)/60)}h ${(l.total_drive_minutes||0)%60}m` },
            { key: "on_duty", label: "On-duty", hideOnMobile: true, render: (l) => `${Math.floor((l.total_on_duty_minutes||0)/60)}h ${(l.total_on_duty_minutes||0)%60}m` },
            { key: "violations", label: "Violations", render: (l) => Array.isArray(l.violations) ? (l.violations as unknown[]).length : 0 },
            { key: "certified", label: "Certified", render: (l) => l.certified ? <span className="text-green-400">✓</span> : <span className="text-white/35">—</span> },
            { key: "eld_source", label: "Source", hideOnMobile: true, render: (l) => l.eld_source || <span className="text-white/35">manual</span> },
          ]}
        />
      </div>
    </AppShell>
  );
}
