import Link from "next/link";
import AppShell from "@/components/AppShell";

const SECTIONS = [
  { key: "drivers",   label: "Driver Qualification Files", cfr: "§ 391.51",     count: "72 drivers · 864 docs",         size: "184 MB", on: true },
  { key: "med",       label: "Medical Certificates",        cfr: "§ 391.43",     count: "72 certs · 3-year history",     size: "42 MB",  on: true },
  { key: "mvr",       label: "MVR Annual Reviews",          cfr: "§ 391.25",     count: "72 reviews · 3-year history",   size: "28 MB",  on: true },
  { key: "da",        label: "Drug & Alcohol Test History",  cfr: "Part 382",    count: "184 tests · 3-year history",    size: "76 MB",  on: true },
  { key: "ch",        label: "Clearinghouse Queries",       cfr: "§ 382.701",    count: "248 queries · 3-year history",  size: "12 MB",  on: true },
  { key: "training",  label: "Training Records",            cfr: "Part 380",     count: "72 drivers · 412 certs",        size: "58 MB",  on: true },
  { key: "vehicles",  label: "Vehicle Inventory & PM",      cfr: "Part 396",     count: "67 units · maint history",      size: "92 MB",  on: true },
  { key: "annual",    label: "Annual DOT Inspections",      cfr: "§ 396.17",     count: "67 units · 3-year history",     size: "44 MB",  on: true },
  { key: "insp",      label: "Roadside Inspections",        cfr: "§ 396.9",      count: "118 inspections · 3 years",     size: "32 MB",  on: true },
  { key: "incidents", label: "Accident Register",           cfr: "§ 390.15",     count: "5 accidents · 3 years",         size: "18 MB",  on: true },
  { key: "hazmat",    label: "Hazmat Records",              cfr: "Part 172",     count: "Security plan, training, ER",   size: "6 MB",   on: false },
  { key: "ifta",      label: "IFTA Quarterly Returns",      cfr: "IFTA",         count: "12 quarters",                   size: "8 MB",   on: false },
];

const RECENT_EXPORTS = [
  { id: "EXP-0024", name: "Q1 2026 audit bundle · full fleet",     when: "2026-04-12", size: "476 MB", actor: "Joshua Kovarik" },
  { id: "EXP-0021", name: "Sarah Johnson · driver-only packet",     when: "2026-03-28", size: "12 MB",  actor: "Joshua Kovarik" },
  { id: "EXP-0019", name: "Texas roadside inspection year",         when: "2026-02-15", size: "84 MB",  actor: "Brad Reynolds" },
];

export default function AuditExportPage() {
  return (
    <AppShell title="Audit Export" crumbs="ADVANCED · ONE-CLICK DOT BUNDLE">
      <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden border border-[#22D3EE]/30"
          style={{ background: "linear-gradient(135deg, #15233D 0%, #0F1C32 100%)" }}
        >
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(34, 211, 238, 0.22), transparent 70%)" }}
          />
          <div className="relative flex items-center gap-6 flex-wrap">
            <div className="text-[56px]">📄</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[28px] font-extrabold text-white tracking-tight mb-1">
                Walk into your DOT audit with{" "}
                <span className="serif-italic" style={{ color: "#22D3EE" }}>a single USB drive.</span>
              </h2>
              <p className="text-[15px] text-white/75 max-w-2xl">
                One click. Every required record, every CFR-cited document, every retention window — indexed, watermarked, page-numbered. The bundle is the audit-readiness story.
              </p>
            </div>
          </div>
        </div>

        {/* Builder */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="px-6 py-5 border-b border-[#1E3556]">
            <h3 className="text-[16px] font-extrabold text-white">Build your audit bundle</h3>
            <p className="text-[13px] text-white/55 mt-0.5">Toggle sections to include. Estimated size + page count update live.</p>
          </div>
          <div className="divide-y divide-[#1E3556]">
            {SECTIONS.map((s) => (
              <label
                key={s.key}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#22D3EE]/5 cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full ${s.on ? "bg-[#22D3EE]/15" : "bg-white/5"} border ${s.on ? "border-[#22D3EE]/40" : "border-white/10"}`}>
                    <span className={`w-4 h-4 rounded-full ${s.on ? "translate-x-2 bg-[#22D3EE]" : "-translate-x-2 bg-white/30"}`} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-white font-bold">{s.label}</div>
                    <div className="text-[11px] text-white/55 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[#22D3EE]/80">{s.cfr}</span>
                      <span>·</span>
                      <span>{s.count}</span>
                    </div>
                  </div>
                </div>
                <div className="text-[12px] text-white/55 tabular-nums">{s.size}</div>
              </label>
            ))}
          </div>
          <div className="px-6 py-5 border-t border-[#1E3556] bg-[#0A1929]/60">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="text-[12px] text-white/55">Estimated bundle</div>
                <div className="text-[20px] font-extrabold text-white">476 MB · ~3,840 pages</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="px-4 py-2.5 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5">
                  Preview index
                </button>
                <button
                  className="px-5 py-2.5 rounded-full text-[14px] font-bold text-[#0A1929]"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
                >
                  📄 Generate bundle →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Audit window", value: "Last 36 months", help: "Match the FMCSA review period" },
            { label: "Filter drivers", value: "All 72 drivers", help: "Or pick specific names" },
            { label: "Output format", value: "Single indexed PDF + ZIP", help: "Watermarked, page-numbered" },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl p-5 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 mb-1.5">{f.label}</div>
              <div className="text-white font-bold mb-1">{f.value}</div>
              <div className="text-[11px] text-white/55">{f.help}</div>
            </div>
          ))}
        </div>

        {/* Recent exports */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="px-6 py-5 border-b border-[#1E3556] flex items-center justify-between">
            <h3 className="text-[16px] font-extrabold text-white">Recent exports</h3>
            <span className="text-[11px] font-mono text-[#22D3EE]/70">Retention: 12 months</span>
          </div>
          <div className="divide-y divide-[#1E3556]">
            {RECENT_EXPORTS.map((r, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-white font-bold">{r.name}</div>
                  <div className="text-[11px] text-white/55 font-mono">{r.id} · generated by {r.actor}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-white/55">{r.when}</span>
                  <span className="text-[12px] text-white/55 tabular-nums">{r.size}</span>
                  <button className="text-[12px] font-bold text-[#22D3EE] hover:text-[#67E8F9]">Download →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
