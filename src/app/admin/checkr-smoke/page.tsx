"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useIsSuperAdmin } from "@/lib/superAdmin";
import { getSupabase } from "@/lib/supabase";
import { SkeletonShell } from "@/components/Skeleton";

type Order = {
  id: string; status: string; vendor_ref_id: string | null;
  checkr_candidate_id: string | null; report_id: string | null;
  invitation_url: string | null;
  checkr_result: string | null; checkr_assessment: string | null;
  effective_status: string | null;
  ordered_at: string | null; completed_at: string | null; last_event_at: string | null;
  adverse_action_at: string | null; canceled_at: string | null;
  package: string | null; work_state: string | null;
};
type Event = {
  id: string; event_id: string; event_type: string;
  signature_verified: boolean; received_at: string; processed_at: string | null; error: string | null;
};
type Step = {
  step: string; fired: boolean;
  event_id: string | null; received_at: string | null;
  signature_verified: boolean | null; processed_at: string | null;
};
type Health = {
  events_received: number;
  lifecycle_steps_fired: number;
  lifecycle_steps_expected: number;
  signature_failures: number;
  unprocessed_events: number;
  order_status: string;
  terminal: boolean;
};
type ApiResp = {
  ok: boolean; order: Order | null; events: Event[];
  timeline: Step[]; lifecycle: readonly string[];
  health?: Health; message?: string;
};

const STAGE_ICON: Record<string, string> = {
  "invitation.created":   "✉️",
  "invitation.completed": "👤",
  "report.created":       "📋",
  "report.updated":       "🔄",
  "report.completed":     "✅",
};
const STAGE_LABEL: Record<string, string> = {
  "invitation.created":   "Invitation sent",
  "invitation.completed": "Candidate accepted",
  "report.created":       "Report opened by Checkr",
  "report.updated":       "Report progressed",
  "report.completed":     "Report finalized",
};

const STATUS_PILL: Record<string, string> = {
  invited:        "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  in_progress:    "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  completed:      "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  failed:         "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  canceled:       "bg-slate-100   dark:bg-slate-500/45   text-slate-900   dark:text-slate-50   border-slate-600   dark:border-slate-300/80",
  awaiting_driver:"bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
};
function StatusPill({ status }: { status: string }) {
  const cls = STATUS_PILL[status] || STATUS_PILL.canceled;
  return <span role="status" aria-label={`Order status: ${status}`} className={`inline-block min-w-[120px] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${cls}`}>{status.replace("_", " ")}</span>;
}

