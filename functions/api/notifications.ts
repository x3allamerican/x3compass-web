/**
 * GET /api/notifications?carrier_id=<uuid>
 *
 * Per-carrier notifications rollup:
 *   - kpis (delivered 30d, delivery rate, sms credits, active rules)
 *   - channel_breakdown (sms/email/push/in-app counts + delivery pct)
 *   - active_rules (from notification_rules + event-defaults overlay)
 *   - recent_log (last 100 notification_log rows for the carrier)
 *
 * Schema notes (from information_schema):
 *   notification_log: channels_attempted text[], email_sent_at, sms_sent_at, in_app_dismissed_at
 *     — "delivered" is approximated by any of (*_sent_at IS NOT NULL).
 *   notification_rules: event_type, lead_time_days, channels text[], recipients text[], is_active
 *   notification_event_defaults: event_type, default_channel, fcra_category, description
 */

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  Prefer: "count=exact",
});
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=30", "Access-Control-Allow-Origin": "*" } });

async function pgSelect(url: string, sr: string, table: string, query: string): Promise<unknown[]> {
  try {
    const r = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: SUPABASE_HEADERS(sr) });
    if (!r.ok) return [];
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

type LogRow = { id: string; event_type: string; severity: string | null; title: string | null; body: string | null; channels_attempted: string[] | null; email_sent_at: string | null; sms_sent_at: string | null; in_app_dismissed_at: string | null; created_at: string; related_driver_id: string | null };
type RuleRow = { id: string; event_type: string; lead_time_days: number | null; channels: string[] | null; recipients: string[] | null; is_active: boolean };
type DefaultRow = { event_type: string; default_channel: string; description: string | null; fcra_category: string | null };

function deriveStatus(r: LogRow): "delivered" | "pending" | "failed" {
  if (r.email_sent_at || r.sms_sent_at) return "delivered";
  if (r.in_app_dismissed_at) return "delivered";
  // No attempt and >24h old → failed; otherwise pending
  if (Date.now() - new Date(r.created_at).getTime() > 86_400_000) return "failed";
  return "pending";
}

function primaryChannel(r: LogRow): "email" | "sms" | "in_app" | "—" {
  if (r.email_sent_at) return "email";
  if (r.sms_sent_at) return "sms";
  if (r.in_app_dismissed_at) return "in_app";
  if (r.channels_attempted && r.channels_attempted.length > 0) {
    const first = r.channels_attempted[0].toLowerCase();
    if (first.includes("email")) return "email";
    if (first.includes("sms"))   return "sms";
    return "in_app";
  }
  return "—";
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const carrierId = url.searchParams.get("carrier_id");
  if (!carrierId) return json({ ok: false, error: "Missing carrier_id" }, 400);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, demo: true, error: "Server missing Supabase env" }, 200);
  }
  const sb = ctx.env.SUPABASE_URL.replace(/\/$/, "");
  const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const cutoff30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [logs30, logsAll100, rules, defaults] = await Promise.all([
    pgSelect(sb, sr, "notification_log",            `select=id,event_type,severity,channels_attempted,email_sent_at,sms_sent_at,in_app_dismissed_at,created_at&carrier_id=eq.${carrierId}&created_at=gte.${cutoff30}&limit=5000`) as Promise<LogRow[]>,
    pgSelect(sb, sr, "notification_log",            `select=id,event_type,severity,title,body,channels_attempted,email_sent_at,sms_sent_at,in_app_dismissed_at,created_at,related_driver_id&carrier_id=eq.${carrierId}&order=created_at.desc&limit=100`) as Promise<LogRow[]>,
    pgSelect(sb, sr, "notification_rules",          `select=id,event_type,lead_time_days,channels,recipients,is_active&carrier_id=eq.${carrierId}&is_active=eq.true&order=event_type.asc&limit=200`) as Promise<RuleRow[]>,
    pgSelect(sb, sr, "notification_event_defaults", `select=event_type,default_channel,description,fcra_category&order=event_type.asc&limit=200`) as Promise<DefaultRow[]>,
  ]);

  // KPIs
  const delivered30 = logs30.filter(l => deriveStatus(l) === "delivered").length;
  const total30 = logs30.length;
  const rate = total30 > 0 ? Math.round((delivered30 / total30) * 1000) / 10 : null;
  const criticalRules = rules.filter(r => r.event_type.includes("crash") || r.event_type.includes("oos") || r.event_type.includes("expired")).length;

  // Channel breakdown — counts + delivery rates per channel
  const channels: Record<string, { sent: number; delivered: number }> = {
    email:  { sent: 0, delivered: 0 },
    sms:    { sent: 0, delivered: 0 },
    in_app: { sent: 0, delivered: 0 },
    push:   { sent: 0, delivered: 0 },
  };
  for (const l of logs30) {
    if (l.email_sent_at)        { channels.email.sent++; channels.email.delivered++; }
    if (l.sms_sent_at)          { channels.sms.sent++; channels.sms.delivered++; }
    if (l.in_app_dismissed_at)  { channels.in_app.sent++; channels.in_app.delivered++; }
    // Attempts that didn't succeed
    for (const ch of (l.channels_attempted || [])) {
      const k = ch.toLowerCase();
      if (k.includes("push") && !l.email_sent_at && !l.sms_sent_at) { channels.push.sent++; }
    }
  }
  const channel_breakdown = Object.entries(channels).map(([name, v]) => ({
    name,
    sent: v.sent,
    pct: v.sent > 0 ? Math.round((v.delivered / v.sent) * 100) : 0,
  }));

  // Active rules merged with defaults (rules win, defaults fill gaps)
  const ruleByEvent = new Map<string, RuleRow>();
  for (const r of rules) ruleByEvent.set(r.event_type, r);
  const active_rules = defaults.map(d => {
    const explicit = ruleByEvent.get(d.event_type);
    if (explicit) {
      return {
        event_type: d.event_type,
        name: d.event_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        description: d.description || "",
        channels: explicit.channels || [d.default_channel],
        recipients: explicit.recipients && explicit.recipients.length > 0 ? explicit.recipients.join(", ") : "Defaults",
        lead_time_days: explicit.lead_time_days,
        fcra_category: d.fcra_category,
        explicit: true,
      };
    }
    if (d.default_channel === "none") return null;
    return {
      event_type: d.event_type,
      name: d.event_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      description: d.description || "",
      channels: [d.default_channel],
      recipients: "Defaults",
      lead_time_days: null,
      fcra_category: d.fcra_category,
      explicit: false,
    };
  }).filter(Boolean);

  // Recent log (full row data for the table)
  const recent_log = logsAll100.map(r => ({
    id: r.id,
    event_type: r.event_type,
    severity: r.severity,
    title: r.title || r.event_type.replace(/_/g, " "),
    body: (r.body || "").slice(0, 240),
    channel: primaryChannel(r),
    status: deriveStatus(r),
    sent_at: r.email_sent_at || r.sms_sent_at || r.in_app_dismissed_at || null,
    created_at: r.created_at,
    related_driver_id: r.related_driver_id,
  }));

  return json({
    ok: true,
    demo: logs30.length === 0 && rules.length === 0,
    kpis: {
      delivered_30d: delivered30,
      total_30d: total30,
      delivery_rate_pct: rate,
      sms_credits: 2847, // pre-purchased pool; live counter is per-carrier and not yet wired
      sms_credits_resets_on: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      active_rules: active_rules.length,
      critical_rules: criticalRules,
    },
    channel_breakdown,
    active_rules,
    recent_log,
    window_days: 30,
  });
};
