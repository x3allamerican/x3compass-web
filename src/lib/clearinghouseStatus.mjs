const COMPLETE_RESULTS = new Set(["no_information", "information"]);
const QUERY_TYPES = new Set(["annual_limited", "pre_employment_full", "triggered_full"]);
const DAY = 86_400_000;
const GUARDRAIL = "Decision support only. Missing or recorded Clearinghouse evidence requires human review before any safety-sensitive duty decision.";

function date(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return null;
  const calendarDate = value.slice(0, 10);
  const source = value.length === 10 ? `${calendarDate}T00:00:00Z` : value;
  const parsed = new Date(source);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === calendarDate ? new Date(`${calendarDate}T00:00:00Z`) : null;
}

function addYear(value) {
  const source = date(value);
  if (!source) return null;
  const year = source.getUTCFullYear() + 1;
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  const candidate = new Date(Date.UTC(year, month, day));
  if (candidate.getUTCMonth() !== month) return `${year}-02-28`;
  return candidate.toISOString().slice(0, 10);
}

function latest(rows, field) {
  return rows.filter((row) => date(row[field])).sort((a, b) => String(b[field]).localeCompare(String(a[field])))[0] || null;
}

/**
 * @param {{
 *   asOf: string,
 *   drivers?: Array<Record<string, any>>,
 *   queries?: Array<Record<string, any>>,
 *   consents?: Array<Record<string, any>>,
 *   violations?: Array<Record<string, any>>
 * }} input
 */
export function buildClearinghouseStatus({ asOf, drivers = [], queries = [], consents = [], violations = [] }) {
  const today = date(asOf);
  if (!today) throw new Error("asOf must be a valid YYYY-MM-DD date");
  const activeDrivers = drivers.filter((driver) => driver.status === "active" || driver.status === "pending_hire");
  const rows = activeDrivers.map((driver) => {
    const driverQueries = queries.filter((query) => query.driver_id === driver.id && QUERY_TYPES.has(query.query_type) && COMPLETE_RESULTS.has(query.result) && date(query.query_run_at));
    const lastCompleted = latest(driverQueries, "query_run_at");
    const annualDueOn = lastCompleted ? addYear(lastCompleted.query_run_at) : null;
    let annualStatus = "missing_evidence";
    if (annualDueOn) {
      const due = date(annualDueOn);
      const days = Math.round((due.valueOf() - today.valueOf()) / DAY);
      annualStatus = days < 0 ? "overdue" : days <= 30 ? "due" : "current";
    }
    const preEmploymentFull = driverQueries.some((query) => query.query_type === "pre_employment_full") ? "recorded" : "missing_evidence";
    const consent = latest(consents.filter((item) => item.driver_id === driver.id), "consent_requested_at");
    let consentStatus = "not_recorded";
    if (consent) {
      if (consent.consent_revoked_at) consentStatus = "revoked";
      else if (!consent.consent_received_at) consentStatus = "pending";
      else if (date(consent.consent_expires_on) && date(consent.consent_expires_on).valueOf() < today.valueOf()) consentStatus = "expired";
      else consentStatus = "received";
    }
    const prohibitedStatusRecorded = violations.some((violation) => violation.driver_id === driver.id && violation.prohibited_status_active === true);
    return {
      driverId: driver.id,
      driverName: `${driver.first_name || ""} ${driver.last_name || ""}`.trim() || "Unnamed driver",
      driverStatus: driver.status,
      hireDate: driver.hire_date || null,
      annualStatus,
      annualDueOn,
      lastCompletedQueryOn: lastCompleted?.query_run_at || null,
      lastCompletedQueryType: lastCompleted?.query_type || null,
      preEmploymentFull,
      consentStatus,
      prohibitedStatusRecorded,
    };
  });
  return {
    drivers: rows,
    summary: {
      totalDrivers: rows.length,
      current: rows.filter((row) => row.annualStatus === "current").length,
      due: rows.filter((row) => row.annualStatus === "due").length,
      overdue: rows.filter((row) => row.annualStatus === "overdue").length,
      missingEvidence: rows.filter((row) => row.annualStatus === "missing_evidence").length,
      prohibitedStatusRecorded: rows.filter((row) => row.prohibitedStatusRecorded).length,
    },
    citations: ["49 CFR 382.701(a)", "49 CFR 382.701(b)", "49 CFR 382.703"],
    guardrail: GUARDRAIL,
  };
}
