import assert from "node:assert/strict";
import test from "node:test";

import { buildAccidentRegister } from "../src/lib/accidentRegister.mjs";

test("normalizes every §390.15(b)(1) field and preserves valid zero outcomes", () => {
  const result = buildAccidentRegister({
    asOf: "2026-08-04",
    drivers: [{ id: "d1", first_name: "Ada", last_name: "Lovelace" }],
    accidents: [{
      id: "a1", accident_date: "2025-08-04", city: "Detroit", state: "MI", driver_id: "d1",
      fatalities: 0, injuries: 0, hazmat_released: false,
    }],
  });

  assert.deepEqual(result.records[0], {
    id: "a1", accidentDate: "2025-08-04", city: "Detroit", state: "MI", driverName: "Ada Lovelace",
    fatalities: 0, injuries: 0, hazmatReleased: false, retentionThrough: "2028-08-04",
    retentionStatus: "retain", missingFields: [], citation: "49 CFR 390.15(b)(1)",
    guardrail: "Decision support only. Verify the source record and register scope with a qualified reviewer.",
  });
  assert.deepEqual(result.counts, { total: 1, complete: 1, missing_evidence: 0, retain: 1, retention_complete: 0, date_missing: 0 });
});

test("keeps unknown hazmat release and missing city/state/driver visible", () => {
  const result = buildAccidentRegister({
    asOf: "2026-08-04", drivers: [],
    accidents: [{ id: "a2", accident_date: "2026-01-01", city: null, state: "", driver_id: null, fatalities: null, injuries: null, hazmat_released: null }],
  });
  assert.deepEqual(result.records[0].missingFields, ["city", "state", "driver_name", "fatalities", "injuries", "hazmat_released"]);
  assert.equal(result.records[0].hazmatReleased, null);
  assert.equal(result.counts.missing_evidence, 1);
});

test("uses three UTC calendar years, clamps leap day, and marks completion only after retention-through", () => {
  const retained = buildAccidentRegister({ asOf: "2027-02-28", drivers: [], accidents: [{ id: "leap", accident_date: "2024-02-29", city: "A", state: "MI", driver_name: "Stored Name", fatalities: 1, injuries: 0, hazmat_released: false }] });
  const complete = buildAccidentRegister({ asOf: "2027-03-01", drivers: [], accidents: [{ id: "leap", accident_date: "2024-02-29", city: "A", state: "MI", driver_name: "Stored Name", fatalities: 1, injuries: 0, hazmat_released: false }] });
  assert.equal(retained.records[0].retentionThrough, "2027-02-28");
  assert.equal(retained.records[0].retentionStatus, "retain");
  assert.equal(complete.records[0].retentionStatus, "retention_complete");
});

test("invalid dates remain date_missing and records sort newest-first with invalid dates last", () => {
  const result = buildAccidentRegister({
    asOf: "2026-08-04", drivers: [],
    accidents: [
      { id: "bad", accident_date: "not-a-date", city: "A", state: "MI", driver_name: "A", fatalities: 0, injuries: 0, hazmat_released: false },
      { id: "old", accident_date: "2024-01-01", city: "A", state: "MI", driver_name: "A", fatalities: 0, injuries: 0, hazmat_released: false },
      { id: "new", accident_date: "2026-01-01", city: "A", state: "MI", driver_name: "A", fatalities: 0, injuries: 0, hazmat_released: false },
    ],
  });
  assert.deepEqual(result.records.map((record) => record.id), ["new", "old", "bad"]);
  assert.equal(result.records[2].retentionStatus, "date_missing");
  assert.equal(result.records[2].retentionThrough, null);
  assert.equal(result.counts.date_missing, 1);
});

test("rejects malformed as-of dates", () => {
  assert.throws(() => buildAccidentRegister({ asOf: "08/04/2026", accidents: [], drivers: [] }), /asOf/);
});
