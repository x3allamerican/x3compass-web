import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = new URL("../supabase/migrations/20260804_clearinghouse_tracking.sql", import.meta.url);

test("Clearinghouse schema is source-only, complete, and tenant guarded", () => {
  const sql = readFileSync(migration, "utf8");
  assert.match(sql, /NEEDS CLAUDE TO APPLY/);
  for (const table of ["queries", "consents", "violations"]) assert.match(sql, new RegExp(`create table if not exists public\\.compass_clearinghouse_${table}`, "i"));
  assert.match(sql, /query_type in \('annual_limited', 'pre_employment_full', 'triggered_full'\)/i);
  assert.match(sql, /result in \('pending', 'no_information', 'information', 'error'\)/i);
  assert.match(sql, /consent_type in \('limited_general', 'pre_employment_full', 'triggered_full'\)/i);
  assert.match(sql, /violation_type in \('positive_drug_test', 'positive_alcohol_test', 'test_refusal', 'actual_knowledge', 'pre_employment_positive'\)/i);
  assert.match(sql, /clearinghouse_driver_carrier_guard/i);
  assert.match(sql, /enable row level security/gi);
  assert.match(sql, /compass_carrier_users/i);
  assert.match(sql, /create index[^;]+carrier_id/i);
  assert.doesNotMatch(sql, /demo|sample|placeholder/i);
});
