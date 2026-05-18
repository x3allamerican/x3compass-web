"use client";
import { useEffect, useState } from "react";

export function Modal({ open, onClose, title, children, footer, width = 720 }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onEsc); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="x3-card overflow-hidden flex flex-col max-h-[85vh]" style={{ width: "100%", maxWidth: width }}>
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="text-[15px] font-extrabold text-[var(--fg)]">{title}</div>
          <button onClick={onClose} aria-label="Close" className="text-[20px] text-[var(--fg-muted)] hover:text-[var(--fg)] leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-end gap-2 bg-[var(--surface-2)]">{footer}</div>}
      </div>
    </div>
  );
}

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl text-[13px] font-bold border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] flex items-center gap-3">
      <span className="text-[var(--success)]">✓</span> {message}
    </div>
  );
}

// ---------- Logs modal ----------
type LogRow = { ts: string; level: "info" | "warn" | "error"; line: string };
function fakeLogsForAgent(name: string): LogRow[] {
  const baseT = Date.now();
  const fmt = (offset: number) => new Date(baseT - offset).toLocaleString("en-US");
  return [
    { ts: fmt(60_000),     level: "info",  line: `[${name}] started — pid=4218 host=cf-worker-iad06 runtime=workers/2026-05-17` },
    { ts: fmt(60_500),     level: "info",  line: `[${name}] auth ok — service_role JWT validated, exp=2027-05-17` },
    { ts: fmt(61_000),     level: "info",  line: `[${name}] selected 28 carriers in scope, 1,000 driver rows, 67 vehicle rows` },
    { ts: fmt(61_400),     level: "info",  line: `[${name}] applied filters — operating_status='ACTIVE', deleted_at IS NULL` },
    { ts: fmt(62_000),     level: "info",  line: `[${name}] processing batch 1/4 (250 rows) ...` },
    { ts: fmt(63_200),     level: "info",  line: `[${name}] processing batch 2/4 (250 rows) ...` },
    { ts: fmt(64_500),     level: "info",  line: `[${name}] processing batch 3/4 (250 rows) ...` },
    { ts: fmt(65_700),     level: "info",  line: `[${name}] processing batch 4/4 (250 rows) ...` },
    { ts: fmt(66_300),     level: "info",  line: `[${name}] commit — 0 new rows, 4 updated, 0 deleted` },
    { ts: fmt(66_400),     level: "info",  line: `[${name}] run summary — duration=6.4s · status=ok` },
    { ts: fmt(360_000),    level: "info",  line: `[${name}] (previous run · 5m ago) duration=6.1s · status=ok` },
    { ts: fmt(660_000),    level: "info",  line: `[${name}] (previous run · 10m ago) duration=6.3s · status=ok` },
    { ts: fmt(960_000),    level: "warn",  line: `[${name}] (previous run · 15m ago) warning — Cloudflare R2 latency 1.4s above p95` },
    { ts: fmt(1_260_000),  level: "info",  line: `[${name}] (previous run · 20m ago) duration=5.9s · status=ok` },
    { ts: fmt(1_560_000),  level: "info",  line: `[${name}] (previous run · 25m ago) duration=6.0s · status=ok` },
  ];
}

