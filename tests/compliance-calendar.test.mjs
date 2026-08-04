import assert from "node:assert/strict";
import test from "node:test";

import { buildComplianceCalendar } from "../src/lib/complianceCalendar.mjs";

const input = {
  asOf: "2026-08-04",
  carrier: { id: "carrier-1", name: "X3 Test Carrier", usdot_number: "123426" },
  drivers: [
    { id: "driver-1", first_name: "Ada", last_name: "Lovelace", status: "active", medical_card_expires_on: "2026-08-20" },
    { id: "driver-2", first_name: "Grace", last_name: "Hopper", status: "active", medical_card_expires_on: null },
    { id: "driver-3", first_name: "Inactive", last_name: "Driver", status: "inactive", medical_card_expires_on: "2026-08-05" },
  ],
  mvrRecords: [
    { id: "mvr-old", driver_id: "driver-1", pulled_on: "2024-08-01" },
    { id: "mvr-latest", driver_id: "driver-1", pulled_on: "2025-08-03" },
  ],
  daTests: [{ id: "test-1", driver_id: "driver-1", test_date: "2026-06-01", test_type: "random", result: "negative" }],
  vehicles: [
    { id: "vehicle-1", unit_number: "TRK-101", license_plate: "X3101", status: "active", next_dot_inspection_due: "2026-09-03" },
    { id: "vehicle-2", unit_number: "TRK-102", license_plate: "X3102", status: "active", next_dot_inspection_due: null },
  ],
  iftaReturns: [{ id: "ifta-q2", quarter: "Q2 2026", due_date: "2026-07-31", filed_date: "2026-07-20", status: "Filed" }],
  safer: { last_mcs150_filed: "2024-02-15" },
};

test("builds evidence-backed driver and vehicle deadlines without inventing missing dates", () => {
  const { items } = buildComplianceCalendar(input);

  const mvr = items.find((item) => item.id === "annual-mvr:driver-1");
  assert.equal(mvr.dueDate, "2026-08-03");
  assert.equal(mvr.status, "overdue");
  assert.match(mvr.evidence.join(" "), /2025-08-03/);

  const missingMvr = items.find((item) => item.id === "annual-mvr:driver-2");
  assert.equal(missingMvr.dueDate, null);
  assert.equal(missingMvr.status, "evidence_missing");

  const mec = items.find((item) => item.id === "medical-certificate:driver-1");
  assert.equal(mec.dueDate, "2026-08-20");
  assert.equal(mec.status, "due");
  assert.equal(items.some((item) => item.id.includes("driver-3")), false);

  assert.equal(items.find((item) => item.id === "annual-inspection:vehicle-1").status, "due");
  assert.equal(items.find((item) => item.id === "annual-inspection:vehicle-2").status, "evidence_missing");
});

test("creates D&A review, four IFTA quarters, UCR, and the USDOT-digit MCS-150 schedule", () => {
  const { items } = buildComplianceCalendar(input);

  const da = items.find((item) => item.rule === "drug-alcohol-program-review");
  assert.equal(da.status, "confirm_applicability");
  assert.match(da.evidence.join(" "), /1 test record/);
  assert.equal(da.dueDate, null);

  const ifta = items.filter((item) => item.rule === "ifta-quarterly-return");
  assert.equal(ifta.length, 4);
  assert.deepEqual(ifta.map((item) => item.dueDate), ["2026-04-30", "2026-07-31", "2026-10-31", "2027-01-31"]);
  assert.equal(ifta.find((item) => item.id === "ifta:2026-q2").status, "current");
  assert.equal(ifta.find((item) => item.id === "ifta:2026-q3").status, "current");

  const ucr = items.find((item) => item.rule === "ucr-registration-review");
  assert.equal(ucr.dueDate, "2026-12-31");
  assert.equal(ucr.status, "confirm_applicability");

  const mcs150 = items.find((item) => item.rule === "mcs-150-biennial-update");
  assert.equal(mcs150.dueDate, "2028-02-29");
  assert.equal(mcs150.status, "current");
  assert.match(mcs150.evidence.join(" "), /USDOT 123426/);
});

test("uses an inclusive 30-day due window and aggregates every status", () => {
  const result = buildComplianceCalendar(input);
  assert.equal(result.items.find((item) => item.id === "annual-inspection:vehicle-1").status, "due");
  assert.equal(result.counts.total, result.items.length);
  assert.equal(result.counts.overdue, result.items.filter((item) => item.status === "overdue").length);
  assert.equal(result.counts.due, result.items.filter((item) => item.status === "due").length);
  assert.equal(result.counts.evidence_missing, result.items.filter((item) => item.status === "evidence_missing").length);
  assert.equal(result.counts.confirm_applicability, result.items.filter((item) => item.status === "confirm_applicability").length);
});

test("empty evidence stays honest and malformed USDOT numbers do not create dates", () => {
  const result = buildComplianceCalendar({
    asOf: "2026-08-04",
    carrier: { id: "carrier-1", name: "Empty Carrier", usdot_number: "ABC" },
    drivers: [], mvrRecords: [], daTests: [], vehicles: [], iftaReturns: [], safer: null,
  });
  assert.equal(result.items.some((item) => item.rule === "annual-mvr-review" && item.status === "evidence_missing"), true);
  assert.equal(result.items.find((item) => item.rule === "mcs-150-biennial-update").dueDate, null);
  assert.equal(result.items.find((item) => item.rule === "mcs-150-biennial-update").status, "evidence_missing");
  assert.equal(result.items.filter((item) => item.rule === "ifta-quarterly-return").every((item) => item.status === "confirm_applicability"), true);
});

test("rejects invalid as-of dates instead of silently changing the calendar", () => {
  assert.throws(() => buildComplianceCalendar({ ...input, asOf: "08/04/2026" }), /asOf/);
});
