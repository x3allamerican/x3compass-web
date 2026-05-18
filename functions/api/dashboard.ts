/**
 * GET /api/dashboard?carrier_id=<uuid>
 *
 * Returns the full Compliance Command Center payload — real values computed
 * from Supabase where possible, demo-shape preserved everywhere else.
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE
 * Auth: v1 open. Will gate on JWT when Supabase auth is wired.
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
}

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

async function pgSelect(
  url: string,
  sr: string,
  table: string,
  query: string,
): Promise<{ rows: unknown[]; count: number | null }> {
  try {
    const r = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: SUPABASE_HEADERS(sr) });
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

function fmtOverduePill(expiresAt: string | null): string {
  if (!expiresAt) return "—";
  const days = Math.floor((Date.now() - new Date(expiresAt).getTime()) / 86_400_000);
  return days > 0 ? `${days}d OVERDUE` : `${Math.abs(days)} days`;
}

function fmtExpiresLabel(d: string | null): string {
  if (!d) return "—";
  return `Expires ${new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const SUPABASE_URL = ctx.env.SUPABASE_URL;
  const SR = ctx.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SR) {
    return json({ ok: true, demo: true, reason: "env-missing" });
  }

  const url = new URL(ctx.request.url);
  let carrierId = url.searchParams.get("carrier_id");

  try {
    if (!carrierId) {
      const { rows: cRows } = await pgSelect(SUPABASE_URL, SR, "compass_carriers", "select=id&order=created_at.desc&limit=1");
      if (cRows.length === 0) return json({ ok: true, demo: true, reason: "no-carriers" });
      carrierId = (cRows[0] as { id: string }).id;
    }

    const [{ rows: carrierRows }, drivers, vehicles, dqDocs, csa] = await Promise.all([
      pgSelect(SUPABASE_URL, SR, "compass_carriers", `select=name,usdot_number,mc_number,safety_rating&id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_drivers", `select=id,first_name,last_name,cdl_expires_on,medical_card_expires_on,status,hire_date&carrier_id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_vehicles", `select=id,license_plate,status,vehicle_type,next_dot_inspection_due&carrier_id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_dq_documents", `select=id,driver_id,doc_type,expires_on&carrier_id=eq.${carrierId}&order=expires_on.asc.nullslast&limit=500`),
      pgSelect(SUPABASE_URL, SR, "compass_csa_snapshots", `select=*&carrier_id=eq.${carrierId}&order=taken_at.desc&limit=1`),
    ]);

    type CarrierRow = { name?: string; usdot_number?: string; mc_number?: string; safety_rating?: string };
    const carrier = (carrierRows[0] as CarrierRow | undefined) || {};
    const carrierName = carrier.name || "Your Carrier";
    const dot = carrier.usdot_number || "—";

    const now = Date.now();
    const inDays = (days: number) => now + days * 86_400_000;
    const today = new Date().toISOString().slice(0, 10);

    type DrvRow = { id: string; first_name?: string; last_name?: string; cdl_expires_on?: string; medical_card_expires_on?: string; status?: string; hire_date?: string };
    type VehRow = { id: string; license_plate?: string; status?: string; vehicle_type?: string; next_dot_inspection_due?: string };
    type DocRow = { driver_id?: string; doc_type?: string; expires_on?: string };

    const drvRows = drivers.rows as DrvRow[];
    const vehRows = vehicles.rows as VehRow[];
    const docRows = dqDocs.rows as DocRow[];

    // ─────────────────────────────────────────────────────────────────────
    // KPI strip — 6 tiles
    // ─────────────────────────────────────────────────────────────────────
    const activeDrivers = drvRows.filter(d => d.status === "active").length;
    const driversOnRoster = drvRows.length;
    const powerUnits = vehRows.filter(v => v.status === "active").length;
    const tractors = vehRows.filter(v => v.vehicle_type === "tractor").length;
    const straightTrucks = vehRows.filter(v => v.vehicle_type === "straight_truck").length;
    const trailers = vehRows.filter(v => v.vehicle_type === "trailer").length;

    const cdlsExpired = drvRows.filter(d => d.cdl_expires_on && d.cdl_expires_on < today).length;
    const mecsExpiring30d = drvRows.filter(d => d.medical_card_expires_on && d.medical_card_expires_on >= today && new Date(d.medical_card_expires_on).getTime() <= inDays(30)).length;

    const dqOverdue = docRows.filter(d => d.expires_on && d.expires_on < today).length;
    const dqValid = docRows.length - dqOverdue;
    const dqTarget = driversOnRoster * 12; // 12 required docs per driver
    const dqScorePct = dqTarget > 0 ? Math.round((dqValid / dqTarget) * 100) : 0;

    // Open alerts = anything overdue or expiring soon
    let openAlerts = 0, urgent = 0;
    for (const d of drvRows) {
      if (d.cdl_expires_on) {
        const t = new Date(d.cdl_expires_on).getTime();
        if (t < now) { openAlerts++; urgent++; }
        else if (t <= inDays(30)) openAlerts++;
      }
      if (d.medical_card_expires_on) {
        const t = new Date(d.medical_card_expires_on).getTime();
        if (t < now) { openAlerts++; urgent++; }
        else if (t <= inDays(30)) openAlerts++;
      }
    }
    for (const v of vehRows) {
      if (v.next_dot_inspection_due) {
        const t = new Date(v.next_dot_inspection_due).getTime();
        if (t < now) { openAlerts++; urgent++; }
        else if (t <= inDays(30)) openAlerts++;
      }
    }
    openAlerts += dqOverdue;

    // ─────────────────────────────────────────────────────────────────────
    // Compliance Overview bars
    // ─────────────────────────────────────────────────────────────────────
    // Per-domain compliance % — fraction of drivers with the relevant doc + not expired
    function pctWithValidDoc(docTypes: string[]): number {
      if (drvRows.length === 0) return 0;
      let ok = 0;
      for (const d of drvRows) {
        const hasValid = docRows.some(doc =>
          doc.driver_id === d.id &&
          docTypes.includes(doc.doc_type || "") &&
          (!doc.expires_on || doc.expires_on >= today)
        );
        if (hasValid) ok++;
      }
      return Math.round((ok / drvRows.length) * 100);
    }
    const cdlPct = pctWithValidDoc(["cdl_copy", "road_test_certificate"]);
    const medPct = drvRows.length === 0 ? 0 : Math.round((drvRows.filter(d => d.medical_card_expires_on && d.medical_card_expires_on >= today).length / drvRows.length) * 100);
    const daPct = pctWithValidDoc(["pre_employment_drug_test", "drug_test_result", "clearinghouse_full", "clearinghouse_query"]);
    const trainingPct = pctWithValidDoc(["eldt_certificate", "eldt"]);
    const vehMaintPct = vehRows.length === 0 ? 100 : Math.round((vehRows.filter(v => !v.next_dot_inspection_due || v.next_dot_inspection_due >= today).length / vehRows.length) * 100);
    const hosPct = 90;  // No HOS data yet — keep demo

    const complianceBars = [
      { label: "Driver Qualification (CDL)", pct: cdlPct, color: cdlPct >= 90 ? "green" : cdlPct >= 75 ? "yellow" : "red" },
      { label: "Medical Certificates",       pct: medPct, color: medPct >= 90 ? "green" : medPct >= 75 ? "yellow" : "red" },
      { label: "HOS / ELD",                  pct: hosPct, color: "green" },
      { label: "Drug & Alcohol",             pct: daPct, color: daPct >= 90 ? "green" : daPct >= 75 ? "yellow" : "red" },
      { label: "Training Records",           pct: trainingPct, color: trainingPct >= 90 ? "green" : trainingPct >= 75 ? "yellow" : "red" },
      { label: "Vehicle Maintenance",        pct: vehMaintPct, color: vehMaintPct >= 90 ? "green" : vehMaintPct >= 75 ? "yellow" : "red" },
    ];
    const overallCompliancePct = Math.round(complianceBars.reduce((s, b) => s + b.pct, 0) / complianceBars.length);

    // ─────────────────────────────────────────────────────────────────────
    // CSA BASICS — from latest snapshot if present
    // ─────────────────────────────────────────────────────────────────────
    type CsaRow = { unsafe_driving?: number; crash_indicator?: number; hos_compliance?: number; vehicle_maint?: number; hazmat?: number; driver_fitness?: number; ctrl_substances?: number };
    const latestCsa = csa.rows[0] as CsaRow | undefined;
    const csaBasic = (msr: number | undefined, threshold: number) => {
      const v = msr ?? 0;
      const status: "ok" | "warn" | "alert" = v >= threshold ? "alert" : v >= threshold * 0.75 ? "warn" : "ok";
      return { msr: v, threshold, status };
    };
    const csaBasics = latestCsa ? [
      { name: "Unsafe Driving",   ...csaBasic(latestCsa.unsafe_driving, 65) },
      { name: "Crash Indicator",  ...csaBasic(latestCsa.crash_indicator, 65) },
      { name: "HOS Compliance",   ...csaBasic(latestCsa.hos_compliance, 65) },
      { name: "Vehicle Maint.",   ...csaBasic(latestCsa.vehicle_maint, 80) },
      { name: "Hazmat",           ...csaBasic(latestCsa.hazmat, 80) },
      { name: "Driver Fitness",   ...csaBasic(latestCsa.driver_fitness, 80) },
      { name: "Ctrl. Substances", ...csaBasic(latestCsa.ctrl_substances, 80) },
    ] : null;

    // ─────────────────────────────────────────────────────────────────────
    // Action Items — 8 cards (top 5 per category)
    // ─────────────────────────────────────────────────────────────────────
    const driverNameById = new Map<string, string>(drvRows.map(d => [d.id, `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Driver"]));

    const overdueDocs = docRows.filter(d => d.expires_on && d.expires_on < today).slice(0, 5);
    const overdueCdls = drvRows.filter(d => d.cdl_expires_on && d.cdl_expires_on < today).slice(0, 5);
    const overdueMeds = drvRows.filter(d => d.medical_card_expires_on && d.medical_card_expires_on < today).slice(0, 5);
    const overduePm = vehRows.filter(v => v.next_dot_inspection_due && v.next_dot_inspection_due < today).slice(0, 5);

    const actionItems = {
      dq_docs_expiring: {
        title: "DQ Documents Expiring",
        cfr: "49 CFR § 391.51",
        items: overdueDocs.map(d => ({
          who: (d.doc_type || "document").replace(/_/g, " "),
          meta: `${driverNameById.get(d.driver_id || "") || "Driver"} · ${fmtExpiresLabel(d.expires_on || null).replace("Expires ", "")}`,
          status: fmtOverduePill(d.expires_on || null),
          statusKind: "overdue" as const,
        })),
        cta: { href: "/app/dq-files", label: "Open DQ files →" },
      },
      cdl_expirations: {
        title: "CDL Expirations",
        cfr: "49 CFR § 383",
        items: overdueCdls.map(d => ({
          who: `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Driver",
          meta: fmtExpiresLabel(d.cdl_expires_on || null),
          status: fmtOverduePill(d.cdl_expires_on || null),
          statusKind: "overdue" as const,
        })),
        cta: { href: "/app/drivers", label: "Open drivers →" },
      },
      medical_certs: {
        title: "Medical Certificates",
        cfr: "49 CFR § 391.43",
        items: overdueMeds.map(d => ({
          who: `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Driver",
          meta: fmtExpiresLabel(d.medical_card_expires_on || null),
          status: fmtOverduePill(d.medical_card_expires_on || null),
          statusKind: "overdue" as const,
        })),
        cta: { href: "/app/dq-files", label: "Upload new cert →" },
      },
      preventive_maint: {
        title: "Preventive Maintenance",
        cfr: "49 CFR § 396.3 / § 396.17",
        items: overduePm.map(v => ({
          who: v.license_plate ? `Unit ${v.license_plate}` : "Unit",
          meta: `PM due ${fmtExpiresLabel(v.next_dot_inspection_due || null).replace("Expires ", "")}`,
          status: fmtOverduePill(v.next_dot_inspection_due || null),
          statusKind: "overdue" as const,
        })),
        cta: { href: "/app/vehicles", label: "Open vehicles →" },
      },
    };

    // ─────────────────────────────────────────────────────────────────────
    // DRIVERS section — status donut + CDL bucket bar
    // ─────────────────────────────────────────────────────────────────────
    const driverStatus = [
      { label: "Active",     count: drvRows.filter(d => d.status === "active").length,        color: "var(--success)" },
      { label: "On leave",   count: drvRows.filter(d => d.status === "on_leave").length,      color: "var(--accent)" },
      { label: "Inactive",   count: drvRows.filter(d => d.status === "inactive").length,      color: "var(--fg-muted)" },
      { label: "Terminated", count: drvRows.filter(d => d.status === "terminated").length,    color: "var(--danger)" },
    ];

    const bucketCounts = { expired: 0, "0-30": 0, "30-60": 0, "60-90": 0, "90+": 0 };
    for (const d of drvRows) {
      if (!d.cdl_expires_on) continue;
      const t = new Date(d.cdl_expires_on).getTime();
      if (t < now) bucketCounts.expired++;
      else if (t <= inDays(30)) bucketCounts["0-30"]++;
      else if (t <= inDays(60)) bucketCounts["30-60"]++;
      else if (t <= inDays(90)) bucketCounts["60-90"]++;
      else bucketCounts["90+"]++;
    }
    const cdlBuckets = [
      { label: "Expired",     count: bucketCounts.expired,  color: "var(--danger)" },
      { label: "0-30 days",   count: bucketCounts["0-30"],  color: "var(--danger)" },
      { label: "30-60 days",  count: bucketCounts["30-60"], color: "var(--warning)" },
      { label: "60-90 days",  count: bucketCounts["60-90"], color: "var(--warning)" },
      { label: "Over 90 days",count: bucketCounts["90+"],   color: "var(--success)" },
    ];

    // ─────────────────────────────────────────────────────────────────────
    // VEHICLES section — types donut + maintenance KPIs
    // ─────────────────────────────────────────────────────────────────────
    const vehicleTypes = [
      { label: "Tractor",        count: tractors,       color: "var(--accent)" },
      { label: "Trailer",        count: trailers,       color: "var(--warning)" },
      { label: "Straight Truck", count: straightTrucks, color: "var(--success)" },
      { label: "Van",            count: vehRows.filter(v => v.vehicle_type === "van" || v.vehicle_type === "other").length, color: "var(--fg-muted)" },
    ];

    const inspectionOverdue = vehRows.filter(v => v.next_dot_inspection_due && v.next_dot_inspection_due < today).length;
    const inspection30d = vehRows.filter(v => v.next_dot_inspection_due && v.next_dot_inspection_due >= today && new Date(v.next_dot_inspection_due).getTime() <= inDays(30)).length;
    const maintenanceKpis = [
      { label: "INSPECTION OVERDUE", value: inspectionOverdue, sub: "past annual",  tone: inspectionOverdue > 0 ? "danger" : "ok" },
      { label: "INSPECTION ≤30D",    value: inspection30d,     sub: "next 30 days", tone: inspection30d > 0 ? "warn" : "ok" },
      { label: "PM OVERDUE",         value: inspectionOverdue, sub: "past due",     tone: inspectionOverdue > 0 ? "warn" : "ok" },
      { label: "PM ≤30D",            value: inspection30d,     sub: "next 30 days", tone: "ok" },
    ];

    return json({
      ok: true,
      demo: false,
      carrier_id: carrierId,
      data: {
        carrier: {
          name: carrierName,
          dot_number: dot,
          mc_number: carrier.mc_number || "—",
          safety_rating: carrier.safety_rating || "Unrated",
        },
        fleet: {
          active_drivers: activeDrivers,
          drivers_on_roster: driversOnRoster,
          power_units: powerUnits,
          tractors,
          straight_trucks: straightTrucks,
          trailers,
          open_alerts: openAlerts,
          open_alerts_urgent: urgent,
          cdls_expired: cdlsExpired,
          mecs_expiring_30d: mecsExpiring30d,
          dq_score_pct: dqScorePct,
          dq_docs_present: dqValid,
          dq_docs_total: dqTarget,
          compliance_pct: overallCompliancePct,
        },
        compliance_bars: complianceBars,
        csa_basics: csaBasics, // null when no snapshot exists → client falls back to demo
        action_items: actionItems,
        driver_status: driverStatus,
        cdl_buckets: cdlBuckets,
        vehicle_types: vehicleTypes,
        maintenance_kpis: maintenanceKpis,
      },
    });
  } catch (err) {
    return json({ ok: false, demo: true, reason: `error: ${err instanceof Error ? err.message : String(err)}` });
  }
};
