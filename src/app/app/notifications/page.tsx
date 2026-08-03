"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile } from "@/components/X3AdminHero";
import { useUser } from "@/lib/useUser";

type RuleRow   = { event_type: string; name: string; description: string; channels: string[]; recipients: string; lead_time_days: number | null; fcra_category: string | null; explicit: boolean };
type LogRow    = { id: string; event_type: string; severity: string | null; title: string; body: string; channel: "email" | "sms" | "in_app" | "—"; status: "delivered" | "pending" | "failed"; sent_at: string | null; created_at: string; related_driver_id: string | null };
type ChannelBd = { name: string; sent: number; pct: number };

type ApiPayload = {
  ok: boolean;
  demo?: boolean;
  kpis?: { delivered_30d: number; total_30d: number; delivery_rate_pct: number | null; sms_credits: number; sms_credits_resets_on: string; active_rules: number; critical_rules: number };
  channel_breakdown?: ChannelBd[];
  active_rules?: RuleRow[];
  recent_log?: LogRow[];
};

// DEMO_* overlay · keeps the dashboard alive when notification_log is empty.
const DEMO_KPIS = { delivered_30d: 3, total_30d: 3, delivery_rate_pct: 100, sms_credits: 2847, sms_credits_resets_on: new Date().toISOString(), active_rules: 30, critical_rules: 4 };
const DEMO_RULES: RuleRow[] = [
  { event_type: "account_security",    name: "Account Security Event",      description: "Admin login from new location, password change, etc.", channels: ["email"], recipients: "Defaults", lead_time_days: null, fcra_category: null, explicit: false },
  { event_type: "mvr_annual_due",      name: "Annual MVR Due",              description: "Annual MVR review due. No driving-record events in 12 months.", channels: ["email"], recipients: "Defaults", lead_time_days: 0, fcra_category: null, explicit: true },
  { event_type: "bg_check_consider",   name: "BG Check Consider",           description: "Background check returned consider · triggers FCRA adverse-action timeline.", channels: ["email"], recipients: "Defaults", lead_time_days: null, fcra_category: "adverse_action", explicit: true },
  { event_type: "cdl_expires_30d",     name: "CDL Expiring 30 Days",        description: "Plenty of lead time. Email only.", channels: ["email"], recipients: "Defaults", lead_time_days: 30, fcra_category: null, explicit: true },
  { event_type: "cdl_expires_14d",     name: "CDL Expiring 14 Days",        description: "Still email-only escalation.", channels: ["email"], recipients: "Defaults", lead_time_days: 14, fcra_category: null, explicit: true },
  { event_type: "cdl_expires_7d",      name: "CDL Expiring 7 Days",         description: "Email plus driver-portal banner.", channels: ["email"], recipients: "Defaults", lead_time_days: 7, fcra_category: null, explicit: true },
  { event_type: "cdl_expires_1d",      name: "CDL Expiring 1 Day",          description: "Driving illegally if not renewed.", channels: ["email", "sms"], recipients: "Defaults", lead_time_days: 1, fcra_category: null, explicit: true },
  { event_type: "crash_reported",      name: "Crash Reported",              description: "Insurance + DataQ deadlines are tight.", channels: ["email", "sms"], recipients: "Defaults", lead_time_days: 0, fcra_category: null, explicit: true },
  { event_type: "daily_digest",        name: "Daily Compliance Digest",     description: "Daily admin summary of expiring docs etc.", channels: ["email"], recipients: "Defaults", lead_time_days: 0, fcra_category: null, explicit: false },
  { event_type: "driver_invite",       name: "Driver Invite",               description: "Carrier admin invites a new driver. SMS because drivers don't read email.", channels: ["sms"], recipients: "Defaults", lead_time_days: 0, fcra_category: null, explicit: false },
  { event_type: "drug_test_missed",    name: "Drug Test Missed",            description: "Driver missed their drug test. Must call carrier immediately.", channels: ["sms"], recipients: "Defaults", lead_time_days: 0, fcra_category: null, explicit: true },
];
const DEMO_CHANNELS: ChannelBd[] = [
  { name: "email",  sent: 3, pct: 100 },
  { name: "sms",    sent: 0, pct: 0 },
  { name: "in_app", sent: 0, pct: 0 },
  { name: "push",   sent: 0, pct: 0 },
];
const DEMO_LOG: LogRow[] = [];

