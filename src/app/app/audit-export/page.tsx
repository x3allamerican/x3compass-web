"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { TenantTable, StatCard, fmtDate } from "@/components/app/TenantTable";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useUser } from "@/lib/useUser";
import { apiFetch } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

type E = {
  id: string;
  exported_on: string;
  scope: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  status: string;
  packet_url: string | null;
  size_bytes: number | null;
};

// Theme-aware uniform-width status pills, same palette family as accidents/inspections
const STATUS_PILL: Record<string, string> = {
  ready:      "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  generating: "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  queued:     "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  failed:     "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  expired:    "bg-slate-100   dark:bg-slate-500/45   text-slate-900   dark:text-slate-50   border-slate-600   dark:border-slate-300/80",
};
function StatusPill({ s }: { s: string }) {
  return (
    <span role="status" aria-label={`Export status: ${s}`} className={`inline-block min-w-[100px] px-3 py-1 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${STATUS_PILL[s] || STATUS_PILL.expired}`}>
      {s}
    </span>
  );
}

const SCOPE_LABEL: Record<string, string> = {
  full: "Full audit",
  dq_files_only: "DQ files only",
  drug_alcohol_only: "D&A only",
  csa_only: "CSA + inspections + accidents",
};

const SCOPE_DEFS: { value: string; label: string; tables: string; use_case: string; cfr: string }[] = [
  { value: "full",              label: "Full audit",                 tables: "All 10 tables · drivers, vehicles, DQ docs, MVRs, training, D&A, accidents, inspections, IFTA, carrier profile.", use_case: "FMCSA Compliance Review, insurance underwriting, M&A due diligence.", cfr: "49 CFR § 385 · §390 · §391 · §382" },
  { value: "dq_files_only",     label: "DQ files only",              tables: "Drivers + all DQ documents (CDL, MVR, medical card, employment app, RFR, PSP, Clearinghouse pre-emp).", use_case: "DQ-file-focused audit (§391.51 compliance check) or new-hire packet review.", cfr: "49 CFR § 391.51" },
  { value: "drug_alcohol_only", label: "Drug & Alcohol only",        tables: "All D&A tests (pre-emp, random, post-accident, reasonable suspicion, return-to-duty, follow-up).", use_case: "Random pool consortium audit or D&A program review.", cfr: "49 CFR Part 382 · Part 40" },
  { value: "csa_only",          label: "CSA + Inspections + Accidents", tables: "Roadside inspections, accidents, CSA snapshots, related BASIC scores.", use_case: "DataQ challenge, post-crash review, or CSA trend analysis.", cfr: "49 CFR § 390.5T · § 396.9" },
];

const SC: Record<string, string> = { queued: "queued", generating: "generating", ready: "ready", failed: "failed", expired: "expired" };