export function AgentLogsModal({ open, onClose, agentName }: { open: boolean; onClose: () => void; agentName: string }) {
  const [realRuns, setRealRuns] = useState<Array<{ when: string; status: string; duration: string; summary: string; log?: string }> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !agentName) { setRealRuns(null); return; }
    setLoading(true);
    (async () => {
      try {
        const { getSupabase } = await import("@/lib/supabase");
        let auth: HeadersInit = {};
        try { const tok = (await getSupabase().auth.getSession()).data.session?.access_token; if (tok) auth = { Authorization: `Bearer ${tok}` }; } catch {}
        const r = await fetch(`/api/admin/agents/${encodeURIComponent(agentName)}/logs?limit=50`, { headers: auth });
        if (r.ok) {
          const j = await r.json() as { runs: Array<{ started_at: string; duration_ms: number | null; status: string; summary: string | null; log: string | null }> };
          setRealRuns(j.runs.map((x) => ({ when: new Date(x.started_at).toLocaleString("en-US"), status: x.status, duration: ((x.duration_ms || 0) / 1000).toFixed(1) + "s", summary: x.summary || "(no summary)", log: x.log || undefined })));
        } else { setRealRuns([]); }
      } catch { setRealRuns([]); }
      setLoading(false);
    })();
  }, [open, agentName]);

  const fallback = agentName ? fakeLogsForAgent(agentName) : [];
  const hasReal = realRuns && realRuns.length > 0;
  return (
    <Modal open={open} onClose={onClose} title={`Logs · ${agentName}`} width={900}
      footer={<><button onClick={onClose} className="px-3 py-1.5 rounded-lg font-bold text-[13px] text-[var(--fg)] border border-[var(--border)]">Close</button><a href="#" className="px-3 py-1.5 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Download .log</a></>}
    >
      <div className="p-5 space-y-3">
        <div className="text-[12px] text-[var(--fg-muted)] flex items-center gap-2">{loading ? <>⏳ Loading runs from <code className="font-mono">compass_agent_runs</code> …</> : hasReal ? <><span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[var(--success)]/15 text-[var(--success)]">LIVE</span> Last 50 runs from the database. Click any row to expand the captured log.</> : <><span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#FACC15]/15 text-[#B45309]">SIMULATED</span> No real runs in the DB yet — showing example output. Once the agent has fired, the real logs land here.</>}</div>
        {hasReal ? (
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]"><tr><th className="text-left px-3 py-2 font-bold">Started</th><th className="text-left px-3 py-2 font-bold">Status</th><th className="text-right px-3 py-2 font-bold">Duration</th><th className="text-left px-3 py-2 font-bold">Summary</th></tr></thead>
              <tbody>{realRuns!.map((r, i) => (
                <tr key={i} className="border-t border-[var(--border)] align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-[var(--fg-muted)] tabular-nums">{r.when}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${r.status === "ok" ? "bg-[var(--success)] text-white" : r.status === "error" ? "bg-[var(--danger)] text-white" : r.status === "partial" ? "bg-[var(--warning)] text-white" : "bg-[#94A3B8] text-white"}`}>{r.status.toUpperCase()}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums text-[var(--fg-muted)]">{r.duration}</td>
                  <td className="px-3 py-2 text-[var(--fg)]">{r.summary}{r.log && <details className="mt-1"><summary className="text-[10px] text-[var(--accent)] cursor-pointer">show log →</summary><pre className="text-[10px] font-mono mt-1 p-2 rounded bg-[#0F1C32] text-[#E2E8F0] whitespace-pre-wrap">{r.log}</pre></details>}</td>
                </tr>))}</tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--border)] overflow-hidden bg-[#0F1C32]">
            <pre className="text-[11px] font-mono leading-relaxed p-4 overflow-x-auto max-h-[420px] overflow-y-auto" style={{ color: "#E2E8F0" }}>{fallback.map((l, i) => (<div key={i} className="flex gap-3"><span className="text-[#94A3B8] whitespace-nowrap">{l.ts}</span><span className={l.level === "error" ? "text-[#F87171]" : l.level === "warn" ? "text-[#FBBF24]" : "text-[#86EFAC]"}>{l.level.toUpperCase().padEnd(5)}</span><span className="text-[#E2E8F0]">{l.line}</span></div>))}</pre>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------- Edit modal ----------
const CADENCE_PRESETS = [
  "Every 5 minutes", "Every 10 minutes", "Every 15 minutes", "Every 30 minutes",
  "Every hour", "Every 6 hours", "Every 12 hours",
  "Daily · 3am UTC", "Daily · 6am UTC", "Daily · 9am UTC", "Daily · 11am UTC", "Daily · 12pm UTC", "Daily · 1pm UTC",
  "Weekly · Mon · 9am UTC", "Weekly · Tue · 9am UTC", "Weekly · Mon–Fri · 2pm UTC",
  "Monthly · 1st · 1pm UTC", "Monthly · 1st · 5am UTC", "Monthly · 1st · 6am UTC",
  "Quarterly · 1st of Jan/Apr/Jul/Oct · 2pm UTC",
];

export function AgentEditModal({ open, onClose, agentName, currentCadence, currentEnabled, onSave }: { open: boolean; onClose: () => void; agentName: string; currentCadence: string; currentEnabled: boolean; onSave: (patch: { cadence?: string; enabled?: boolean }) => void }) {
  const [cadence, setCadence] = useState(currentCadence);
  const [enabled, setEnabled] = useState(currentEnabled);
  useEffect(() => { setCadence(currentCadence); setEnabled(currentEnabled); }, [currentCadence, currentEnabled, open]);

  return (
    <Modal open={open} onClose={onClose} title={`Edit · ${agentName}`} width={620}
      footer={<><button onClick={onClose} className="px-3 py-1.5 rounded-lg font-bold text-[13px] text-[var(--fg)] border border-[var(--border)]">Cancel</button><button onClick={() => { onSave({ cadence, enabled }); onClose(); }} className="px-4 py-1.5 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Save changes</button></>}
    >
      <div className="p-5 space-y-5">
        <div>
          <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2">Enabled</div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-5 h-5" />
            <span className="text-[13px] text-[var(--fg)]">{enabled ? "Agent is enabled and will fire on schedule." : "Agent is paused — it will not run automatically."}</span>
          </label>
        </div>
        <div>
          <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2">Cadence</div>
          <select value={cadence} onChange={(e) => setCadence(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px] text-[var(--fg)]">
            <option>{currentCadence}</option>
            {CADENCE_PRESETS.filter((p) => p !== currentCadence).map((p) => <option key={p}>{p}</option>)}
          </select>
          <div className="text-[11px] text-[var(--fg-muted)] mt-2">Cron-compatible string. Saved to the agent config table on next deploy.</div>
        </div>
        <div className="rounded-lg border border-[var(--success)]/40 p-3 bg-[var(--success)]/5 text-[12px] text-[var(--fg-muted)]">
          <strong className="text-[var(--success)]">✓ Live</strong> — saves to <code className="font-mono text-[var(--accent)]">compass_agents</code> via <code className="font-mono text-[var(--accent)]">PATCH /api/admin/agents/{agentName}</code>. The cron dispatcher picks up the new cadence on its next 5-minute tick.
        </div>
      </div>
    </Modal>
  );
}

// ---------- Run Now confirm modal ----------
export function AgentRunNowModal({ open, onClose, agentName, onConfirm }: { open: boolean; onClose: () => void; agentName: string; onConfirm: (mode: "ok" | "skipped" | "error") => void }) {
  return (
    <Modal open={open} onClose={onClose} title={`Run now · ${agentName}`} width={520}
      footer={<><button onClick={onClose} className="px-3 py-1.5 rounded-lg font-bold text-[13px] text-[var(--fg)] border border-[var(--border)]">Cancel</button><button onClick={() => { onConfirm("ok"); onClose(); }} className="px-4 py-1.5 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Run now</button></>}
    >
      <div className="p-5 space-y-3 text-[13px] text-[var(--fg-muted)] leading-relaxed">
        <div>This will fire <code className="font-mono text-[var(--accent)]">{agentName}</code> immediately outside its normal cadence. The run uses the same service-role JWT and writes the result to the activity log.</div>
        <div>You&apos;ll see the run appear at the top of the Activity tab within a few seconds.</div>
        <div className="rounded-lg border border-[var(--success)]/40 p-3 bg-[var(--success)]/5">
          <strong className="text-[var(--success)]">✓ Live</strong> — this fires <code className="font-mono text-[var(--accent)]">POST /api/admin/agents/{agentName}/run</code> with your super-admin JWT. The run lands in <code className="font-mono text-[var(--accent)]">compass_agent_runs</code> and the Activity tab updates within seconds.
        </div>
      </div>
    </Modal>
  );
}
