"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import { useDrivers, driverLabel } from "@/components/app/useDrivers";

type Doc = {
  id: string;
  carrier_id: string;
  driver_id: string;
  doc_type: string;
  label: string | null;
  url: string | null;
  expires_on: string | null;
  created_at: string;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  application:                "Driver Application",
  cdl_copy:                   "CDL",
  medical_card:               "Medical Examiner Cert",
  road_test_certificate:      "Road Test Certificate",
  mvr:                        "MVR",
  drug_test_result:           "D&A Result",
  clearinghouse_query:        "Clearinghouse Query",
  prior_employer_inquiry:     "Prior Employer Inquiry",
  disclosure_consent:         "FCRA Disclosure & Consent",
  background_check:           "Background Check",
  other:                      "Other",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

export default function DocumentLookupPage() {
  const { carrier } = useUser();
  const drivers = useDrivers(carrier?.id);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    if (!carrier?.id) return;
    getSupabase().from("compass_dq_documents")
      .select("*")
      .eq("carrier_id", carrier.id)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setDocs((data as Doc[] | null) || []);
        setLoading(false);
      });
  }, [carrier]);

  // Driver lookup map for fast name resolution
  const driverById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const d of drivers) m[d.id] = driverLabel(d);
    return m;
  }, [drivers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (typeFilter && d.doc_type !== typeFilter) return false;
      if (!term) return true;
      const hay = `${d.label || ""} ${driverById[d.driver_id] || ""} ${d.doc_type} ${DOC_TYPE_LABELS[d.doc_type] || ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [docs, q, typeFilter, driverById]);

  const docTypes = useMemo(() => {
    const set = new Set<string>(); for (const d of docs) set.add(d.doc_type);
    return Array.from(set).sort();
  }, [docs]);

  return (
    <AppShell title="Document Lookup" crumbs="Advanced · Search every file in your account">
      <div className="px-6 py-6 space-y-4 bg-[var(--bg)] min-h-screen">
        <div className="x3-card p-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by driver name, document type, or label…"
            className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[var(--accent)]"
          />
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setTypeFilter("")}
              className={`px-3 py-1 rounded text-[11px] font-bold ${typeFilter === "" ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}
            >
              All
            </button>
            {docTypes.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t === typeFilter ? "" : t)}
                className={`px-3 py-1 rounded text-[11px] font-bold ${typeFilter === t ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}
              >
                {DOC_TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-[var(--fg-muted)] mt-3">
            {loading ? "Loading…" : `${filtered.length} of ${docs.length} documents · indexed across DQ files, medical certs, MVRs, ELDT, D&A results, background checks.`}
          </div>
        </div>

        {!loading && docs.length === 0 ? (
          <div className="x3-card p-8 text-center">
            <div className="text-[16px] font-extrabold text-[var(--fg)] mb-1">No documents yet</div>
            <p className="text-[13px] text-[var(--fg-muted)]">
              Documents appear here as you upload them via the <strong>DQ Files</strong> tracker, run Checkr background checks, pull MVRs, or process D&A tests. Every artifact tagged to a driver is indexed and searchable.
            </p>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="x3-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left px-4 py-2 font-bold">Document</th>
                  <th className="text-left px-4 py-2 font-bold">Driver</th>
                  <th className="text-left px-4 py-2 font-bold">Type</th>
                  <th className="text-left px-4 py-2 font-bold">Uploaded</th>
                  <th className="text-left px-4 py-2 font-bold">Expires</th>
                  <th className="text-right px-4 py-2 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/40">
                    <td className="px-4 py-2.5 text-[var(--fg)]">{d.label || <span className="text-[var(--fg-muted)] italic">(unlabeled)</span>}</td>
                    <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{driverById[d.driver_id] || <span className="text-[var(--fg-muted)] italic">unknown</span>}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[var(--accent)]/15 text-[var(--accent)]">{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)] tabular-nums">{fmtDate(d.created_at)}</td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)] tabular-nums">{fmtDate(d.expires_on)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[var(--accent)] font-bold hover:underline">Open →</a> : <span className="text-[12px] text-[var(--fg-faint)]">no link</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
