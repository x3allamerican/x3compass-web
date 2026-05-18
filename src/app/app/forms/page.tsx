"use client";
import AppShell from "@/components/AppShell";

const FORMS = [
  { name: "Driver Application (long form)",        cfr: "49 CFR § 391.21",   uses: 142, last: "2026-05-14", category: "Hire" },
  { name: "Investigation of Previous Employers",   cfr: "49 CFR § 391.23",   uses:  98, last: "2026-05-14", category: "Hire" },
  { name: "Annual Driver Review",                  cfr: "49 CFR § 391.25",   uses:  72, last: "2026-05-12", category: "Annual" },
  { name: "MVR Request Authorization",             cfr: "49 CFR § 391.23(a)(1)", uses: 72, last: "2026-05-10", category: "Annual" },
  { name: "Medical Examiner Cert (template)",      cfr: "49 CFR § 391.43",   uses:  60, last: "2026-05-07", category: "Medical" },
  { name: "FCRA Disclosure & Consent",             cfr: "FCRA 15 USC 1681", uses:  72, last: "2026-05-01", category: "Background" },
  { name: "Drug & Alcohol Pre-Employment",         cfr: "49 CFR § 382.301", uses:  72, last: "2026-04-29", category: "D&A" },
  { name: "Post-Accident D&A Form",                cfr: "49 CFR § 382.303", uses:  12, last: "2026-04-18", category: "D&A" },
  { name: "Driver Vehicle Inspection Report",      cfr: "49 CFR § 396.11",  uses: 216, last: "2026-05-17", category: "Daily Ops" },
  { name: "Accident Register Entry",               cfr: "49 CFR § 390.15",  uses:   5, last: "2026-04-22", category: "Incidents" },
];

export default function FormsPage() {
  return (
    <AppShell title="Forms" crumbs="Client Admin · Templates · Auto-fillable">
      <div className="px-6 py-6 space-y-4 bg-[var(--bg)] min-h-screen">
        <div className="x3-card p-5">
          <div className="text-[13px] text-[var(--fg-muted)]">
            Every form X3 Compass generates for you, every CFR-required signature. Auto-fills from driver / vehicle / incident records. PDF + DocuSign-routable. Versioned — when a regulation changes, we update the template and re-issue.
          </div>
        </div>
        <div className="x3-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-4 py-2 font-bold">Form</th><th className="text-left px-4 py-2 font-bold">CFR Anchor</th><th className="text-left px-4 py-2 font-bold">Category</th><th className="text-right px-4 py-2 font-bold">Uses (YTD)</th><th className="text-left px-4 py-2 font-bold">Last used</th><th className="text-right px-4 py-2 font-bold">Action</th></tr>
            </thead>
            <tbody>{FORMS.map((f, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{f.name}</td>
                <td className="px-4 py-2.5 text-[var(--accent)] font-mono text-[12px]">{f.cfr}</td>
                <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[var(--accent)]/15 text-[var(--accent)]">{f.category}</span></td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{f.uses}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{f.last}</td>
                <td className="px-4 py-2.5 text-right"><button className="text-[12px] text-[var(--accent)] font-bold hover:underline">Generate →</button></td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
