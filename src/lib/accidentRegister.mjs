const GUARDRAIL = "Decision support only. Verify the source record and register scope with a qualified reviewer.";

function parseIso(value, field) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError(`${field} must be an ISO YYYY-MM-DD date`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new TypeError(`${field} must be a valid ISO YYYY-MM-DD date`);
  return date;
}

function validIso(value) {
  try { return value ? parseIso(value, "date") : null; } catch { return null; }
}

function iso(date) { return date.toISOString().slice(0, 10); }

function addThreeYears(value) {
  const source = parseIso(value, "accidentDate");
  const year = source.getUTCFullYear() + 3;
  const month = source.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(year, month, Math.min(source.getUTCDate(), lastDay))));
}

function driverName(driver) {
  return driver ? `${driver.first_name || ""} ${driver.last_name || ""}`.trim() : "";
}

export function buildAccidentRegister(input = {}) {
  const asOf = input.asOf;
  const today = parseIso(asOf, "asOf");
  const drivers = new Map((Array.isArray(input.drivers) ? input.drivers : []).map((driver) => [driver.id, driver]));
  const records = (Array.isArray(input.accidents) ? input.accidents : []).map((accident) => {
    const accidentDate = validIso(accident.accident_date) ? accident.accident_date : null;
    const linkedName = driverName(drivers.get(accident.driver_id));
    const storedName = typeof accident.driver_name === "string" ? accident.driver_name.trim() : "";
    const name = linkedName || storedName || null;
    const city = typeof accident.city === "string" && accident.city.trim() ? accident.city.trim() : null;
    const state = typeof accident.state === "string" && accident.state.trim() ? accident.state.trim().toUpperCase() : null;
    const fatalities = Number.isInteger(accident.fatalities) && accident.fatalities >= 0 ? accident.fatalities : null;
    const injuries = Number.isInteger(accident.injuries) && accident.injuries >= 0 ? accident.injuries : null;
    const hazmatReleased = typeof accident.hazmat_released === "boolean" ? accident.hazmat_released : null;
    const missingFields = [];
    if (!accidentDate) missingFields.push("accident_date");
    if (!city) missingFields.push("city");
    if (!state) missingFields.push("state");
    if (!name) missingFields.push("driver_name");
    if (fatalities === null) missingFields.push("fatalities");
    if (injuries === null) missingFields.push("injuries");
    if (hazmatReleased === null) missingFields.push("hazmat_released");
    const retentionThrough = accidentDate ? addThreeYears(accidentDate) : null;
    const retentionStatus = !retentionThrough
      ? "date_missing"
      : parseIso(retentionThrough, "retentionThrough").getTime() < today.getTime() ? "retention_complete" : "retain";
    return {
      id: accident.id, accidentDate, city, state, driverName: name, fatalities, injuries, hazmatReleased,
      retentionThrough, retentionStatus, missingFields, citation: "49 CFR 390.15(b)(1)", guardrail: GUARDRAIL,
    };
  }).sort((a, b) => (b.accidentDate || "").localeCompare(a.accidentDate || "") || String(a.id).localeCompare(String(b.id)));

  const counts = { total: records.length, complete: 0, missing_evidence: 0, retain: 0, retention_complete: 0, date_missing: 0 };
  for (const record of records) {
    counts[record.missingFields.length === 0 ? "complete" : "missing_evidence"] += 1;
    counts[record.retentionStatus] += 1;
  }
  return { records, counts };
}