export default function AuditExportPage() {
  const { carrier } = useUser();
  const [rows, setRows] = useState<E[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [quickBusy, setQuickBusy] = useState(false);

  async function refresh() {
    if (!carrier) return;
    const { data } = await getSupabase().from("compass_audit_exports").select("*").eq("carrier_id", carrier.id).order("exported_on", { ascending: false });
    setRows((data as E[]) || []);
    setLoading(false);
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  async function quickFullAudit() {
    if (!carrier || quickBusy) return;
    setQuickBusy(true);
    try {
      const inserted = await getSupabase().from("compass_audit_exports").insert([{ carrier_id: carrier.id, scope: "full", status: "queued" }]).select("id").single();
      if (inserted.error) throw inserted.error;
      apiFetch("/api/audit/build", { method: "POST", body: JSON.stringify({ id: inserted.data!.id }) }).catch(() => {});
      await refresh();
    } catch {
      // silently fall through; user can retry
    } finally {
      setQuickBusy(false);
    }
  }

  const stats = useMemo(() => {
    const ready = rows.filter(r => r.status === "ready");
    const generating = rows.filter(r => r.status === "generating" || r.status === "queued");
    const failed = rows.filter(r => r.status === "failed");
    const totalKB = ready.reduce((s, r) => s + Math.round((r.size_bytes || 0) / 1024), 0);
    return {
      total: rows.length,
      ready: ready.length,
      generating: generating.length,
      failed: failed.length,
      total_size: totalKB > 1024 ? `${(totalKB / 1024).toFixed(1)} MB` : `${totalKB} KB`,
      last: ready.length > 0 ? ready[0].exported_on : null,
    };
  }, [rows]);

  return (
    <AppShell crumbs="AUDIT EXPORT" title="Audit Packet Generator"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={quickFullAudit}
            disabled={!carrier || quickBusy}
            className="px-3 py-2 rounded-lg font-extrabold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)] disabled:opacity-40"
          >
            {quickBusy ? "Queuing…" : "⚡ Quick full audit"}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)]"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            + Custom packet
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total packets"  value={stats.total}      sub={stats.last ? `last ${fmtDate(stats.last)}` : "none yet"} />
          <StatCard label="Ready to download" value={stats.ready}   sub={stats.total_size}                                          accent="#34D399" />
          <StatCard label="In progress"    value={stats.generating} sub={stats.generating > 0 ? "auto-refresh recommended" : "—"}   accent="#22D3EE" />
          <StatCard label="Failed"         value={stats.failed}     sub={stats.failed > 0 ? "retry from the row" : "—"}             accent={stats.failed > 0 ? "#F87171" : "#94A3B8"} />
        </div>

        {/* Two-column: table + Definitions */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-5">
              <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-2">What this does</div>
              <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
                Bundles drivers, DQ documents, MVRs, drug &amp; alcohol test results, training records, accidents, and roadside inspections into a single DOT audit-ready ZIP. Each table is exported as a separate JSON file with a <code className="text-[var(--fg)] bg-[var(--surface-2)] px-1 rounded">manifest.json</code> showing scope, date range, and row counts.
              </p>
            </div>

            <TenantTable<E>
              rows={rows}
              loading={loading}
              emptyTitle="No exports yet"
              emptyDesc='Click "⚡ Quick full audit" above to generate your first packet · covers all data, all dates.'
              columns={[
                { key: "exported_on", label: "Generated", render: (e) => new Date(e.exported_on).toLocaleString() },
                { key: "scope",       label: "Scope",     render: (e) => SCOPE_LABEL[e.scope || "full"] || e.scope || "—" },
                { key: "range",       label: "Date range", hideOnMobile: true, render: (e) => e.date_range_start ? `${fmtDate(e.date_range_start)} → ${fmtDate(e.date_range_end) || "now"}` : "all time" },
                { key: "status",      label: "Status",    render: (e) => <StatusPill s={SC[e.status] || "expired"} /> },
                { key: "size_bytes",  label: "Size",      hideOnMobile: true, render: (e) => e.size_bytes ? `${Math.round(e.size_bytes / 1024)} KB` : <span className="text-[var(--fg-faint)]">—</span> },
                {
                  key: "packet_url",
                  label: "Download",
                  render: (e) => e.packet_url
                    ? <a href={e.packet_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline font-bold">↓ ZIP</a>
                    : e.status === "failed"
                      ? <button onClick={() => apiFetch("/api/audit/build", { method: "POST", body: JSON.stringify({ id: e.id }) }).then(() => refresh())} className="text-rose-500 underline text-[12px] font-bold">retry</button>
                      : <span className="text-[var(--fg-faint)]">pending…</span>,
                },
              ]}
            />
          </div>

          {/* Scope definitions */}
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Scope definitions</div>
              <div className="text-[10px] tracking-[.14em] uppercase font-mono text-[var(--fg-muted)]">When to use each</div>
            </div>
            <div className="space-y-4">
              {SCOPE_DEFS.map(d => (
                <div key={d.value} className="pb-4 border-b border-[var(--border)] last:border-b-0 last:pb-0">
                  <div className="text-[13px] font-extrabold text-[var(--fg)] mb-1">{d.label}</div>
                  <div className="text-[11px] text-[var(--fg-muted)] mb-1.5"><strong className="text-[var(--fg)]">Includes:</strong> {d.tables}</div>
                  <div className="text-[11px] text-[var(--fg-muted)] mb-1.5"><strong className="text-[var(--fg)]">Use for:</strong> {d.use_case}</div>
                  <div className="text-[10px] font-mono text-[var(--fg-faint)]">{d.cfr}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--fg-muted)]">
              <strong className="text-[var(--fg)]">Retention:</strong> packets stored 365 days in R2. Re-generate any time · the source data lives in your Supabase, not the ZIP.
            </div>
          </div>
        </div>
      </div>

      {showAdd && <ExportFormModal carrier_id={carrier!.id} onClose={() => setShowAdd(false)} onSaved={() => { refresh(); setShowAdd(false); }} />}
    </AppShell>
  );
}

function ExportFormModal({ carrier_id, onClose, onSaved }: { carrier_id: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<E>>({ scope: "full" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const inserted = await getSupabase().from("compass_audit_exports").insert([{ ...form, carrier_id, status: "queued" }]).select("id").single();
      if (inserted.error) throw inserted.error;
      apiFetch("/api/audit/build", { method: "POST", body: JSON.stringify({ id: inserted.data!.id }) }).catch(() => {});
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Queue failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Generate custom audit packet" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Scope">
          <select className="x3i" value={form.scope || "full"} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
            {SCOPE_DEFS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="From"><input type="date" className="x3i" value={form.date_range_start || ""} onChange={(e) => setForm({ ...form, date_range_start: e.target.value })} /></Field>
          <Field label="To"><input type="date" className="x3i" value={form.date_range_end || ""} onChange={(e) => setForm({ ...form, date_range_end: e.target.value })} /></Field>
        </div>
        <p className="text-[11px] text-[var(--fg-muted)]">Leaving dates blank = all-time. Packet generation is queued; the row will switch to <strong>ready</strong> when the ZIP is downloadable (typically &lt; 60 seconds).</p>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} submitLabel="Queue export" />
      </form>
    </Modal>
  );
}
