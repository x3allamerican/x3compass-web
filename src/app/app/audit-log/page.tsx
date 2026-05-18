"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero } from "@/components/X3AdminHero";

type LogEvent = { ts: string; actor: string; actor_email?: string; action: "CREATE" | "UPDATE" | "DELETE" | "NOTIFY" | "BULK_IMPORT"; entity: string; entity_id: string; details: string };

const EVENTS: LogEvent[] = [
  { ts: "4/21/2026 4:00:59 PM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "CREATE",      entity: "csa snapshot",         entity_id: "dbc78820...", details: '"source":"manual","measurement_date":"2026-04-21"' },
  { ts: "4/21/2026 3:48:08 PM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "UPDATE",      entity: "carrier",              entity_id: "19837b87...", details: '"changed_fields":["legal_name","dba","dot_number",...]' },
  { ts: "4/21/2026 9:53:36 AM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "UPDATE",      entity: "training record",      entity_id: "6e761048...", details: '"status":"completed","training_type":"supervisor_da_t..."' },
  { ts: "4/21/2026 9:52:17 AM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "UPDATE",      entity: "training record",      entity_id: "6e761048...", details: '"status":"completed","training_type":"eldt_theory","co..."' },
  { ts: "4/21/2026 9:51:02 AM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "CREATE",      entity: "training record",      entity_id: "6e761048...", details: '"status":"completed","training_type":"supervisor_da_t..."' },
  { ts: "4/21/2026 9:42:49 AM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "NOTIFY",      entity: "compliance digest",    entity_id: "",            details: '"items":3,"subject":"[X3] 3 compliance items due in n..."' },
  { ts: "4/21/2026 9:17:43 AM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "CREATE",      entity: "drug alcohol test",    entity_id: "70b10f4f...", details: '"result":"dilute_negative","substance":"drug","test_ty..."' },
  { ts: "4/21/2026 9:16:25 AM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "CREATE",      entity: "drug alcohol test",    entity_id: "9e2ffaec...", details: '"result":"negative","substance":"alcohol","test_type":"..."' },
  { ts: "4/21/2026 9:06:41 AM",  actor: "system",                                                  action: "NOTIFY",      entity: "compliance digest",    entity_id: "",            details: '"items":3,"subject":"[X3] 3 compliance items due in n..."' },
  { ts: "4/21/2026 8:03:53 AM",  actor: "system",                                                  action: "NOTIFY",      entity: "compliance digest",    entity_id: "",            details: '"items":3,"subject":"[X3] 3 compliance items due in n..."' },
  { ts: "4/21/2026 7:26:05 AM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "CREATE",      entity: "membership",           entity_id: "198ca956...", details: '"role":"safety_manager","invited_email":"joshuakovari..."' },
  { ts: "4/21/2026 7:06:59 AM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "CREATE",      entity: "vehicle",              entity_id: "9557189a...", details: '"vin":"1FMCU9GD4KUA98990","unit_number":"T-101"...' },
  { ts: "4/20/2026 8:56:54 PM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "UPDATE",      entity: "dq document",          entity_id: "749dcbf2...", details: '"doc_type":"national_registry_verification"' },
  { ts: "4/20/2026 8:47:30 PM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "UPDATE",      entity: "dq document",          entity_id: "253bb46b...", details: '"doc_type":"medical_examiner_cert"' },
  { ts: "4/20/2026 8:33:46 PM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "UPDATE",      entity: "dq document",          entity_id: "65470784...", details: '"doc_type":"medical_examiner_cert"' },
  { ts: "4/20/2026 6:45:15 PM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "BULK_IMPORT", entity: "driver",               entity_id: "",            details: '"skipped":0,"imported":1' },
  { ts: "4/20/2026 6:36:25 PM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "CREATE",      entity: "driver",               entity_id: "208d702b...", details: '"last_name":"Lincoln","cdl_number":"12345","first_na..."' },
  { ts: "4/20/2026 6:26:08 PM",  actor: "Joshua Kovarik", actor_email: "joshua@x3compass.com",     action: "CREATE",      entity: "carrier",              entity_id: "19837b87...", details: '"dot_number":null,"legal_name":"X3 Fleet Safety"' },
];

const ACTION_COLOR: Record<LogEvent["action"], string> = {
  CREATE:      "bg-[var(--success)] text-white",
  UPDATE:      "bg-[var(--accent)] text-white",
  DELETE:      "bg-[var(--danger)] text-white",
  NOTIFY:      "bg-[var(--warning)] text-white",
  BULK_IMPORT: "bg-[#A78BFA] text-white",
};

export default function AuditLogPage() {
  const [actor, setActor] = useState("all");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const filtered = EVENTS.filter((e) => (actor === "all" || (e.actor === actor || e.actor_email === actor)) && (action === "all" || e.action === action) && (entity === "all" || e.entity === entity));

  return (
    <AppShell title="Audit Log" crumbs="X3 Admin · Immutable change log">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <X3AdminHero
          eyebrow="Audit Log"
          title="Every change. Every actor. Every timestamp."
          intro="Immutable record of state changes across the entire X3 Compass platform — human edits, agent actions, system events. Retained 7 years. Exportable as CSV or JSON for any FMCSA, SOC 2, or insurance audit."
        />
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
            <label className="text-[11px] font-bold text-[var(--fg-muted)] tracking-[.12em] uppercase">Actor</label>
            <select value={actor} onChange={(e) => setActor(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option value="all">All actors</option><option value="Joshua Kovarik">Joshua Kovarik</option><option value="system">system</option></select>
            <label className="text-[11px] font-bold text-[var(--fg-muted)] tracking-[.12em] uppercase">Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option value="all">All actions</option><option>CREATE</option><option>UPDATE</option><option>DELETE</option><option>NOTIFY</option><option>BULK_IMPORT</option></select>
            <label className="text-[11px] font-bold text-[var(--fg-muted)] tracking-[.12em] uppercase">Entity</label>
            <select value={entity} onChange={(e) => setEntity(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option value="all">All entities</option><option>carrier</option><option>driver</option><option>vehicle</option><option>training record</option><option>dq document</option><option>drug alcohol test</option><option>csa snapshot</option><option>membership</option><option>compliance digest</option></select>
            <span className="text-[11px] text-[var(--fg-muted)] ml-auto">{filtered.length} of {EVENTS.length}</span>
            <button className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↓ Export CSV</button>
            <button className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↓ Export JSON</button>
          </div>
          <table className="w-full text-[12px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-4 py-2 font-bold">Timestamp</th><th className="text-left px-4 py-2 font-bold">Actor</th><th className="text-left px-4 py-2 font-bold">Action</th><th className="text-left px-4 py-2 font-bold">Entity</th><th className="text-left px-4 py-2 font-bold">Details</th></tr>
            </thead>
            <tbody>{filtered.map((e, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{e.ts}</td>
                <td className="px-4 py-2.5"><div className="text-[var(--fg)] font-semibold">{e.actor}</div>{e.actor_email && <div className="text-[10px] text-[var(--fg-faint)]">{e.actor_email}</div>}</td>
                <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${ACTION_COLOR[e.action]}`}>{e.action}</span></td>
                <td className="px-4 py-2.5"><div className="text-[var(--fg)] font-semibold">{e.entity}</div><div className="text-[10px] text-[var(--fg-faint)] font-mono">{e.entity_id}</div></td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)] font-mono text-[11px]">{e.details}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
