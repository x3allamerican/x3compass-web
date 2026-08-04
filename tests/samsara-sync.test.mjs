import assert from "node:assert/strict";
import { test } from "node:test";
import { mapSamsaraDrivers, mapSamsaraDailyLogs, nextCursor } from "../src/lib/samsaraSync.mjs";

test("maps Samsara drivers using immutable source ids and preserves missing evidence", () => {
  assert.deepEqual(mapSamsaraDrivers([{ id:"d-1", name:"Ada Lovelace", username:"ada", driverActivationStatus:"active" }]), [{
    source_vendor:"samsara", source_id:"d-1", first_name:"Ada", last_name:"Lovelace", email:null, phone:null, status:"active",
  }]);
  assert.deepEqual(mapSamsaraDrivers([{ id:"d-2", name:"Cher", driverActivationStatus:"deactivated" }]), []);
});

test("maps daily HOS summaries without inventing violations", () => {
  const rows = mapSamsaraDailyLogs([{ driver:{id:"d-1"}, startTime:"2026-08-03T00:00:00Z", dutyStatusDurations:{driveDurationMs:3600000,onDutyDurationMs:1800000}, distanceTraveledMeters:16093.44, logCertifiedAtTime:"2026-08-04T02:00:00Z" }]);
  assert.equal(rows[0].source_id, "d-1:2026-08-03");
  assert.equal(rows[0].total_drive_minutes, 60);
  assert.equal(rows[0].total_on_duty_minutes, 30);
  assert.equal(rows[0].distance_miles, 10);
  assert.equal(rows[0].certified, true);
  assert.deepEqual(rows[0].violations, []);
});

test("cursor pagination continues only when a cursor is explicitly present", () => {
  assert.equal(nextCursor({ pagination:{ endCursor:"abc", hasNextPage:true } }), "abc");
  assert.equal(nextCursor({ pagination:{ endCursor:"abc", hasNextPage:false } }), null);
  assert.equal(nextCursor({}), null);
});
