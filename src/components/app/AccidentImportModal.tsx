"use client";

import { useState } from "react";

const TEMPLATE = `accident_date,driver_first_name,driver_last_name,license_plate,location,recordable,fatalities,injuries,tow_required,preventable,description,cause_category
2026-03-15,James,Carter,7XYZ123,I-35 · TX,true,0,1,true,preventable,Rear-end at slow speed,following_distance
2026-02-08,Maria,Reyes,7XYZ124,US-287 · OK,false,0,0,false,non_preventable,Deer strike,wildlife`;

type ImportResult = { ok: boolean; submitted: number; inserted: number; updated: number; skipped: number; errors: { row: number; reason: string }[] };

export function AccidentImportModal({ carrierId, onClose, onImported }: { carrierId: string; onClose: () => void; onImported: () => void }) {
  const [csv, setCsv] = useState(""); const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string[][]>([]); const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null); const [error, setError] = useState<string | null>(null);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "accidents_template.csv"; a.click();
  }
  function onFile(f: File | null | undefined) {
    if (!f) return;
    setFileName(f.name); setError(null); setResult(null);
    const reader = new FileReader();
    reader.onload = () => { const t = String(reader.result || ""); setCsv(t); setPreview(t.split(/\r?\n/).slice(0, 11).map(l => l.split(","))); };
    reader.readAsText(f);
  }
  async function submit() {
    if (!csv) { setError("Pick a CSV first."); return; }
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await fetch("/api/accidents/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ carrier_id: carrierId, csv }) });
      const body = await r.json() as ImportResult & { error?: string };
      if (!r.ok) setError(body.error || `Server error ${r.status}`); else { setResult(body); if (body.ok) onImported(); }
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-extrabold text-[var(--fg)]">Bulk import accidents</h2>
            <p className="text-[12px] text-[var(--fg-muted)] mt-1">49 CFR § 390.15 — accidents must be retained for 3 years.</p>
          </div>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <div className="text-[13px] font-bold text-[var(--fg)] mb-1">1. Download the template (optional)</div>
            <button onClick={downloadTemplate} className="px-3 py-1.5 rounded-lg text-[12px] font-bold border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--surface-3)]">↓ accidents_template.csv</button>
            <div className="text-[11px] text-[var(--fg-muted)] mt-1">Required: accident_date. Driver matched by name; vehicle by plate.</div>
          </div>
          <div>
            <div className="text-[13px] font-bold text-[var(--fg)] mb-1">2. Upload your CSV</div>
            <label className="block px-4 py-6 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg)] text-center cursor-pointer hover:border-[var(--accent)] transition-colors">
              <span className="text-[13px] text-[var(--fg-muted)]">{fileName ? <strong className="text-[var(--fg)]">{fileName}</strong> : "Click to choose CSV · or drop one here"}</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
          {preview.length > 1 && (
            <div>
              <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2">Preview (first 10 rows)</div>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                <table className="w-full text-[11px]">
                  <thead className="bg-[var(--surface-3)] text-[10px] tracking-[.12em] uppercase text-[var(--fg-muted)]"><tr>{preview[0].map((h, i) => <th key={i} className="text-left px-2 py-1.5 font-bold whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{preview.slice(1).map((row, i) => (<tr key={i} className="border-t border-[var(--border)]">{row.map((c, j) => <td key={j} className="px-2 py-1 whitespace-nowrap text-[var(--fg-muted)]">{c}</td>)}</tr>))}</tbody>
                </table>
              </div>
            </div>
          )}
          {error && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-[13px] text-rose-300">{error}</div>}
          {result && (
            <div className={`rounded-lg border p-4 text-[13px] ${result.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-amber-500/40 bg-amber-500/10 text-amber-300"}`}>
              <div className="font-bold mb-1">{result.ok ? "✓ Import complete" : "⚠ Import finished with errors"}</div>
              <div className="text-[12px]">Submitted: <strong>{result.submitted}</strong> · Saved: <strong>{result.inserted + result.updated}</strong>{result.errors.length ? <> · Errors: <strong>{result.errors.length}</strong></> : null}</div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-[var(--border)] flex justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded-lg font-bold text-[13px] text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--fg)]">{result?.ok ? "Done" : "Cancel"}</button>
          {!result?.ok && <button onClick={submit} disabled={busy || !csv} className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--bg)] disabled:opacity-40" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Importing…" : `Import${preview.length > 1 ? ` ${preview.length - 1} rows` : ""} →`}</button>}
        </div>
      </div>
    </div>
  );
}
