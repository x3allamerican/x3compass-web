import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const route = await readFile(new URL("functions/api/inspections/parse.ts", root), "utf8");
const page = await readFile(new URL("src/app/app/inspections/page.tsx", root), "utf8");
const migration = await readFile(new URL("supabase/migrations/20260804_inspection_intake.sql", root), "utf8");

test("parse endpoint is tenant guarded and fails into manual review", () => {
  assert.match(route, /requireTenant/);
  assert.match(route, /needs_manual/);
  assert.match(route, /needs_human_review/);
  assert.doesNotMatch(route, /carrier_id\s*:\s*body\.carrier_id/);
});

test("inspection page uploads, pre-fills, and preserves manual entry", () => {
  assert.match(page, /\/api\/inspections\/parse/);
  assert.match(page, /Upload inspection report/);
  assert.match(page, /Review every extracted field/);
  assert.match(page, /setShowAdd\(true\)/);
});

test("migration adds review provenance without replacing the inspection table", () => {
  assert.match(migration, /alter table public\.compass_inspections/i);
  assert.match(migration, /parse_status/);
  assert.match(migration, /report_filename/);
  assert.doesNotMatch(migration, /drop table/i);
});
