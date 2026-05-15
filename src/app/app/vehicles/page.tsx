import Link from "next/link";
import AppShell from "@/components/AppShell";

type Status = "active" | "pm-due" | "oos" | "annual-due";

type Vehicle = {
  id: string;
  unit: string;
  type: string;
  vin: string;
  year: number;
  make: string;
  plate: string;
  miles: number;
  driver: string;
  annual: string;
  pm: string;
  status: Status;
  statusLabel: string;
};

const VEHICLES: Vehicle[] = [
  { id: "156A", unit: "Unit 156A",  type: "Tractor", vin: "1FUJGBDV9BLAY3856", year: 2021, make: "Freightliner Cascadia", plate: "TX-4U3K9", miles: 418923, driver: "Ricardo Torres", annual: "2026-08-04", pm: "2026-01-01", status: "pm-due",     statusLabel: "PM 134d overdue" },
  { id: "109",  unit: "Unit 109",   type: "Tractor", vin: "3HSDJSJR3GN203827", year: 2019, make: "Peterbilt 579",         plate: "TX-7N2L1", miles: 612471, driver: "Jared Martinez", annual: "2026-11-22", pm: "2026-01-04", status: "pm-due",     statusLabel: "PM 131d overdue" },
  { id: "154",  unit: "Unit 154",   type: "Tractor", vin: "1NPXLP9X1EN255672", year: 2022, make: "Kenworth T680",         plate: "TX-8R4P2", miles: 287113, driver: "Mike Kowalski",  annual: "2027-02-15", pm: "2026-01-22", status: "pm-due",     statusLabel: "PM 113d overdue" },
  { id: "167",  unit: "Unit 167",   type: "Tractor", vin: "4V4NC9EH2KN912233", year: 2020, make: "Volvo VNL 760",         plate: "FL-3X9Q7", miles: 521002, driver: "Diego Ramirez",  annual: "2026-12-30", pm: "2026-01-29", status: "pm-due",     statusLabel: "PM 106d overdue" },
  { id: "134",  unit: "Unit 134",   type: "Tractor", vin: "5KJJAEDR0KPLM6612", year: 2018, make: "International LT",      plate: "NM-5P3T4", miles: 743882, driver: "Emma Park",      annual: "2026-09-11", pm: "2026-02-07", status: "pm-due",     statusLabel: "PM 97d overdue" },
  { id: "188",  unit: "Unit 188",   type: "Tractor", vin: "1FUJGBDV5GLAH2987", year: 2024, make: "Freightliner Cascadia", plate: "TX-9R7S3", miles: 98443,  driver: "Alex Carter",    annual: "2027-04-18", pm: "2026-07-12", status: "active",     statusLabel: "Active" },
  { id: "T-12", unit: "Trailer T-12", type: "Dry van 53ft", vin: "1JJV532W0LL112245", year: 2020, make: "Wabash DuraPlate", plate: "TX-T8412", miles: 0, driver: "Pool", annual: "2026-06-22", pm: "2026-06-22", status: "annual-due", statusLabel: "Annual 31d" },
  { id: "T-08", unit: "Trailer T-08", type: "Reefer 53ft", vin: "1JJV532W2LL098771",  year: 2019, make: "Utility 3000R",   plate: "TX-T7811", miles: 0, driver: "Pool", annual: "2026-07-05", pm: "2026-04-22", status: "active",     statusLabel: "Active" },
  { id: "172",  unit: "Unit 172",   type: "Tractor", vin: "1NPXLP9X8KN277104", year: 2023, make: "Kenworth T680",         plate: "OK-6V2K9", miles: 165890, driver: "Linda Wilson",   annual: "2027-01-08", pm: "2026-08-04", status: "active",     statusLabel: "Active" },
  { id: "191",  unit: "Unit 191",   type: "Tractor", vin: "5KJJAEDR4LPLM7228", year: 2024, make: "International LT",      plate: "CA-3X8N4", miles: 42117,  driver: "Raj Mehta",      annual: "2027-09-04", pm: "2026-11-15", status: "active",     statusLabel: "Active" },
];

const STATUS_PILL: Record<Status, string> = {
  active:       "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  "pm-due":     "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  "annual-due": "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  oos:          "bg-rose-500/15 text-rose-300 border border-rose-500/30",
};

