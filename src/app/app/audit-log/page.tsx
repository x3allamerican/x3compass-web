"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile } from "@/components/X3AdminHero";
import { useUser } from "@/lib/useUser";

type LogRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_id_short: string | null;
  details: string;
  ip_address: string | null;
};

type ApiPayload = {
  ok: boolean;
  demo?: boolean;
  rows?: LogRow[];
  stats?: { total: number; by_action: Record<string, number>; by_entity: Record<string, number> };
  distinct_actors?: { user_id: string; email: string | null }[];
  distinct_entities?: string[];
};

// DEMO overlay — preserves UX before audit_log has rows for this carrier
const DEMO_ROWS: LogRow[] = [
  { id: "d1", created_at: "2026-05-19T15:00:59Z", user_id: "u1", actor_email: "joshua@x3compass.com", action: "CREATE",      entity_type: "csa_snapshot",      entity_id: "dbc78820-abcd-1234-5678-9abcdef01234", entity_id_short: "dbc78820…", details: '"source":"manual","measurement_date":"2026-04-21"', ip_address: null },
  { id: "d2", created_at: "2026-05-19T14:48:08Z", user_id: "u1", actor_email: "joshua@x3compass.com", action: "UPDATE",      entity_type: "carrier",           entity_id: "19837b87-abcd-1234-5678-9abcdef01234", entity_id_short: "19837b87…", details: '"changed_fields":[legal_name,dba,dot_number,…]',     ip_address: null },
  { id: "d3", created_at: "2026-05-19T14:00:00Z", user_id: null, actor_email: null,                   action: "NOTIFY",      entity_type: "compliance_digest", entity_id: null,                                  entity_id_short: null,        details: '"items":3,"subject":"[X3] 3 compliance items due in n…"',ip_address: null },
  { id: "d4", created_at: "2026-05-19T13:53:36Z", user_id: "u1", actor_email: "joshua@x3compass.com", action: "UPDATE",      entity_type: "training_record",   entity_id: "6e761048-abcd-1234-5678-9abcdef01234", entity_id_short: "6e761048…", details: '"status":"completed","training_type":"supervisor_da_t…"',ip_address: null },
  { id: "d5", created_at: "2026-05-19T13:42:49Z", user_id: "u1", actor_email: "joshua@x3compass.com", action: "BULK_IMPORT", entity_type: "driver",            entity_id: null,                                  entity_id_short: null,        details: '"skipped":0,"imported":10',                              ip_address: null },
  { id: "d6", created_at: "2026-05-19T13:17:43Z", user_id: "u1", actor_email: "joshua@x3compass.com", action: "CREATE",      entity_type: "drug_alcohol_test", entity_id: "70b10f4f-abcd-1234-5678-9abcdef01234", entity_id_short: "70b10f4f…", details: '"result":"dilute_negative","substance":"drug","test_ty…"', ip_address: null },
  { id: "d7", created_at: "2026-05-19T07:26:05Z", user_id: "u1", actor_email: "joshua@x3compass.com", action: "CREATE",      entity_type: "membership",        entity_id: "198ca956-abcd-1234-5678-9abcdef01234", entity_id_short: "198ca956…", details: '"role":"safety_manager","invited_email":"…"',             ip_address: null },
  { id: "d8", created_at: "2026-05-19T06:45:15Z", user_id: "u1", actor_email: "joshua@x3compass.com", action: "DELETE",      entity_type: "dq_document",       entity_id: "749dcbf2-abcd-1234-5678-9abcdef01234", entity_id_short: "749dcbf2…", details: '"doc_type":"national_registry_verification"',              ip_address: null },
];

