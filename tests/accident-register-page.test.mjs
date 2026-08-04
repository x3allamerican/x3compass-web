import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = new URL("../src/app/app/accidents/page.tsx", import.meta.url);
const migration = new URL("../supabase/migrations/20260804_accident_register_fields.sql", import.meta.url);

test("accident page loads the authenticated register and exposes retention/evidence filters", () => {
  const source = readFileSync(page, "utf8");
  assert.match(source, /getSession/);
  assert.match(source, /Authorization/);
  assert.match(source, /\/api\/accident-register/);
  assert.match(source, /retention_complete/);
  assert.match(source, /missingFields/);
  assert.match(source, /hazmat_released/);
  assert.doesNotMatch(source, /DEMO_REGISTER|demoData|withDemoFallback/);
});

test("source-only migration adds nullable register evidence without fabricating defaults", () => {
  const sql = readFileSync(migration, "utf8");
  assert.match(sql, /NEEDS CLAUDE TO APPLY/);
  assert.match(sql, /add column if not exists city text/i);
  assert.match(sql, /add column if not exists state text/i);
  assert.match(sql, /add column if not exists hazmat_released boolean/i);
  assert.doesNotMatch(sql, /hazmat_released boolean[^;]*default/i);
});
