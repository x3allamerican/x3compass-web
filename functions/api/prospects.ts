/**
 * GET /api/prospects
 *
 * FMCSA Prospects rollup — super-admin only at the page level.
 * Pulls:
 *   - fmcsa_carriers (active, in-region universe)
 *   - fmcsa_outreach_log (per-DOT outreach status)
 *   - fmcsa_outreach_templates (intro emails by segment)
 *   - fmcsa_scraper_runs (latest 30)
 *
 * Returns:
 *   - kpis: 6 cards matching X3FS classic
 *   - distributions: fleet-size buckets for EACH tab scope
 *   - new_entrants / below_sat / new_this_week / all_in_region: full rows
 *   - outreach_log: latest 200
 *   - templates: full list (enabled flag preserved)
 *   - scraper_runs: latest 30
 *
 * ICP filter (server-side, redundant w/ ingest-time filter as belt+suspenders):
 *   state IN ('MI','OH','IN','IL','WI')
 *   operating_status = 'ACTIVE'
 *   power_units BETWEEN 1 AND 100  (X3FS classic says 25 at ingest but UI bars go to 100)
 *   email IS NOT NULL
 */

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  Prefer: "count=exact",
});
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), {
  status: s,
  headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
});

async function pgSelect(url: string, sr: string, table: string, query: string): Promise<unknown[]> {
  try {
    const r = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: SUPABASE_HEADERS(sr) });
    if (!r.ok) return [];
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

type Carrier = {
  id: string; dot_number: string; legal_name: string; dba: string | null;
  address_city: string | null; address_state: string | null; address_zip: string | null;
  phone: string | null; email: string | null;
  power_units: number | null; drivers: number | null;
  operating_status: string | null; safety_rating: string | null; safety_rating_date: string | null;
  registration_date: string | null; new_entrant: boolean | null;
  first_seen_at: string; last_seen_at: string | null;
};
type Outreach = {
  id: string; carrier_id: string | null; dot_number: string; recipient_email: string;
  template_id: string; subject: string | null;
  status: string;
  sent_at: string | null; delivered_at: string | null; opened_at: string | null; replied_at: string | null;
  error_message: string | null; created_at: string;
};
type Template = {
  template_id: string; enabled: boolean; segment_label: string;
  subject_template: string; body_text_template: string;
  required_variables: string[] | null; notes: string | null;
};
type Run = {
  id: string; started_at: string; finished_at: string | null;
  status: string; carriers_scanned: number | null; carriers_new: number | null;
  carriers_updated: number | null; ratings_changed: number | null;
  prospects_under_25: number | null; notes: string | null; error_message: string | null;
};

const STATES = ["MI", "OH", "IN", "IL", "WI"];
const BUCKETS: { range: string; min: number; max: number }[] = [
  { range: "1-5",    min: 1,  max: 5 },
  { range: "6-10",   min: 6,  max: 10 },
  { range: "11-20",  min: 11, max: 20 },
  { range: "21-50",  min: 21, max: 50 },
  { range: "51-100", min: 51, max: 100 },
];

function distribute(carriers: Carrier[]): { range: string; count: number }[] {
  return BUCKETS.map(b => ({
    range: b.range,
    count: carriers.filter(c => (c.power_units ?? 0) >= b.min && (c.power_units ?? 0) <= b.max).length,
  }));
}

function inIcp(c: Carrier): boolean {
  return (
    !!c.address_state && STATES.includes(c.address_state.toUpperCase()) &&
    (c.operating_status || "").toUpperCase() === "ACTIVE" &&
    !!c.email && !!c.power_units && c.power_units >= 1 && c.power_units <= 100
  );
}

function ageDaysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, demo: true, error: "Server missing Supabase env" }, 200);
  }
  const sb = ctx.env.SUPABASE_URL.replace(/\/$/, "");
  const sr = ctx.env.SUPABASE_SERVICE_ROLE;

  // Carriers — full universe (we'll filter ICP client-side too as cheap belt-and-suspenders)
  const inRegionFilter = `address_state=in.(${STATES.join(",")})`;
  const [carriersRaw, outreachRaw, templatesRaw, runsRaw] = await Promise.all([
    pgSelect(sb, sr, "fmcsa_carriers",          `select=*&${inRegionFilter}&operating_status=eq.ACTIVE&power_units=gte.1&power_units=lte.100&email=not.is.null&order=registration_date.desc&limit=5000`) as Promise<Carrier[]>,
    pgSelect(sb, sr, "fmcsa_outreach_log",      `select=*&order=created_at.desc&limit=500`) as Promise<Outreach[]>,
    pgSelect(sb, sr, "fmcsa_outreach_templates",`select=*&order=template_id.asc&limit=50`) as Promise<Template[]>,
    pgSelect(sb, sr, "fmcsa_scraper_runs",      `select=*&order=started_at.desc&limit=30`) as Promise<Run[]>,
  ]);
  const carriers = carriersRaw.filter(inIcp);

  // Segment carriers
  const twelveMo = Date.now() - 365 * 86_400_000;
  const sevenD = Date.now() - 7 * 86_400_000;

  const newEntrants = carriers.filter(c => {
    if (c.new_entrant === true) return true;
    if (!c.registration_date) return false;
    return new Date(c.registration_date).getTime() > twelveMo;
  });
  const belowSat = carriers.filter(c => {
    const r = (c.safety_rating || "").toUpperCase();
    return r === "CONDITIONAL" || r === "UNSATISFACTORY";
  });
  const newThisWeek = carriers.filter(c => new Date(c.first_seen_at).getTime() > sevenD);

  // Build outreach lookup by DOT number (for the carrier-row outreach column)
  const outreachByDot = new Map<string, Outreach>();
  for (const o of outreachRaw) {
    const cur = outreachByDot.get(o.dot_number);
    // Prefer the most progressed status (replied > opened > delivered > sent > queued > failed)
    const rank = (s: string) => ["failed", "queued", "sent", "delivered", "opened", "replied"].indexOf((s || "").toLowerCase()) + 1;
    if (!cur || rank(o.status) > rank(cur.status)) outreachByDot.set(o.dot_number, o);
  }

  function row(c: Carrier) {
    const o = outreachByDot.get(c.dot_number);
    return {
      id: c.id,
      dot_number: c.dot_number,
      legal_name: c.legal_name,
      dba: c.dba,
      city: c.address_city,
      state: c.address_state,
      power_units: c.power_units,
      drivers: c.drivers,
      safety_rating: c.safety_rating,
      safety_rating_date: c.safety_rating_date,
      registration_date: c.registration_date,
      new_entrant: c.new_entrant === true || ((c.registration_date && new Date(c.registration_date).getTime() > twelveMo) || false),
      first_seen_at: c.first_seen_at,
      first_seen_days: ageDaysSince(c.first_seen_at),
      email: c.email,
      phone: c.phone,
      outreach_status: o?.status || null,
      outreach_sent_at: o?.sent_at || null,
      outreach_template_id: o?.template_id || null,
    };
  }

  // KPIs (X3FS classic)
  const outreachSent = outreachRaw.filter(o => ["sent", "delivered", "opened", "replied"].includes((o.status || "").toLowerCase())).length;
  const replies = outreachRaw.filter(o => !!o.replied_at).length;

  return json({
    ok: true,
    demo: carriers.length === 0,
    kpis: {
      in_region: carriers.length,
      new_entrants: newEntrants.length,
      below_sat: belowSat.length,
      new_this_week: newThisWeek.length,
      outreach_sent: outreachSent,
      replies,
    },
    distributions: {
      all:           distribute(carriers),
      new_entrants:  distribute(newEntrants),
      below_sat:     distribute(belowSat),
      new_this_week: distribute(newThisWeek),
    },
    rows: {
      new_entrants:  newEntrants.map(row),
      below_sat:     belowSat.map(row),
      new_this_week: newThisWeek.map(row),
      all_in_region: carriers.map(row),
    },
    outreach_log: outreachRaw.slice(0, 200).map(o => {
      // Look up legal name from carriers list
      const c = carriers.find(x => x.dot_number === o.dot_number);
      let displayStatus = (o.status || "queued").toLowerCase();
      if (o.replied_at) displayStatus = "replied";
      else if (o.opened_at) displayStatus = "opened";
      else if (o.delivered_at) displayStatus = "delivered";
      else if (o.sent_at) displayStatus = "sent";
      return {
        id: o.id,
        sent_at: o.sent_at || o.created_at,
        carrier_name: c?.legal_name || "(unknown)",
        dot_number: o.dot_number,
        template_id: o.template_id,
        status: displayStatus,
        subject: o.subject || "(no subject)",
        recipient_email: o.recipient_email,
        delivered_at: o.delivered_at, opened_at: o.opened_at, replied_at: o.replied_at,
        error_message: o.error_message,
      };
    }),
    templates: templatesRaw.map(t => ({
      template_id: t.template_id,
      enabled: t.enabled,
      segment_label: t.segment_label,
      subject_template: t.subject_template,
      body_text_template: t.body_text_template,
      required_variables: t.required_variables,
      notes: t.notes,
    })),
    scraper_runs: runsRaw.map(r => {
      const ms = r.finished_at && r.started_at ? new Date(r.finished_at).getTime() - new Date(r.started_at).getTime() : null;
      return {
        id: r.id,
        started_at: r.started_at,
        duration_ms: ms,
        duration_label: ms != null ? `${Math.floor(ms / 60000)}m ${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}s` : "—",
        status: r.status,
        carriers_scanned: r.carriers_scanned,
        carriers_new: r.carriers_new,
        carriers_updated: r.carriers_updated,
        ratings_changed: r.ratings_changed,
        prospects_under_25: r.prospects_under_25,
        notes: r.notes,
        error_message: r.error_message,
      };
    }),
  });
};