function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function CheckrSmokePage() {
  const isSuperAdmin = useIsSuperAdmin();
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollOn, setPollOn] = useState(true);
  const [filter, setFilter] = useState<{ orderId?: string; candidateId?: string }>({});

  async function fetchOnce() {
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      const params = new URLSearchParams();
      if (filter.orderId) params.set("order_id", filter.orderId);
      if (filter.candidateId) params.set("candidate_id", filter.candidateId);
      const r = await fetch(`/api/admin/checkr/smoke?${params.toString()}`, {
        cache: "no-store",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const body = await r.json() as ApiResp;
      setData(body);
    } catch (e) {
      console.error("[smoke-poll]", e);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchOnce();
    if (!pollOn) return;
    const iv = setInterval(fetchOnce, 2000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, pollOn, filter.orderId, filter.candidateId]);

  if (!isSuperAdmin) {
    return (
      <AppShell title="Checkr smoke test">
        <div className="p-10 max-w-md mx-auto text-center bg-[var(--bg)] min-h-screen">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold mb-2 text-[var(--fg)]">Restricted</h1>
          <p className="text-[var(--fg-muted)] mb-4">Super-admin only.</p>
          <Link href="/app" className="text-[var(--accent)] hover:underline font-bold">← Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  if (loading && !data) {
    return <AppShell title="Checkr smoke test"><div className="p-6"><SkeletonShell kpis={4} rows={5} /></div></AppShell>;
  }

  const o = data?.order;
  const h = data?.health;
  const events = data?.events || [];
  const timeline = data?.timeline || [];

  return (
    <AppShell title="Checkr smoke test" crumbs="X3 Admin · Live webhook round-trip">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        <div className="x3-card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div>
              <h1 className="text-[20px] font-extrabold text-[var(--fg)]">Checkr round-trip smoke test</h1>
              <p className="text-[12px] text-[var(--fg-muted)] mt-1">Polls every 2 seconds. Watch a candidate progress through invitation → report.completed in real time.</p>
            </div>
            <button onClick={() => setPollOn(p => !p)} className={`px-3 py-1.5 rounded-lg font-bold text-[12px] border ${pollOn ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" : "bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--border)]"}`}>
              {pollOn ? "🟢 Live polling" : "⏸ Paused"}
            </button>
          </div>
          <div className="flex gap-2 items-center flex-wrap mt-3">
            <input type="text" placeholder="Order UUID (optional)" value={filter.orderId || ""} onChange={e => setFilter(f => ({ ...f, orderId: e.target.value || undefined, candidateId: undefined }))} className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px] font-mono min-w-[280px]" />
            <span className="text-[10px] text-[var(--fg-muted)]">or</span>
            <input type="text" placeholder="Checkr candidate ID" value={filter.candidateId || ""} onChange={e => setFilter(f => ({ ...f, candidateId: e.target.value || undefined, orderId: undefined }))} className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px] font-mono min-w-[220px]" />
            {(filter.orderId || filter.candidateId) && <button onClick={() => setFilter({})} className="text-[11px] text-[var(--accent)] font-bold underline">Reset to latest</button>}
          </div>
        </div>

        {!o ? (
          <div className="x3-card p-12 text-center">
            <div className="text-4xl mb-2">🤷</div>
            <div className="font-bold text-[var(--fg)] mb-1">No matching Checkr order yet.</div>
            <div className="text-[12px] text-[var(--fg-muted)]">{data?.message || "Submit an invitation from /app/background-checks to start a flow."}</div>
            <div className="mt-4">
              <Link href="/app/background-checks" className="text-[var(--accent)] hover:underline font-bold text-[13px]">→ Send an invitation</Link>
            </div>
          </div>
        ) : (
          <>
            {/* Health KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card label="Order status" value={<StatusPill status={o.status} />} sub={`Last event ${relTime(o.last_event_at)}`} />
              <Card label="Lifecycle progress" value={`${h?.lifecycle_steps_fired}/${h?.lifecycle_steps_expected}`} sub={`${h?.events_received} events received`} tone="cyan" />
              <Card label="Signature failures" value={String(h?.signature_failures ?? 0)} sub={h?.signature_failures === 0 ? "All HMAC ✓" : "🚨 investigate"} tone={h?.signature_failures === 0 ? "emerald" : "rose"} />
              <Card label="Unprocessed" value={String(h?.unprocessed_events ?? 0)} sub={h?.terminal ? "Terminal state" : "still progressing"} tone={h?.unprocessed_events === 0 ? "emerald" : "amber"} />
            </div>

            {/* Lifecycle timeline */}
            <div className="x3-card p-5">
              <h2 className="text-[15px] font-extrabold text-[var(--fg)] mb-4">📊 Webhook lifecycle</h2>
              <div className="space-y-3">
                {timeline.map((step) => {
                  const icon = STAGE_ICON[step.step] || "•";
                  const label = STAGE_LABEL[step.step] || step.step;
                  return (
                    <div key={step.step} className={`flex items-center gap-3 p-3 rounded-lg border ${step.fired ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30" : "bg-[var(--surface-2)] border-[var(--border)] opacity-70"}`}>
                      <div className="text-2xl w-10 text-center">{step.fired ? icon : "⏳"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-extrabold text-[var(--fg)]">{label}</div>
                        <div className="text-[11px] text-[var(--fg-muted)] font-mono">{step.step}</div>
                      </div>
                      <div className="text-right">
                        {step.fired ? (
                          <>
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">✓ {relTime(step.received_at)}</div>
                            <div className="text-[10px] text-[var(--fg-faint)] font-mono">{step.event_id?.slice(0, 12)}…</div>
                            {step.signature_verified ? <div className="text-[10px] text-emerald-700 dark:text-emerald-300">HMAC ✓</div> : <div className="text-[10px] text-rose-700 dark:text-rose-300">HMAC ✗</div>}
                          </>
                        ) : (
                          <div className="text-[11px] text-[var(--fg-muted)]">awaiting</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order detail */}
            <div className="x3-card p-5">
              <h2 className="text-[15px] font-extrabold text-[var(--fg)] mb-3">🗃 Order state in vendor_orders</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                <Field label="Order ID"             value={<code className="font-mono text-[10px] text-[var(--accent)]">{o.id}</code>} />
                <Field label="Status"               value={<StatusPill status={o.status} />} />
                <Field label="Candidate ID"         value={<code className="font-mono text-[10px] text-[var(--fg)]">{o.checkr_candidate_id || "—"}</code>} />
                <Field label="Report ID"            value={<code className="font-mono text-[10px] text-[var(--fg)]">{o.report_id || "—"}</code>} />
                <Field label="Package"              value={o.package || "—"} />
                <Field label="Work state"           value={o.work_state || "—"} />
                <Field label="Ordered at"           value={o.ordered_at ? new Date(o.ordered_at).toLocaleString() : "—"} />
                <Field label="Completed at"         value={o.completed_at ? new Date(o.completed_at).toLocaleString() : "—"} />
                <Field label="Checkr result"        value={o.checkr_result ? <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{o.checkr_result.toUpperCase()}</span> : "—"} />
                <Field label="Checkr assessment"    value={o.checkr_assessment ? <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{o.checkr_assessment.toUpperCase()}</span> : "—"} />
                <Field label="Effective status"     value={o.effective_status || "—"} />
                <Field label="Adverse action at"    value={o.adverse_action_at ? <span className="text-rose-700 dark:text-rose-300">{new Date(o.adverse_action_at).toLocaleString()}</span> : "—"} />
                {o.invitation_url && <Field label="Invitation URL" className="sm:col-span-2" value={<a href={o.invitation_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline text-[11px] break-all">{o.invitation_url}</a>} />}
              </dl>
            </div>

            {/* Raw event stream */}
            <div className="x3-card overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border)]">
                <h2 className="text-[15px] font-extrabold text-[var(--fg)]">📜 Raw event stream ({events.length})</h2>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">From vendor_webhook_events · oldest first</div>
              </div>
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold whitespace-nowrap">Received</th>
                    <th className="text-left px-3 py-2 font-bold">Type</th>
                    <th className="text-left px-3 py-2 font-bold">Event ID</th>
                    <th className="text-left px-3 py-2 font-bold">HMAC</th>
                    <th className="text-left px-3 py-2 font-bold">Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-[var(--fg-muted)]">No events linked to this order yet.</td></tr>
                  ) : events.map(e => (
                    <tr key={e.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{new Date(e.received_at).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}</td>
                      <td className="px-3 py-2"><code className="font-mono text-[10px] text-[var(--fg)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{e.event_type}</code></td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[var(--fg-faint)]">{e.event_id.slice(0, 18)}…</td>
                      <td className="px-3 py-2">{e.signature_verified ? <span className="text-emerald-700 dark:text-emerald-300 font-bold">✓</span> : <span className="text-rose-700 dark:text-rose-300 font-bold">✗</span>}</td>
                      <td className="px-3 py-2 text-[var(--fg-muted)] tabular-nums">{e.processed_at ? relTime(e.processed_at) : "pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="x3-card p-4 text-[11px] text-[var(--fg-muted)]">
              <strong className="text-[var(--fg)]">How to test:</strong> Go to <Link href="/app/background-checks" className="text-[var(--accent)] hover:underline">/app/background-checks</Link> → submit a new invitation (use Checkr staging test data) → return here. The Checkr Apply flow will emit invitation.created instantly; the candidate has to walk through consent + form before invitation.completed fires; report.created fires when Checkr opens the file; report.completed when results are ready (usually 30-60s in staging).
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Card({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: "emerald" | "amber" | "rose" | "cyan" }) {
  const toneCls: Record<string, string> = {
    emerald: "text-emerald-700 dark:text-emerald-300",
    amber:   "text-amber-700   dark:text-amber-300",
    rose:    "text-rose-700    dark:text-rose-300",
    cyan:    "text-cyan-700    dark:text-cyan-300",
  };
  return (
    <div className="x3-card p-4">
      <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-extrabold mb-2">{label}</div>
      <div className={`text-[24px] font-black ${tone ? toneCls[tone] : "text-[var(--fg)]"}`}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--fg-muted)] mt-1">{sub}</div>}
    </div>
  );
}
function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className || ""}>
      <dt className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold">{label}</dt>
      <dd className="text-[var(--fg)] mt-0.5">{value}</dd>
    </div>
  );
}
