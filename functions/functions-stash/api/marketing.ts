/**
 * GET /api/marketing
 *
 * Lead pipeline + campaign-performance rollup from marketing_clicks /
 * marketing_leads / marketing_campaigns / marketing_audit_invites.
 *
 * No carrier_id filter — this is the company-wide marketing dashboard, only
 * accessible to super-admins (gating handled at the page level / RLS).
 */

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  Prefer: "count=exact",
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=30", "Access-Control-Allow-Origin": "*" },
  });

async function pgSelect(url: string, sr: string, table: string, query: string): Promise<unknown[]> {
  try {
    const r = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: SUPABASE_HEADERS(sr) });
    if (!r.ok) return [];
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

type Click = { campaign_id: string | null; utm_source: string | null; utm_campaign: string | null; created_at: string };
type Lead  = {
  id: string; first_name: string | null; last_name: string | null; email: string; company: string | null;
  fleet_size: string | null; utm_source: string | null; utm_campaign: string | null; campaign_id: string | null;
  primary_pain: string | null; status: string | null; created_at: string;
};
type Campaign = { id: string; slug: string; name: string; channel: string | null; is_active: boolean };
type Invite = { lead_id: string; sent_to_email: string; created_at: string };

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, demo: true, error: "Server missing Supabase env" }, 200);
  }
  const sb = ctx.env.SUPABASE_URL.replace(/\/$/, "");
  const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const cutoff30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [clicks30, leads30, campaigns, invites, leadsAll] = await Promise.all([
    pgSelect(sb, sr, "marketing_clicks",        `select=campaign_id,utm_source,utm_campaign,created_at&created_at=gte.${cutoff30}&limit=5000`) as Promise<Click[]>,
    pgSelect(sb, sr, "marketing_leads",         `select=id,first_name,last_name,email,company,fleet_size,utm_source,utm_campaign,campaign_id,primary_pain,status,created_at&created_at=gte.${cutoff30}&order=created_at.desc&limit=200`) as Promise<Lead[]>,
    pgSelect(sb, sr, "marketing_campaigns",     `select=id,slug,name,channel,is_active&order=created_at.desc&limit=200`) as Promise<Campaign[]>,
    pgSelect(sb, sr, "marketing_audit_invites", `select=lead_id,sent_to_email,created_at&limit=5000`) as Promise<Invite[]>,
    pgSelect(sb, sr, "marketing_leads",         `select=id,status,campaign_id&limit=5000`) as Promise<Lead[]>,
  ]);

  // KPIs (30-day window)
  const clicksCount = clicks30.length;
  const leadsCount = leads30.length;
  const invitesCount = invites.length;
  const auditsDone = leadsAll.filter(l => l.status === "audit_completed").length;
  const converted = leadsAll.filter(l => l.status === "converted").length;
  const clickToLeadPct = clicksCount > 0 ? Math.round((leadsCount / clicksCount) * 1000) / 10 : null;
  const leadToAuditPct = leadsCount > 0 ? Math.round((auditsDone / leadsCount) * 1000) / 10 : null;

  // Campaign funnel — left-join campaigns with click/lead/invite/audit/convert counts
  const cIdByLeadCampaign = new Map<string, string>(); // campaign_id → first slug match (not needed, kept for future)
  const clicksByCampaign = new Map<string, number>();
  for (const c of clicks30) {
    const key = c.campaign_id || c.utm_campaign || "(direct)";
    clicksByCampaign.set(key, (clicksByCampaign.get(key) || 0) + 1);
  }
  const leadsByCampaign = new Map<string, number>();
  const auditsByCampaign = new Map<string, number>();
  const convertedByCampaign = new Map<string, number>();
  for (const l of leadsAll) {
    const key = l.campaign_id || "(direct)";
    leadsByCampaign.set(key, (leadsByCampaign.get(key) || 0) + 1);
    if (l.status === "audit_completed") auditsByCampaign.set(key, (auditsByCampaign.get(key) || 0) + 1);
    if (l.status === "converted")       convertedByCampaign.set(key, (convertedByCampaign.get(key) || 0) + 1);
  }
  const invitesByCampaign = new Map<string, number>();
  const leadIdToCampaign = new Map<string, string>();
  for (const l of leadsAll) leadIdToCampaign.set(l.id, l.campaign_id || "(direct)");
  for (const inv of invites) {
    const cId = leadIdToCampaign.get(inv.lead_id) || "(direct)";
    invitesByCampaign.set(cId, (invitesByCampaign.get(cId) || 0) + 1);
  }

  type FunnelRow = { campaign: string; channel: string; clicks: number; leads: number; invites: number; audits: number; converted: number; click_to_lead: number | null; lead_to_audit: number | null };
  const funnel: FunnelRow[] = campaigns.map(c => {
    const cl = clicksByCampaign.get(c.id) || 0;
    const ld = leadsByCampaign.get(c.id) || 0;
    const iv = invitesByCampaign.get(c.id) || 0;
    const au = auditsByCampaign.get(c.id) || 0;
    const cv = convertedByCampaign.get(c.id) || 0;
    return {
      campaign: c.slug || c.name,
      channel: c.channel || "—",
      clicks: cl, leads: ld, invites: iv, audits: au, converted: cv,
      click_to_lead: cl > 0 ? Math.round((ld / cl) * 1000) / 10 : null,
      lead_to_audit: ld > 0 ? Math.round((au / ld) * 1000) / 10 : null,
    };
  }).sort((a, b) => (b.clicks + b.leads * 5) - (a.clicks + a.leads * 5));

  // Traffic sparkline — 30 buckets, daily click counts
  const traffic: number[] = new Array(30).fill(0);
  for (const c of clicks30) {
    const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000);
    const idx = 29 - days;
    if (idx >= 0 && idx < 30) traffic[idx] += 1;
  }

  // Recent leads (top 25, full data)
  const recentLeads = leads30.slice(0, 25).map(l => ({
    id: l.id,
    captured: l.created_at,
    name: [l.first_name, l.last_name].filter(Boolean).join(" ").trim() || "—",
    email: l.email,
    company: l.company || "—",
    fleet: l.fleet_size || "—",
    source: l.utm_source || "direct",
    pain: l.primary_pain || "—",
    status: l.status || "new",
  }));

  return json({
    ok: true,
    demo: clicksCount === 0 && leadsCount === 0,
    kpis: {
      clicks_30d: clicksCount,
      leads_30d: leadsCount,
      invites_total: invitesCount,
      audits_completed_total: auditsDone,
      converted_total: converted,
      cost_per_lead: 0,
      click_to_lead_pct: clickToLeadPct,
      lead_to_audit_pct: leadToAuditPct,
    },
    funnel,
    traffic,
    recent_leads: recentLeads,
    campaigns: campaigns.filter(c => c.is_active).map(c => ({ id: c.id, slug: c.slug, name: c.name, channel: c.channel })),
    window_days: 30,
  });
};
