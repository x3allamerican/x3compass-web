"use client";

import { useState, useRef } from "react";

const DRIVER_TEMPLATE = `first_name,last_name,email,phone,date_of_birth,license_number,license_state,license_class,license_expiration,medical_cert_expiration,hire_date,status
John,Doe,john.doe@example.com,555-123-4567,1985-03-12,D1234567,TX,A,2028-04-30,2027-02-15,2024-01-15,active
Jane,Smith,jane.smith@example.com,555-987-6543,1990-07-22,S7654321,TX,A,2029-07-22,2026-12-01,2023-11-01,active`;

type ImportResult = {
  ok: boolean;
  submitted: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

export function DriverImportModal({
  carrierId,
  onClose,
  onImported,
}: {
  carrierId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [csv, setCsv] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropRef = useRef<HTMLLabelElement>(null);

  function downloadTemplate() {
    const blob = new Blob([DRIVER_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "drivers_template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(f: File | null | undefined) {
    if (!f) return;
    setFileName(f.name);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setCsv(text);
      // Quick preview parse (first 10 rows, naive split for display only)
      const rows = text.split(/\r?\n/).slice(0, 11).map(line => line.split(","));
      setPreview(rows);
    };
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(f);
  }

  async function submit() {
    if (!csv) { setError("Pick a CSV first."); return; }
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await fetch("/api/drivers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier_id: carrierId, csv }),
      });
      const body = await r.json() as ImportResult & { error?: string };
      if (!r.ok) {
        setError(body.error || `Server error ${r.status}`);
      } else {
        setResult(body);
        if (body.ok) onImported();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-extrabold text-[var(--fg)]">Bulk import drivers</h2>
            <p className="text-[12px] text-[var(--fg-muted)] mt-1">CSV upload · existing drivers (by CDL #) are updated, not duplicated.</p>
          </div>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <div className="text-[13px] font-bold text-[var(--fg)] mb-1">1. Download the template (optional)</div>
            <button onClick={downloadTemplate} className="px-3 py-1.5 rounded-lg text-[12px] font-bold border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--surface-3)]">
              ↓ drivers_template.csv
            </button>
            <div className="text-[11px] text-[var(--fg-muted)] mt-1">Required: first_name, last_name. All other columns optional.</div>
          </div>

          <div>
            <div className="text-[13px] font-bold text-[var(--fg)] mb-1">2. Upload your CSV</div>
            <label
              ref={dropRef}
              className="block px-4 py-6 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg)] text-center cursor-pointer hover:border-[var(--accent)] transition-colors"
            >
              <span className="text-[13px] text-[var(--fg-muted)]">
                {fileName ? <strong className="text-[var(--fg)]">{fileName}</strong> : "Click to choose CSV · or drop one here"}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          </div>

          {preview.length > 1 && (
            <div>
              <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2">Preview (first 10 rows)</div>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                <table className="w-full text-[11px]">
                  <thead className="bg-[var(--surface-3)] text-[10px] tracking-[.12em] uppercase text-[var(--fg-muted)]">
                    <tr>{preview[0].map((h, i) => <th key={i} className="text-left px-2 py-1.5 font-bold whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>{preview.slice(1).map((row, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      {row.map((c, j) => <td key={j} className="px-2 py-1 whitespace-nowrap text-[var(--fg-muted)]">{c}</td>)}
                    </tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-[13px] text-rose-300">{error}</div>
          )}

          {result && (
            <div className={`rounded-lg border p-4 text-[13px] ${result.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-amber-500/40 bg-amber-500/10 text-amber-300"}`}>
              <div className="font-bold mb-1">{result.ok ? "✓ Import complete" : "⚠ Import finished with errors"}</div>
              <div className="text-[12px]">
                Submitted: <strong>{result.submitted}</strong> · Saved: <strong>{result.inserted + result.updated}</strong>
                {result.skipped ? <> · Skipped: <strong>{result.skipped}</strong></> : null}
                {result.errors.length ? <> · Errors: <strong>{result.errors.length}</strong></> : null}
              </div>
              {result.errors.length > 0 && (
                <ul className="mt-2 text-[11px] text-amber-200 space-y-0.5 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 10).map((e, i) => <li key={i}>Row {e.row + 1}: {e.reason}</li>)}
                  {result.errors.length > 10 && <li>…and {result.errors.length - 10} more</li>}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--border)] flex justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded-lg font-bold text-[13px] text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--fg)]">
            {result?.ok ? "Done" : "Cancel"}
          </button>
          {!result?.ok && (
            <button
              onClick={submit}
              disabled={busy || !csv}
              className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--bg)] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              {busy ? "Importing…" : `Import${preview.length > 1 ? ` ${preview.length - 1} rows` : ""} →`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
