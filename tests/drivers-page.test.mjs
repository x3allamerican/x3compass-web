import assert from "node:assert/strict";
import test from "node:test";

import { buildDriverKpis } from "../src/lib/driverKpis.mjs";

test("driver KPIs use inclusive month, 30-day expiry, and 90-day inactive boundaries", () => {
  const drivers = [
    {
      status: "active",
      hire_date: "2026-08-01",
      created_at: "2026-07-01T12:00:00Z",
      termination_date: null,
      cdl_expires_on: "2026-09-04",
      medical_card_expires_on: null,
    },
    {
      status: "pending_hire",
      hire_date: null,
      created_at: "2026-08-05T08:00:00Z",
      termination_date: null,
      cdl_expires_on: null,
      medical_card_expires_on: "2026-08-05",
    },
    {
      status: "terminated",
      hire_date: "2024-01-01",
      created_at: "2024-01-01T00:00:00Z",
      termination_date: "2026-05-07",
      cdl_expires_on: "2026-09-05",
      medical_card_expires_on: "2026-08-04",
    },
  ];

  assert.deepEqual(buildDriverKpis(drivers, "2026-08-05"), {
    active: 1,
    pending: 1,
    newThisMonth: 2,
    inactiveTerminated90: 1,
    cdlExp30: 1,
    medExp30: 1,
  });
});

test("driver KPI calculation rejects a non-calendar as-of date", () => {
  assert.throws(() => buildDriverKpis([], "2026-02-30"), /asOf/);
});
