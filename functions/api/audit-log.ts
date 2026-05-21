/**
 * GET /api/audit-log?carrier_id=<uuid>&limit=200&action=&entity=&actor=&since=
 *
 * Immutable, append-only audit trail for one carrier from compass_audit_log.
 * RLS already gates by carrier_id+user membership; this endpoint adds an
 * explicit carrier_id filter as belt-and-suspenders.
 *
 * Optional query params:
 *   limit  (default 200, max 1000)
 *   action (CREATE|UPDATE|DELETE|NOTIFY|BULK_IMPORT) — case-insensitive
 *   entity (carrier|driver|vehicle|dq_document|...) — case-insensitive
 *   actor  (user_id uuid OR email substring) — matches user_id OR payload.actor_email
 *   since  (ISO timestamp) — created_at >= since
 *
 * Returns:
 *   - rows: latest N audit events with normalized actor info
 *   - stats: counts by action + by entity_type
 *   - distinct_actors: list of unique actor user_ids for the filter dropdown
 *   - distinct_entities: list of unique entity_types
 */

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
});
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), {
  status: s,
  headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=15", "Access-Control-Allow-Origin": "*" },
});

async function pgSelect(url: string, sr: string, table: string, query: string): Promise<unknown[]> {
  try {
    const r = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: SUPABASE_HEADERS(sr) });
    if (!r.ok) return [];
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

type LogRow = {
  id: string; carrier_id: string; user_id: string | null;
  action: string; entity_type: string; entity_id: string | null;
  payload: Record<string, unknown> | null;
  ip_address: string | null; user_agent: string | null; created_at: string;
};

// Auth users lookup (best-effort — auth.users isn't directly queryable via PostgREST
// but compass_carrier_users joins user_id → email)
type CarrierUser = { user_id: string; email?: string | null };

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const carrierId = url.searchParams.get("carrier_id");
  if (!carrierId) return json({ ok: false, error: "Missing carrier_id" }, 400);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, demo: true, error: "Server missing Supabase env" }, 200);
  }
  const sb = ctx.env.SUPABASE_URL.replace(/\/$/, "");
  const sr = ctx.env.SUPABASE_SERVICE_ROLE;

  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "200", 10) || 200, 1), 1000);
  const actionFilter = (url.searchParams.get("action") || "").toUpperCase();
  const entityFilter = (url.searchParams.get("entity") || "").toLowerCase();
  const actorFilter  = (url.searchParams.get("actor")  || "").trim();
  const sinceFilter  = url.searchParams.get("since");

  // Build the query string
  const parts = [
    `carrier_id=eq.${carrierId}`,
    "select=id,carrier_id,user_id,action,entity_type,entity_id,payload,ip_address,user_agent,created_at",
    "order=created_at.desc",
    `limit=${limit}`,
  ];
  if (actionFilter && actionFilter !== "ALL") parts.push(`action=eq.${encodeURIComponent(actionFilter)}`);
  if (entityFilter && entityFilter !== "all") parts.push(`entity_type=eq.${encodeURIComponent(entityFilter)}`);
  if (sinceFilter) parts.push(`created_at=gte.${encodeURIComponent(sinceFilter)}`);
  // actor filter applied client-side (it can match user_id OR payload.actor_email)

  const [rows, allMemberships] = await Promise.all([
    pgSelect(sb, sr, "compass_audit_log", parts.join("&")) as Promise<LogRow[]>,
    pgSelect(sb, sr, "compass_carrier_users", `select=user_id&carrier_id=eq.${carrierId}`) as Promise<CarrierUser[]>,
  ]);

  // Optional actor filter (post-fetch because it can match payload metadata)
  const filtered = actorFilter
    ? rows.filter(r =>
        (r.user_id || "").includes(actorFilter) ||
        JSON.stringify(r.payload || {}).toLowerCase().includes(actorFilter.toLowerCase())
      )
    : rows;

  // Stats
  const actionCounts: Record<string, number> = {};
  const entityCounts: Record<string, number> = {};
  for (const r of rows) {
    actionCounts[r.action || "UNKNOWN"] = (actionCounts[r.action || "UNKNOWN"] || 0) + 1;
    entityCounts[r.entity_type || "unknown"] = (entityCounts[r.entity_type || "unknown"] || 0) + 1;
  }

  // Distinct actor + entity lists for the filter dropdowns
  const distinctActors = Array.from(new Set(rows.map(r => r.user_id).filter((v): v is string => !!v)));
  const distinctEntities = Array.from(new Set(rows.map(r => r.entity_type).filter((v): v is string => !!v))).sort();

  // Normalize rows for the page
  const normalized = filtered.map(r => {
    const payload = r.payload || {};
    // Pull a short details preview from common payload shapes
    const detailsObj: Record<string, unknown> = {};
    for (const k of Object.keys(payload).slice(0, 4)) {
      const v = (payload as Record<string, unknown>)[k];
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") detailsObj[k] = v;
      else if (Array.isArray(v)) detailsObj[k] = `[${v.slice(0, 4).join(",")}${v.length > 4 ? ",…" : ""}]`;
    }
    const detailsStr = Object.entries(detailsObj).map(([k, v]) => `"${k}":${typeof v === "string" ? `"${v.slice(0, 60)}"` : v}`).join(",");

    return {
      id: r.id,
      created_at: r.created_at,
      user_id: r.user_id,
      actor_email: (payload as Record<string, unknown>).actor_email as string | undefined ||
                   (payload as Record<string, unknown>).actual_user_email as string | undefined || null,
      action: (r.action || "UNKNOWN").toUpperCase(),
      entity_type: r.entity_type || "unknown",
      entity_id: r.entity_id,
      entity_id_short: r.entity_id ? r.entity_id.slice(0, 8) + "…" : null,
      details: detailsStr,
      ip_address: r.ip_address,
    };
  });

  return json({
    ok: true,
    demo: rows.length === 0,
    rows: normalized,
    stats: {
      total: rows.length,
      by_action: actionCounts,
      by_entity: entityCounts,
    },
    distinct_actors: distinctActors.map(uid => {
      const m = allMemberships.find(x => x.user_id === uid);
      return { user_id: uid, email: m?.email || null };
    }),
    distinct_entities: distinctEntities,
    window: { limit, action: actionFilter || null, entity: entityFilter || null, actor: actorFilter || null, since: sinceFilter || null },
  });
};
