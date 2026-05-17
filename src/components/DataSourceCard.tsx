"use client";

import { useState, useRef } from "react";

export type Vendor = {
  name: string;
  blurb: string;          // 1-line description for buyers
  badge?: string;         // "Recommended" / "OAuth" / "API key"
  status?: "live" | "beta" | "manual-pull";
  cost?: string;          // "Included" / "$0.25 / record" / "$4.95/driver/mo"
};

export type DataSourceConfig = {
  /** Tracker label for the header, e.g., "Hours of Service" */
  trackerLabel: string;
  /** CFR reference shown under the header */
  cfr?: string;
  /** Vendors that can integrate directly */
  vendors: Vendor[];
  /** Path or label for the CSV template download */
  csvTemplate: { name: string; columns: string[] };
  /** What the manual entry button says, e.g., "Add log entry" */
  manualLabel: string;
  /** Current state — defaults to "empty" */
  initialStatus?: "empty" | "connected" | "imported" | "manual";
  /** If connected, which vendor */
  connectedVendor?: string;
  /** Last sync timestamp text */
  lastSync?: string;
  /** Count of records currently in the tracker */
  recordCount?: number;
};

export default function DataSourceCard({
  trackerLabel,
  cfr,
  vendors,
  csvTemplate,
  manualLabel,
  initialStatus = "empty",
  connectedVendor,
  lastSync,
  recordCount = 0,
}: DataSourceConfig) {
  const [status, setStatus] = useState(initialStatus);
  const [expanded, setExpanded] = useState(initialStatus === "empty");
  const [activeTab, setActiveTab] = useState<"connect" | "csv" | "manual">("connect");
  const [showManualModal, setShowManualModal] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compact bar shown when data is loaded
  if (!expanded && status !== "empty") {
    return (
      <div
        className="rounded-xl px-4 py-3 border border-[var(--border)] flex items-center justify-between gap-3"
        style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #34d399" }} />
          <div className="min-w-0">
            <div className="text-[12px] text-[var(--fg)]">
              <span className="font-bold text-[var(--fg)]">{status === "connected" ? `Connected · ${connectedVendor}` : status === "imported" ? `CSV imported · ${csvFileName ?? csvTemplate.name}` : "Manual entry"}</span>
              <span className="text-[var(--fg-muted)] ml-2">{recordCount} records</span>
              {lastSync && <span className="text-white/40 ml-2">· last sync {lastSync}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="text-[11px] font-semibold text-[#22D3EE] hover:underline whitespace-nowrap"
        >
          Change source →
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <div>
              <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[#22D3EE]/80 mb-1">
                Data source for {trackerLabel}
              </div>
              <h3 className="text-[17px] font-extrabold text-[var(--fg)]">How do you want to get data in here?</h3>
            </div>
            {status !== "empty" && (
              <button
                onClick={() => setExpanded(false)}
                className="text-[11px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] whitespace-nowrap"
              >
                Collapse ↑
              </button>
            )}
          </div>
          {cfr && (
            <div className="text-[11px] text-[var(--fg-muted)]">
              Backed by <span className="font-mono text-[#22D3EE]">{cfr}</span>
            </div>
          )}
        </div>

        {/* Tab strip */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface-3)]">
          {[
            { id: "connect" as const, label: `🔌 Option A · Connect vendor`, sub: "(preferred)" },
            { id: "csv" as const, label: "📄 Option B · Import CSV", sub: "" },
            { id: "manual" as const, label: "✏️ Option C · Manual entry", sub: "" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 px-4 py-3 text-[12px] font-bold transition-colors ${
                activeTab === t.id
                  ? "text-white bg-[#22D3EE]/10 border-b-2 border-[#22D3EE]"
                  : "text-[var(--fg-muted)] hover:text-white border-b-2 border-transparent"
              }`}
            >
              <div>{t.label}</div>
              {t.sub && <div className="text-[10px] text-[var(--fg-faint)] font-medium mt-0.5">{t.sub}</div>}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="p-5">
          {/* Option A — Connect */}
          {activeTab === "connect" && (
            <div className="space-y-3">
              <div className="text-[12.5px] text-[var(--fg-muted)] mb-3">
                If you already use one of these vendors, Compass pulls data in real-time. Setup takes ~3 minutes.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vendors.map((v) => (
                  <div
                    key={v.name}
                    className="rounded-xl p-4 border border-[var(--border)] hover:border-[#22D3EE]/40 transition-colors"
                    style={{ background: "#0F1C32" }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="text-[var(--fg)] font-bold text-[13.5px] flex items-center gap-2 flex-wrap">
                          {v.name}
                          {v.badge === "Recommended" && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold text-[var(--bg)] bg-[#22D3EE]">
                              {v.badge}
                            </span>
                          )}
                          {v.badge && v.badge !== "Recommended" && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-[var(--fg-muted)] border border-white/20">
                              {v.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">{v.blurb}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]/60">
                      <div className="text-[10.5px] text-[var(--fg-faint)]">
                        {v.cost && <span>{v.cost}</span>}
                        {v.status === "beta" && <span className="ml-2 text-amber-300">· Beta</span>}
                        {v.status === "manual-pull" && <span className="ml-2 text-[var(--fg-muted)]">· Manual data pull</span>}
                      </div>
                      <button
                        onClick={() => {
                          setStatus("connected");
                          setExpanded(false);
                        }}
                        className="text-[11px] font-bold text-[var(--bg)] px-3 py-1.5 rounded-full"
                        style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                      >
                        Connect →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-[var(--fg-faint)] pt-2">
                Don&apos;t see your vendor? <a href="mailto:support@x3compass.com?subject=Vendor%20request" className="text-[#22D3EE] hover:underline">Request an integration →</a>
              </div>
            </div>
          )}

          {/* Option B — CSV */}
          {activeTab === "csv" && (
            <div className="space-y-4">
              <div className="text-[12.5px] text-[var(--fg-muted)]">
                No vendor? No problem. Export from your current system as CSV, upload it here, and Compass parses it into the tracker.
              </div>

              {/* CSV template download */}
              <div className="rounded-xl p-4 border border-[var(--border)] flex items-center justify-between gap-3 flex-wrap" style={{ background: "#0F1C32" }}>
                <div className="min-w-0">
                  <div className="text-[var(--fg)] font-bold text-[13px] mb-1">Step 1 · Download the template</div>
                  <div className="text-[11px] text-[var(--fg-muted)]">
                    Columns: <span className="font-mono text-[#22D3EE]">{csvTemplate.columns.join(", ")}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Generate and download a CSV with just the headers
                    const csv = csvTemplate.columns.join(",") + "\n";
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = csvTemplate.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[12px] font-bold text-[var(--fg)] border border-white/20 hover:bg-white/5 px-4 py-2 rounded-full whitespace-nowrap"
                >
                  ⬇ Download CSV template
                </button>
              </div>

              {/* CSV upload */}
              <div
                className="rounded-xl p-6 border-2 border-dashed border-[#22D3EE]/40 text-center cursor-pointer hover:border-[#22D3EE] hover:bg-[#22D3EE]/5 transition-colors"
                style={{ background: "rgba(34, 211, 238, 0.03)" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setCsvFileName(f.name);
                      setStatus("imported");
                      setExpanded(false);
                    }
                  }}
                />
                <div className="text-[36px] mb-2">📤</div>
                <div className="text-[var(--fg)] font-bold text-[13px] mb-1">Step 2 · Drop your CSV here, or click to browse</div>
                <div className="text-[11px] text-[var(--fg-muted)]">Up to 50 MB · all data stays in your account · processed locally first</div>
              </div>

              <div className="text-[11px] text-[var(--fg-faint)]">
                Compass will preview the rows, show what it parsed, and let you confirm before anything is written.
              </div>
            </div>
          )}

          {/* Option C — Manual */}
          {activeTab === "manual" && (
            <div className="space-y-4">
              <div className="text-[12.5px] text-[var(--fg-muted)]">
                Smallest fleets often start here. Add records one at a time. You can switch to CSV or vendor integration later — no data is lost.
              </div>

              <div className="rounded-xl p-5 border border-[var(--border)] flex items-center justify-between gap-3" style={{ background: "#0F1C32" }}>
                <div>
                  <div className="text-[var(--fg)] font-bold text-[13px]">Add records manually</div>
                  <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">Best for fleets &lt; 5 drivers, or for adding one-off records.</div>
                </div>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="text-[12px] font-bold text-[var(--bg)] px-4 py-2 rounded-full whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                >
                  + {manualLabel}
                </button>
              </div>

              <div className="text-[11px] text-[var(--fg-faint)]">
                💡 Tip: every manual entry generates the same audit trail as integrated data. Compass timestamps, attaches your user ID, and stores it in the same schema.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual entry modal */}
      {showManualModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowManualModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] p-6"
            style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-[var(--fg)] font-extrabold text-[16px]">{manualLabel}</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-[18px]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-[12.5px] text-[var(--fg-muted)] mb-4">
              In production, this opens a form pre-mapped to the tracker schema with required fields, validation, and a save button. For the demo, this preview confirms the path exists.
            </p>
            <div className="space-y-2 mb-5">
              {csvTemplate.columns.slice(0, 4).map((col) => (
                <div key={col}>
                  <label className="text-[10px] tracking-[.12em] uppercase font-bold text-[var(--fg-muted)] block mb-1">
                    {col}
                  </label>
                  <input
                    type="text"
                    placeholder={`Enter ${col}`}
                    className="w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--fg)] placeholder:text-white/30 focus:outline-none focus:border-[#22D3EE]"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowManualModal(false)}
                className="text-[12px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] px-4 py-2 rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStatus("manual");
                  setExpanded(false);
                  setShowManualModal(false);
                }}
                className="text-[12px] font-bold text-[var(--bg)] px-5 py-2 rounded-full"
                style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
              >
                Save record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