// Theme-aware pills · readable in light AND dark (no white-on-cyan).
const STATUS_PILL: Record<string, string> = {
  delivered: "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  pending:   "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  failed:    "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
};
const CHANNEL_PILL: Record<string, string> = {
  email:  "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  sms:    "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
  push:   "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  in_app: "bg-slate-100   dark:bg-slate-500/45   text-slate-900   dark:text-slate-50   border-slate-600   dark:border-slate-300/80",
  "—":    "bg-slate-100   dark:bg-slate-500/30   text-slate-900   dark:text-slate-50   border-slate-600   dark:border-slate-300/80",
};
const CHANNEL_LABEL: Record<string, string> = { email: "Email", sms: "SMS", push: "Push", in_app: "In-App", "—": "—" };
const CHANNEL_ICON: Record<string, string> = { email: "✉", sms: "💬", push: "🔔", in_app: "📱" };

function StatusPill({ status }: { status: string }) {
  return (
    <span role="status" aria-label={`Delivery status: ${status}`} className={`inline-block min-w-[90px] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${STATUS_PILL[status] || STATUS_PILL.pending}`}>
      {status}
    </span>
  );
}
function ChannelPill({ channel }: { channel: string }) {
  return (
    <span className={`inline-block min-w-[70px] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${CHANNEL_PILL[channel] || CHANNEL_PILL["—"]}`}>
      {CHANNEL_LABEL[channel] || channel}
    </span>
  );
}

