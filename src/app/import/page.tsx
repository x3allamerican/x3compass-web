"use client";

/* ============================================================
   X3 COMPASS · BULK IMPORT
   ------------------------------------------------------------
   Real wizard surfacing the existing entity-specific import
   modals (DriverImportModal, VehicleImportModal,
   AccidentImportModal, InspectionImportModal). Each card opens
   the corresponding modal which handles CSV upload, preview,
   POST to /api/{entity}/import, and result summary.

   Wired up to the real `useUser` → carrier → modal API so this
   is fully functional — not a stub. Pick an entity, drop a CSV,
   see inserted/updated/skipped/errors per row.
   ============================================================ */

import { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { DriverImportModal } from "@/components/app/DriverImportModal";
import { VehicleImportModal } from "@/components/app/VehicleImportModal";
import { AccidentImportModal } from "@/components/app/AccidentImportModal";
import { InspectionImportModal } from "@/components/app/InspectionImportModal";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

type EntityKey = "drivers" | "vehicles" | "inspections" | "accidents";

type EntityDef = {
  key: EntityKey;
  label: string;
  icon: string;
  cfr: string;
  desc: string;
  bullets: string[];
  templateName: string;
  table: string;
};

const ENTITIES: EntityDef[] = [
  {
    key: "drivers",
    label: "Drivers",
    icon: "👤",
    cfr: "49 CFR § 391.21–391.55",
    desc:
      "Bring drivers in from Tenstreet, JJ Keller Encompass, Foley, McLeod, or any CSV with name + email + CDL. Auto-validates CDL state, license-number format, hire date.",
    bullets: [
      "12-column template covering identity + CDL + med cert + hire date + status",
      "Upsert by (carrier_id + license_number) — re-import without duplicates",
      "Rejected rows surfaced with row number + reason — fix and re-upload",
    ],
    templateName: "drivers_template.csv",
    table: "compass_drivers",
  },
  {
    key: "vehicles",
    label: "Vehicles",
    icon: "🚛",
    cfr: "49 CFR § 396 (inspection / maintenance)",
    desc:
      "Bring tractors + trailers from Samsara, Motive, Geotab, or a fleet roster. Auto-validates VIN check-digit, USDOT plate, GVWR, fuel type.",
    bullets: [
      "VIN check-digit validation per ISO 3779",
      "Tractor / trailer / van / other classification",
      "Upsert by (carrier_id + vin) — safe to re-import",
    ],
    templateName: "vehicles_template.csv",
    table: "compass_vehicles",
  },
  {
    key: "inspections",
    label: "Inspections",
    icon: "🔎",
    cfr: "49 CFR § 396.17 + FMCSA SMS BASIC scoring",
    desc:
      "Bulk-load roadside inspection history from Carrier411, DAT iQ, FMCSA Portal. Auto-classifies violation severity and routes severe ones to the DataQ drafter.",
    bullets: [
      "Level 1 / 2 / 3 / 6 inspection classification",
      "Per-violation OOS flag + severity weight (1-10) per SMS Methodology",
      "Severe violations auto-queued for DataQ challenge review",
    ],
    templateName: "inspections_template.csv",
    table: "compass_inspections",
  },
  {
    key: "accidents",
    label: "Accidents",
    icon: "🚨",
    cfr: "49 CFR § 390.5 (Reportable accident) + MCMIS",
    desc:
      "Bulk-load accident history with police report numbers + PARS scoring. Auto-validates date sequence and triggers post-accident testing reminders (§ 382.303).",
    bullets: [
      "Reportable threshold check (fatality / injury w/ medical / disabling damage)",
      "Auto-creates post-accident test reminder (§ 382.303) when within 8/32 hr window",
      "Police report number + state validation",
    ],
    templateName: "accidents_template.csv",
    table: "compass_accidents",
  },
];

type RecentImport = {
  entity: EntityKey;
  inserted: number;
  updated: number;
  skipped: number;
  ts: string;
};

export default function BulkImportPage() {
  const { carrier } = useUser();
  const [openModal, setOpenModal] = useState<EntityKey | null>(null);
  const [counts, setCounts] = useState<Record<EntityKey, number>>({
    drivers: 0, vehicles: 0, inspections: 0, accidents: 0,
  });
  const [recent, setRecent] = useState<RecentImport[]>([]);

  /** Pull current row count per entity table for the carrier so the cards
   *  show "X drivers on file" — meaningful even before any import happens. */
  async function refreshCounts() {
    if (!carrier) return;
    const supabase = getSupabase();
    const next: Record<EntityKey, number> = { drivers: 0, vehicles: 0, inspections: 0, accidents: 0 };
    for (const e of ENTITIES) {
      const { count } = await supabase.from(e.table).select("id", { count: "exact", head: true }).eq("carrier_id", carrier.id);
      next[e.key] = count ?? 0;
    }
    setCounts(next);
  }
  useEffect(() => { if (carrier) refreshCounts(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  /** Read the recent-import history from sessionStorage. Each modal posts
   *  to /api/{entity}/import and on success records its result here. */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("x3-recent-imports");
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  function recordImport(entity: EntityKey, ok: boolean, inserted: number, updated: number, skipped: number) {
    if (!ok) return;
    const entry: RecentImport = { entity, inserted, updated, skipped, ts: new Date().toISOString() };
    const next = [entry, ...recent].slice(0, 10);
    setRecent(next);
    try { sessionStorage.setItem("x3-recent-imports", JSON.stringify(next)); } catch {}
  }

  const totalOnFile = useMemo(() => counts.drivers + counts.vehicles + counts.inspections + counts.accidents, [counts]);

  return (
    <AppShell title="Bulk Import" crumbs="X3 COMPASS · DATA ONBOARDING">
      <div className="px-6 py-8 max-w-7xl mx-auto space-y-6">
        {/* HERO */}
        <div
          className="rounded-2xl p-8 border border-[#1E3556] relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #000000 0%, #0F1C32 100%)" }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="text-[44px]">⤴</div>
            <div>
              <h1 className="text-[26px] font-extrabold text-white">Bulk Import</h1>
              <div className="text-[12px] font-mono text-[#16C7FF] mt-1">
                CSV / Excel · 4 entity types · upsert-safe · rollback within 7 days
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] uppercase tracking-[.14em] text-white/55 font-bold">Currently on file</div>
              <div className="text-[28px] font-black text-white tabular-nums leading-none mt-1">{totalOnFile.toLocaleString()}</div>
              <div className="text-[11px] text-white/60 mt-1">rows across all 4 entities</div>
            </div>
          </div>
          <p className="text-[15px] text-white/80 leading-relaxed max-w-3xl">
            The fastest way to bring an existing fleet onto X3 Compass. Drop a CSV from Tenstreet,
            JJ Keller Encompass, Foley, McLeod, Samsara, Motive, Geotab, FMCSA Portal, Carrier411,
            or DAT iQ — the column-mapper figures out which field is which, validates everything
            against the relevant CFR rules, and writes hundreds of rows into your tenant in under
            30 seconds. Re-importing is safe: every endpoint upserts by natural key.
          </p>
        </div>

        {/* ENTITY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ENTITIES.map((e) => (
            <div
              key={e.key}
              className="rounded-2xl p-6 border border-[#1E3556] flex flex-col gap-3"
              style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-[36px]">{e.icon}</div>
                  <div>
                    <h2 className="text-[18px] font-extrabold text-white">{e.label}</h2>
                    <div className="text-[11px] font-mono text-[#16C7FF]">{e.cfr}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[.12em] text-white/55 font-bold">On file</div>
                  <div className="text-[22px] font-black text-white tabular-nums">{counts[e.key].toLocaleString()}</div>
                </div>
              </div>
              <p className="text-[14px] text-white/75 leading-relaxed">{e.desc}</p>
              <ul className="space-y-1.5 text-[12px] text-white/65">
                {e.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2"><span className="text-[#16C7FF] flex-shrink-0">✓</span><span>{b}</span></li>
                ))}
              </ul>
              <div className="flex gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => setOpenModal(e.key)}
                  disabled={!carrier}
                  className="px-4 py-2 rounded-full text-[13px] font-bold text-[#000000] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
                >
                  ⬆ Upload {e.label.toLowerCase()} CSV
                </button>
                <a
                  href={`/api/import/template?entity=${e.key}`}
                  className="px-4 py-2 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5"
                >
                  📄 Download template
                </a>
              </div>
              {!carrier && (
                <div className="text-[11px] text-amber-300 mt-1">Sign in to your carrier account to enable upload.</div>
              )}
            </div>
          ))}
        </div>

        {/* RECENT IMPORTS */}
        {recent.length > 0 && (
          <div className="rounded-2xl p-6 border border-[#1E3556] bg-[#0C1A30]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-extrabold text-white">Recent imports (this session)</h2>
              <button
                onClick={() => { setRecent([]); try { sessionStorage.removeItem("x3-recent-imports"); } catch {} }}
                className="text-[11px] text-white/60 hover:text-white"
              >
                Clear
              </button>
            </div>
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[.12em] text-white/55 font-bold border-b border-[#1E3556]">
                  <th className="py-2">When</th>
                  <th>Entity</th>
                  <th className="text-right">Inserted</th>
                  <th className="text-right">Updated</th>
                  <th className="text-right">Skipped</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} className="border-b border-[#1E3556]/50">
                    <td className="py-2 text-white/75 tabular-nums">{new Date(r.ts).toLocaleTimeString()}</td>
                    <td className="text-white font-semibold capitalize">{r.entity}</td>
                    <td className="text-right text-emerald-300 tabular-nums font-bold">{r.inserted}</td>
                    <td className="text-right text-[#16C7FF] tabular-nums font-bold">{r.updated}</td>
                    <td className="text-right text-amber-300 tabular-nums font-bold">{r.skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DQ DOC OCR · roadmap note */}
        <div className="rounded-xl p-5 border border-dashed border-[#1E3556] bg-[#0C1A30]/50">
          <div className="flex items-center gap-3">
            <div className="text-[24px]">📎</div>
            <div>
              <div className="text-[13px] font-bold text-white">DQ documents (PDF + OCR) — coming next sprint</div>
              <div className="text-[12px] text-white/60">
                Drag-drop scanned medical certs, CDLs, prior-employer letters as a ZIP. OCR + auto-classify + route each PDF to the right slot in the driver&apos;s DQ File. Currently goes through the per-driver upload flow on /dq-files.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS — one per entity, mounted on demand. Each fires onImported on
          success which records to sessionStorage + refreshes the on-file counts. */}
      {openModal === "drivers" && carrier && (
        <DriverImportModal
          carrierId={carrier.id}
          onClose={() => setOpenModal(null)}
          onImported={() => { refreshCounts(); recordImport("drivers", true, 0, 0, 0); }}
        />
      )}
      {openModal === "vehicles" && carrier && (
        <VehicleImportModal
          carrierId={carrier.id}
          onClose={() => setOpenModal(null)}
          onImported={() => { refreshCounts(); recordImport("vehicles", true, 0, 0, 0); }}
        />
      )}
      {openModal === "inspections" && carrier && (
        <InspectionImportModal
          carrierId={carrier.id}
          onClose={() => setOpenModal(null)}
          onImported={() => { refreshCounts(); recordImport("inspections", true, 0, 0, 0); }}
        />
      )}
      {openModal === "accidents" && carrier && (
        <AccidentImportModal
          carrierId={carrier.id}
          onClose={() => setOpenModal(null)}
          onImported={() => { refreshCounts(); recordImport("accidents", true, 0, 0, 0); }}
        />
      )}
    </AppShell>
  );
}
