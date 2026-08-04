/**
 * GET /api/dashboard?carrier_id=<uuid>
 *
 * Returns the full Compliance Command Center payload — real values computed
 * from Supabase where possible, demo-shape preserved everywhere else.
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE
 * Auth: verified Supabase session plus server-resolved carrier membership.
 */
import { correlationId, requireTenant, securityError, tenantJson, type SecurityEnv } from "../_shared/request-security";

type Env = SecurityEnv;

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  Prefer: "count=exact",
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
  const url = new URL(ctx.request.url);
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, url.searchParams.get("carrier_id")); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);

  const SUPABASE_URL = ctx.env.SUPABASE_URL;
  const SR = ctx.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SR) {
    return securityError(503, "service_unavailable", requestId);
  }

  const carrierId = authority.carrierId;

  try {
    const sinceISO = new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0,10);
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0,10);
    const [{ rows: carrierRows }, drivers, vehicles, dqDocs, csa, saferRows, inspections, accidents, daTests, hosLogs, training] = await Promise.all([
      pgSelect(SUPABASE_URL, SR, "compass_carriers", `select=name,usdot_number,mc_number&id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_drivers", `select=id,first_name,last_name,cdl_expires_on,medical_card_expires_on,status,hire_date&carrier_id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_vehicles", `select=id,license_plate,status,vehicle_type,next_dot_inspection_due&carrier_id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_dq_documents", `select=id,driver_id,doc_type,expires_on&carrier_id=eq.${carrierId}&order=expires_on.asc.nullslast&limit=500`),
      pgSelect(SUPABASE_URL, SR, "compass_csa_snapshots", `select=unsafe_driving,crash_indicator,hos_compliance,vehicle_maint,hazmat,driver_fitness,ctrl_substances&carrier_id=eq.${carrierId}&order=taken_at.desc&limit=1`),
      pgSelect(SUPABASE_URL, SR, "compass_carrier_safer", `select=safety_rating,rating_date,rating_type,operating_authority,annual_miles,reported_power_units,reported_drivers,last_mcs150_filed,bipd_insurance_amount_cents,bipd_required_amount_cents,cargo_insurance_amount_cents,crashes_24mo_total,crashes_24mo_fatal,crashes_24mo_injury,driver_oos_rate_pct,driver_oos_national_pct,vehicle_oos_rate_pct,vehicle_oos_national_pct,last_synced_at&carrier_id=eq.${carrierId}`),
      pgSelect(SUPABASE_URL, SR, "compass_inspections", `select=inspection_date,oos_driver,oos_vehicle,violation_count&carrier_id=eq.${carrierId}&inspection_date=gte.${sinceISO}&order=inspection_date.desc&limit=500`),
      pgSelect(SUPABASE_URL, SR, "compass_accidents", `select=id,accident_date,preventable,driver_id,description,cause_category&carrier_id=eq.${carrierId}&order=accident_date.desc&limit=100`),
      pgSelect(SUPABASE_URL, SR, "compass_da_tests", `select=test_type,result,collected_on&carrier_id=eq.${carrierId}&collected_on=gte.${sinceISO}&order=collected_on.desc&limit=500`),
      pgSelect(SUPABASE_URL, SR, "compass_hos_logs", `select=total_drive_minutes,violations&carrier_id=eq.${carrierId}&log_date=gte.${since30}&order=log_date.desc&limit=500`),
      pgSelect(SUPABASE_URL, SR, "compass_training_records", `select=expires_on,course_name,course_category,driver_id&carrier_id=eq.${carrierId}&order=completed_on.desc&limit=500`),
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
    const dqScorePct = dqTarget > 0 ? Math.min(100, Math.round((dqValid / dqTarget) * 100)) : 0;

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
    function pctWithValidDoc(docTypes: string[]): number | null {
      if (drvRows.length === 0) return null;
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
    const medPct = drvRows.length === 0 ? null : Math.round((drvRows.filter(d => d.medical_card_expires_on && d.medical_card_expires_on >= today).length / drvRows.length) * 100);
    const daPct = pctWithValidDoc(["pre_employment_drug_test", "drug_test_result", "clearinghouse_full", "clearinghouse_query"]);
    type TrainRow = { expires_on?: string; course_name?: string; course_category?: string; driver_id?: string };
    type HosRow = { total_drive_minutes?: number; violations?: unknown[] };
    const trainRows = training.rows as TrainRow[];
    const hosRows = hosLogs.rows as HosRow[];
    const driversWithCurrentTraining = new Set(
      trainRows
        .filter((row) => row.driver_id && (!row.expires_on || row.expires_on >= today))
        .map((row) => row.driver_id),
    ).size;
    const trainingPct = drvRows.length === 0 ? null : Math.round((driversWithCurrentTraining / drvRows.length) * 100);
    const vehMaintPct = vehRows.length === 0 ? null : Math.round((vehRows.filter(v => !v.next_dot_inspection_due || v.next_dot_inspection_due >= today).length / vehRows.length) * 100);
    const hosPct = hosRows.length === 0
      ? null
      : Math.round((hosRows.filter((row) => !Array.isArray(row.violations) || row.violations.length === 0).length / hosRows.length) * 100);

    const complianceBar = (label: string, pct: number | null) => ({
      label,
      pct,
      color: pct == null ? "unknown" : pct >= 90 ? "green" : pct >= 75 ? "yellow" : "red",
    });
    const complianceBars = [
      complianceBar("Driver Qualification (CDL)", cdlPct),
      complianceBar("Medical Certificates", medPct),
      complianceBar("HOS / ELD", hosPct),
      complianceBar("Drug & Alcohol", daPct),
      complianceBar("Training Records", trainingPct),
      complianceBar("Vehicle Maintenance", vehMaintPct),
    ];
    const availableComplianceValues = complianceBars.flatMap((bar) => bar.pct == null ? [] : [bar.pct]);
    const overallCompliancePct = availableComplianceValues.length
      ? Math.round(availableComplianceValues.reduce((sum, value) => sum + value, 0) / availableComplianceValues.length)
      : null;

    // ─────────────────────────────────────────────────────────────────────
    // CSA BASICS — from latest snapshot if present
    // ─────────────────────────────────────────────────────────────────────
    type CsaRow = { unsafe_driving?: number; crash_indicator?: number; hos_compliance?: number; vehicle_maint?: number; hazmat?: number; driver_fitness?: number; ctrl_substances?: number };
    const latestCsa = csa.rows[0] as CsaRow | undefined;
    const csaBasic = (name: string, msr: number | undefined, threshold: number) => {
      if (typeof msr !== "number") return null;
      const status: "ok" | "warn" | "alert" = msr >= threshold ? "alert" : msr >= threshold * 0.75 ? "warn" : "ok";
      return { name, msr, threshold, status };
    };
    const csaBasics = latestCsa
      ? [
          csaBasic("Unsafe Driving", latestCsa.unsafe_driving, 65),
          csaBasic("Crash Indicator", latestCsa.crash_indicator, 65),
          csaBasic("HOS Compliance", latestCsa.hos_compliance, 65),
          csaBasic("Vehicle Maint.", latestCsa.vehicle_maint, 80),
          csaBasic("Hazmat", latestCsa.hazmat, 80),
          csaBasic("Driver Fitness", latestCsa.driver_fitness, 80),
          csaBasic("Ctrl. Substances", latestCsa.ctrl_substances, 80),
        ].filter((basic): basic is NonNullable<typeof basic> => basic != null)
      : null;

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

    // ── FMCSA SAFER carrier profile
    type SaferRow = {
      safety_rating?: string; rating_date?: string; rating_type?: string; operating_authority?: string;
      annual_miles?: number; reported_power_units?: number; reported_drivers?: number;
      last_mcs150_filed?: string;
      bipd_insurance_amount_cents?: number; bipd_required_amount_cents?: number; cargo_insurance_amount_cents?: number;
      crashes_24mo_total?: number; crashes_24mo_fatal?: number; crashes_24mo_injury?: number;
      driver_oos_rate_pct?: number; driver_oos_national_pct?: number;
      vehicle_oos_rate_pct?: number; vehicle_oos_national_pct?: number;
      last_synced_at?: string;
    };
    const safer = (saferRows.rows[0] as SaferRow | undefined) || {};
    const fmtMoney = (cents?: number) => cents == null ? "—" : cents >= 100_000_000 ? `$${(cents/100_000_000).toFixed(0)}M` : cents >= 100_000 ? `$${(cents/100_000).toFixed(0)}K` : `$${(cents/100).toFixed(0)}`;

    // ── INSPECTIONS — last 6 months stacked bar (clean/violations/oos)
    type InspRow = { inspection_date?: string; oos_driver?: boolean; oos_vehicle?: boolean; violation_count?: number };
    const inspRows = inspections.rows as InspRow[];
    const monthLabels: string[] = [];
    const monthKeys: string[] = [];
    {
      const d = new Date(); d.setDate(1);
      for (let i = 5; i >= 0; i--) {
        const dt = new Date(d); dt.setMonth(dt.getMonth() - i);
        monthKeys.push(dt.toISOString().slice(0, 7));
        monthLabels.push(dt.toLocaleString("en-US", { month: "short", year: "2-digit" }).replace(" ", " "));
      }
    }
    const inspBars = monthLabels.map((label, i) => {
      const k = monthKeys[i];
      const rows = inspRows.filter(r => r.inspection_date && r.inspection_date.startsWith(k));
      const oos = rows.filter(r => r.oos_driver || r.oos_vehicle).length;
      const viol = rows.filter(r => (r.violation_count || 0) > 0 && !(r.oos_driver || r.oos_vehicle)).length;
      const clean = rows.length - oos - viol;
      return { label, clean, violations: viol, oos };
    });

    // ── ACCIDENTS — unclassified ones feed "Incidents Awaiting Review" action card
    type AccRow = { id: string; accident_date?: string; preventable?: string | null; driver_id?: string; description?: string; cause_category?: string };
    const accRows = accidents.rows as AccRow[];
    const unclassifiedAccidents = accRows.filter(a => !a.preventable || a.preventable === "undetermined");

    // ── D&A — tests-by-type stacked + monthly trend
    type DaRow = { test_type?: string; result?: string; collected_on?: string };
    const daRows = daTests.rows as DaRow[];
    const daResultMap: Record<string, "negative"|"dilute"|"canceled"|"positive"|"refusal"> = { negative: "negative", dilute_negative: "dilute", cancelled: "canceled", positive: "positive", refusal: "refusal" };
    const daResults = ["negative","dilute_negative","cancelled","positive","refusal"] as const;
    const daTypes = ["pre_employment","random","post_accident","reasonable_suspicion"] as const;
    const daTestsByType = daTypes.map(t => {
      const rs = daRows.filter(r => r.test_type === t);
      const out: Record<string, number> = { type: 0 as unknown as number };
      const counts: Record<string, number> = {};
      counts.negative = rs.filter(x => x.result === "negative").length;
      counts.dilute = rs.filter(x => x.result === "dilute_negative").length;
      counts.canceled = rs.filter(x => x.result === "cancelled").length;
      counts.positive = rs.filter(x => x.result === "positive").length;
      counts.refusal = rs.filter(x => x.result === "refusal").length;
      return { type: t.replace(/_/g, " "), ...counts };
    });
    const daMonthly = monthLabels.map((label, i) => {
      const k = monthKeys[i];
      const rs = daRows.filter(r => r.collected_on && r.collected_on.startsWith(k));
      return { label, total: rs.length, positives: rs.filter(r => r.result === "positive" || r.result === "refusal").length };
    });

    // ── HOS — last 30 days roll-up
    const totalLogs = hosRows.length;
    const totalDriveMins = hosRows.reduce((s, r) => s + (r.total_drive_minutes || 0), 0);
    const avgDriveMins = totalLogs > 0 ? Math.round(totalDriveMins / totalLogs) : 0;
    const hosViolations = hosRows.filter(r => Array.isArray(r.violations) && r.violations.length > 0).length;
    const formatHM = (mins: number) => {
      const h = Math.floor(mins / 60), m = mins % 60;
      return `${h}h ${m.toString().padStart(2, '0')}m`;
    };
    const hosMetrics = {
      total_logs_30d: totalLogs,
      violations_30d: hosViolations,
      avg_drive: formatHM(avgDriveMins),
      total_miles_30d: Math.round(totalDriveMins * 0.85),
    };

    // ── Document expiration stacked bar (CDL / MEC / Training across 0-30, 31-60, 61-90)
    function bucketDocs(docFilter: (d: DocRow | DrvRow) => string | null | undefined, rows: Array<DocRow | DrvRow>) {
      let b0 = 0, b1 = 0, b2 = 0;
      for (const r of rows) {
        const exp = docFilter(r);
        if (!exp) continue;
        const t = new Date(exp).getTime();
        if (t < now) continue;
        if (t <= inDays(30)) b0++;
        else if (t <= inDays(60)) b1++;
        else if (t <= inDays(90)) b2++;
      }
      return { "0_30": b0, "31_60": b1, "61_90": b2 };
    }
    const docExpirations = [
      { name: "CDL",      ...bucketDocs(d => (d as DrvRow).cdl_expires_on, drvRows) },
      { name: "MEC",      ...bucketDocs(d => (d as DrvRow).medical_card_expires_on, drvRows) },
      { name: "Training", ...bucketDocs(d => (d as TrainRow).expires_on, trainRows) },
    ];

    // ── Training topics stacked bar (completed/in-progress/expired)
    const trainingTopicNames = ["Supervisor D&A","Pre-Trip Inspection","Defensive Driving","ELDT BTW","Distracted Driving","Cargo Securement","HOS Refresher","ELDT Theory","Winter Driving","Hazmat"];
    const trainingTopics = trainingTopicNames.map(name => {
      const rows = trainRows.filter(r => r.course_name === name);
      const completed = rows.filter(r => !r.expires_on || r.expires_on >= today).length;
      const expired = rows.filter(r => r.expires_on && r.expires_on < today).length;
      const inProgress = Math.max(0, drvRows.length - rows.length);  // drivers without record yet
      return { name, completed, in_progress: inProgress, expired };
    });

    // ── Action items rows 2 — incidents awaiting · ELDT incomplete · training expiring · clearinghouse owed
    const driverIdByName = (driverId: string) => drvRows.find(d => d.id === driverId);
    const incidentsAwaiting = {
      title: "Incidents Awaiting Review",
      cfr: "Preventability classification",
      items: unclassifiedAccidents.slice(0, 5).map(a => {
        const drv = driverIdByName(a.driver_id || "");
        const drvName = drv ? `${drv.first_name || ""} ${drv.last_name || ""}`.trim() : "Driver";
        return {
          who: a.accident_date ? `${new Date(a.accident_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${(a.cause_category || "incident").replace(/_/g," ")}` : "incident",
          meta: `${drvName} · ${a.description || ""}`,
          status: "CLASSIFY",
          statusKind: "warn" as const,
        };
      }),
      cta: { href: "/app/accidents", label: "Open register →" },
    };

    const driversMissingEldt = drvRows.filter(d => !trainRows.some(t => t.driver_id === d.id && (t.course_name === "ELDT BTW" || t.course_name === "ELDT Theory")));
    const eldtIncomplete = {
      title: "ELDT Incomplete",
      cfr: "49 CFR § 380",
      items: driversMissingEldt.slice(0, 5).map(d => ({
        who: `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Driver",
        meta: "Missing: theory + BTW",
        status: "LOG ELDT",
        statusKind: "warn" as const,
      })),
      cta: { href: "/app/training", label: "Open training log →" },
    };

    const expiredTraining = trainRows.filter(t => t.expires_on && t.expires_on < today).slice(0, 5);
    const trainingExpiring = {
      title: "Training Expiring / Expired",
      cfr: "49 CFR Part 380",
      items: expiredTraining.map(t => {
        const drv = driverIdByName(t.driver_id || "");
        const drvName = drv ? `${drv.first_name || ""} ${drv.last_name || ""}`.trim() : "Driver";
        const days = Math.floor((Date.now() - new Date(t.expires_on || today).getTime()) / 86_400_000);
        return { who: t.course_name || "Course", meta: `${drvName} · ${t.expires_on ? new Date(t.expires_on).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}`, status: `${days}d OVERDUE`, statusKind: "overdue" as const };
      }),
      cta: { href: "/app/training", label: "Open training log →" },
    };

    const positiveDaTests = daRows.filter(r => r.result === "positive" || r.result === "refusal").slice(0, 5);
    const clearinghouseOwed = {
      title: "Clearinghouse Reporting Owed",
      cfr: "49 CFR § 382.705 · 3 business days",
      items: positiveDaTests.map(r => {
        return {
          who: r.test_type ? `positive · ${r.test_type.replace(/_/g," ")}` : "positive",
          meta: r.collected_on ? new Date(r.collected_on).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
          status: "REPORT",
          statusKind: "warn" as const,
        };
      }),
      cta: { href: "/app/drug-alcohol", label: "Mark reported →" },
    };

    return tenantJson(ctx.request, ctx.env, {
      ok: true,
      demo: false,
      carrier_id: carrierId,
      data: {
        carrier: {
          name: carrierName,
          dot_number: dot,
          mc_number: carrier.mc_number || "—",
          safety_rating: safer.safety_rating || "Unrated",
          rating_date: safer.rating_date || null,
          rating_type: safer.rating_type || null,
          operating_authority: safer.operating_authority || null,
          annual_miles: safer.annual_miles || 0,
          reported_power_units: safer.reported_power_units || 0,
          reported_drivers: safer.reported_drivers || 0,
          last_mcs150_filed: safer.last_mcs150_filed || null,
          bipd_insurance: `${fmtMoney(safer.bipd_insurance_amount_cents)} on file / ${fmtMoney(safer.bipd_required_amount_cents)} req`,
          cargo_insurance: fmtMoney(safer.cargo_insurance_amount_cents),
          crashes_24mo_total: safer.crashes_24mo_total || 0,
          crashes_24mo_fatal: safer.crashes_24mo_fatal || 0,
          crashes_24mo_injury: safer.crashes_24mo_injury || 0,
          driver_oos_rate_pct: safer.driver_oos_rate_pct ?? 0,
          driver_oos_national_pct: safer.driver_oos_national_pct ?? 6.47,
          vehicle_oos_rate_pct: safer.vehicle_oos_rate_pct ?? 0,
          vehicle_oos_national_pct: safer.vehicle_oos_national_pct ?? 22.28,
          last_synced_at: safer.last_synced_at || null,
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
          // SAFER-derived (mirrored onto fleet for page JSX)
          bipd_insurance: `${fmtMoney(safer.bipd_insurance_amount_cents)} on file / ${fmtMoney(safer.bipd_required_amount_cents)} req`,
          cargo_insurance: fmtMoney(safer.cargo_insurance_amount_cents),
          crashes_24mo_total: safer.crashes_24mo_total || 0,
          crashes_24mo_fatal: safer.crashes_24mo_fatal || 0,
          crashes_24mo_injury: safer.crashes_24mo_injury || 0,
          driver_oos_rate_pct: safer.driver_oos_rate_pct ?? 0,
          driver_oos_national_pct: safer.driver_oos_national_pct ?? 6.47,
          vehicle_oos_rate_pct: safer.vehicle_oos_rate_pct ?? 0,
          vehicle_oos_national_pct: safer.vehicle_oos_national_pct ?? 22.28,
        },
        compliance_bars: complianceBars,
        csa_basics: csaBasics, // null when no snapshot exists → client falls back to demo
        action_items: actionItems,
        driver_status: driverStatus,
        cdl_buckets: cdlBuckets,
        vehicle_types: vehicleTypes,
        maintenance_kpis: maintenanceKpis,
        inspections_bars: inspBars,
        da_tests_by_type: daTestsByType,
        da_monthly: daMonthly,
        hos_metrics: hosMetrics,
        doc_expirations: docExpirations,
        training_topics: trainingTopics,
        action_items_row2: { incidents_awaiting: incidentsAwaiting, eldt_incomplete: eldtIncomplete, training_expiring: trainingExpiring, clearinghouse_owed: clearinghouseOwed },
      },
    });
  } catch {
    console.error("dashboard request failed", { correlation_id: requestId });
    return securityError(500, "request_failed", requestId);
  }
};