export default function NotificationsPage() {
  const { carrier } = useUser();
  const [api, setApi] = useState<ApiPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function refresh() {
    if (!carrier) return;
    setRefreshing(true);
    try {
      const r = await fetch(`/api/notifications?carrier_id=${carrier.id}`, { cache: "no-store" });
      const body = await r.json() as ApiPayload;
      setApi(body);
    } catch { /* keep previous */ }
    finally { setRefreshing(false); }
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier]);

  const KPIS     = api?.kpis ? { ...DEMO_KPIS, ...api.kpis } : DEMO_KPIS;
  const RULES    = api?.active_rules && api.active_rules.length > 0 ? api.active_rules : DEMO_RULES;
  const CHANNELS = api?.channel_breakdown && api.channel_breakdown.some(c => c.sent > 0) ? api.channel_breakdown : DEMO_CHANNELS;
  const LOG      = api?.recent_log || DEMO_LOG;
  const isDemo   = api?.demo !== false;

  const filteredLog = useMemo(() => LOG.filter(l =>
    (channelFilter === "all" || l.channel === channelFilter) &&
    (statusFilter === "all" || l.status === statusFilter)
  ), [LOG, channelFilter, statusFilter]);

  function exportLog() {
    const headers = ["created_at", "event_type", "title", "channel", "status", "sent_at"];
    const rows = filteredLog.map(l => [l.created_at, l.event_type, l.title, l.channel, l.status, l.sent_at || ""].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `notification_log_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Notifications Center" crumbs="X3 Admin · Email · SMS · Push · In-App">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        <X3AdminHero
          eyebrow="Notification Center"
          title="Email, SMS, and in-app alerts."
          intro="Configurable rules across MEC, MVR, training, and roster events."
          dataSource={{
            items: [
              <span key="n1"><strong className="text-[var(--fg)]">Notifications</strong> live in <code className="font-mono text-[var(--accent)]">notification_log</code> · every email, SMS, push, in-app gets a row with channel, recipient, status, timestamp.</span>,
              <span key="n2"><strong className="text-[var(--fg)]">Email</strong> via Resend (delivery webhooks update status); <strong className="text-[var(--fg)]">SMS</strong> via Twilio (delivery callbacks); <strong className="text-[var(--fg)]">Push &amp; In-App</strong> via our service worker.</span>,
              <span key="n3"><strong className="text-[var(--fg)]">Active rules</strong> = <code className="font-mono text-[var(--accent)]">notification_rules</code> rows merged with <code className="font-mono text-[var(--accent)]">notification_event_defaults</code> · explicit rules win, defaults fill gaps.</span>,
              <span key="n4"><strong className="text-[var(--fg)]">SMS credits</strong> are pre-purchased pool. Each text decrements; auto-top-up at &lt; 500.</span>,
            ],
            footnote: <>Live data via <code className="font-mono text-[var(--accent)]">/api/notifications</code>. Critical alerts always fire regardless of digest mode.</>,
          }}
        />

        {/* 4 KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <X3KPITile label="Delivered · 30 days" value={KPIS.delivered_30d}                                  sub={`of ${KPIS.total_30d} sent`}            tone="navy" />
          <X3KPITile label="Delivery rate"       value={KPIS.delivery_rate_pct != null ? `${KPIS.delivery_rate_pct}%` : "—"} sub="Industry avg 94%"                                                            tone="navy" />
          <X3KPITile label="SMS credits"         value={KPIS.sms_credits.toLocaleString()}                   sub={`Resets ${new Date(KPIS.sms_credits_resets_on).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}`} tone="navy" />
          <X3KPITile label="Active rules"        value={KPIS.active_rules}                                   sub={`${KPIS.critical_rules} critical paths`} tone="navy" />
        </div>

        {/* Refresh + demo */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={refresh} disabled={refreshing} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50">
            {refreshing ? "↻ Refreshing…" : "↻ Refresh"}
          </button>
          {isDemo && (
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
              Demo data · once events start firing you&apos;ll see the real log here
            </span>
          )}
        </div>

        {/* Two-up: Channel breakdown + Active Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Delivery by Channel · last 30 Days</div>
              <div className="text-[10px] tracking-[.14em] uppercase font-mono text-[var(--fg-muted)]">delivered % per channel</div>
            </div>
            <div className="space-y-3">
              {CHANNELS.map(c => (
                <div key={c.name}>
                  <div className="flex justify-between items-center text-[12px] mb-1">
                    <span className="flex items-center gap-2"><ChannelPill channel={c.name} /><span className="text-[var(--fg)] font-semibold">{c.sent} sends</span></span>
                    <span className="text-[var(--fg-muted)] tabular-nums">{c.pct}% delivered</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="x3-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Active Alert Rules</div>
              <div className="text-[11px] text-[var(--fg-muted)]">{RULES.length} rules</div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 540 }}>
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">Rule</th>
                    <th className="text-left px-3 py-2 font-bold">Trigger</th>
                    <th className="text-left px-3 py-2 font-bold">Channels</th>
                    <th className="text-left px-3 py-2 font-bold">Recipients</th>
                  </tr>
                </thead>
                <tbody>
                  {RULES.map(r => (
                    <tr key={r.event_type} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-3 py-2.5 text-[var(--fg)] font-semibold align-top">
                        {r.name}
                        {r.explicit && <span className="ml-1 text-[9px] font-mono text-[var(--accent)] uppercase tracking-wider">custom</span>}
                      </td>
                      <td className="px-3 py-2.5 text-[var(--fg-muted)] align-top">
                        <code className="font-mono text-[10px] text-[var(--fg)]">{r.event_type}</code>
                        {r.description && <div className="text-[11px] mt-0.5">{r.description}</div>}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="flex gap-1 flex-wrap">{r.channels.map(c => <ChannelPill key={c} channel={c} />)}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--fg-muted)] text-[11px] align-top">{r.recipients}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notification Log · the missing third section */}
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Notification Log</div>
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="in_app">In-App</option>
              <option value="push">Push</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
              <option value="all">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={exportLog} disabled={filteredLog.length === 0} className="ml-auto px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-40">Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">When</th>
                  <th className="text-left px-3 py-2 font-bold">Event</th>
                  <th className="text-left px-3 py-2 font-bold">Title</th>
                  <th className="text-left px-3 py-2 font-bold">Channel</th>
                  <th className="text-left px-3 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--fg-muted)] text-[12px]">
                    {LOG.length === 0 ? "No notifications yet. They'll appear here as events fire." : "No log entries match these filters."}
                  </td></tr>
                ) : filteredLog.map(l => (
                  <tr key={l.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-3 py-2.5 text-[var(--fg-muted)] whitespace-nowrap tabular-nums">{new Date(l.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                    <td className="px-3 py-2.5"><code className="font-mono text-[10px] text-[var(--fg)]">{l.event_type}</code></td>
                    <td className="px-3 py-2.5 text-[var(--fg)] font-semibold">{l.title}</td>
                    <td className="px-3 py-2.5"><ChannelPill channel={l.channel} /></td>
                    <td className="px-3 py-2.5"><StatusPill status={l.status} /></td>
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
