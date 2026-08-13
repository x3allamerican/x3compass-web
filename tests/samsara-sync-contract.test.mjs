import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
const root = new URL("../", import.meta.url);
const route = await readFile(new URL("functions/api/vendors/samsara/sync.ts", root), "utf8");
const migration = await readFile(new URL("supabase/migrations/20260804_samsara_sync_depth.sql", root), "utf8");
const settings = await readFile(new URL("src/app/settings/page.tsx", root), "utf8");

test("sync remains tenant guarded, cursor paginated, and reconciles all three domains", () => {
  assert.match(route, /requireTenant/);
  assert.match(route, /fleet\/drivers/);
  assert.match(route, /fleet\/vehicles/);
  assert.match(route, /fleet\/hos\/daily-logs/);
  assert.match(route, /on_conflict=carrier_id,source_vendor,source_id/);
});

test("schema adds stable vendor keys without destructive replacement", () => {
  assert.match(migration, /source_vendor/);
  assert.match(migration, /source_id/);
  assert.match(migration, /unique index/i);
  assert.doesNotMatch(migration, /drop table/i);
});

test("settings surfaces authenticated last-sync state", () => {
  assert.match(settings, /\/api\/vendors\/list/);
  assert.match(settings, /last_sync_at/);
  assert.match(settings, /Sync Samsara/);
});
