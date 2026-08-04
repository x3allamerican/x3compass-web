const DAY_MS = 86_400_000;
const INSURANCE_TYPES = ["insurance", "bmc-91", "mcs-90", "liability", "cargo_policy"];

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

function addYear(value) {
  const source = parseIso(value, "sourceDate");
  const year = source.getUTCFullYear() + 1;
  const month = source.getUTCMonth();
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(year, month, Math.min(source.getUTCDate(), last))));
}

function classify(dueDate, asOf) {
  const daysRemaining = Math.round((parseIso(dueDate, "dueDate").getTime() - parseIso(asOf, "asOf").getTime()) / DAY_MS);
  if (daysRemaining > 60) return null;
  return { daysRemaining, urgency: daysRemaining < 0 ? "overdue" : daysRemaining <= 30 ? "due_30" : "due_60" };
}

function driverName(driver) {
  return `${driver.first_name || ""} ${driver.last_name || ""}`.trim() || driver.id || "Unnamed driver";
}

function makeItem(fields, asOf) {
  const timing = classify(fields.dueDate, asOf);
  return timing ? { ...fields, ...timing } : null;
}

function activeDrivers(rows) {
  return (Array.isArray(rows) ? rows : []).filter((row) => String(row?.status || "active").toLowerCase() === "active");
}

function insuranceType(value) {
  const type = String(value || "").toLowerCase().replaceAll(" ", "_");
  return INSURANCE_TYPES.some((token) => type.includes(token));
}

export function buildExpirationDigest(input = {}) {
  const asOf = input.asOf;
  parseIso(asOf, "asOf");
  const drivers = activeDrivers(input.drivers);
  const byDriver = new Map(drivers.map((driver) => [driver.id, driver]));
  const items = [];

  for (const driver of drivers) {
    if (validIso(driver.cdl_expires_on)) items.push(makeItem({
      id: `cdl:${driver.id}`, category: "cdl", subject: driverName(driver), sourceDate: driver.cdl_expires_on,
      dueDate: driver.cdl_expires_on, evidence: `Recorded CDL expiration: ${driver.cdl_expires_on}.`, citation: "49 CFR 383.23",
    }, asOf));
    if (validIso(driver.medical_card_expires_on)) items.push(makeItem({
      id: `mec:${driver.id}`, category: "mec", subject: driverName(driver), sourceDate: driver.medical_card_expires_on,
      dueDate: driver.medical_card_expires_on, evidence: `Recorded medical certificate expiration: ${driver.medical_card_expires_on}.`, citation: "49 CFR 391.45",
    }, asOf));

    const latest = (Array.isArray(input.mvrRecords) ? input.mvrRecords : [])
      .filter((record) => record?.driver_id === driver.id && validIso(record?.pulled_on))
      .sort((a, b) => b.pulled_on.localeCompare(a.pulled_on))[0];
    if (latest) {
      const dueDate = addYear(latest.pulled_on);
      items.push(makeItem({
        id: `mvr:${driver.id}`, category: "mvr", subject: driverName(driver), sourceDate: latest.pulled_on,
        dueDate, evidence: `Latest recorded MVR pull: ${latest.pulled_on}.`, citation: "49 CFR 391.25",
      }, asOf));
    }
  }

  for (const document of Array.isArray(input.insuranceDocuments) ? input.insuranceDocuments : []) {
    if (!insuranceType(document?.doc_type) || !validIso(document?.expires_on)) continue;
    const driver = document.driver_id ? byDriver.get(document.driver_id) : null;
    items.push(makeItem({
      id: `insurance:${document.id}`, category: "insurance", subject: driver ? driverName(driver) : "Carrier insurance",
      sourceDate: document.expires_on, dueDate: document.expires_on,
      evidence: `Recorded ${String(document.doc_type).replaceAll("_", " ")} expiration: ${document.expires_on}.`, citation: "49 CFR 387.7",
    }, asOf));
  }

  const normalized = items.filter(Boolean).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
  const counts = { total: normalized.length, overdue: 0, due_30: 0, due_60: 0 };
  for (const entry of normalized) counts[entry.urgency] += 1;
  return { carrier: input.carrier, items: normalized, counts };
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function urgencyLabel(item) {
  if (item.urgency === "overdue") return `${Math.abs(item.daysRemaining)} day${Math.abs(item.daysRemaining) === 1 ? "" : "s"} overdue`;
  return `due in ${item.daysRemaining} day${item.daysRemaining === 1 ? "" : "s"}`;
}

export function renderExpirationDigestHtml(digest) {
  const rows = digest.items.map((entry) => `<li><strong>${escapeHtml(entry.subject)}</strong> — ${escapeHtml(entry.category.toUpperCase())} ${escapeHtml(urgencyLabel(entry))} (${escapeHtml(entry.dueDate)}) · ${escapeHtml(entry.citation)}</li>`).join("");
  return `<h1>${escapeHtml(digest.carrier?.name || "Carrier")} · document expiration digest</h1><p>${digest.counts.total} dated item${digest.counts.total === 1 ? "" : "s"} require review within the 60-day window.</p><ul>${rows}</ul><p>Decision support only. Confirm source records and required action with a qualified reviewer.</p>`;
}

export function renderExpirationDigestText(digest) {
  const rows = digest.items.map((entry) => `- ${entry.subject} — ${entry.category.toUpperCase()} ${urgencyLabel(entry)} (${entry.dueDate}) · ${entry.citation}`);
  return [`${digest.carrier?.name || "Carrier"} · document expiration digest`, `${digest.counts.total} dated items require review within the 60-day window.`, ...rows, "Decision support only. Confirm source records and required action with a qualified reviewer."].join("\n");
}
