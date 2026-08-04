import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  MVR_MONTHLY_RETAIL_CENTS,
  MVR_MONTHLY_VENDOR_CENTS,
  MVR_TRIGGER_RETAIL_CENTS,
  MVR_TRIGGER_VENDOR_CENTS,
  mvrChargeSummary,
} from "../functions/_shared/mvr-billing.mjs";

test("continuous MVR monthly and triggered pass-through math is exact", () => {
  assert.equal(MVR_MONTHLY_VENDOR_CENTS, 250);
  assert.equal(MVR_MONTHLY_RETAIL_CENTS, 500);
  assert.equal(MVR_TRIGGER_VENDOR_CENTS, 950);
  assert.equal(MVR_TRIGGER_RETAIL_CENTS, 950);
  assert.deepEqual(mvrChargeSummary({ activeMonitors: 2, triggeredReports: 3 }), {
    monthlyVendorCents: 500,
    monthlyRetailCents: 1000,
    triggeredVendorCents: 2850,
    triggeredRetailCents: 2850,
    vendorTotalCents: 3350,
    retailTotalCents: 3850,
    marginCents: 500,
  });
});

test("charge math rejects fractional or negative usage", () => {
  assert.throws(() => mvrChargeSummary({ activeMonitors: -1, triggeredReports: 0 }), /non-negative integer/);
  assert.throws(() => mvrChargeSummary({ activeMonitors: 1, triggeredReports: 0.5 }), /non-negative integer/);
});

test("billing agent and webhook use the deduplicated event ledger", async () => {
  const [agent, webhook, migration] = await Promise.all([
    readFile(new URL("../functions/_shared/agent-registry.ts", import.meta.url), "utf8"),
    readFile(new URL("../functions/api/screenings/webhook.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260804_compass_mvr_billing_events.sql", import.meta.url), "utf8"),
  ]);
  assert.match(agent, /case "agent-mvr-monthly-billing"/);
  assert.match(agent, /\/v1\/invoiceitems/);
  assert.match(agent, /"Idempotency-Key"/);
  assert.match(agent, /event\.status === "pending" \|\| event\.status === "error"/);
  assert.match(agent, /resolution=merge-duplicates/);
  assert.match(agent, /compass_vendor_invoices/);
  assert.match(webhook, /dedupe_key: `triggered:\$\{reportId\}`/);
  assert.match(migration, /cron_expr, description, enabled/);
  assert.match(migration, /null,[\s\S]*false/);
});