export default function VehiclesPage() {
  const total = VEHICLES.length;
  const active = VEHICLES.filter(v => v.status === "active").length;
  const pmDue = VEHICLES.filter(v => v.status === "pm-due").length;
  const annualDue = VEHICLES.filter(v => v.status === "annual-due").length;

  return (
    <AppShell
      title="Vehicles & Preventive Maintenance"
      crumbs="VEHICLES BRAIN · 49 CFR § 396.3 / § 396.17"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            ⬆ Import CSV
          </button>
          <Link href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#0A1929]"
            style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
          >
            + Add vehicle
          </Link>
        </>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: "Power units",         v: total - 2,    c: "#22D3EE" },
            { l: "Trailers",            v: 2,            c: "#22D3EE" },
            { l: "Active",              v: active,       c: "#10B981" },
            { l: "PM overdue",          v: pmDue,        c: "#FBBF24" },
            { l: "Annual DOT ≤ 30d",    v: annualDue,    c: "#FBBF24" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/50 mb-1">{s.l}</div>
              <div className="text-[26px] font-black leading-none" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Compass nudge */}
        <div
          className="rounded-2xl p-5 border flex gap-4 items-start"
          style={{
            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(15, 28, 50, 0.5))",
            borderColor: "rgba(251, 191, 36, 0.30)",
          }}
        >
          <div className="text-[22px]">⚠</div>
          <div className="flex-1">
            <div className="text-white font-bold text-[14px] mb-1">5 vehicles are past PM due dates · § 396.3(b)</div>
            <div className="text-[13px] text-white/75 leading-relaxed mb-3">
              Roadside inspections of a vehicle with no PM record on file count against your Vehicle Maintenance BASIC — your current percentile is{" "}
              <strong className="text-amber-300">64</strong>, intervention threshold is 80. I can build a § 396.3 PM template per unit using the manufacturer&apos;s recommended cycle.
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 rounded-full text-[12px] font-bold text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>
                Build PM templates →
              </button>
              <button className="px-4 py-2 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                Email shop manager
              </button>
            </div>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px] relative">
            <input type="search" placeholder="Search by unit #, VIN, plate, make…"
              className="w-full bg-[#15233D] border border-[#1E3556] rounded-full pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-white/40 focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[14px]">🔍</span>
          </div>
          {["All 67", "Tractors 60", "Trailers 7", "PM overdue 5", "Hazmat-rated 12"].map((f, i) => (
            <button
              key={i}
              className={`text-[12px] font-semibold px-3 py-2 rounded-full border ${
                i === 0
                  ? "bg-[#22D3EE]/15 border-[#22D3EE]/40 text-[#22D3EE]"
                  : "border-[#1E3556] text-white/70 hover:border-[#22D3EE]/40 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Vehicles table */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556] flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[15px] font-extrabold text-white">Power units & trailers · 67 total</h3>
            <span className="text-[11px] font-mono text-[#22D3EE]/70">§ 396 · annual + PM tracking</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#0F1C32]/60">
                <tr className="text-left text-[10px] tracking-[.14em] uppercase font-bold text-white/45">
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-3">Make / Year</th>
                  <th className="py-3 px-3">VIN</th>
                  <th className="py-3 px-3">Plate</th>
                  <th className="py-3 px-3 text-right">Mileage</th>
                  <th className="py-3 px-3">Driver</th>
                  <th className="py-3 px-3">Annual due</th>
                  <th className="py-3 px-3">PM due</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3556]">
                {VEHICLES.map((v) => (
                  <tr key={v.id} className="hover:bg-[#22D3EE]/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-[22px]">{v.type === "Tractor" ? "🚛" : "📦"}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-white">{v.unit}</div>
                          <div className="text-white/45 text-[11px]">{v.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white/85">{v.make}<div className="text-[10px] text-white/45">{v.year}</div></td>
                    <td className="py-3 px-3 font-mono text-white/80 text-[11px]">{v.vin}</td>
                    <td className="py-3 px-3 font-mono text-white/80 text-[12px]">{v.plate}</td>
                    <td className="py-3 px-3 text-white/85 text-right tabular-nums">{v.miles.toLocaleString()}</td>
                    <td className="py-3 px-3 text-white/85 text-[12px]">{v.driver}</td>
                    <td className="py-3 px-3 text-white/85">{v.annual}</td>
                    <td className="py-3 px-3 text-white/85">{v.pm}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_PILL[v.status]}`}>
                        {v.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href="#" className="text-[12px] font-bold text-[#22D3EE] hover:text-[#67E8F9]">
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-[#1E3556] flex items-center justify-between text-[12px] text-white/55">
            <span>Showing 10 of 67 vehicles</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded border border-[#1E3556] hover:border-[#22D3EE]/40">‹</button>
              <span className="text-white/80 font-semibold">1 / 7</span>
              <button className="px-3 py-1 rounded border border-[#1E3556] hover:border-[#22D3EE]/40">›</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
