import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("weekly prompt evaluation view is security-invoker", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20260814_compass_prompt_eval_security_invoker.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /create\s+or\s+replace\s+view\s+public\.compass_prompt_eval_weekly/i);
  assert.match(migration, /with\s*\(\s*security_invoker\s*=\s*on\s*\)/i);
});
