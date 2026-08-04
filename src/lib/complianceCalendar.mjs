const DAY_MS = 86_400_000;
const GUARDRAIL = "Decision support only. Confirm applicability, source records, and required action with a qualified reviewer.";

function parseIso(value, field) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${field} must be an ISO YYYY-MM-DD date`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${field} must be a valid ISO YYYY-MM-DD date`);
  }
  return date;
}

function validIso(value) {
  try { return value ? parseIso(value, "date") : null; } catch { return null; }
}

function iso(date) { return date.toISOString().slice(0, 10); }

function addCalendarYear(value) {
  const date = parseIso(value, "source date");
  const year = date.getUTCFullYear() + 1;
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(year, month, Math.min(day, lastDay))));
}

function classify(dueDate, asOf) {
  const due = parseIso(dueDate, "dueDate");
  const today = parseIso(asOf, "asOf");
  const days = Math.round((due.getTime() - today.getTime()) / DAY_MS);
  if (days < 0) return "overdue";
  if (days <= 30) return "due";
  return "current";
}

function personName(driver) {
  return `${driver.first_name || ""} ${driver.last_name || ""}`.trim() || driver.id || "Unnamed driver";
}

function vehicleName(vehicle) {
  return vehicle.unit_number || vehicle.license_plate || vehicle.vin || vehicle.id || "Unnamed vehicle";
}

function item(fields) {
  return { ...fields, guardrail: GUARDRAIL };
}

function activeRows(rows) {
  return (Array.isArray(rows) ? rows : []).filter((row) => String(row?.status || "active").toLowerCase() === "active");
}

function buildDriverItems(asOf, drivers, mvrRecords) {
  const activeDrivers = activeRows(drivers);
  if (activeDrivers.length === 0) {
    return [item({
      id: "annual-mvr:setup", rule: "annual-mvr-review", title: "Add active drivers and annual MVR evidence",
      subject: "Fleet", citation: "49 CFR 391.25", dueDate: null, status: "evidence_missing",
      evidence: ["No active driver records were returned; no driver deadline was inferred."],
    })];
  }

  const records = Array.isArray(mvrRecords) ? mvrRecords : [];
  return activeDrivers.flatMap((driver) => {
    const latest = records
      .filter((record) => record?.driver_id === driver.id && validIso(record?.pulled_on))
      .sort((a, b) => b.pulled_on.localeCompare(a.pulled_on))[0];
    const mvrDue = latest ? addCalendarYear(latest.pulled_on) : null;
    const mvrItem = item({
      id: `annual-mvr:${driver.id}`, rule: "annual-mvr-review", title: "Annual motor vehicle record review",
      subject: personName(driver), citation: "49 CFR 391.25", dueDate: mvrDue,
      status: mvrDue ? classify(mvrDue, asOf) : "evidence_missing",
      evidence: latest ? [`Latest recorded MVR pull: ${latest.pulled_on}.`] : ["No dated MVR pull was found for this active driver."],
    });

    const medicalDate = validIso(driver.medical_card_expires_on) ? driver.medical_card_expires_on : null;
    const medicalItem = item({
      id: `medical-certificate:${driver.id}`, rule: "medical-certificate-expiration", title: "Medical examiner's certificate expiration",
      subject: personName(driver), citation: "49 CFR 391.45", dueDate: medicalDate,
      status: medicalDate ? classify(medicalDate, asOf) : "evidence_missing",
      evidence: medicalDate ? [`Recorded medical certificate expiration: ${medicalDate}.`] : ["No medical certificate expiration date was found for this active driver."],
    });
    return [mvrItem, medicalItem];
  });
}

function buildVehicleItems(asOf, vehicles) {
  return activeRows(vehicles).map((vehicle) => {
    const dueDate = validIso(vehicle.next_dot_inspection_due) ? vehicle.next_dot_inspection_due : null;
    return item({
      id: `annual-inspection:${vehicle.id}`, rule: "annual-vehicle-inspection", title: "Periodic vehicle inspection",
      subject: vehicleName(vehicle), citation: "49 CFR 396.17", dueDate,
      status: dueDate ? classify(dueDate, asOf) : "evidence_missing",
      evidence: dueDate ? [`Recorded next DOT inspection due: ${dueDate}.`] : ["No next DOT inspection due date was found for this active vehicle."],
    });
  });
}

function quarterRows(year) {
  return [
    { quarter: 1, label: `Q1 ${year}`, dueDate: `${year}-04-30` },
    { quarter: 2, label: `Q2 ${year}`, dueDate: `${year}-07-31` },
    { quarter: 3, label: `Q3 ${year}`, dueDate: `${year}-10-31` },
    { quarter: 4, label: `Q4 ${year}`, dueDate: `${year + 1}-01-31` },
  ];
}