// Theme-aware action pills — readable in light + dark, matching accidents/inspections/prospects palette
const ACTION_PILL: Record<string, string> = {
  CREATE:      "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  UPDATE:      "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  DELETE:      "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  NOTIFY:      "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  BULK_IMPORT: "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
  UNKNOWN:     "bg-slate-100   dark:bg-slate-500/30   text-slate-900   dark:text-slate-50   border-slate-600   dark:border-slate-300/80",
};
function ActionPill({ action }: { action: string }) {
  const cls = ACTION_PILL[action] || ACTION_PILL.UNKNOWN;
  return <span role="status" aria-label={`Action: ${action}`} className={`inline-block min-w-[110px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${cls}`}>{action}</span>;
}

export default function AuditLogPage() {
  const { carrier } = useUser();
  const [api, setApi] = useState<ApiPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [sinceFilter, setSinceFilter] = useState<string>("");

  async function refresh() {
    if (!carrier) return;
    setRefreshing(true);
    try {
      const params = new URLSearchParams({ carrier_id: carrier.id, limit: "500" });
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (entityFilter !== "all") params.set("entity", entityFilter);
      if (actorFilter !== "all")  params.set("actor", actorFilter);
      if (sinceFilter)            params.set("since", new Date(sinceFilter).toISOString());
      const r = await fetch(`/api/audit-log?${params.toString()}`, { cache: "no-store" });
      const body = await r.json() as ApiPayload;
      setApi(body);
    } catch { /* keep previous */ }
    finally { setRefreshing(false); }
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier, actionFilter, entityFilter, actorFilter, sinceFilter]);

  const ROWS = api?.rows && api.rows.length > 0 ? api.rows : DEMO_ROWS;
  const STATS = api?.stats || { total: DEMO_ROWS.length, by_action: { CREATE: 4, UPDATE: 2, DELETE: 1, NOTIFY: 1, BULK_IMPORT: 1 }, by_entity: {} };
  const ENTITIES = api?.distinct_entities || ["carrier", "driver", "vehicle", "dq_document", "training_record", "drug_alcohol_test", "membership", "compliance_digest", "csa_snapshot"];
  const ACTORS   = api?.distinct_actors   || [];
  const isDemo = api?.demo !== false;

  // Client-side search refinement (in addition to server filters)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ROWS;
    return ROWS.filter(r =>
      r.entity_type.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      (r.actor_email || "").toLowerCase().includes(q) ||
      (r.entity_id || "").toLowerCase().includes(q) ||
      r.details.toLowerCase().includes(q)
    );
  }, [ROWS, search]);

  function exportCsv() {
    const headers = ["timestamp", "action", "entity_type", "entity_id", "actor_email", "user_id", "details", "ip_address"];
    const rows = filtered.map(r => [r.created_at, r.action, r.entity_type, r.entity_id || "", r.actor_email || "", r.user_id || "", r.details, r.ip_address || ""].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Audit Log" crumbs="Immutable change log · § 390.5T">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        <X3AdminHero
          eyebrow="Audit Log"
          title="Every change. Every actor. Every timestamp."
          intro={<>Immutable record of state changes across the entire X3 Compass platform — human edits, agent actions, system events. <strong className="text-white">Append-only</strong>, retained 7 years per FMCSA audit-defense requirements (§ 390.5T). Exportable as CSV or JSON for any FMCSA, SOC 2, or insurance audit.</>}
          dataSource={{
            items: [
              <span key="a1"><strong className="text-[var(--fg)]">Source</strong> — every CRUD on driver, vehicle, DQ document, medical, MVR, D&amp;A, training, incident, inspection, carrier, membership, and digest writes one row to <code className="font-mono text-[var(--accent)]">compass_audit_log</code>.</span>,
              <span key="a2"><strong className="text-[var(--fg)]">Append-only</strong> — there is no UPDATE or DELETE endpoint. Even super-admins cannot mutate history. RLS denies non-owner/admin reads.</span>,
              <span key="a3"><strong className="text-[var(--fg)]">Retention</strong> — 7 years (longer than the 3-year FMCSA window) so insurance + SOC 2 audits also stay covered.</span>,
              <span key="a4"><strong className="text-[var(--fg)]">Exports</strong> are tenant-scoped JSON/CSV. The Audit Export page (/app/audit-export) bundles this with all other compass_* tables into one ZIP for offline review.</span>,
            ],
          }}
        />

        {/* KPI strip — counts by action */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <X3KPITile label="Total events"  value={STATS.total}                       sub={isDemo ? "demo" : "real-time"}      tone="navy" />
          <X3KPITile label="Creates"       value={STATS.by_action.CREATE || 0}       sub="new records"                        tone="green" />
          <X3KPITile label="Updates"       value={STATS.by_action.UPDATE || 0}       sub="state changes"                      tone="navy" />
          <X3KPITile label="Deletes"       value={STATS.by_action.DELETE || 0}       sub="removals"                           tone="red" />
          <X3KPITile label="Notifies"      value={STATS.by_action.NOTIFY || 0}       sub="emails/SMS sent"                    tone="navy" />
          <X3KPITile label="Bulk imports"  value={STATS.by_action.BULK_IMPORT || 0}  sub="batch operations"                   tone="navy" />
        </div>

        {/* Filter bar */}
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2 flex-wrap bg-[var(--surface-3)]">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔎 Search action, entity, actor email, details…" className="flex-1 min-w-[260px] px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px] focus:outline-none focus:border-[var(--accent)]" />
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
              <option value="all">All actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="NOTIFY">Notify</option>
              <option value="BULK_IMPORT">Bulk import</option>
            </select>
            <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
              <option value="all">All entities</option>
              {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
              <option value="all">All actors</option>
              {ACTORS.map(a => <option key={a.user_id} value={a.user_id}>{a.email || a.user_id.slice(0, 8) + "…"}</option>)}
            </select>
            <input type="date" value={sinceFilter} onChange={(e) => setSinceFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]" title="Show events since…" />
            <button onClick={refresh} disabled={refreshing} className="px-2.5 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50">{refreshing ? "↻" : "↻ Refresh"}</button>
            <span className="text-[11px] text-[var(--fg-muted)] ml-auto">
              {filtered.length} of {STATS.total} {filtered.length !== STATS.total ? "(filtered)" : ""}
            </span>
            <button onClick={exportCsv} disabled={filtered.length === 0} className="px-2.5 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-40">↓ CSV</button>
            <button onClick={exportJson} disabled={filtered.length === 0} className="px-2.5 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-40">↓ JSON</button>
          </div>

          {isDemo && (
            <div className="px-5 py-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 border-b border-amber-500/40">
              Demo data · live audit events appear here in real-time as users + agents act in the app
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left px-4 py-2 font-bold whitespace-nowrap">Timestamp</th>
                  <th className="text-left px-4 py-2 font-bold">Actor</th>
                  <th className="text-left px-4 py-2 font-bold">Action</th>
                  <th className="text-left px-4 py-2 font-bold">Entity</th>
                  <th className="text-left px-4 py-2 font-bold">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--fg-muted)]">
                    <div className="text-2xl mb-2">🧾</div>
                    <div className="font-bold text-[var(--fg)] mb-1">No audit entries match</div>
                    <div className="text-[11px]">Every change made to drivers, vehicles, or compliance records will show up here in real time.</div>
                  </td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.actor_email
                        ? <div><div className="text-[var(--fg)] font-semibold">{r.actor_email.split("@")[0]}</div><div className="text-[10px] text-[var(--fg-faint)] font-mono">{r.actor_email}</div></div>
                        : <div className="text-[var(--fg-muted)] italic">system</div>}
                    </td>
                    <td className="px-4 py-2.5"><ActionPill action={r.action} /></td>
                    <td className="px-4 py-2.5">
                      <div className="text-[var(--fg)] font-semibold">{r.entity_type.replace(/_/g, " ")}</div>
                      {r.entity_id_short && <div className="text-[10px] text-[var(--fg-faint)] font-mono" title={r.entity_id || ""}>{r.entity_id_short}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)] font-mono text-[11px] max-w-[420px] truncate" title={r.details}>{r.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
