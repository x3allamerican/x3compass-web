import assert from "node:assert/strict";
import test from "node:test";
import { CSA_BASICS, buildCsaScorecards } from "../src/lib/csaScorecards.mjs";

test("CSA scorecards preserve all seven BASICs and established thresholds", () => {
  assert.equal(CSA_BASICS.length, 7);
  assert.deepEqual(CSA_BASICS.map((basic) => basic.threshold), [65, 65, 65, 80, 80, 80, 80]);
});

test("scorecards derive latest value, threshold state, and trend from ordered snapshots", () => {
  const cards = buildCsaScorecards([
    { taken_at: "2026-08-01T00:00:00Z", unsafe_driving: 66, vehicle_maint: 72 },
    { taken_at: "2026-07-01T00:00:00Z", unsafe_driving: 60, vehicle_maint: 75 },
  ]);
  const unsafe = cards.find((card) => card.key === "unsafe_driving");
  const vehicle = cards.find((card) => card.key === "vehicle_maint");
  assert.deepEqual(unsafe, {
    key: "unsafe_driving", label: "Unsafe Driving", threshold: 65, value: 66,
    state: "alert", delta: 6, direction: "worsening", history: [60, 66],
  });
  assert.equal(vehicle.state, "watch");
  assert.equal(vehicle.direction, "improving");
  assert.equal(vehicle.delta, -3);
});

test("missing BASIC values remain unknown instead of becoming zero", () => {
  const cards = buildCsaScorecards([{ taken_at: "2026-08-01T00:00:00Z", unsafe_driving: null }]);
  assert.equal(cards.find((card) => card.key === "unsafe_driving").value, null);
  assert.equal(cards.find((card) => card.key === "unsafe_driving").state, "unknown");
  assert.deepEqual(buildCsaScorecards([]), []);
});
