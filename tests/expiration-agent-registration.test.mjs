import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = new URL("../supabase/migrations/20260804_agent_expiration_sweep.sql", import.meta.url);

test("agent registration is idempotent and deliberately unscheduled", () => {
  const sql = readFileSync(migration, "utf8");
  assert.match(sql, /agent-expiration-sweep/);
  assert.match(sql, /on conflict\s*\(name\)/i);
  assert.match(sql, /cron_expr[\s\S]*null/i);
  assert.match(sql, /NEEDS CLAUDE TO APPLY/);
  assert.doesNotMatch(sql, /cron\.schedule|next_run_at\s*=/i);
});
