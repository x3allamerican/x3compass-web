import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = new URL("../supabase/migrations/20260804_dataq_challenges.sql", import.meta.url);

test("DataQ schema is source-only, tenant-scoped, and constrains workflow values", () => {
  const sql = readFileSync(migration, "utf8");
  assert.match(sql, /NEEDS CLAUDE TO APPLY/);
  assert.match(sql, /create table if not exists public\.compass_dataq_challenges/i);
  assert.match(sql, /create table if not exists public\.compass_dataq_evidence/i);
  assert.match(sql, /target_type in \('inspection', 'crash'\)/i);
  assert.match(sql, /status in \('submitted', 'under_review', 'approved', 'denied'\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /compass_carrier_users/i);
  assert.match(sql, /create index[^;]+carrier_id/i);
  assert.match(sql, /dataq_evidence_carrier_guard/i);
  assert.doesNotMatch(sql, /demo|sample|placeholder/i);
});
