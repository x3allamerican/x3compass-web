"use client";
import AppShell from "@/components/AppShell";

const PROSPECTS = [
  { name: "ABC Trucking LLC",        dot: "1234567", state: "TX", trucks: 24, drivers: 31,  rating: "Satisfactory", crashes: 2, hot: "warm" },
  { name: "Big Sky Express",          dot: "2349810", state: "MT", trucks: 14, drivers: 18,  rating: "—",            crashes: 0, hot: "hot"  },
  { name: "Carolina Cold Chain",     dot: "3458801", state: "NC", trucks: 47, drivers: 62,  rating: "—",            crashes: 1, hot: "hot"  },
  { name: "Desert Star Logistics",   dot: "4561023", state: "AZ", trucks: 11, drivers: 14,  rating: "Satisfactory", crashes: 0, hot: "warm" },
  { name: "Eagle Eye Freight",        dot: "5552204", state: "GA", trucks: 33, drivers: 41,  rating: "Conditional",  crashes: 4, hot: "hot"  },
  { name: "Frontier Bulk",            dot: "6610922", state: "ND", trucks: 19, drivers: 24,  rating: "—",            crashes: 0, hot: "warm" },
  { name: "GreatLakes Hauling",      dot: "7711045", state: "MI", trucks: 28, drivers: 36,  rating: "Satisfactory", crashes: 1, hot: "cool" },
];

export default function ProspectsPage() {
  return (
    <AppShell title="FMCSA Prospects" crumbs="Carriers near you · publicly listed on SAFER">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <div className="x3-card p-5">
          <div className="text-[13px] text-[var(--fg-muted)]">
            Carriers with 10–100 power units that match your typical lane and equipment. Sourced from FMCSA SAFER + MCS-150 data. Hot = no current safety mgmt vendor + recent crash. Warm = recent MCS-150 update. Cool = stable.
          </div>
        </div>
        <div className="x3-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-4 py-2 font-bold">Carrier</th><th className="text-left px-4 py-2 font-bold">DOT #</th><th className="text-left px-4 py-2 font-bold">State</th><th className="text-right px-4 py-2 font-bold">Trucks</th><th className="text-right px-4 py-2 font-bold">Drivers</th><th className="text-left px-4 py-2 font-bold">Safety rating</th><th className="text-right px-4 py-2 font-bold">24mo crashes</th><th className="text-left px-4 py-2 font-bold">Heat</th></tr>
            </thead>
            <tbody>{PROSPECTS.map((p, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{p.name}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)] font-mono">{p.dot}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{p.state}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{p.trucks}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{p.drivers}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{p.rating}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{p.crashes}</td>
                <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${p.hot === "hot" ? "bg-[var(--danger)]/15 text-[var(--danger)]" : p.hot === "warm" ? "bg-[var(--warning)]/15 text-[var(--warning)]" : "bg-[var(--success)]/15 text-[var(--success)]"}`}>{p.hot.toUpperCase()}</span></td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
