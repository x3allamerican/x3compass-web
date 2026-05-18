"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";

const DOCS = [
  { name: "Driver_Qualification_File_RodriguezM.pdf", who: "Margaret Rodriguez", kind: "DQ File",       updated: "2026-05-10", size: "2.4 MB" },
  { name: "MVR_GreenA_2026.pdf",                       who: "Anthony Green",     kind: "MVR",            updated: "2026-04-02", size: "318 KB" },
  { name: "Medical_Examiner_Cert_MitchellZ.pdf",      who: "Zachary Mitchell",  kind: "Medical Cert",   updated: "2026-01-13", size: "412 KB" },
  { name: "ELDT_Theory_Cert_PatelM.pdf",               who: "Michael Patel",     kind: "ELDT Certificate", updated: "2026-03-22", size: "201 KB" },
  { name: "Drug_Test_Result_WilsonC_2026-02-22.pdf",   who: "Christine Wilson",  kind: "D&A Result",     updated: "2026-02-22", size: "188 KB" },
  { name: "Roadside_Inspection_MartinezE_2026-04-18.pdf", who: "Eric Martinez",  kind: "Inspection",     updated: "2026-04-18", size: "640 KB" },
  { name: "Accident_Report_Mar22_LeeJ.pdf",            who: "Joshua Lee",        kind: "Accident",       updated: "2026-03-22", size: "1.1 MB" },
  { name: "Annual_Inspection_Unit156A_2025.pdf",       who: "Unit 156A",         kind: "Vehicle Insp.",  updated: "2025-12-10", size: "504 KB" },
];

export default function DocumentLookupPage() {
  const [q, setQ] = useState("");
  const filtered = DOCS.filter((d) => {
    const hay = `${d.name} ${d.who} ${d.kind}`.toLowerCase();
    return q.trim() === "" || hay.includes(q.toLowerCase());
  });
  return (
    <AppShell title="Document Lookup" crumbs="Advanced · Search every file in your account">
      <div className="px-6 py-6 space-y-4 bg-[var(--bg)] min-h-screen">
        <div className="x3-card p-5">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by driver name, unit number, document type, or filename…" className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[var(--accent)]" />
          <div className="text-[11px] text-[var(--fg-muted)] mt-2">{filtered.length} of {DOCS.length} documents · indexed across DQ files, medical certs, MVRs, ELDT, D&A results, inspections, accident reports, vehicle docs.</div>
        </div>
        <div className="x3-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-4 py-2 font-bold">File</th><th className="text-left px-4 py-2 font-bold">Who / What</th><th className="text-left px-4 py-2 font-bold">Type</th><th className="text-left px-4 py-2 font-bold">Updated</th><th className="text-right px-4 py-2 font-bold">Size</th></tr>
            </thead>
            <tbody>{filtered.map((d, i) => (
              <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/40">
                <td className="px-4 py-2.5 text-[var(--accent)] font-mono">{d.name}</td>
                <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{d.who}</td>
                <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[var(--accent)]/15 text-[var(--accent)]">{d.kind}</span></td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{d.updated}</td>
                <td className="px-4 py-2.5 text-right text-[var(--fg-muted)] tabular-nums">{d.size}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
