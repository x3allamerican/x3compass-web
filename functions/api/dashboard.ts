/**
 * GET /api/dashboard?carrier_id=<uuid>
 *
 * Aggregates the data shown on the /app dashboard from Supabase, in parallel:
 *   - compass_carriers   → header line (name, DOT #, driver/unit counts)
 *   - compass_drivers    → driver count, CDL/medical/training expirations
 *   - compass_vehicles   → unit count, PM expirations
 *   - compass_dq_documents → expiring documents (next 30d + overdue)
 *   - compass_csa_snapshots → latest BASIC scores, percentile, clean-inspection rate
 *
 * Required Pages env vars:
 *   - SUPABASE_URL          — e.g., https://your-project.supabase.co
 *   - SUPABASE_SERVICE_ROLE — Supabase service-role key
 *
 * If env is missing OR no carrier is found, returns { ok: true, demo: true,
 * data: <demo-shaped payload> } so the client never breaks. Real-data callers
 * should pass ?carrier_id=<uuid>; with no carrier_id we pick the most-recently
 * created carrier (single-tenant dev case).
 *
 * Auth note: v1 is open by design — no JWT verification yet. Once Supabase
 * auth is wired into the Next.js app, this function will swap to verifying
 * the user's JWT and the carrier_id they have access to.
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
}

type DashboardKpi = {
  label: string;
  value: string;
  trend: string;
  trendNeg: boolean;
  spark: string;
};

type DashboardActionItem = { l: string; meta: string; pill: string };
type DashboardAction = {
  icon: string;
  title: string;
  cfr: string;
  items: DashboardActionItem[];
  foot: string;
  href: string;
};
type DashboardBasic = { name: string; value: number };
type DashboardExpir = { who: string; what: string; cfr: string; pill: string; color: string };

type DashboardPayload = {
  header: { greeting_name: string; carrier_label: string; summary: string };
  kpis: DashboardKpi[];
  actions: DashboardAction[];
  basics: DashboardBasic[];
  expir: DashboardExpir[];
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO FALLBACK (matches the original hardcoded constants in page.tsx exactly)
// ─────────────────────────────────────────────────────────────────────────────
const DEMO: DashboardPayload = {
  header: {
    greeting_name: "Joshua",
    carrier_label: "DASHBOARD · APEX LOGISTICS LLC · DOT #8001247",
    summary: "72 drivers · 67 power units · 85% compliance health · 42 open alerts · DIY plan",
  },
  kpis: [
    { label: "CSA percentile",       value: "57th",   trend: "↓ 12",    trendNeg: true,  spark: "0,28 20,24 40,26 60,20 80,22 100,18 120,14 140,16 160,12 180,10 200,8" },
    { label: "Clean inspection rate", value: "89%",    trend: "↑ 4",     trendNeg: false, spark: "0,22 20,24 40,18 60,20 80,16 100,14 120,12 140,14 160,10 180,8 200,6" },
    { label: "DataQ wins · YTD",      value: "$18.4k", trend: "↑ $2.1k", trendNeg: false, spark: "0,32 20,30 40,28 60,24 80,22 100,18 120,14 140,16 160,12 180,8 200,4" },
    { label: "Audit readiness",       value: "94%",    trend: "↑ 6",     trendNeg: false, spark: "0,30 20,28 40,24 60,22 80,18 100,16 120,12 140,10 160,8 180,6 200,4" },
  ],
  basics: [
    { name: "Unsafe driving",    value: 42 },
    { name: "HOS compliance",    value: 78 },
    { name: "Driver fitness",    value: 31 },
    { name: "Controlled subs",   value: 18 },
    { name: "Vehicle maint",     value: 64 },
    { name: "Hazmat compliance", value: 22 },
    { name: "Crash indicator",   value: 55 },
  ],
  expir: [
    { who: "Sarah Johnson",  what: "MVR",          cfr: "§ 391.25", pill: "Overdue 3d", color: "red" },
    { who: "Ricardo Torres", what: "Med cert",     cfr: "§ 391.43", pill: "14 days",    color: "amber" },
    { who: "Emma Park",      what: "ELDT training",cfr: "Part 380", pill: "19 days",    color: "amber" },
    { who: "Truck 4287",     what: "Annual DOT",   cfr: "§ 396.17", pill: "22 days",    color: "amber" },
    { who: "Mike Kowalski",  what: "CDL",          cfr: "§ 383.93", pill: "28 days",    color: "green" },
  ],
  actions: [
    { icon: "📁", title: "DQ Documents Expiring", cfr: "49 CFR § 391.51", foot: "Open DQ files →", href: "/app/dq-files", items: [
      { l: "motor vehicle record", meta: "Nancy Walker · May 15",     pill: "3652d overdue" },
      { l: "eldt training cert",   meta: "Lawrence Sanchez · Aug 14", pill: "3561d overdue" },
      { l: "medical examiner cert", meta: "Terry Ramirez · Nov 2",    pill: "3481d overdue" },
      { l: "eldt training cert",   meta: "Ronald Watson · Nov 29",    pill: "3454d overdue" },
      { l: "medical examiner cert", meta: "Jacob Roberts · Jul 5",    pill: "3236d overdue" },
    ]},
    { icon: "🪪", title: "CDL Expirations", cfr: "49 CFR § 383", foot: "Open drivers →", href: "/app/drivers", items: [
      { l: "Margaret Rodriguez", meta: "Expires Dec 30", pill: "14381d overdue" },
      { l: "Douglas Hernandez",  meta: "Expires Oct 10", pill: "11905d overdue" },
      { l: "Anthony Green",      meta: "Expires Nov 13", pill: "11141d overdue" },
      { l: "Benjamin Morales",   meta: "Expires Dec 26", pill: "11098d overdue" },
      { l: "Eric Martinez",      meta: "Expires Aug 29", pill: "10851d overdue" },
    ]},
    { icon: "🩺", title: "Medical Certificates", cfr: "49 CFR § 391.45", foot: "Upload new cert →", href: "/app/dq-files", items: [
      { l: "Zachary Mitchell",  meta: "Expires Jan 31", pill: "469d overdue" },
      { l: "Anthony Green",     meta: "Expires Feb 11", pill: "458d overdue" },
      { l: "Kevin Hernandez",   meta: "Expires Apr 1",  pill: "409d overdue" },
      { l: "Jerry Long",        meta: "Expires Jan 8",  pill: "127d overdue" },
      { l: "Lawrence Gonzalez", meta: "Expires Jan 12", pill: "123d overdue" },
    ]},
    { icon: "🔧", title: "Preventive Maintenance", cfr: "49 CFR § 396.3 / § 396.17", foot: "Open vehicles →", href: "/app/vehicles", items: [
      { l: "Unit 156A", meta: "PM due Jan 1",  pill: "134d overdue" },
      { l: "Unit 109",  meta: "PM due Jan 4",  pill: "131d overdue" },
      { l: "Unit 154",  meta: "PM due Jan 22", pill: "113d overdue" },
      { l: "Unit 167",  meta: "PM due Jan 29", pill: "106d overdue" },
      { l: "Unit 134",  meta: "PM due Feb 7",  pill: "97d overdue" },
    ]},
  ],
};

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  Prefer: "count=exact",
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=30",
      "Access-Control-Allow-Origin": "*",
    },
  });

// Safe fetch that never throws — returns parsed JSON + count or null.
async function pgSelect(
  url: string,
  sr: string,
  table: string,
  query: string,
): Promise<{ rows: unknown[]; count: number | null }> {
  try {
    const r = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: SUPABASE_HEADERS(sr),
    });
    if (!r.ok) return { rows: [], count: null };
    const contentRange = r.headers.get("content-range") || "";
    const totalMatch = contentRange.match(/\/(\d+)$/);
    const count = totalMatch ? parseInt(totalMatch[1], 10) : null;
    const rows = (await r.json()) as unknown[];
    return { rows: Array.isArray(rows) ? rows : [], count };
  } catch {
    return { rows: [], count: null };
  }
}

function fmtDayPill(daysOut: number): { pill: string; color: string } {
  if (daysOut < 0) return { pill: `Overdue ${Math.abs(daysOut)}d`, color: "red" };
  if (daysOut <= 14) return { pill: `${daysOut} days`, color: "amber" };
  if (daysOut <= 30) return { pill: `${daysOut} days`, color: "amber" };
  return { pill: `${daysOut} days`, color: "green" };
}

function fmtOverduePill(expiresAt: string | null): string {
  if (!expiresAt) return "—";
  const exp = new Date(expiresAt).getTime();
  const days = Math.floor((Date.now() - exp) / 86_400_000);
  return days > 0 ? `${days}d overdue` : `${Math.abs(days)} days`;
}

function fmtExpiresLabel(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return `Expires ${dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const SUPABASE_URL = ctx.env.SUPABASE_URL;
  const SR = ctx.env.SUPABASE_SERVICE_ROLE;

  // No Supabase configured → demo
  if (!SUPABASE_URL || !SR) {
    return json({ ok: true, demo: true, reason: "env-missing", data: DEMO });
  }

  const url = new URL(ctx.request.url);
  let carrierId = url.searchParams.get("carrier_id");

  // Resolve carrier
  try {
    if (!carrierId) {
      const { rows: cRows } = await pgSelect(
        SUPABASE_URL,
        SR,
        "compass_carriers",
        "select=id,name,usdot_number&order=created_at.desc&limit=1",
      );
      if (cRows.length === 0) {
        return json({ ok: true, demo: true, reason: "no-carriers", data: DEMO });
      }
      carrierId = (cRows[0] as { id: string }).id;
    }

    const [{ rows: carrierRows }, drivers, vehicles, dqDocs, csa] = await Promise.all([
      pgSelect(SUPABASE_URL, SR, "compass_carriers", `select=name,usdot_number&id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_drivers", `select=id,first_name,last_name,cdl_expires_on,medical_card_expires_on,status&carrier_id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_vehicles", `select=id,license_plate,status,next_dot_inspection_due&carrier_id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_dq_documents", `select=id,doc_type,expires_at,driver_id&carrier_id=eq.${carrierId}&order=expires_at.asc&limit=200`),
      pgSelect(SUPABASE_URL, SR, "compass_csa_snapshots", `select=*&carrier_id=eq.${carrierId}&order=taken_at.desc&limit=1`),
    ]);

    const carrier = (carrierRows[0] as { name?: string; usdot_number?: string } | undefined);
    const carrierName = carrier?.name || "Your Carrier";
    const dot = carrier?.usdot_number ? `DOT #${carrier.usdot_number}` : "DOT pending";

    const driverCount = drivers.count ?? drivers.rows.length;
    const vehicleCount = vehicles.count ?? vehicles.rows.length;

    // ── Compute open alerts (overdue items across CDL/Med/PM/DQ) + compliance health
    const now = Date.now();
    let openAlerts = 0;
    let alertWindowItems = 0;  // expiring within 30 days (counts as alert)
    const in30 = now + 30 * 86_400_000;
    for (const d of drivers.rows as { cdl_expires_on?: string; medical_card_expires_on?: string }[]) {
      if (d.cdl_expires_on) {
        const t = new Date(d.cdl_expires_on).getTime();
        if (t < now) openAlerts++; else if (t < in30) alertWindowItems++;
      }
      if (d.medical_card_expires_on) {
        const t = new Date(d.medical_card_expires_on).getTime();
        if (t < now) openAlerts++; else if (t < in30) alertWindowItems++;
      }
    }
    for (const v of vehicles.rows as { next_dot_inspection_due?: string }[]) {
      if (v.next_dot_inspection_due) {
        const t = new Date(v.next_dot_inspection_due).getTime();
        if (t < now) openAlerts++; else if (t < in30) alertWindowItems++;
      }
    }
    for (const doc of dqDocs.rows as { expires_at?: string }[]) {
      if (doc.expires_at && new Date(doc.expires_at).getTime() < now) openAlerts++;
    }
    const totalAlerts = openAlerts + alertWindowItems;
    // Rough compliance health: 100% minus % of (drivers × 2 trackers + vehicles) that are overdue/expiring
    const totalTrackedItems = driverCount * 2 + vehicleCount;
    const compliancePct = totalTrackedItems > 0
      ? Math.max(0, Math.min(100, Math.round(100 - (openAlerts / totalTrackedItems) * 100)))
      : 100;

    // ── Header
    const header = {
      greeting_name: "Joshua",
      carrier_label: `DASHBOARD · ${carrierName.toUpperCase()} · ${dot}`,
      summary: `${driverCount} drivers · ${vehicleCount} power units · ${compliancePct}% compliance health · ${totalAlerts} open alerts`,
    };

    // ── BASICS (from latest CSA snapshot if present, else demo)
    type CsaRow = {
      unsafe_driving?: number; hos_compliance?: number; driver_fitness?: number;
      ctrl_substances?: number; vehicle_maint?: number; hazmat?: number;
      crash_indicator?: number;
      raw?: { smartway_percentile?: number; clean_inspection_rate?: number; dataq_wins_ytd_cents?: number; audit_readiness?: number };
    };
    const latestCsa = csa.rows[0] as CsaRow | undefined;
    const basics: DashboardBasic[] = latestCsa ? [
      { name: "Unsafe driving",    value: latestCsa.unsafe_driving ?? 0 },
      { name: "HOS compliance",    value: latestCsa.hos_compliance ?? 0 },
      { name: "Driver fitness",    value: latestCsa.driver_fitness ?? 0 },
      { name: "Controlled subs",   value: latestCsa.ctrl_substances ?? 0 },
      { name: "Vehicle maint",     value: latestCsa.vehicle_maint ?? 0 },
      { name: "Hazmat compliance", value: latestCsa.hazmat ?? 0 },
      { name: "Crash indicator",   value: latestCsa.crash_indicator ?? 0 },
    ] : DEMO.basics;

    // ── KPIs (CSA percentile from snapshot if available; others "—" until wired)
    const r = latestCsa?.raw || {};
    const fmtPct = (v: number | undefined) => v != null ? `${v}%` : "—";
    const fmtUsd = (cents: number | undefined) => cents != null ? `$${(cents/100/1000).toFixed(1)}k` : "—";
    const kpis: DashboardKpi[] = [
      { label: "CSA percentile",        value: r.smartway_percentile != null ? `${r.smartway_percentile}th` : "—", trend: "—", trendNeg: false, spark: DEMO.kpis[0].spark },
      { label: "Clean inspection rate", value: fmtPct(r.clean_inspection_rate), trend: "—", trendNeg: false, spark: DEMO.kpis[1].spark },
      { label: "DataQ wins · YTD",      value: fmtUsd(r.dataq_wins_ytd_cents),  trend: "—", trendNeg: false, spark: DEMO.kpis[2].spark },
      { label: "Audit readiness",       value: fmtPct(r.audit_readiness),       trend: "—", trendNeg: false, spark: DEMO.kpis[3].spark },
    ];

    // ── EXPIR (next 5 docs/drivers expiring soonest)
    const allUpcoming: Array<{ when: number; raw: string; who: string; what: string; cfr: string }> = [];

    type DrvRow = { first_name?: string; last_name?: string; cdl_expires_on?: string; medical_card_expires_on?: string };
    for (const d of drivers.rows as DrvRow[]) {
      const name = `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Driver";
      if (d.cdl_expires_on) allUpcoming.push({ when: new Date(d.cdl_expires_on).getTime(), raw: d.cdl_expires_on, who: name, what: "CDL", cfr: "§ 383.93" });
      if (d.medical_card_expires_on) allUpcoming.push({ when: new Date(d.medical_card_expires_on).getTime(), raw: d.medical_card_expires_on, who: name, what: "Med cert", cfr: "§ 391.43" });
    }
    type DocRow = { doc_type?: string; expires_at?: string; driver_id?: string };
    for (const doc of dqDocs.rows as DocRow[]) {
      if (!doc.expires_at) continue;
      allUpcoming.push({ when: new Date(doc.expires_at).getTime(), raw: doc.expires_at, who: doc.doc_type || "Document", what: doc.doc_type || "DQ doc", cfr: "§ 391.51" });
    }
    allUpcoming.sort((a, b) => a.when - b.when);

    const expir: DashboardExpir[] = allUpcoming.slice(0, 5).map(item => {
      const days = Math.ceil((item.when - Date.now()) / 86_400_000);
      const { pill, color } = fmtDayPill(days);
      return { who: item.who, what: item.what, cfr: item.cfr, pill, color };
    });

    // ── ACTIONS (real overdue rows where possible)
    const overdueDocs = (dqDocs.rows as DocRow[])
      .filter(d => d.expires_at && new Date(d.expires_at).getTime() < Date.now())
      .slice(0, 5);
    const overdueCdls = (drivers.rows as DrvRow[])
      .filter(d => d.cdl_expires_on && new Date(d.cdl_expires_on).getTime() < Date.now())
      .slice(0, 5);
    const overdueMeds = (drivers.rows as DrvRow[])
      .filter(d => d.medical_card_expires_on && new Date(d.medical_card_expires_on).getTime() < Date.now())
      .slice(0, 5);
    type VehRow = { license_plate?: string; next_dot_inspection_due?: string };
    const overduePm = (vehicles.rows as VehRow[])
      .filter(v => v.next_dot_inspection_due && new Date(v.next_dot_inspection_due).getTime() < Date.now())
      .slice(0, 5);

    const actions: DashboardAction[] = [
      { icon: "📁", title: "DQ Documents Expiring", cfr: "49 CFR § 391.51", foot: "Open DQ files →", href: "/app/dq-files",
        items: overdueDocs.length ? overdueDocs.map(d => ({ l: d.doc_type || "Document", meta: d.driver_id ? `Driver ${d.driver_id.slice(0, 8)} · ${fmtExpiresLabel(d.expires_at || null)}` : fmtExpiresLabel(d.expires_at || null), pill: fmtOverduePill(d.expires_at || null) })) : [] },
      { icon: "🪪", title: "CDL Expirations", cfr: "49 CFR § 383", foot: "Open drivers →", href: "/app/drivers",
        items: overdueCdls.length ? overdueCdls.map(d => ({ l: `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Driver", meta: fmtExpiresLabel(d.cdl_expires_on || null), pill: fmtOverduePill(d.cdl_expires_on || null) })) : [] },
      { icon: "🩺", title: "Medical Certificates", cfr: "49 CFR § 391.45", foot: "Upload new cert →", href: "/app/dq-files",
        items: overdueMeds.length ? overdueMeds.map(d => ({ l: `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Driver", meta: fmtExpiresLabel(d.medical_card_expires_on || null), pill: fmtOverduePill(d.medical_card_expires_on || null) })) : [] },
      { icon: "🔧", title: "Preventive Maintenance", cfr: "49 CFR § 396.3 / § 396.17", foot: "Open vehicles →", href: "/app/vehicles",
        items: overduePm.length ? overduePm.map(v => ({ l: v.license_plate ? `Unit ${v.license_plate}` : "Unit", meta: `PM due ${fmtExpiresLabel(v.next_dot_inspection_due || null).replace("Expires ", "")}`, pill: fmtOverduePill(v.next_dot_inspection_due || null) })) : [] },
    ];

    return json({
      ok: true,
      demo: false,
      carrier_id: carrierId,
      data: { header, kpis, basics, expir, actions } satisfies DashboardPayload,
    });
  } catch (err) {
    return json({
      ok: true,
      demo: true,
      reason: `error: ${err instanceof Error ? err.message : String(err)}`,
      data: DEMO,
    });
  }
};
