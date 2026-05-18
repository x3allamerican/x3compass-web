"use client";
import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

const DRIVER_TEMPLATE = `first_name,last_name,email,phone,date_of_birth,license_number,license_state,license_class,license_expiration,medical_cert_expiration,hire_date,status
John,Doe,john.doe@example.com,555-123-4567,1985-03-12,D1234567,TX,A,2028-04-30,2027-02-15,2024-01-15,active
Jane,Smith,jane.smith@example.com,555-987-6543,1990-07-22,S7654321,TX,A,2029-07-22,2026-12-01,2023-11-01,active`;

const VEHICLE_TEMPLATE = `unit_number,vin,year,make,model,vehicle_type,gvwr,annual_inspection_date,pm_due_date,status
156A,1FUJGEDR5BLAS1234,2022,Freightliner,Cascadia,Tractor,80000,2026-01-15,2026-07-15,active
167,1FUJGEDR5BLAS5678,2021,Volvo,VNL,Tractor,80000,2026-03-20,2026-09-20,active`;

const DRIVER_FIELDS = [
  { name: "first_name",               req: true,  desc: "Driver first name" },
  { name: "last_name",                req: true,  desc: "Driver last name" },
  { name: "email",                    req: true,  desc: "Personal or work email" },
  { name: "phone",                    req: false, desc: "Mobile preferred for SMS reminders" },
  { name: "date_of_birth",            req: true,  desc: "YYYY-MM-DD" },
  { name: "license_number",           req: true,  desc: "CDL number" },
  { name: "license_state",            req: true,  desc: "2-letter state code" },
  { name: "license_class",            req: true,  desc: "A / B / C" },
  { name: "license_expiration",       req: true,  desc: "YYYY-MM-DD" },
  { name: "medical_cert_expiration",  req: true,  desc: "YYYY-MM-DD" },
  { name: "hire_date",                req: false, desc: "YYYY-MM-DD" },
  { name: "status",                   req: false, desc: "active / inactive / terminated" },
];

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export default function BulkImportPage() {
  const [tab, setTab] = useState<"drivers" | "vehicles">("drivers");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [imported, setImported] = useState(false);

  function onFile(f: File | null) {
    setFile(f); setImported(false);
    if (!f) { setPreview([]); return; }
    const r = new FileReader();
    r.onload = () => {
      const rows = String(r.result).split(/\r?\n/).filter(Boolean).slice(0, 11);
      setPreview(rows.map(line => line.split(",")));
    };
    r.readAsText(f);
  }

  return (
    <AppShell title="Bulk Import" crumbs="CSV upload · driver and vehicle onboarding">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <div className="x3-card p-5">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab("drivers")}  className={`px-4 py-2 rounded font-extrabold text-[12px] tracking-[.14em] uppercase ${tab === "drivers"  ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "bg-[var(--surface-2)] text-[var(--fg-muted)]"}`}>Drivers</button>
            <button onClick={() => setTab("vehicles")} className={`px-4 py-2 rounded font-extrabold text-[12px] tracking-[.14em] uppercase ${tab === "vehicles" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "bg-[var(--surface-2)] text-[var(--fg-muted)]"}`}>Vehicles</button>
          </div>

          <div className="text-[15px] font-extrabold text-[var(--fg)] mb-2">Step 1 · Download the template</div>
          <p className="text-[13px] text-[var(--fg-muted)] mb-3">CSV with the exact column headers we expect. Required fields are marked. Save your changes back as CSV (UTF-8).</p>
          <button onClick={() => download(`${tab}_template.csv`, tab === "drivers" ? DRIVER_TEMPLATE : VEHICLE_TEMPLATE)} className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>↓ Download {tab}_template.csv</button>

          {tab === "drivers" && (
            <div className="mt-5">
              <div className="text-[12px] font-bold text-[var(--fg-muted)] mb-2">Column reference</div>
              <div className="grid sm:grid-cols-2 gap-2 text-[12px]">
                {DRIVER_FIELDS.map((f) => (
                  <div key={f.name} className="flex items-start gap-2 px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface-2)]">
                    <span className={`text-[10px] font-extrabold mt-0.5 ${f.req ? "text-[var(--danger)]" : "text-[var(--fg-faint)]"}`}>{f.req ? "REQ" : "OPT"}</span>
                    <div className="flex-1 min-w-0"><div className="text-[var(--fg)] font-mono">{f.name}</div><div className="text-[var(--fg-muted)]">{f.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="x3-card p-5">
          <div className="text-[15px] font-extrabold text-[var(--fg)] mb-2">Step 2 · Upload your filled CSV</div>
          <p className="text-[13px] text-[var(--fg-muted)] mb-3">We preview the first 10 rows so you can confirm before we write anything. Each row creates one record. Existing records with matching license_number (drivers) or VIN (vehicles) are updated, not duplicated.</p>
          <label className="block px-4 py-3 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center cursor-pointer hover:border-[var(--accent)]">
            <span className="text-[13px] text-[var(--fg-muted)]">{file ? <strong className="text-[var(--fg)]">{file.name}</strong> : "Click to choose CSV · or drop one here"}</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          </label>

          {preview.length > 1 && (
            <div className="mt-4">
              <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2">Preview (first 10 rows)</div>
              <div className="overflow-x-auto x3-card p-0">
                <table className="w-full text-[12px]">
                  <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                    <tr>{preview[0].map((h, i) => <th key={i} className="text-left px-3 py-2 font-bold whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>{preview.slice(1).map((row, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      {row.map((c, j) => <td key={j} className="px-3 py-1.5 whitespace-nowrap text-[var(--fg-muted)]">{c}</td>)}
                    </tr>))}</tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setImported(true)} className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Import {preview.length - 1} {tab} →</button>
                <button onClick={() => { setFile(null); setPreview([]); }} className="px-4 py-2 rounded-lg font-bold text-[13px] text-[var(--fg-muted)] border border-[var(--border)]">Cancel</button>
              </div>
              {imported && <div className="mt-3 rounded-lg border border-[var(--success)] bg-[var(--success)]/10 p-3 text-[13px] text-[var(--success)] font-semibold">✓ Imported {preview.length - 1} {tab}. <Link href={tab === "drivers" ? "/app/drivers" : "/app/vehicles"} className="underline">View →</Link></div>}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
