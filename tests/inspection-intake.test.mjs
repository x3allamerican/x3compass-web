import assert from "node:assert/strict";
import { test } from "node:test";

import { mapViolationToBasic, normalizeInspectionExtraction } from "../src/lib/inspectionIntake.mjs";

test("maps recognized violation CFR families without guessing unknown codes", () => {
  assert.equal(mapViolationToBasic("395.8").basic_category, "Hours-of-Service Compliance");
  assert.equal(mapViolationToBasic("393.45").basic_category, "Vehicle Maintenance");
  assert.equal(mapViolationToBasic("392.2").basic_category, "Unsafe Driving");
  assert.equal(mapViolationToBasic("391.41").basic_category, "Driver Fitness");
  assert.equal(mapViolationToBasic("382.215").basic_category, "Controlled Substances/Alcohol");
  assert.equal(mapViolationToBasic("177.817").basic_category, "Hazardous Materials Compliance");
  assert.deepEqual(mapViolationToBasic("999.1"), {
    basic_category: null,
    mapping_basis: "unmapped",
    review_status: "needs_human_review",
  });
});

test("normalizes extracted fields and marks the whole result for review", () => {
  const result = normalizeInspectionExtraction({
    inspection_date: "2026-08-03",
    level: 2,
    state: "mi",
    report_number: " MI-44 ",
    oos_driver: false,
    oos_vehicle: true,
    violations: [{ code: "393.45", description: "Brake tubing", oos: true }],
  });
  assert.equal(result.state, "MI");
  assert.equal(result.report_number, "MI-44");
  assert.equal(result.violation_count, 1);
  assert.equal(result.violations[0].basic_category, "Vehicle Maintenance");
  assert.equal(result.review_status, "needs_human_review");
});

test("rejects invalid extracted values instead of fabricating defaults", () => {
  const result = normalizeInspectionExtraction({ inspection_date: "tomorrow", level: 9, state: "Michigan", violations: "none" });
  assert.equal(result.inspection_date, null);
  assert.equal(result.level, null);
  assert.equal(result.state, null);
  assert.deepEqual(result.violations, []);
  assert.ok(result.parser_warnings.length >= 3);
});