function buildIftaItems(asOf, iftaReturns) {
  const year = parseIso(asOf, "asOf").getUTCFullYear();
  const returns = Array.isArray(iftaReturns) ? iftaReturns : [];
  const participationEstablished = returns.length > 0;
  return quarterRows(year).map(({ quarter, label, dueDate }) => {
    const filing = returns.find((row) => String(row?.quarter || "").toUpperCase() === label.toUpperCase());
    const filedDate = filing && validIso(filing.filed_date) ? filing.filed_date : null;
    let status = "confirm_applicability";
    if (filedDate || String(filing?.status || "").toLowerCase() === "filed") status = "current";
    else if (participationEstablished) status = classify(dueDate, asOf);
    return item({
      id: `ifta:${year}-q${quarter}`, rule: "ifta-quarterly-return", title: `${label} IFTA return`, subject: "Carrier",
      citation: "IFTA Articles of Agreement § R960", dueDate, status,
      evidence: filedDate ? [`Matching return recorded as filed ${filedDate}.`] : filing ? [`Matching return status: ${filing.status || "not recorded"}.`] : [participationEstablished ? "No matching return was found for this represented IFTA account." : "IFTA participation is not established by the returned records."],
    });
  });
}

function nextMcs150Date(usdot, asOf) {
  const digits = String(usdot || "").replace(/\s+/g, "");
  if (!/^\d{2,8}$/.test(digits)) return null;
  const monthDigit = Number(digits.at(-2));
  const parity = Number(digits.at(-1)) % 2;
  const month = monthDigit === 0 ? 10 : monthDigit;
  if (month < 1 || month > 10) return null;
  const today = parseIso(asOf, "asOf");
  let year = today.getUTCFullYear();
  while (year % 2 !== parity) year += 1;
  let candidate = new Date(Date.UTC(year, month, 0));
  if (candidate.getTime() < today.getTime()) {
    year += 2;
    candidate = new Date(Date.UTC(year, month, 0));
  }
  return iso(candidate);
}

function buildCarrierItems(asOf, carrier, daTests, iftaReturns, safer) {
  const tests = Array.isArray(daTests) ? daTests : [];
  const dueDate = nextMcs150Date(carrier?.usdot_number, asOf);
  const lastFiled = validIso(safer?.last_mcs150_filed) ? safer.last_mcs150_filed : null;
  const year = parseIso(asOf, "asOf").getUTCFullYear();
  return [
    item({
      id: "drug-alcohol:program-review", rule: "drug-alcohol-program-review", title: "Drug and alcohol program applicability review",
      subject: "Carrier", citation: "49 CFR Part 382", dueDate: null, status: "confirm_applicability",
      evidence: [`${tests.length} test record${tests.length === 1 ? "" : "s"} returned. Test history alone does not establish the next required testing action.`],
    }),
    ...buildIftaItems(asOf, iftaReturns),
    item({
      id: `ucr:${year}`, rule: "ucr-registration-review", title: `${year + 1} Unified Carrier Registration planning review`,
      subject: "Carrier", citation: "49 U.S.C. 14504a", dueDate: `${year}-12-31`, status: "confirm_applicability",
      evidence: ["The available carrier record does not establish every UCR applicability fact or registration status."],
    }),
    item({
      id: "mcs-150:biennial", rule: "mcs-150-biennial-update", title: "MCS-150 biennial update window",
      subject: "Carrier", citation: "49 CFR 390.19(b)(2)", dueDate,
      status: dueDate ? classify(dueDate, asOf) : "evidence_missing",
      evidence: dueDate
        ? [`Schedule derived from USDOT ${carrier.usdot_number}.${lastFiled ? ` Last recorded filing: ${lastFiled}.` : " No last-filed date was returned."}`]
        : ["A valid USDOT number was not returned, so the filing month and year could not be derived."],
    }),
  ];
}

export function buildComplianceCalendar(input = {}) {
  const asOf = input.asOf;
  parseIso(asOf, "asOf");
  const items = [
    ...buildDriverItems(asOf, input.drivers, input.mvrRecords),
    ...buildVehicleItems(asOf, input.vehicles),
    ...buildCarrierItems(asOf, input.carrier, input.daTests, input.iftaReturns, input.safer),
  ].sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") || a.id.localeCompare(b.id));

  const counts = { total: items.length, overdue: 0, due: 0, current: 0, confirm_applicability: 0, evidence_missing: 0 };
  for (const entry of items) counts[entry.status] += 1;
  return { items, counts };
}
